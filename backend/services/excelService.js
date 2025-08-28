const XLSX = require("xlsx");
const fs = require("fs");
const { getPool } = require("../db");

class ExcelService {
  // Función para leer un archivo Excel y extraer los datos
  async readExcelFile(filePath, ignoreHeaders = false) {
    try {
      

      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        throw new Error(`El archivo no existe: ${filePath}`);
      }

      // Leer el archivo Excel
      const workbook = XLSX.readFile(filePath);

      // Obtener la primera hoja
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convertir a JSON
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (data.length === 0) {
        throw new Error("El archivo Excel está vacío");
      }

      let headers, rows;

      if (ignoreHeaders) {
        // Si se ignoran los headers, excluir la primera fila y usar el resto como datos
        headers = null;
        rows = data.slice(1).filter((row) => row.length > 0);
      } else {
        // Comportamiento normal: primera fila como headers
        if (data.length < 2) {
          throw new Error(
            "El archivo Excel debe tener al menos una fila de encabezados y una fila de datos"
          );
        }
        headers = data[0];
        rows = data.slice(1).filter((row) => row.length > 0);
      }
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

      // Validar columnas y obtener tipos de datos
      const validation = await this.validateColumns(
        databaseName,
        tableName,
        excelHeaders
      );
      const insertableColumns = validation.insertableColumns;


      if (insertableColumns.length === 0) {
        throw new Error("No hay columnas válidas para insertar");
      }

      // Obtener tipos de datos de las columnas para conversión
      const columnTypes = await this.getColumnTypes(
        databaseName,
        tableName,
        insertableColumns
      );


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
          // Crear objeto de parámetros con conversión de tipos
          const params = {};
          insertableColumns.forEach((col, index) => {
            const value = row[excelHeaders.indexOf(col)];
            params[col] = this.convertValueForSQL(value, columnTypes[col]);
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
          console.error(
            `🔍 Debug insert - Error en fila ${i + 1}:`,
            error.message
          );

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

      console.log(
        `🔍 Debug insert - Inserción completada. Éxitos: ${successCount}, Errores: ${errorCount}`
      );
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
  async processExcelImport(
    filePath,
    databaseName,
    tableName,
    ignoreHeaders = false
  ) {
    try {
      console.log(
        `🔍 Debug import - Iniciando proceso para ${databaseName}.${tableName}`
      );
      console.log(`🔍 Debug import - Archivo: ${filePath}`);
      console.log(`🔍 Debug import - Ignorar headers: ${ignoreHeaders}`);

      // Leer el archivo Excel
      console.log(`🔍 Debug import - Leyendo archivo Excel...`);
      const excelData = await this.readExcelFile(filePath, ignoreHeaders);
      console.log(
        `🔍 Debug import - Archivo leído. Filas: ${
          excelData.rows.length
        }, Headers: ${excelData.headers?.length || "null"}`
      );

      // Si se ignoran los headers, necesitamos obtener los headers de la tabla
      let headers = excelData.headers;
      if (ignoreHeaders) {
        console.log(`🔍 Debug import - Obteniendo headers de la tabla...`);
        const tableStructure = await this.getTableHeaders(
          databaseName,
          tableName
        );
        headers = tableStructure.insertableColumns;
        console.log(
          `🔍 Debug import - Headers de tabla obtenidos: ${headers.length} columnas`
        );
      }

      // Insertar los datos
      console.log(
        `🔍 Debug import - Iniciando inserción de ${excelData.rows.length} filas...`
      );
      const result = await this.insertExcelData(
        databaseName,
        tableName,
        headers,
        excelData.rows
      );
      console.log(
        `🔍 Debug import - Inserción completada. Éxitos: ${result.successCount}, Errores: ${result.errorCount}`
      );

      // Si hay errores, generar reporte de errores
      let errorReport = null;
      if (result.errorCount > 0) {
        try {
          errorReport = await this.generateErrorReport(
            result.errors,
            headers,
            tableName
          );
        } catch (error) {
          console.error("Error generating error report:", error);
        }
      }

      // Limpiar el archivo temporal
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🔍 Debug import - Archivo temporal eliminado`);
      }

      return {
        ...result,
        headers: headers,
        totalRows: excelData.totalRows,
        errorReport,
      };
    } catch (error) {
      console.error(`🔍 Debug import - Error en processExcelImport:`, error);
      // Limpiar el archivo temporal en caso de error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(
          `🔍 Debug import - Archivo temporal eliminado después de error`
        );
      }
      throw error;
    }
  }

  // Función auxiliar para obtener headers de la tabla
  async getTableHeaders(databaseName, tableName) {
    try {
      const pool = await getPool(databaseName);

      // Obtener la estructura de la tabla
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

      // Obtener columnas de identidad
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
      }

      // Filtrar columnas insertables (excluir columnas de identidad)
      const insertableColumns = tableColumns.filter(
        (col) => !identityColumns.includes(col)
      );

      return {
        tableColumns,
        insertableColumns,
        identityColumns,
      };
    } catch (error) {
      console.error("Error getting table headers:", error);
      throw new Error(`Error al obtener headers de la tabla: ${error.message}`);
    }
  }

  // Función para generar un template de Excel con headers de la tabla
  async generateExcelTemplate(databaseName, tableName) {
    try {
      const pool = await getPool(databaseName);

      // Obtener la estructura de la tabla
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

      // Obtener columnas de identidad
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
      }

      // Filtrar columnas insertables (excluir columnas de identidad)
      const insertableColumns = result.recordset
        .filter((col) => !identityColumns.includes(col.COLUMN_NAME))
        .map((col) => col.COLUMN_NAME);

      // Crear el template con solo headers
      const templateData = [insertableColumns];

      // Crear el workbook y worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(templateData);

      // Agregar el worksheet al workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

      // Generar el archivo temporal
      const tempFilePath = `./uploads/template_${tableName}_${Date.now()}.xlsx`;
      XLSX.writeFile(workbook, tempFilePath);

      return {
        filePath: tempFilePath,
        fileName: `template_${tableName}.xlsx`,
        headers: insertableColumns,
        totalColumns: insertableColumns.length,
      };
    } catch (error) {
      console.error("Error generating Excel template:", error);
      throw new Error(`Error al generar template de Excel: ${error.message}`);
    }
  }

  // Función para obtener los tipos de datos de las columnas
  async getColumnTypes(databaseName, tableName, columnNames) {
    try {
      const pool = await getPool(databaseName);

      // Construir la consulta con parámetros nombrados para SQL Server
      const placeholders = columnNames
        .map((_, index) => `@col${index}`)
        .join(",");
      const query = `
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = @tableName
        AND COLUMN_NAME IN (${placeholders})
        ORDER BY ORDINAL_POSITION
      `;

      const request = pool.request();
      request.input("tableName", tableName);
      columnNames.forEach((col, index) => {
        request.input(`col${index}`, col);
      });

      const result = await request.query(query);

      const columnTypes = {};
      result.recordset.forEach((row) => {
        columnTypes[row.COLUMN_NAME] = row.DATA_TYPE;
      });

      return columnTypes;
    } catch (error) {
      console.error("Error getting column types:", error);
      throw error;
    }
  }

  // Función para convertir valores de Excel a tipos SQL apropiados
  convertValueForSQL(value, sqlType) {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    // Si es un número de Excel (fecha), convertirlo
    if (
      typeof value === "number" &&
      sqlType &&
      sqlType.toLowerCase().includes("date")
    ) {
      try {
        // Convertir número de Excel a fecha
        const excelDate = XLSX.SSF.parse_date_code(value);
        if (excelDate) {
          // Crear fecha en UTC para evitar problemas de zona horaria
          const date = new Date(
            Date.UTC(excelDate.y, excelDate.m - 1, excelDate.d)
          );
          console.log(
            `🔍 Debug convert - Excel number ${value} -> Date: ${date.toISOString()}`
          );
          return date;
        }
      } catch (error) {
        console.warn(
          `🔍 Debug convert - Error converting Excel date ${value}:`,
          error.message
        );
      }
    }

    // Si es una cadena que parece fecha, intentar convertirla
    if (
      typeof value === "string" &&
      sqlType &&
      sqlType.toLowerCase().includes("date")
    ) {
      console.log(`🔍 Debug convert - Processing string date: "${value}"`);

      // Verificar si es un formato de fecha común
      const datePatterns = [
        { pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, format: "DD/MM/YYYY" }, // DD/MM/YYYY
        { pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, format: "MM/DD/YYYY" }, // MM/DD/YYYY (mismo patrón, diferente interpretación)
        { pattern: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, format: "YYYY-MM-DD" }, // YYYY-MM-DD
        { pattern: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, format: "DD-MM-YYYY" }, // DD-MM-YYYY
      ];

      for (const { pattern, format } of datePatterns) {
        const match = value.match(pattern);
        if (match) {
          try {
            let date;

            if (format === "DD/MM/YYYY") {
              // Para DD/MM/YYYY, crear fecha en UTC para evitar problemas de zona horaria
              const day = parseInt(match[1]);
              const month = parseInt(match[2]) - 1; // Meses en JS van de 0-11
              const year = parseInt(match[3]);
              date = new Date(Date.UTC(year, month, day));
            } else if (format === "MM/DD/YYYY") {
              // Para MM/DD/YYYY, crear fecha en UTC para evitar problemas de zona horaria
              const month = parseInt(match[1]) - 1;
              const day = parseInt(match[2]);
              const year = parseInt(match[3]);
              date = new Date(Date.UTC(year, month, day));
            } else {
              // Para otros formatos, usar Date constructor
              date = new Date(value);
            }

            if (!isNaN(date.getTime())) {
              console.log(
                `🔍 Debug convert - String date "${value}" (${format}) -> Date: ${date.toISOString()}`
              );
              return date;
            }
          } catch (error) {
            console.warn(
              `🔍 Debug convert - Error converting string date "${value}" with format ${format}:`,
              error.message
            );
          }
        }
      }

      // Si no coincide con ningún patrón, intentar con Date constructor como último recurso
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          console.log(
            `🔍 Debug convert - String date "${value}" (fallback) -> Date: ${date.toISOString()}`
          );
          return date;
        }
      } catch (error) {
        console.warn(
          `🔍 Debug convert - Error converting string date "${value}" (fallback):`,
          error.message
        );
      }
    }

    // Para otros tipos, devolver el valor tal como está
    return value;
  }

  // Función para generar un Excel con los errores de importación
  async generateErrorReport(
    errors,
    originalHeaders,
    fileName = "error_report"
  ) {
    try {
      // Crear el archivo Excel
      const workbook = XLSX.utils.book_new();

      // Preparar los datos para el reporte de errores
      const errorData = errors.map((error) => {
        const rowData = {
          Fila: error.row,
          Error: error.error,
          "Tipo de Error": error.errorType,
          "Error Original": error.originalError,
        };

        // Agregar los datos originales de la fila
        if (error.data && originalHeaders) {
          originalHeaders.forEach((header, index) => {
            rowData[header] = error.data[index] || "";
          });
        }

        return rowData;
      });

      // Convertir los datos a formato de hoja de cálculo
      const worksheet = XLSX.utils.json_to_sheet(errorData);

      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(workbook, worksheet, "Errores");

      // Generar nombre de archivo único
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const finalFileName = `${fileName}_errores_${timestamp}.xlsx`;
      const filePath = `uploads/${finalFileName}`;

      // Asegurar que el directorio existe
      if (!fs.existsSync("uploads")) {
        fs.mkdirSync("uploads", { recursive: true });
      }

      // Escribir el archivo
      XLSX.writeFile(workbook, filePath);

      return {
        filePath,
        fileName: finalFileName,
        errorCount: errors.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error generating error report:", error);
      throw error;
    }
  }

  // Función para exportar datos de una tabla a Excel
  async exportTableToExcel(
    databaseName,
    tableName,
    exportType = "all",
    limit = null,
    offset = null,
    filters = [],
    sort = null
  ) {
    try {
      const pool = await getPool(databaseName);

      // Import query builder
      const { buildSelectQuery } = require("../utils/queryBuilder");

      // Construir la consulta según el tipo de exportación
      let query;
      const request = pool.request();

      if (exportType === "current_page" && limit !== null && offset !== null) {
        // Exportar solo la página actual con filtros y ordenamiento
        query = buildSelectQuery(
          tableName,
          filters,
          sort,
          limit,
          offset,
          request
        );
      } else {
        // Exportar toda la tabla con filtros y ordenamiento
        query = buildSelectQuery(tableName, filters, sort, null, null, request);
      }

      // Ejecutar la consulta
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
