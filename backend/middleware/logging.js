const LogService = require('../services/logService');

// Middleware para logging de acciones
function loggingMiddleware(req, res, next) {
  const originalSend = res.send;
  const startTime = Date.now();

  // Capturar información del usuario y la petición
  const logData = {
    userId: req.user?.userId || null,
    username: req.user?.username || 'Anónimo',
    action: getActionFromPath(req.path, req.method),
    databaseName: req.params.dbName || null,
    tableName: req.params.tableName || null,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    query: req.method === 'GET' ? JSON.stringify(req.query) : null,
    status: 'SUCCESS',
    errorMessage: null
  };

  // Interceptar la respuesta para capturar errores
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    
    try {
      const responseData = JSON.parse(data);
      
      if (responseData.error) {
        logData.status = 'ERROR';
        logData.errorMessage = responseData.error;
      }

      // Capturar información específica según la acción
      if (req.method === 'POST' && req.body) {
        logData.newValues = JSON.stringify(req.body);
      } else if (req.method === 'PUT' && req.body) {
        logData.newValues = JSON.stringify(req.body);
      } else if (req.method === 'DELETE') {
        // Para DELETE, intentar capturar el ID del registro
        if (req.params.id) {
          logData.recordId = req.params.id;
        } else if (req.body && req.body.ids) {
          logData.recordId = req.body.ids.join(',');
        }
      }

      // Crear el log de forma asíncrona
      LogService.createLog(logData).catch(err => {
        console.error('Error creando log:', err);
      });

    } catch (error) {
      console.error('Error procesando respuesta para logging:', error);
    }

    // Llamar al método original
    originalSend.call(this, data);
  };

  next();
}

// Función para determinar la acción basada en la ruta y método
function getActionFromPath(path, method) {
  if (path.includes('/auth/login')) return 'LOGIN';
  if (path.includes('/auth/logout')) return 'LOGOUT';
  
  if (path.includes('/data')) {
    if (method === 'GET') return 'QUERY_DATA';
    if (method === 'POST') return 'CREATE';
    if (method === 'PUT') return 'UPDATE';
    if (method === 'DELETE') return 'DELETE';
  }
  
  if (path.includes('/import')) return 'IMPORT';
  if (path.includes('/export')) return 'EXPORT';
  if (path.includes('/users')) return 'USER_MANAGEMENT';
  if (path.includes('/permissions')) return 'PERMISSION_MANAGEMENT';
  
  return 'UNKNOWN';
}

// Middleware específico para capturar valores antiguos en UPDATE y DELETE
async function captureOldValues(req, res, next) {
  if ((req.method === 'PUT' || req.method === 'DELETE') && req.params.dbName && req.params.tableName) {
    try {
      const { dbName, tableName } = req.params;
      const pool = await require('../db').getPool(dbName);
      
      // Obtener información de la clave primaria
      const schemaResult = await pool.request().query(`
        SELECT 
          c.COLUMN_NAME, 
          c.DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS c
        LEFT JOIN (
          SELECT ku.COLUMN_NAME
          FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
          JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
            ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
          WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
            AND ku.TABLE_NAME = '${tableName}'
        ) pk ON c.COLUMN_NAME = pk.COLUMN_NAME
        WHERE c.TABLE_NAME = '${tableName}'
          AND pk.COLUMN_NAME IS NOT NULL
      `);

      if (schemaResult.recordset.length > 0) {
        const primaryKeyColumn = schemaResult.recordset[0].COLUMN_NAME;
        let recordId = null;

        // Obtener el ID del registro
        if (req.params.id) {
          recordId = req.params.id;
        } else if (req.body && req.body.id) {
          recordId = req.body.id;
        }

        if (recordId) {
          // Obtener los valores antiguos
          const oldValuesQuery = `SELECT * FROM [${tableName}] WHERE [${primaryKeyColumn}] = @recordId`;
          const oldValuesResult = await pool.request()
            .input('recordId', recordId)
            .query(oldValuesQuery);

          if (oldValuesResult.recordset.length > 0) {
            req.oldValues = oldValuesResult.recordset[0];
          }
        }
      }
    } catch (error) {
      console.error('Error capturando valores antiguos:', error);
    }
  }
  
  next();
}

module.exports = {
  loggingMiddleware,
  captureOldValues
}; 