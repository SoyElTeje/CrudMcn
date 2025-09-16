const { getPool } = require("../db");

class LogService {
  /**
   * Registra una acción en el sistema de logs
   * @param {Object} logData - Datos del log
   * @param {number} logData.userId - ID del usuario
   * @param {string} logData.username - Nombre del usuario
   * @param {string} logData.action - Tipo de acción (INSERT, UPDATE, DELETE, EXPORT)
   * @param {string} logData.databaseName - Nombre de la base de datos
   * @param {string} logData.tableName - Nombre de la tabla
   * @param {string} [logData.recordId] - ID del registro afectado
   * @param {Object} [logData.oldData] - Datos anteriores (para UPDATE/DELETE)
   * @param {Object} [logData.newData] - Datos nuevos (para INSERT/UPDATE)
   * @param {number} [logData.affectedRows=1] - Número de registros afectados
   * @param {string} [logData.ipAddress] - Dirección IP del usuario
   * @param {string} [logData.userAgent] - User agent del navegador
   */
  async logAction(logData) {
    try {
      const {
        userId,
        username,
        action,
        databaseName,
        tableName,
        recordId = null,
        oldData = null,
        newData = null,
        affectedRows = 1,
        ipAddress = null,
        userAgent = null,
      } = logData;

      const pool = await getPool();

      // Verificar si la tabla audit_logs existe
      const tableExistsQuery = `
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'audit_logs'
      `;

      const tableExistsResult = await pool.request().query(tableExistsQuery);
      const tableExists = tableExistsResult.recordset[0].count > 0;

      if (!tableExists) {
        console.log("⚠️ Tabla audit_logs no existe, no se puede registrar log");
        return;
      }

      const query = `
        INSERT INTO audit_logs (
          user_id, action, database_name, table_name, 
          record_id, old_values, new_values, affected_rows, ip_address, user_agent, timestamp
        ) VALUES (
          @userId, @action, @databaseName, @tableName,
          @recordId, @oldValues, @newValues, @affectedRows, @ipAddress, @userAgent, GETDATE()
        )
      `;

      // Construir los valores antiguos y nuevos
      const oldValues = oldData ? JSON.stringify(oldData) : null;
      const newValues = newData ? JSON.stringify(newData) : null;

      // Convertir recordId a int si es posible, o null si no
      let recordIdInt = null;
      if (recordId) {
        if (typeof recordId === "number") {
          recordIdInt = recordId;
        } else if (typeof recordId === "string") {
          // Intentar extraer un ID numérico del string
          const match = recordId.match(/\d+/);
          if (match) {
            recordIdInt = parseInt(match[0], 10);
          }
        }
      }

      await pool
        .request()
        .input("userId", userId)
        .input("action", action)
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .input("recordId", recordIdInt)
        .input("oldValues", oldValues)
        .input("newValues", newValues)
        .input("affectedRows", affectedRows)
        .input("ipAddress", ipAddress)
        .input("userAgent", userAgent)
        .query(query);

      console.log(
        `✅ Log registrado: ${action} en ${databaseName}.${tableName} por usuario ${userId}`
      );
    } catch (error) {
      console.error("❌ Error registrando log:", error);
      // No lanzamos el error para no interrumpir la operación principal
    }
  }

