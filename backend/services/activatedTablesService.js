const { getPool } = require("../db");
const {
  parseDateDDMMYYYY,
  isValidDateDDMMYYYY,
  convertToISODate,
} = require("../utils/dateUtils");

class ActivatedTablesService {
  /**
   * Obtiene todas las bases de datos disponibles (excluyendo APPDATA)
   */
  async getAllDatabases() {
    try {
      const pool = await getPool();

      const query = `
        SELECT name as DatabaseName
        FROM sys.databases 
        WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb', 'APPDATA')
        AND state = 0 -- Online databases only
        ORDER BY name
      `;

      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error("Error obteniendo bases de datos:", error);
      throw error;
    }
  }

  /**
   * Obtiene todas las tablas de una base de datos específica
   */
  async getTablesByDatabase(databaseName) {
    try {
      const pool = await getPool(databaseName);

      const query = `
        SELECT 
          TABLE_NAME as TableName,
          TABLE_SCHEMA as SchemaName
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `;

      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error("Error obteniendo tablas de la base de datos:", error);
      throw error;
    }
  }

  /**
   * Obtiene todas las tablas disponibles (activas e inactivas)
   */
  async getAllTables() {
    try {
      const pool = await getPool();

      // Obtener todas las tablas de todas las bases de datos excepto APPDATA
      const query = `
        SELECT 
          TABLE_CATALOG as DatabaseName,
          TABLE_NAME as TableName,
          TABLE_SCHEMA as SchemaName
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        AND TABLE_CATALOG NOT IN ('master', 'tempdb', 'model', 'msdb', 'APPDATA')
        ORDER BY TABLE_CATALOG, TABLE_NAME
      `;

      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error("Error obteniendo todas las tablas:", error);
      throw error;
    }
  }

