/**
 * Rutas de health check y monitoreo del sistema
 * Proporciona información sobre el estado de la aplicación y base de datos
 */

const express = require("express");
const router = express.Router();
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { catchAsync, AppError } = require("../middleware/errorHandler");
const { getPoolStats, getPool } = require("../db");
const logger = require("../config/logger");

/**
 * Health check básico - sin autenticación
 * Útil para load balancers y monitoreo externo
 */
router.get("/", catchAsync(async (req, res) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024),
    },
  };

  res.json(health);
}));

/**
 * Health check detallado - requiere autenticación de admin
 * Incluye información de base de datos y pools
 */
router.get("/detailed", authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Obtener estadísticas de pools
    const poolStats = getPoolStats();
    
    // Verificar conexión a base de datos principal
    let dbHealth = { status: "unknown", responseTime: 0 };
    try {
      const dbStartTime = Date.now();
      const pool = await getPool();
      const request = pool.request();
      await request.query("SELECT 1 as health_check");
      dbHealth = {
        status: "connected",
        responseTime: Date.now() - dbStartTime,
      };
    } catch (error) {
      dbHealth = {
        status: "error",
        responseTime: 0,
        error: error.message,
      };
    }

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
      responseTime: Date.now() - startTime,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      database: dbHealth,
      pools: poolStats,
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
      },
    };

    logger.performance("Health check detallado ejecutado", {
      userId: req.user.id,
      responseTime: health.responseTime,
      dbResponseTime: dbHealth.responseTime,
    });

    res.json(health);
  } catch (error) {
    logger.database("Error en health check detallado", {
      userId: req.user.id,
      error: error.message,
    });

    throw new AppError(
      "Error obteniendo información de salud del sistema",
      500,
      "HEALTH_CHECK_ERROR"
    );
  }
}));

/**
 * Endpoint para obtener estadísticas de pools de conexión
 * Requiere autenticación de admin
 */
router.get("/pools", authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const poolStats = getPoolStats();
  
  logger.database("Estadísticas de pools consultadas", {
    userId: req.user.id,
    poolsCount: Object.keys(poolStats).length,
  });

  res.json({
    timestamp: new Date().toISOString(),
    pools: poolStats,
  });
}));

/**
 * Endpoint para forzar la reconexión de un pool específico
 * Requiere autenticación de admin
 */
router.post("/pools/:databaseName/reconnect", authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const { databaseName } = req.params;
  
  try {
    // Cerrar pool existente si existe
    const { closePool } = require("../db");
    await closePool(databaseName);
    
    // Crear nueva conexión
    const pool = await getPool(databaseName);
    
    logger.database(`Pool de ${databaseName} reconectado manualmente`, {
      userId: req.user.id,
      database: databaseName,
    });

    res.json({
      success: true,
      message: `Pool de ${databaseName} reconectado exitosamente`,
      database: databaseName,
    });
  } catch (error) {
    logger.database(`Error reconectando pool de ${databaseName}`, {
      userId: req.user.id,
      database: databaseName,
      error: error.message,
    });

    throw new AppError(
      `Error reconectando pool de ${databaseName}: ${error.message}`,
      500,
      "POOL_RECONNECT_ERROR"
    );
  }
}));

/**
 * Endpoint para obtener métricas de rendimiento
 * Requiere autenticación de admin
 */
router.get("/metrics", authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
      external: process.memoryUsage().external,
      rss: process.memoryUsage().rss,
    },
    cpu: {
      usage: process.cpuUsage(),
    },
    pools: getPoolStats(),
    environment: process.env.NODE_ENV || "development",
  };

  logger.performance("Métricas de rendimiento consultadas", {
    userId: req.user.id,
    memoryUsed: Math.round(metrics.memory.used / 1024 / 1024),
  });

  res.json(metrics);
}));

module.exports = router;