  /**
   * Registra una inserción de registro
   */
  async logInsert(
    userId,
    username,
    databaseName,
    tableName,
    newData,
    recordId = null,
    affectedRows = 1,
    ipAddress = null,
    userAgent = null
  ) {
    await this.logAction({
      userId,
      username,
      action: "INSERT",
      databaseName,
      tableName,
      recordId,
      newData,
      affectedRows,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra una actualización de registro
   */
  async logUpdate(
    userId,
    username,
    databaseName,
    tableName,
    oldData,
    newData,
    recordId = null,
    affectedRows = 1,
    ipAddress = null,
    userAgent = null
  ) {
    await this.logAction({
      userId,
      username,
      action: "UPDATE",
      databaseName,
      tableName,
      recordId,
      oldData,
      newData,
      affectedRows,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra una eliminación de registro
   */
  async logDelete(
    userId,
    username,
    databaseName,
    tableName,
    oldData,
    recordId = null,
    affectedRows = 1,
    ipAddress = null,
    userAgent = null
  ) {
    await this.logAction({
      userId,
      username,
      action: "DELETE",
      databaseName,
      tableName,
      recordId,
      oldData,
      affectedRows,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra una exportación de Excel
   */
  async logExport(
    userId,
    username,
    databaseName,
    tableName,
    affectedRows = 0,
    ipAddress = null,
    userAgent = null
  ) {
    await this.logAction({
      userId,
      username,
      action: "EXPORT",
      databaseName,
      tableName,
      affectedRows,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Obtiene los logs de un usuario específico
   */
  async getUserLogs(userId, limit = 50, offset = 0) {
    try {
      const pool = await getPool();

      // Verificar si la tabla LOGS existe
      const tableExistsQuery = `
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'LOGS'
      `;

      const tableExistsResult = await pool.request().query(tableExistsQuery);
      const tableExists = tableExistsResult.recordset[0].count > 0;

      if (!tableExists) {
        console.log("⚠️ Tabla LOGS no existe, retornando logs vacíos");
        return [];
      }

      const query = `
        SELECT 
          Id, UserId, Action, DatabaseName, TableName,
          Details, FechaCreacion, IPAddress, UserAgent
        FROM LOGS 
        WHERE UserId = @userId
        ORDER BY FechaCreacion DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `;

      const result = await pool
        .request()
        .input("userId", userId)
        .input("limit", limit)
        .input("offset", offset)
        .query(query);

      return result.recordset.map((log) => {
        const details = log.Details ? JSON.parse(log.Details) : {};
        return {
          ...log,
          Username: details.username || null,
          RecordId: details.recordId || null,
          OldData: details.oldData || null,
          NewData: details.newData || null,
          AffectedRows: details.affectedRows || 1,
        };
      });
    } catch (error) {
      console.error("Error obteniendo logs del usuario:", error);
      // Si hay error, retornar logs vacíos en lugar de fallar
      return [];
    }
  }

  /**
   * Obtiene todos los logs (solo para admins)
   */
  async getAllLogs(limit = 100, offset = 0, filters = {}) {
    try {
      const pool = await getPool();

      // Verificar si la tabla audit_logs existe
      const tableExistsQuery = `
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'audit_logs'
      `;

      const tableExistsResult = await pool.request().query(tableExistsQuery);
      const tableExists = tableExistsResult.recordset[0].count > 0;

      if (!tableExists) {
        console.log("⚠️ Tabla audit_logs no existe, retornando logs vacíos");
        return {
          data: [],
          totalRecords: 0,
          currentPage: 1,
          totalPages: 0,
          recordsPerPage: limit,
        };
      }

      let query = `
        SELECT 
          a.id as Id, a.user_id as UserId, a.action as Action, 
          a.database_name as DatabaseName, a.table_name as TableName,
          a.record_id as RecordId, a.old_values as OldData, a.new_values as NewData,
          a.affected_rows as AffectedRows, a.ip_address as IPAddress, a.user_agent as UserAgent, a.timestamp as FechaCreacion,
          u.username as Username
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE 1=1
      `;

      const request = pool.request();

      // Aplicar filtros
      if (filters.action) {
        query += " AND a.action = @action";
        request.input("action", filters.action);
      }

      if (filters.databaseName) {
        query += " AND a.database_name = @databaseName";
        request.input("databaseName", filters.databaseName);
      }

      if (filters.tableName) {
        query += " AND a.table_name = @tableName";
        request.input("tableName", filters.tableName);
      }

      if (filters.username) {
        query += " AND u.username LIKE @username";
        request.input("username", `%${filters.username}%`);
      }

      if (filters.startDate) {
        query += " AND a.timestamp >= @startDate";
        request.input("startDate", filters.startDate);
      }

      if (filters.endDate) {
        query += " AND a.timestamp <= @endDate";
        request.input("endDate", filters.endDate);
      }

      // Query para contar el total de registros con los mismos filtros
      let countQuery = `
        SELECT COUNT(*) as total
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE 1=1
      `;

      const countRequest = pool.request();

      // Aplicar los mismos filtros al count
      if (filters.action) {
        countQuery += " AND a.action = @action";
        countRequest.input("action", filters.action);
      }

      if (filters.databaseName) {
        countQuery += " AND a.database_name = @databaseName";
        countRequest.input("databaseName", filters.databaseName);
      }

      if (filters.tableName) {
        countQuery += " AND a.table_name = @tableName";
        countRequest.input("tableName", filters.tableName);
      }

      if (filters.username) {
        countQuery += " AND u.username LIKE @username";
        countRequest.input("username", `%${filters.username}%`);
      }

      if (filters.startDate) {
        countQuery += " AND a.timestamp >= @startDate";
        countRequest.input("startDate", filters.startDate);
      }

      if (filters.endDate) {
        countQuery += " AND a.timestamp <= @endDate";
        countRequest.input("endDate", filters.endDate);
      }

      // Ejecutar ambas queries en paralelo
      const [result, countResult] = await Promise.all([
        request
          .input("limit", limit)
          .input("offset", offset)
          .query(
            query +
              " ORDER BY a.timestamp DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY"
          ),
        countRequest.query(countQuery),
      ]);

      const totalRecords = countResult.recordset[0].total;

      return {
        data: result.recordset.map((log) => {
          // Parsear los valores JSON si existen
          const oldData = log.OldData ? JSON.parse(log.OldData) : null;
          const newData = log.NewData ? JSON.parse(log.NewData) : null;

          // Formatear la fecha como string ISO
          const fechaCreacion =
            log.FechaCreacion instanceof Date
              ? log.FechaCreacion.toISOString()
              : log.FechaCreacion;

          return {
            ...log,
            Username: log.Username, // Ahora viene del JOIN con users
            RecordId: log.RecordId,
            OldData: oldData,
            NewData: newData,
            AffectedRows: log.AffectedRows || 1, // Usar el valor real de la base de datos
            FechaCreacion: fechaCreacion, // Asegurar que sea string
          };
        }),
        totalRecords,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(totalRecords / limit),
        recordsPerPage: limit,
      };
    } catch (error) {
      console.error("Error obteniendo todos los logs:", error);
      // Si hay error, retornar logs vacíos en lugar de fallar
      return {
        data: [],
        totalRecords: 0,
        currentPage: 1,
        totalPages: 0,
        recordsPerPage: limit,
      };
    }
  }

  /**
   * Obtiene estadísticas de logs
   */
  async getLogStats() {
    try {
      const pool = await getPool();

      // Verificar si la tabla LOGS existe
      const tableExistsQuery = `
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'LOGS'
      `;

      const tableExistsResult = await pool.request().query(tableExistsQuery);
      const tableExists = tableExistsResult.recordset[0].count > 0;

      if (!tableExists) {
        console.log("⚠️ Tabla LOGS no existe, retornando estadísticas vacías");
        return [];
      }

      const query = `
        SELECT 
          Action,
          COUNT(*) as Count,
          COUNT(DISTINCT UserId) as UniqueUsers,
          COUNT(DISTINCT DatabaseName + '.' + TableName) as UniqueTables
        FROM LOGS 
        GROUP BY Action
        ORDER BY Count DESC
      `;

      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error("Error obteniendo estadísticas de logs:", error);
      // Si hay error, retornar estadísticas vacías en lugar de fallar
      return [];
    }
  }
}

module.exports = new LogService();
