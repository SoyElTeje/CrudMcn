/**
 * Módulo de conexión a base de datos optimizado
 * Utiliza la nueva configuración de pool con clean code
 */

const { databaseConfig, sql } = require("./config/database");
const logger = require("./config/logger");

/**
 * Obtiene un pool de conexiones para la base de datos especificada
 * @param {string} dbName - Nombre de la base de datos
 * @returns {Promise<sql.ConnectionPool>} Pool de conexiones
 */
async function getPool(dbName = process.env.DB_DATABASE) {
  try {
    return await databaseConfig.getPool(dbName);
  } catch (error) {
    logger.database(`Error obteniendo pool para ${dbName}`, {
      database: dbName,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Cierra un pool específico
 * @param {string} dbName - Nombre de la base de datos
 */
async function closePool(dbName) {
  try {
    await databaseConfig.closePool(dbName);
  } catch (error) {
    logger.database(`Error cerrando pool para ${dbName}`, {
      database: dbName,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Cierra todos los pools de conexiones
 */
async function closeAllPools() {
  try {
    await databaseConfig.closeAllPools();
  } catch (error) {
    logger.database("Error cerrando todos los pools", {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Obtiene estadísticas de los pools
 * @returns {Object} Estadísticas de los pools
 */
function getPoolStats() {
  return databaseConfig.getPoolStats();
}

// Manejar cierre graceful de la aplicación
process.on("SIGINT", async () => {
  logger.database("Cerrando pools de conexión...");
  await closeAllPools();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.database("Cerrando pools de conexión...");
  await closeAllPools();
  process.exit(0);
});

module.exports = {
  getPool,
  closePool,
  closeAllPools,
  getPoolStats,
  sql,
};
