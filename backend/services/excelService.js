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
          errors.push({
            row: i + 2, // +2 porque Excel empieza en 1 y la primera fila son encabezados
            error: error.message,
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
}

module.exports = new ExcelService();
