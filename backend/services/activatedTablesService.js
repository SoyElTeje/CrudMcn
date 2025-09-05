const { getPool } = require("../db");
const {
  parseDateDDMMYYYY,
  isValidDateDDMMYYYY,
  convertToISODate,
} = require("../utils/dateUtils");

class ActivatedTablesService {
  /**
   * Obtiene todas las bases de datos disponibles para un usuario específico
   */
  async getAllDatabases(userId = null) {
    try {
      const pool = await getPool();

      if (userId) {
        // Obtener bases de datos a las que el usuario tiene permisos
        const query = `
          SELECT DISTINCT database_name as DatabaseName
          FROM user_permissions 
          WHERE user_id = @userId
          ORDER BY database_name
        `;

        const result = await pool
          .request()
          .input("userId", userId)
          .query(query);

        return result.recordset;
      } else {
        // Si no se especifica usuario, obtener todas las bases de datos del servidor
        const query = `
          SELECT name as DatabaseName
          FROM sys.databases 
          WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')
          ORDER BY name
        `;

        const result = await pool.request().query(query);
        return result.recordset;
      }
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
   * Obtiene todas las tablas disponibles para un usuario específico
   */
  async getAllTables(userId = null) {
    try {
      const pool = await getPool();

      if (userId) {
        // Obtener tablas de bases de datos a las que el usuario tiene permisos
        const query = `
          SELECT DISTINCT 
            up.database_name as DatabaseName,
            t.TABLE_NAME as TableName,
            t.TABLE_SCHEMA as SchemaName
          FROM user_permissions up
          CROSS APPLY (
            SELECT TABLE_NAME, TABLE_SCHEMA
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_CATALOG = up.database_name 
            AND TABLE_TYPE = 'BASE TABLE'
          ) t
          WHERE up.user_id = @userId
          ORDER BY up.database_name, t.TABLE_NAME
        `;

        const result = await pool
          .request()
          .input("userId", userId)
          .query(query);

        return result.recordset;
      } else {
        // Si no se especifica usuario, obtener todas las tablas de todas las bases de datos
        const query = `
          SELECT 
            TABLE_CATALOG as DatabaseName,
            TABLE_NAME as TableName,
            TABLE_SCHEMA as SchemaName
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_TYPE = 'BASE TABLE'
          AND TABLE_CATALOG NOT IN ('master', 'tempdb', 'model', 'msdb')
          ORDER BY TABLE_CATALOG, TABLE_NAME
        `;

        const result = await pool.request().query(query);
        return result.recordset;
      }
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

      // Siempre usar consulta simple para evitar problemas con JOINs
      const query = `
        SELECT 
          at.Id,
          at.DatabaseName,
          at.TableName,
          at.Description,
          at.IsActive,
          at.FechaCreacion,
          at.CreatedBy,
          u.username as CreatedByUsername
        FROM ACTIVATED_TABLES at
        LEFT JOIN users u ON at.CreatedBy = u.id
        WHERE at.IsActive = 1
        ORDER BY at.DatabaseName, at.TableName
      `;

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
          COLUMN_DEFAULT as DefaultValue,
          CHARACTER_MAXIMUM_LENGTH as MaxLength,
          NUMERIC_PRECISION as NumericPrecision,
          NUMERIC_SCALE as NumericScale
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
   * Activa una tabla
   */
  async activateTable(databaseName, tableName, description, userId) {
    try {
      const pool = await getPool();

      // Verificar si la tabla ya está activada
      const checkQuery = `
        SELECT Id FROM ACTIVATED_TABLES 
        WHERE DatabaseName = @databaseName AND TableName = @tableName
      `;

      const checkResult = await pool
        .request()
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .query(checkQuery);

      if (checkResult.recordset.length > 0) {
        // Si ya existe, actualizar
        const updateQuery = `
          UPDATE ACTIVATED_TABLES 
          SET Description = @description, IsActive = 1, FechaModificacion = GETDATE()
          WHERE DatabaseName = @databaseName AND TableName = @tableName
        `;

        await pool
          .request()
          .input("databaseName", databaseName)
          .input("tableName", tableName)
          .input("description", description)
          .query(updateQuery);

        return checkResult.recordset[0].Id;
      } else {
        // Si no existe, crear nueva
        const insertQuery = `
          INSERT INTO ACTIVATED_TABLES (DatabaseName, TableName, Description, IsActive, FechaCreacion, CreatedBy)
          VALUES (@databaseName, @tableName, @description, 1, GETDATE(), @userId)
        `;

        const insertResult = await pool
          .request()
          .input("databaseName", databaseName)
          .input("tableName", tableName)
          .input("description", description)
          .input("userId", userId)
          .query(insertQuery + "; SELECT SCOPE_IDENTITY() as Id");

        return insertResult.recordset[0].Id;
      }
    } catch (error) {
      console.error("Error activando tabla:", error);
      throw error;
    }
  }

  /**
   * Desactiva una tabla
   */
  async deactivateTable(databaseName, tableName) {
    try {
      const pool = await getPool();

      const query = `
        UPDATE ACTIVATED_TABLES 
        SET IsActive = 0, FechaModificacion = GETDATE()
        WHERE DatabaseName = @databaseName AND TableName = @tableName
      `;

      await pool
        .request()
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .query(query);

      return true;
    } catch (error) {
      console.error("Error desactivando tabla:", error);
      throw error;
    }
  }

  /**
   * Obtiene las condiciones de una tabla por ID
   */
  async getTableConditions(activatedTableId) {
    try {
      const pool = await getPool();

      const query = `
        SELECT 
          tc.Id,
          tc.ColumnName,
          tc.ConditionType,
          tc.ConditionValue,
          tc.IsRequired,
          tc.CreatedAt,
          tc.CreatedBy
        FROM TABLE_CONDITIONS tc
        WHERE tc.ActivatedTableId = @activatedTableId
        ORDER BY tc.ColumnName
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
          tc.ConditionType,
          tc.ConditionValue,
          tc.IsRequired,
          tc.CreatedAt,
          tc.CreatedBy
        FROM TABLE_CONDITIONS tc
        INNER JOIN ACTIVATED_TABLES at ON tc.ActivatedTableId = at.Id
        WHERE at.DatabaseName = @databaseName 
        AND at.TableName = @tableName
        AND at.IsActive = 1
        ORDER BY tc.ColumnName
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
   * Guarda las condiciones de una tabla
   */
  async saveTableConditions(activatedTableId, conditions, userId) {
    try {
      const pool = await getPool();

      // Eliminar condiciones existentes
      const deleteQuery = `
        DELETE FROM TABLE_CONDITIONS 
        WHERE ActivatedTableId = @activatedTableId
      `;

      await pool
        .request()
        .input("activatedTableId", activatedTableId)
        .query(deleteQuery);

      // Insertar nuevas condiciones
      for (const condition of conditions) {
        const insertQuery = `
          INSERT INTO TABLE_CONDITIONS (
            ActivatedTableId, ColumnName, ConditionType, 
            ConditionValue, IsRequired, CreatedAt, CreatedBy
          )
          VALUES (
            @activatedTableId, @columnName, @conditionType,
            @conditionValue, @isRequired, GETDATE(), @userId
          )
        `;

        await pool
          .request()
          .input("activatedTableId", activatedTableId)
          .input("columnName", condition.columnName)
          .input("conditionType", condition.conditionType)
          .input("conditionValue", JSON.stringify(condition.conditionValue))
          .input("isRequired", condition.isRequired || false)
          .input("userId", userId)
          .query(insertQuery);
      }

      return true;
    } catch (error) {
      console.error("Error guardando condiciones de tabla:", error);
      throw error;
    }
  }

  /**
   * Actualiza las condiciones de una tabla
   */
  async updateTableConditions(
    databaseName,
    tableName,
    conditions,
    description,
    userId
  ) {
    try {
      const pool = await getPool();

      // Obtener el ID de la tabla activada
      const tableQuery = `
        SELECT Id FROM ACTIVATED_TABLES 
        WHERE DatabaseName = @databaseName AND TableName = @tableName
      `;

      const tableResult = await pool
        .request()
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .query(tableQuery);

      if (tableResult.recordset.length === 0) {
        throw new Error("Tabla no encontrada");
      }

      const activatedTableId = tableResult.recordset[0].Id;

      // Actualizar descripción
      if (description) {
        const updateDescQuery = `
          UPDATE ACTIVATED_TABLES 
          SET Description = @description, FechaModificacion = GETDATE()
          WHERE Id = @activatedTableId
        `;

        await pool
          .request()
          .input("description", description)
          .input("activatedTableId", activatedTableId)
          .query(updateDescQuery);
      }

      // Guardar condiciones
      if (conditions && conditions.length > 0) {
        await this.saveTableConditions(activatedTableId, conditions, userId);
      }

      return true;
    } catch (error) {
      console.error("Error actualizando condiciones de tabla:", error);
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
        SELECT Id FROM ACTIVATED_TABLES 
        WHERE DatabaseName = @databaseName 
        AND TableName = @tableName 
        AND IsActive = 1
      `;

      const result = await pool
        .request()
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .query(query);

      return result.recordset.length > 0;
    } catch (error) {
      console.error("Error verificando si tabla está activada:", error);
      throw error;
    }
  }

  /**
   * Valida los datos de una tabla según las condiciones configuradas
   */
  async validateTableData(databaseName, tableName, data) {
    try {
      // Obtener las condiciones de la tabla
      const conditions = await this.getTableConditionsByDatabaseAndTable(
        databaseName,
        tableName
      );

      if (conditions.length === 0) {
        return { isValid: true, errors: [] };
      }

      const errors = [];

      // Validar cada campo según sus condiciones
      for (const condition of conditions) {
        const fieldValue = data[condition.ColumnName];

        // Validar campo requerido
        if (
          condition.IsRequired &&
          (fieldValue === undefined || fieldValue === null || fieldValue === "")
        ) {
          errors.push(`El campo '${condition.ColumnName}' es requerido`);
          continue;
        }

        // Si el campo no tiene valor y no es requerido, continuar
        if (
          fieldValue === undefined ||
          fieldValue === null ||
          fieldValue === ""
        ) {
          continue;
        }

        // Validar según el tipo de condición
        switch (condition.ConditionType) {
          case "date":
            const dateErrors = this.validateDateField(condition, fieldValue);
            errors.push(...dateErrors);
            break;
          case "boolean":
            const boolErrors = this.validateBooleanField(condition, fieldValue);
            errors.push(...boolErrors);
            break;
          case "text":
            const textErrors = this.validateTextField(condition, fieldValue);
            errors.push(...textErrors);
            break;
          case "number":
            const numberErrors = this.validateNumberField(
              condition,
              fieldValue
            );
            errors.push(...numberErrors);
            break;
        }
      }

      return {
        isValid: errors.length === 0,
        errors: errors,
      };
    } catch (error) {
      console.error("Error validando datos de tabla:", error);
      throw error;
    }
  }

  /**
   * Valida campos de tipo texto
   */
  validateTextField(condition, value) {
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
        case "pattern":
          const regex = new RegExp(conditionValue.pattern);
          if (!regex.test(stringValue)) {
            errors.push(
              `El campo '${condition.ColumnName}' no cumple con el formato requerido`
            );
          }
          break;
      }
    } catch (error) {
      console.error("Error validando campo texto:", error);
    }

    return errors;
  }

  /**
   * Valida campos de tipo número
   */
  validateNumberField(condition, value) {
    const errors = [];
    const numValue = Number(value);

    if (isNaN(numValue)) {
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
            numValue < conditionValue.min
          ) {
            errors.push(
              `El campo '${condition.ColumnName}' debe ser mayor o igual a ${conditionValue.min}`
            );
          }
          if (
            conditionValue.max !== undefined &&
            numValue > conditionValue.max
          ) {
            errors.push(
              `El campo '${condition.ColumnName}' debe ser menor o igual a ${conditionValue.max}`
            );
          }
          break;
        case "precision":
          if (conditionValue.decimals !== undefined) {
            const decimalPlaces = (numValue.toString().split(".")[1] || "")
              .length;
            if (decimalPlaces > conditionValue.decimals) {
              errors.push(
                `El campo '${condition.ColumnName}' no puede tener más de ${conditionValue.decimals} decimales`
              );
            }
          }
          break;
      }
    } catch (error) {
      console.error("Error validando campo número:", error);
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
