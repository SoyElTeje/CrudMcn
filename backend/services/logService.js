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

      const query = `
        INSERT INTO SYSTEM_LOGS (
          UserId, Username, Action, DatabaseName, TableName, 
          RecordId, OldData, NewData, AffectedRows, IPAddress, UserAgent
        ) VALUES (
          @userId, @username, @action, @databaseName, @tableName,
          @recordId, @oldData, @newData, @affectedRows, @ipAddress, @userAgent
        )
      `;

      await pool
        .request()
        .input("userId", userId)
        .input("username", username)
        .input("action", action)
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .input("recordId", recordId)
        .input("oldData", oldData ? JSON.stringify(oldData) : null)
        .input("newData", newData ? JSON.stringify(newData) : null)
        .input("affectedRows", affectedRows)
        .input("ipAddress", ipAddress)
        .input("userAgent", userAgent)
        .query(query);

      console.log(
        `✅ Log registrado: ${action} en ${databaseName}.${tableName} por ${username}`
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

      const query = `
        SELECT 
          Id, UserId, Username, Action, DatabaseName, TableName,
          RecordId, OldData, NewData, AffectedRows, Timestamp,
          IPAddress, UserAgent
        FROM SYSTEM_LOGS 
        WHERE UserId = @userId
        ORDER BY Timestamp DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `;

      const result = await pool
        .request()
        .input("userId", userId)
        .input("limit", limit)
        .input("offset", offset)
        .query(query);

      return result.recordset.map((log) => ({
        ...log,
        OldData: log.OldData ? JSON.parse(log.OldData) : null,
        NewData: log.NewData ? JSON.parse(log.NewData) : null,
      }));
    } catch (error) {
      console.error("Error obteniendo logs del usuario:", error);
      throw error;
    }
  }

  /**
   * Obtiene todos los logs (solo para admins)
   */
  async getAllLogs(limit = 100, offset = 0, filters = {}) {
    try {
      const pool = await getPool();

      let query = `
        SELECT 
          Id, UserId, Username, Action, DatabaseName, TableName,
          RecordId, OldData, NewData, AffectedRows, Timestamp,
          IPAddress, UserAgent
        FROM SYSTEM_LOGS 
        WHERE 1=1
      `;

      const request = pool.request();

      // Aplicar filtros
      if (filters.action) {
        query += " AND Action = @action";
        request.input("action", filters.action);
      }

      if (filters.databaseName) {
        query += " AND DatabaseName = @databaseName";
        request.input("databaseName", filters.databaseName);
      }

      if (filters.tableName) {
        query += " AND TableName = @tableName";
        request.input("tableName", filters.tableName);
      }

      if (filters.username) {
        query += " AND Username LIKE @username";
        request.input("username", `%${filters.username}%`);
      }

      if (filters.startDate) {
        query += " AND Timestamp >= @startDate";
        request.input("startDate", filters.startDate);
      }

      if (filters.endDate) {
        query += " AND Timestamp <= @endDate";
        request.input("endDate", filters.endDate);
      }

      // Query para contar el total de registros con los mismos filtros
      let countQuery = `
        SELECT COUNT(*) as total
        FROM SYSTEM_LOGS 
        WHERE 1=1
      `;

      const countRequest = pool.request();

      // Aplicar los mismos filtros al count
      if (filters.action) {
        countQuery += " AND Action = @action";
        countRequest.input("action", filters.action);
      }

      if (filters.databaseName) {
        countQuery += " AND DatabaseName = @databaseName";
        countRequest.input("databaseName", filters.databaseName);
      }

      if (filters.tableName) {
        countQuery += " AND TableName = @tableName";
        countRequest.input("tableName", filters.tableName);
      }

      if (filters.username) {
        countQuery += " AND Username LIKE @username";
        countRequest.input("username", `%${filters.username}%`);
      }

      if (filters.startDate) {
        countQuery += " AND Timestamp >= @startDate";
        countRequest.input("startDate", filters.startDate);
      }

      if (filters.endDate) {
        countQuery += " AND Timestamp <= @endDate";
        countRequest.input("endDate", filters.endDate);
      }

      // Ejecutar ambas queries en paralelo
      const [result, countResult] = await Promise.all([
        request
          .input("limit", limit)
          .input("offset", offset)
          .query(
            query +
              " ORDER BY Timestamp DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY"
          ),
        countRequest.query(countQuery),
      ]);

      const totalRecords = countResult.recordset[0].total;

      return {
        data: result.recordset.map((log) => ({
          ...log,
          OldData: log.OldData ? JSON.parse(log.OldData) : null,
          NewData: log.NewData ? JSON.parse(log.NewData) : null,
        })),
        totalRecords,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(totalRecords / limit),
        recordsPerPage: limit,
      };
    } catch (error) {
      console.error("Error obteniendo todos los logs:", error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de logs
   */
  async getLogStats() {
    try {
      const pool = await getPool();

      const query = `
        SELECT 
          Action,
          COUNT(*) as Count,
          COUNT(DISTINCT UserId) as UniqueUsers,
          COUNT(DISTINCT DatabaseName + '.' + TableName) as UniqueTables
        FROM SYSTEM_LOGS 
        GROUP BY Action
        ORDER BY Count DESC
      `;

      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error("Error obteniendo estadísticas de logs:", error);
      throw error;
    }
  }
}

module.exports = new LogService();
