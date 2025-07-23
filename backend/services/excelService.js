const XLSX = require("xlsx");
const fs = require("fs");
const { getPool } = require("../db");

class ExcelService {
  // Función para leer un archivo Excel y extraer los datos
  async readExcelFile(filePath) {
    try {
      // Leer el archivo Excel
      const workbook = XLSX.readFile(filePath);

      // Obtener la primera hoja
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convertir a JSON
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (data.length < 2) {
        throw new Error(
          "El archivo Excel debe tener al menos una fila de encabezados y una fila de datos"
        );
      }

      // Extraer encabezados (primera fila)
      const headers = data[0];

      // Extraer datos (filas restantes)
      const rows = data.slice(1).filter((row) => row.length > 0);

      return {
        headers,
        rows,
        totalRows: rows.length,
      };
    } catch (error) {
      console.error("Error reading Excel file:", error);
      throw new Error(`Error al leer el archivo Excel: ${error.message}`);
    }
  }

  // Función para validar que las columnas del Excel coincidan con las de la tabla
  async validateColumns(databaseName, tableName, excelHeaders) {
    try {
      const pool = await getPool(databaseName);

      // Obtener la estructura de la tabla (sin IS_IDENTITY que puede no estar disponible)
      const query = `
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = @tableName
        ORDER BY ORDINAL_POSITION
      `;

      const result = await pool
        .request()
        .input("tableName", tableName)
        .query(query);

      if (result.recordset.length === 0) {
        throw new Error(
          `La tabla ${tableName} no existe en la base de datos ${databaseName}`
        );
      }

      const tableColumns = result.recordset.map((col) => col.COLUMN_NAME);

      // Obtener columnas de identidad usando una consulta separada
      const identityQuery = `
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = @tableName
        AND COLUMNPROPERTY(OBJECT_ID('dbo.' + @tableName), COLUMN_NAME, 'IsIdentity') = 1
      `;

      let identityColumns = [];
      try {
        const identityResult = await pool
          .request()
          .input("tableName", tableName)
          .query(identityQuery);
        identityColumns = identityResult.recordset.map(
          (col) => col.COLUMN_NAME
        );
      } catch (identityError) {
        console.warn(
          "Could not determine identity columns, assuming none:",
          identityError.message
        );
        identityColumns = [];
      }

      // Verificar que todos los encabezados del Excel estén en la tabla
      const missingColumns = excelHeaders.filter(
        (header) => !tableColumns.includes(header)
      );

      if (missingColumns.length > 0) {
        throw new Error(
          `Las siguientes columnas no existen en la tabla: ${missingColumns.join(
            ", "
          )}`
        );
      }

      // Verificar que no se estén intentando insertar en columnas de identidad
      const identityColumnsInExcel = excelHeaders.filter((header) =>
        identityColumns.includes(header)
      );

      if (identityColumnsInExcel.length > 0) {
        throw new Error(
          `No se puede insertar en columnas de identidad: ${identityColumnsInExcel.join(
            ", "
          )}`
        );
      }

      return {
        tableColumns,
        insertableColumns: excelHeaders.filter(
          (header) => !identityColumns.includes(header)
        ),
        identityColumns,
      };
    } catch (error) {
      console.error("Error validating columns:", error);
      throw error;
    }
  }