  /**
   * Obtiene solo las tablas activadas
   */
  async getActivatedTables() {
    try {
      const pool = await getPool();

      // Primero verificar si la tabla USERS existe
      const usersTableExists = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'USERS'
      `);

      let query;
      if (usersTableExists.recordset[0].count > 0) {
        // Si la tabla USERS existe, usar JOIN
        query = `
          SELECT 
            at.Id,
            at.DatabaseName,
            at.TableName,
            at.IsActive,
            at.Description,
            at.CreatedAt,
            at.UpdatedAt,
            u.Username as CreatedByUsername,
            u2.Username as UpdatedByUsername
          FROM ACTIVATED_TABLES at
          LEFT JOIN USERS u ON at.CreatedBy = u.Id
          LEFT JOIN USERS u2 ON at.UpdatedBy = u2.Id
          WHERE at.IsActive = 1
          ORDER BY at.DatabaseName, at.TableName
        `;
      } else {
        // Si la tabla USERS no existe, usar consulta simple
        query = `
          SELECT 
            at.Id,
            at.DatabaseName,
            at.TableName,
            at.IsActive,
            at.Description,
            at.CreatedAt,
            at.UpdatedAt,
            'Admin' as CreatedByUsername,
            'Admin' as UpdatedByUsername
          FROM ACTIVATED_TABLES at
          WHERE at.IsActive = 1
          ORDER BY at.DatabaseName, at.TableName
        `;
      }

      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error("Error obteniendo tablas activadas:", error);
      throw error;
    }
  }

  /**
   * Obtiene la estructura de una tabla específica
   */
  async getTableStructure(databaseName, tableName) {
    try {
      const pool = await getPool(databaseName);

      const query = `
        SELECT 
          COLUMN_NAME as ColumnName,
          DATA_TYPE as DataType,
          IS_NULLABLE as IsNullable,
          CHARACTER_MAXIMUM_LENGTH as MaxLength,
          COLUMN_DEFAULT as DefaultValue,
          ORDINAL_POSITION as Position
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = @tableName
        ORDER BY ORDINAL_POSITION
      `;

      const result = await pool
        .request()
        .input("tableName", tableName)
        .query(query);

      return result.recordset;
    } catch (error) {
      console.error("Error obteniendo estructura de tabla:", error);
      throw error;
    }
  }

  /**
   * Verifica si una tabla está activada
   */
  async isTableActivated(databaseName, tableName) {
    try {
      const pool = await getPool();

      const query = `
        SELECT Id, IsActive 
        FROM ACTIVATED_TABLES 
        WHERE DatabaseName = @databaseName AND TableName = @tableName
      `;

      const result = await pool
        .request()
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .query(query);

      return result.recordset.length > 0 && result.recordset[0].IsActive;
    } catch (error) {
      console.error("Error verificando si tabla está activada:", error);
      throw error;
    }
  }

  /**
   * Activa una tabla
   */
  async activateTable(databaseName, tableName, description, userId) {
    try {
      const pool = await getPool();

      // Verificar si ya existe y está activa
      const existing = await pool
        .request()
        .input("databaseName", databaseName)
        .input("tableName", tableName).query(`
          SELECT Id, IsActive FROM ACTIVATED_TABLES 
          WHERE DatabaseName = @databaseName AND TableName = @tableName
        `);

      if (existing.recordset.length > 0) {
        if (existing.recordset[0].IsActive) {
          throw new Error(
            `La tabla ${databaseName}.${tableName} ya está activada`
          );
        } else {
          // Reactivar tabla existente
          await pool
            .request()
            .input("databaseName", databaseName)
            .input("tableName", tableName)
            .input("description", description)
            .input("userId", userId).query(`
              UPDATE ACTIVATED_TABLES 
              SET IsActive = 1, Description = @description, UpdatedAt = GETDATE(), UpdatedBy = @userId
              WHERE DatabaseName = @databaseName AND TableName = @tableName
            `);

          return existing.recordset[0].Id;
        }
      } else {
        // Insertar nueva tabla activada
        const result = await pool
          .request()
          .input("databaseName", databaseName)
          .input("tableName", tableName)
          .input("description", description)
          .input("userId", userId).query(`
            INSERT INTO ACTIVATED_TABLES (DatabaseName, TableName, Description, CreatedBy, UpdatedBy)
            OUTPUT INSERTED.Id
            VALUES (@databaseName, @tableName, @description, @userId, @userId)
          `);

        return result.recordset[0].Id;
      }
    } catch (error) {
      console.error("Error activando tabla:", error);
      throw error;
    }
  }

  /**
   * Desactiva una tabla
   */
  async deactivateTable(databaseName, tableName, userId) {
    try {
      const pool = await getPool();

      await pool
        .request()
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .input("userId", userId).query(`
          UPDATE ACTIVATED_TABLES 
          SET IsActive = 0, UpdatedAt = GETDATE(), UpdatedBy = @userId
          WHERE DatabaseName = @databaseName AND TableName = @tableName
        `);

      return true;
    } catch (error) {
      console.error("Error desactivando tabla:", error);
      throw error;
    }
  }

  /**
   * Obtiene las condiciones de una tabla
   */
  async getTableConditions(activatedTableId) {
    try {
      const pool = await getPool();

      const query = `
        SELECT 
          tc.Id,
          tc.ColumnName,
          tc.DataType,
          tc.ConditionType,
          tc.ConditionValue,
          tc.IsRequired,
          tc.IsActive,
          tc.CreatedAt,
          tc.UpdatedAt,
          u.Username as CreatedByUsername,
          u2.Username as UpdatedByUsername
        FROM TABLE_CONDITIONS tc
        LEFT JOIN USERS u ON tc.CreatedBy = u.Id
        LEFT JOIN USERS u2 ON tc.UpdatedBy = u2.Id
        WHERE tc.ActivatedTableId = @activatedTableId
        ORDER BY tc.ColumnName, tc.ConditionType
      `;

      const result = await pool
        .request()
        .input("activatedTableId", activatedTableId)
        .query(query);

      return result.recordset;
    } catch (error) {
      console.error("Error obteniendo condiciones de tabla:", error);
      throw error;
    }
  }

  /**
   * Obtiene las condiciones de una tabla por database y table name
   */
  async getTableConditionsByDatabaseAndTable(databaseName, tableName) {
    try {
      const pool = await getPool();

      const query = `
        SELECT 
          tc.Id,
          tc.ColumnName,
          tc.DataType,
          tc.ConditionType,
          tc.ConditionValue,
          tc.IsRequired,
          tc.IsActive,
          tc.CreatedAt,
          tc.UpdatedAt,
          'Admin' as CreatedByUsername,
          'Admin' as UpdatedByUsername
        FROM TABLE_CONDITIONS tc
        JOIN ACTIVATED_TABLES at ON tc.ActivatedTableId = at.Id
        WHERE at.DatabaseName = @databaseName 
        AND at.TableName = @tableName 
        AND at.IsActive = 1
        ORDER BY tc.ColumnName, tc.ConditionType
      `;

      const result = await pool
        .request()
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .query(query);

      return result.recordset;
    } catch (error) {
      console.error("Error obteniendo condiciones de tabla:", error);
      throw error;
    }
  }

  /**
   * Actualiza las condiciones de una tabla activada
   */
  async updateTableConditions(databaseName, tableName, conditions, userId) {
    try {
      const pool = await getPool();

      // Obtener el ID de la tabla activada
      const tableQuery = `
        SELECT Id FROM ACTIVATED_TABLES 
        WHERE DatabaseName = @databaseName 
        AND TableName = @tableName 
        AND IsActive = 1
      `;

      const tableResult = await pool
        .request()
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .query(tableQuery);

      if (tableResult.recordset.length === 0) {
        throw new Error(
          `La tabla ${databaseName}.${tableName} no está activada`
        );
      }

      const activatedTableId = tableResult.recordset[0].Id;

      // Eliminar condiciones existentes
      await pool.request().input("activatedTableId", activatedTableId).query(`
          DELETE FROM TABLE_CONDITIONS 
          WHERE ActivatedTableId = @activatedTableId
        `);

      // Insertar nuevas condiciones
      for (const condition of conditions) {
        await pool
          .request()
          .input("activatedTableId", activatedTableId)
          .input("columnName", condition.columnName)
          .input("dataType", condition.dataType)
          .input("conditionType", condition.conditionType)
          .input("conditionValue", condition.conditionValue)
          .input("isRequired", condition.isRequired)
          .input("userId", userId).query(`
            INSERT INTO TABLE_CONDITIONS (
              ActivatedTableId, ColumnName, DataType, ConditionType, 
              ConditionValue, IsRequired, CreatedBy, UpdatedBy
            )
            VALUES (
              @activatedTableId, @columnName, @dataType, @conditionType,
              @conditionValue, @isRequired, @userId, @userId
            )
          `);
      }

      return true;
    } catch (error) {
      console.error("Error actualizando condiciones de tabla:", error);
      throw error;
    }
  }

  /**
   * Guarda las condiciones de una tabla
   */
  async saveTableConditions(activatedTableId, conditions, userId) {
    try {
      const pool = await getPool();

      // Eliminar condiciones existentes
      await pool.request().input("activatedTableId", activatedTableId).query(`
          DELETE FROM TABLE_CONDITIONS 
          WHERE ActivatedTableId = @activatedTableId
        `);

      // Insertar nuevas condiciones
      for (const condition of conditions) {
        await pool
          .request()
          .input("activatedTableId", activatedTableId)
          .input("columnName", condition.columnName)
          .input("dataType", condition.dataType)
          .input("conditionType", condition.conditionType)
          .input("conditionValue", condition.conditionValue)
          .input("isRequired", condition.isRequired)
          .input("userId", userId).query(`
            INSERT INTO TABLE_CONDITIONS (
              ActivatedTableId, ColumnName, DataType, ConditionType, 
              ConditionValue, IsRequired, CreatedBy, UpdatedBy
            )
            VALUES (
              @activatedTableId, @columnName, @dataType, @conditionType,
              @conditionValue, @isRequired, @userId, @userId
            )
          `);
      }

      return true;
    } catch (error) {
      console.error("Error guardando condiciones de tabla:", error);
      throw error;
    }
  }

  /**
   * Valida datos según las condiciones de la tabla
   */
  async validateTableData(databaseName, tableName, data) {
    try {
      const pool = await getPool();

      // Obtener las condiciones de la tabla
      const conditionsQuery = `
        SELECT tc.*
        FROM TABLE_CONDITIONS tc
        JOIN ACTIVATED_TABLES at ON tc.ActivatedTableId = at.Id
        WHERE at.DatabaseName = @databaseName 
        AND at.TableName = @tableName 
        AND tc.IsActive = 1
        AND at.IsActive = 1
      `;

      const conditionsResult = await pool
        .request()
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .query(conditionsQuery);

      const conditions = conditionsResult.recordset;
      const errors = [];

      // Obtener información de la estructura de la tabla para identificar campos identity
      const structureQuery = `
        SELECT 
          COLUMN_NAME,
          COLUMNPROPERTY(object_id(@tableName), COLUMN_NAME, 'IsIdentity') as IS_IDENTITY
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = @tableName
      `;

      const structureResult = await pool
        .request()
        .input("tableName", tableName)
        .query(structureQuery);

      const identityColumns = structureResult.recordset
        .filter((col) => col.IS_IDENTITY)
        .map((col) => col.COLUMN_NAME);

      // Validar cada campo según sus condiciones
      for (const condition of conditions) {
        // Saltar validación para campos identity (auto-increment)
        if (identityColumns.includes(condition.ColumnName)) {
          continue;
        }

        const fieldValue = data[condition.ColumnName];

        // Validar campo requerido
        if (
          condition.IsRequired &&
          (fieldValue === null || fieldValue === undefined || fieldValue === "")
        ) {
          errors.push(`El campo '${condition.ColumnName}' es obligatorio`);
          continue;
        }

        // Si el campo está vacío y no es requerido, continuar
        if (
          fieldValue === null ||
          fieldValue === undefined ||
          fieldValue === ""
        ) {
          continue;
        }

        // Validar según el tipo de dato
        switch (condition.DataType.toLowerCase()) {
          case "string":
            errors.push(...this.validateStringField(condition, fieldValue));
            break;
          case "numeric":
            errors.push(...this.validateNumericField(condition, fieldValue));
            break;
          case "date":
            errors.push(...this.validateDateField(condition, fieldValue));
            break;
          case "boolean":
            errors.push(...this.validateBooleanField(condition, fieldValue));
            break;
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      console.error("Error validando datos de tabla:", error);
      throw error;
    }
  }

  /**
   * Valida campos de tipo string
   */
  validateStringField(condition, value) {
    const errors = [];
    const stringValue = String(value);

    try {
      const conditionValue = JSON.parse(condition.ConditionValue);

      switch (condition.ConditionType) {
        case "length":
          if (conditionValue.min && stringValue.length < conditionValue.min) {
            errors.push(
              `El campo '${condition.ColumnName}' debe tener al menos ${conditionValue.min} caracteres`
            );
          }
          if (conditionValue.max && stringValue.length > conditionValue.max) {
            errors.push(
              `El campo '${condition.ColumnName}' debe tener máximo ${conditionValue.max} caracteres`
            );
          }
          break;

        case "contains":
          if (
            !stringValue
              .toLowerCase()
              .includes(conditionValue.text.toLowerCase())
          ) {
            errors.push(
              `El campo '${condition.ColumnName}' debe contener '${conditionValue.text}'`
            );
          }
          break;

        case "regex":
          const regex = new RegExp(conditionValue.pattern);
          if (!regex.test(stringValue)) {
            errors.push(
              `El campo '${condition.ColumnName}' no cumple con el patrón requerido`
            );
          }
          break;

        case "starts_with":
          if (
            !stringValue
              .toLowerCase()
              .startsWith(conditionValue.text.toLowerCase())
          ) {
            errors.push(
              `El campo '${condition.ColumnName}' debe comenzar con '${conditionValue.text}'`
            );
          }
          break;

        case "ends_with":
          if (
            !stringValue
              .toLowerCase()
              .endsWith(conditionValue.text.toLowerCase())
          ) {
            errors.push(
              `El campo '${condition.ColumnName}' debe terminar con '${conditionValue.text}'`
            );
          }
          break;
      }
    } catch (error) {
      console.error("Error validando campo string:", error);
    }

    return errors;
  }

  /**
   * Valida campos de tipo numérico
   */
  validateNumericField(condition, value) {
    const errors = [];
    const numericValue = parseFloat(value);

    if (isNaN(numericValue)) {
      errors.push(
        `El campo '${condition.ColumnName}' debe ser un número válido`
      );
      return errors;
    }

    try {
      const conditionValue = JSON.parse(condition.ConditionValue);

      switch (condition.ConditionType) {
        case "range":
          if (
            conditionValue.min !== undefined &&
            numericValue < conditionValue.min
          ) {
            errors.push(
              `El campo '${condition.ColumnName}' debe ser mayor o igual a ${conditionValue.min}`
            );
          }
          if (
            conditionValue.max !== undefined &&
            numericValue > conditionValue.max
          ) {
            errors.push(
              `El campo '${condition.ColumnName}' debe ser menor o igual a ${conditionValue.max}`
            );
          }
          break;

        case "min":
          if (numericValue < conditionValue.value) {
            errors.push(
              `El campo '${condition.ColumnName}' debe ser mayor o igual a ${conditionValue.value}`
            );
          }
          break;

        case "max":
          if (numericValue > conditionValue.value) {
            errors.push(
              `El campo '${condition.ColumnName}' debe ser menor o igual a ${conditionValue.value}`
            );
          }
          break;
      }
    } catch (error) {
      console.error("Error validando campo numérico:", error);
    }

    return errors;
  }

  /**
   * Valida campos de tipo fecha
   */
  validateDateField(condition, value) {
    const errors = [];

    // Intentar parsear la fecha en formato DD/MM/AAAA
    const dateValue = parseDateDDMMYYYY(value);

    if (!dateValue) {
      errors.push(
        `El campo '${condition.ColumnName}' debe ser una fecha válida en formato DD/MM/AAAA`
      );
      return errors;
    }

    try {
      const conditionValue = JSON.parse(condition.ConditionValue);

      switch (condition.ConditionType) {
        case "range":
          if (conditionValue.min) {
            const minDate = new Date(conditionValue.min);
            if (dateValue < minDate) {
              errors.push(
                `El campo '${condition.ColumnName}' debe ser posterior a ${conditionValue.min}`
              );
            }
          }
          if (conditionValue.max) {
            const maxDate = new Date(conditionValue.max);
            if (dateValue > maxDate) {
              errors.push(
                `El campo '${condition.ColumnName}' debe ser anterior a ${conditionValue.max}`
              );
            }
          }
          break;

        case "before":
          const beforeDate = new Date(conditionValue.date);
          if (dateValue >= beforeDate) {
            errors.push(
              `El campo '${condition.ColumnName}' debe ser anterior a ${conditionValue.date}`
            );
          }
          break;

        case "after":
          const afterDate = new Date(conditionValue.date);
          if (dateValue <= afterDate) {
            errors.push(
              `El campo '${condition.ColumnName}' debe ser posterior a ${conditionValue.date}`
            );
          }
          break;
      }
    } catch (error) {
      console.error("Error validando campo fecha:", error);
    }

    return errors;
  }

  /**
   * Valida campos de tipo boolean
   */
  validateBooleanField(condition, value) {
    const errors = [];
    const boolValue = Boolean(value);

    try {
      const conditionValue = JSON.parse(condition.ConditionValue);

      switch (condition.ConditionType) {
        case "value":
          if (boolValue !== conditionValue.expected) {
            errors.push(
              `El campo '${condition.ColumnName}' debe ser ${
                conditionValue.expected ? "verdadero" : "falso"
              }`
            );
          }
          break;
      }
    } catch (error) {
      console.error("Error validando campo boolean:", error);
    }

    return errors;
  }
}

module.exports = new ActivatedTablesService();
