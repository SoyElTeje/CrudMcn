/**
 * Configuración optimizada del pool de conexiones de base de datos
 * Implementa clean code, retry logic, monitoreo y configuración por ambiente
 */

const sql = require("mssql");
const logger = require("./logger");

/**
 * Configuración base del pool de conexiones
 * Optimizada para diferentes ambientes (desarrollo, staging, producción)
 */
class DatabaseConfig {
  constructor() {
    this.pools = new Map();
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 segundo
    this.healthCheckInterval = 30000; // 30 segundos
    this.isHealthCheckRunning = false;
  }

  /**
   * Obtiene la configuración del pool según el ambiente
   * @returns {Object} Configuración del pool
   */
  getPoolConfig() {
    const environment = process.env.NODE_ENV || "development";

    const baseConfig = {
      server: process.env.DB_SERVER,
      port: parseInt(process.env.DB_PORT, 10) || 1433,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate: process.env.DB_TRUST_CERT === "true",
        enableArithAbort: true,
        requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT, 10) || 30000,
        connectionTimeout:
          parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 15000,
      },
    };

    // Configuración específica por ambiente
    const environmentConfigs = {
      development: {
        pool: {
          max: 5,
          min: 1,
          idleTimeoutMillis: 30000,
          acquireTimeoutMillis: 60000,
          createTimeoutMillis: 30000,
          destroyTimeoutMillis: 5000,
          reapIntervalMillis: 1000,
          createRetryIntervalMillis: 200,
        },
      },
      staging: {
        pool: {
          max: 10,
          min: 2,
          idleTimeoutMillis: 60000,
          acquireTimeoutMillis: 60000,
          createTimeoutMillis: 30000,
          destroyTimeoutMillis: 5000,
          reapIntervalMillis: 1000,
          createRetryIntervalMillis: 200,
        },
      },
      production: {
        pool: {
          max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
          min: parseInt(process.env.DB_POOL_MIN, 10) || 5,
          idleTimeoutMillis:
            parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 300000, // 5 minutos
          acquireTimeoutMillis:
            parseInt(process.env.DB_ACQUIRE_TIMEOUT, 10) || 60000,
          createTimeoutMillis:
            parseInt(process.env.DB_CREATE_TIMEOUT, 10) || 30000,
          destroyTimeoutMillis:
            parseInt(process.env.DB_DESTROY_TIMEOUT, 10) || 5000,
          reapIntervalMillis:
            parseInt(process.env.DB_REAP_INTERVAL, 10) || 1000,
          createRetryIntervalMillis:
            parseInt(process.env.DB_CREATE_RETRY_INTERVAL, 10) || 200,
        },
      },
    };

    return {
      ...baseConfig,
      ...environmentConfigs[environment],
    };
  }

  /**
   * Crea un pool de conexiones con retry logic
   * @param {string} databaseName - Nombre de la base de datos
   * @returns {Promise<sql.ConnectionPool>} Pool de conexiones
   */
  async createPool(databaseName) {
    const config = {
      ...this.getPoolConfig(),
      database: databaseName,
    };

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        logger.database(
          `Intentando conectar a ${databaseName} (intento ${attempt}/${this.retryAttempts})`
        );

        const pool = new sql.ConnectionPool(config);
        await pool.connect();

        // Configurar event listeners para monitoreo
        this.setupPoolEventListeners(pool, databaseName);

        logger.database(`✅ Conectado exitosamente a ${databaseName}`, {
          database: databaseName,
          attempt,
          poolConfig: config.pool,
        });

        return pool;
      } catch (error) {
        logger.database(
          `❌ Error conectando a ${databaseName} (intento ${attempt}/${this.retryAttempts})`,
          {
            database: databaseName,
            attempt,
            error: error.message,
          }
        );

        if (attempt === this.retryAttempts) {
          throw new Error(
            `No se pudo conectar a ${databaseName} después de ${this.retryAttempts} intentos: ${error.message}`
          );
        }

        // Esperar antes del siguiente intento
        await this.delay(this.retryDelay * attempt);
      }
    }
  }

  /**
   * Configura event listeners para monitoreo del pool
   * @param {sql.ConnectionPool} pool - Pool de conexiones
   * @param {string} databaseName - Nombre de la base de datos
   */
  setupPoolEventListeners(pool, databaseName) {
    pool.on("connect", (connection) => {
      logger.database(`Nueva conexión establecida para ${databaseName}`, {
        database: databaseName,
        connectionId: connection.connectionId,
      });
    });

    pool.on("error", (error) => {
      logger.database(`Error en pool de ${databaseName}`, {
        database: databaseName,
        error: error.message,
        stack: error.stack,
      });
    });

    pool.on("close", () => {
      logger.database(`Pool de ${databaseName} cerrado`, {
        database: databaseName,
      });
    });
  }

  /**
   * Obtiene o crea un pool de conexiones para una base de datos específica
   * @param {string} databaseName - Nombre de la base de datos
   * @returns {Promise<sql.ConnectionPool>} Pool de conexiones
   */
  async getPool(databaseName) {
    // Si no se proporciona nombre, usar el de la variable de entorno
    const dbName = databaseName || process.env.DB_DATABASE;

    if (!dbName) {
      throw new Error("Nombre de base de datos es requerido");
    }

    // Verificar si el pool ya existe y está conectado
    if (this.pools.has(dbName)) {
      const existingPool = this.pools.get(dbName);

      if (existingPool.connected) {
        return existingPool;
      } else {
        // Remover pool desconectado
        this.pools.delete(dbName);
      }
    }

    // Crear nuevo pool
    const pool = await this.createPool(dbName);
    this.pools.set(dbName, pool);

    return pool;
  }

  /**
   * Cierra un pool específico
   * @param {string} databaseName - Nombre de la base de datos
   */
  async closePool(databaseName) {
    if (this.pools.has(databaseName)) {
      const pool = this.pools.get(databaseName);

      try {
        await pool.close();
        this.pools.delete(databaseName);
        logger.database(`Pool de ${databaseName} cerrado exitosamente`);
      } catch (error) {
        logger.database(`Error cerrando pool de ${databaseName}`, {
          database: databaseName,
          error: error.message,
        });
      }
    }
  }

  /**
   * Cierra todos los pools de conexiones
   */
  async closeAllPools() {
    const closePromises = Array.from(this.pools.keys()).map((databaseName) =>
      this.closePool(databaseName)
    );

    await Promise.all(closePromises);
    logger.database("Todos los pools de conexión cerrados");
  }

  /**
   * Obtiene estadísticas de todos los pools
   * @returns {Object} Estadísticas de los pools
   */
  getPoolStats() {
    const stats = {};

    for (const [databaseName, pool] of this.pools) {
      stats[databaseName] = {
        connected: pool.connected,
        totalConnections: pool.totalConnections,
        availableConnections: pool.availableConnections,
        borrowedConnections: pool.borrowedConnections,
        pendingRequests: pool.pendingRequests,
      };
    }

    return stats;
  }

  /**
   * Inicia el health check de los pools
   */
  startHealthCheck() {
    if (this.isHealthCheckRunning) {
      return;
    }

    this.isHealthCheckRunning = true;

    setInterval(async () => {
      try {
        const stats = this.getPoolStats();
        logger.database("Health check de pools", { stats });

        // Verificar pools desconectados
        for (const [databaseName, pool] of this.pools) {
          if (!pool.connected) {
            logger.database(
              `Pool de ${databaseName} desconectado, reintentando conexión`
            );
            this.pools.delete(databaseName);
          }
        }
      } catch (error) {
        logger.database("Error en health check de pools", {
          error: error.message,
        });
      }
    }, this.healthCheckInterval);
  }

  /**
   * Detiene el health check
   */
  stopHealthCheck() {
    this.isHealthCheckRunning = false;
  }

  /**
   * Utilidad para delay
   * @param {number} ms - Milisegundos a esperar
   * @returns {Promise} Promise que se resuelve después del delay
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Instancia singleton
const databaseConfig = new DatabaseConfig();

// Iniciar health check en producción
if (process.env.NODE_ENV === "production") {
  databaseConfig.startHealthCheck();
}

module.exports = {
  databaseConfig,
  sql,
};