  // Función para insertar datos del Excel en la tabla
  async insertExcelData(databaseName, tableName, excelHeaders, excelRows) {
    try {
      const pool = await getPool(databaseName);

      // Validar columnas
      const validation = await this.validateColumns(
        databaseName,
        tableName,
        excelHeaders
      );
      const insertableColumns = validation.insertableColumns;

      if (insertableColumns.length === 0) {
        throw new Error("No hay columnas válidas para insertar");
      }

      // Construir la consulta de inserción
      const columnsList = insertableColumns.join(", ");
      const placeholders = insertableColumns.map((col) => `@${col}`).join(", ");

      const insertQuery = `
        INSERT INTO ${databaseName}.dbo.${tableName} (${columnsList})
        VALUES (${placeholders})
      `;

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Insertar cada fila
      for (let i = 0; i < excelRows.length; i++) {
        const row = excelRows[i];

        try {
          // Crear objeto de parámetros
          const params = {};
          insertableColumns.forEach((col, index) => {
            const value = row[excelHeaders.indexOf(col)];
            params[col] = value !== undefined ? value : null;
          });

          // Ejecutar inserción
          const request = pool.request();
          insertableColumns.forEach((col) => {
            request.input(col, params[col]);
          });

          await request.query(insertQuery);
          successCount++;
        } catch (error) {
          errorCount++;

          // Detectar errores específicos de SQL Server
          let errorMessage = error.message;
          let errorType = "general";

          if (error.message) {
            const errorMsg = error.message.toLowerCase();

            // Error de clave primaria duplicada
            if (
              errorMsg.includes("primary key") ||
              errorMsg.includes("duplicate key") ||
              errorMsg.includes("unique constraint") ||
              errorMsg.includes("pk_")
            ) {
              errorMessage =
                "Ya existe un registro con la misma clave primaria";
              errorType = "primary_key_violation";
            }
            // Error de constraint de verificación (CHECK)
            else if (
              errorMsg.includes("check constraint") ||
              errorMsg.includes("check_")
            ) {
              errorMessage =
                "Los datos no cumplen con las restricciones de validación";
              errorType = "check_constraint_violation";
            }
            // Error de clave foránea
            else if (
              errorMsg.includes("foreign key") ||
              errorMsg.includes("fk_")
            ) {
              errorMessage =
                "Los datos hacen referencia a un registro que no existe en otra tabla";
              errorType = "foreign_key_violation";
            }
            // Error de NOT NULL
            else if (
              errorMsg.includes("cannot insert the value null") ||
              errorMsg.includes("null value")
            ) {
              errorMessage =
                "No se puede insertar un valor nulo en un campo requerido";
              errorType = "null_violation";
            }
            // Error de tipo de dato
            else if (
              errorMsg.includes("conversion failed") ||
              errorMsg.includes("data type")
            ) {
              errorMessage =
                "El tipo de dato proporcionado no es compatible con el campo";
              errorType = "data_type_violation";
            }
            // Error de longitud
            else if (
              errorMsg.includes("string or binary data would be truncated")
            ) {
              errorMessage =
                "Los datos proporcionados exceden la longitud máxima permitida";
              errorType = "length_violation";
            }
          }

          errors.push({
            row: i + 2, // +2 porque Excel empieza en 1 y la primera fila son encabezados
            error: errorMessage,
            errorType: errorType,
            originalError: error.message,
            data: row,
          });
        }
      }

      return {
        successCount,
        errorCount,
        errors,
        totalRows: excelRows.length,
      };
    } catch (error) {
      console.error("Error inserting Excel data:", error);
      throw error;
    }
  }

  // Función principal para procesar la importación de Excel
  async processExcelImport(filePath, databaseName, tableName) {
    try {
      // Leer el archivo Excel
      const excelData = await this.readExcelFile(filePath);

      // Insertar los datos
      const result = await this.insertExcelData(
        databaseName,
        tableName,
        excelData.headers,
        excelData.rows
      );

      // Limpiar el archivo temporal
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return {
        ...result,
        headers: excelData.headers,
        totalRows: excelData.totalRows,
      };
    } catch (error) {
      // Limpiar el archivo temporal en caso de error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  }

  // Función para exportar datos de una tabla a Excel
  async exportTableToExcel(
    databaseName,
    tableName,
    exportType = "all",
    limit = null,
    offset = null
  ) {
    try {
      const pool = await getPool(databaseName);

      // Construir la consulta según el tipo de exportación
      let query;
      let params = [];

      if (exportType === "current_page" && limit !== null && offset !== null) {
        // Exportar solo la página actual
        query = `SELECT * FROM [${tableName}] ORDER BY (SELECT NULL) OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
        params = [
          { name: "offset", value: parseInt(offset) },
          { name: "limit", value: parseInt(limit) },
        ];
      } else {
        // Exportar toda la tabla
        query = `SELECT * FROM [${tableName}]`;
      }

      // Ejecutar la consulta
      const request = pool.request();
      params.forEach((param) => {
        request.input(param.name, param.value);
      });

      const result = await request.query(query);

      if (result.recordset.length === 0) {
        throw new Error("No hay datos para exportar");
      }

      // Crear el archivo Excel
      const workbook = XLSX.utils.book_new();

      // Convertir los datos a formato de hoja de cálculo
      const worksheet = XLSX.utils.json_to_sheet(result.recordset);

      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(workbook, worksheet, tableName);

      // Generar nombre de archivo único
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `${tableName}_${exportType}_${timestamp}.xlsx`;
      const filePath = `uploads/${fileName}`;

      // Asegurar que el directorio existe
      if (!fs.existsSync("uploads")) {
        fs.mkdirSync("uploads", { recursive: true });
      }

      // Escribir el archivo
      XLSX.writeFile(workbook, filePath);

      return {
        filePath,
        fileName,
        recordCount: result.recordset.length,
        exportType,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error exporting table to Excel:", error);
      throw error;
    }
  }
}

module.exports = new ExcelService();
