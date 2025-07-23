const express = require("express");
const router = express.Router();
const logService = require("../services/logService");
const { authenticateToken, requireAdmin } = require("./auth");

// Obtener logs del usuario actual
router.get("/my-logs", authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const logs = await logService.getUserLogs(
      req.user.id,
      parseInt(limit),
      parseInt(offset)
    );
    res.json(logs);
  } catch (error) {
    console.error("Error obteniendo logs del usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener todos los logs (solo admin)
router.get("/all", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      limit = 100,
      offset = 0,
      action,
      databaseName,
      tableName,
      username,
      startDate,
      endDate,
    } = req.query;

    const filters = {
      action,
      databaseName,
      tableName,
      username,
      startDate,
      endDate,
    };

    const logs = await logService.getAllLogs(
      parseInt(limit),
      parseInt(offset),
      filters
    );
    res.json(logs);
  } catch (error) {
    console.error("Error obteniendo todos los logs:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener estadísticas de logs (solo admin)
router.get("/stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await logService.getLogStats();
    res.json(stats);
  } catch (error) {
    console.error("Error obteniendo estadísticas de logs:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener logs de un usuario específico (solo admin)
router.get(
  "/user/:userId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const logs = await logService.getUserLogs(
        parseInt(userId),
        parseInt(limit),
        parseInt(offset)
      );
      res.json(logs);
    } catch (error) {
      console.error("Error obteniendo logs del usuario:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

module.exports = router;
