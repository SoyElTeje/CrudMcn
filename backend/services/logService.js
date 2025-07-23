const sql = require("mssql");
const { getPool } = require("../db");
require("dotenv").config();

class LogService {
  // Crear un nuevo log de auditoría
  static async createLog(logData) {
    try {
      const pool = await getPool(process.env.DB_DATABASE);

      const query = `
        INSERT INTO AuditLogs (
          UserId, Username, Action, DatabaseName, TableName, 
          RecordId, OldValues, NewValues, Query, IPAddress, 
          UserAgent, Status, ErrorMessage
        ) VALUES (
          @userId, @username, @action, @databaseName, @tableName,
          @recordId, @oldValues, @newValues, @query, @ipAddress,
          @userAgent, @status, @errorMessage
        )
      `;

      const request = pool.request()
        .input('userId', logData.userId || null)
        .input('username', logData.username || 'Sistema')
        .input('action', logData.action)
        .input('databaseName', logData.databaseName || null)
        .input('tableName', logData.tableName || null)
        .input('recordId', logData.recordId || null)
        .input('oldValues', logData.oldValues || null)
        .input('newValues', logData.newValues || null)
        .input('query', logData.query || null)
        .input('ipAddress', logData.ipAddress || null)
        .input('userAgent', logData.userAgent || null)
        .input('status', logData.status || 'SUCCESS')
        .input('errorMessage', logData.errorMessage || null);

      await request.query(query);
    } catch (error) {
      console.error('Error creando log:', error);
      // No lanzar error para no interrumpir la operación principal
    }
  }

  // Obtener logs con filtros y paginación
  static async getLogs(filters = {}, page = 1, pageSize = 25) {
    try {
      const pool = await getPool(process.env.DB_DATABASE);
      
      let whereClause = '';
      const filterParams = [];
      let paramIndex = 0;

      // Aplicar filtros
      if (filters.username) {
        whereClause += whereClause ? ' AND ' : 'WHERE ';
        whereClause += `Username LIKE @param${paramIndex}`;
        filterParams.push({ name: `param${paramIndex}`, value: `%${filters.username}%` });
        paramIndex++;
      }

      if (filters.action) {
        whereClause += whereClause ? ' AND ' : 'WHERE ';
        whereClause += `Action = @param${paramIndex}`;
        filterParams.push({ name: `param${paramIndex}`, value: filters.action });
        paramIndex++;
      }

      if (filters.databaseName) {
        whereClause += whereClause ? ' AND ' : 'WHERE ';
        whereClause += `DatabaseName = @param${paramIndex}`;
        filterParams.push({ name: `param${paramIndex}`, value: filters.databaseName });
        paramIndex++;
      }

      if (filters.tableName) {
        whereClause += whereClause ? ' AND ' : 'WHERE ';
        whereClause += `TableName = @param${paramIndex}`;
        filterParams.push({ name: `param${paramIndex}`, value: filters.tableName });
        paramIndex++;
      }

      if (filters.startDate && filters.endDate) {
        whereClause += whereClause ? ' AND ' : 'WHERE ';
        whereClause += `Timestamp BETWEEN @param${paramIndex} AND @param${paramIndex + 1}`;
        filterParams.push({ name: `param${paramIndex}`, value: filters.startDate });
        filterParams.push({ name: `param${paramIndex + 1}`, value: filters.endDate });
        paramIndex += 2;
      }

      // Obtener total de registros
      const countQuery = `SELECT COUNT(*) as total FROM AuditLogs ${whereClause}`;
      const countRequest = pool.request();
      filterParams.forEach(param => {
        countRequest.input(param.name, param.value);
      });
      const countResult = await countRequest.query(countQuery);
      const totalCount = countResult.recordset[0].total;

      // Obtener datos paginados
      const offset = (page - 1) * pageSize;
      const dataQuery = `
        SELECT 
          Id, UserId, Username, Action, DatabaseName, TableName,
          RecordId, OldValues, NewValues, Query, IPAddress,
          UserAgent, Timestamp, Status, ErrorMessage
        FROM AuditLogs 
        ${whereClause}
        ORDER BY Timestamp DESC
        OFFSET ${offset} ROWS 
        FETCH NEXT ${pageSize} ROWS ONLY
      `;

      const dataRequest = pool.request();
      filterParams.forEach(param => {
        dataRequest.input(param.name, param.value);
      });
      const dataResult = await dataRequest.query(dataQuery);

      return {
        logs: dataResult.recordset,
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
      };
    } catch (error) {
      console.error('Error obteniendo logs:', error);
      throw error;
    }
  }

  // Obtener estadísticas de logs
  static async getLogStats() {
    try {
      const pool = await getPool(process.env.DB_DATABASE);

      const statsQuery = `
        SELECT 
          Action,
          COUNT(*) as count,
          COUNT(CASE WHEN Status = 'SUCCESS' THEN 1 END) as successCount,
          COUNT(CASE WHEN Status = 'ERROR' THEN 1 END) as errorCount
        FROM AuditLogs 
        WHERE Timestamp >= DATEADD(day, -30, GETDATE())
        GROUP BY Action
        ORDER BY count DESC
      `;

      const result = await pool.request().query(statsQuery);
      return result.recordset;
    } catch (error) {
      console.error('Error obteniendo estadísticas de logs:', error);
      throw error;
    }
  }

  // Limpiar logs antiguos
  static async cleanOldLogs(daysToKeep = 90) {
    try {
      const pool = await getPool(process.env.DB_DATABASE);

      const deleteQuery = `
        DELETE FROM AuditLogs 
        WHERE Timestamp < DATEADD(day, -${daysToKeep}, GETDATE())
      `;

      const result = await pool.request().query(deleteQuery);
      return result.rowsAffected[0];
    } catch (error) {
      console.error('Error limpiando logs antiguos:', error);
      throw error;
    }
  }
}

module.exports = LogService; 