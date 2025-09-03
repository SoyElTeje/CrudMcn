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

      // Verificar si la tabla LOGS existe
      const tableExistsQuery = `
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'LOGS'
      `;

      const tableExistsResult = await pool.request().query(tableExistsQuery);
      const tableExists = tableExistsResult.recordset[0].count > 0;

      if (!tableExists) {
        console.log("⚠️ Tabla LOGS no existe, no se puede registrar log");
        return;
      }

      const query = `
        INSERT INTO LOGS (
          UserId, Action, DatabaseName, TableName, 
          Details, IPAddress, UserAgent, FechaCreacion
        ) VALUES (
          @userId, @action, @databaseName, @tableName,
          @details, @ipAddress, @userAgent, GETDATE()
        )
      `;

      // Construir el campo Details con toda la información
      const details = {
        username,
        recordId,
        oldData,
        newData,
        affectedRows,
      };

      await pool
        .request()
        .input("userId", userId)
        .input("action", action)
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .input("details", JSON.stringify(details))
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
          Id, UserId, Action, DatabaseName, TableName,
          Details, FechaCreacion, IPAddress, UserAgent
        FROM LOGS 
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
        query += " AND FechaCreacion >= @startDate";
        request.input("startDate", filters.startDate);
      }

      if (filters.endDate) {
        query += " AND FechaCreacion <= @endDate";
        request.input("endDate", filters.endDate);
      }

      // Query para contar el total de registros con los mismos filtros
      let countQuery = `
        SELECT COUNT(*) as total
        FROM LOGS 
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
        countQuery += " AND FechaCreacion >= @startDate";
        countRequest.input("startDate", filters.startDate);
      }

      if (filters.endDate) {
        countQuery += " AND FechaCreacion <= @endDate";
        countRequest.input("endDate", filters.endDate);
      }

      // Ejecutar ambas queries en paralelo
      const [result, countResult] = await Promise.all([
        request
          .input("limit", limit)
          .input("offset", offset)
          .query(
            query +
              " ORDER BY FechaCreacion DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY"
          ),
        countRequest.query(countQuery),
      ]);

      const totalRecords = countResult.recordset[0].total;

      return {
        data: result.recordset.map((log) => {
          const details = log.Details ? JSON.parse(log.Details) : {};
          return {
            ...log,
            Username: details.username || null,
            RecordId: details.recordId || null,
            OldData: details.oldData || null,
            NewData: details.newData || null,
            AffectedRows: details.affectedRows || 1,
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
