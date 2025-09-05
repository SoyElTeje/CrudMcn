const express = require("express");
const router = express.Router();
const activatedTablesService = require("../services/activatedTablesService");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { catchAsync, AppError } = require("../middleware/errorHandler");
const { validate, schemas } = require("../middleware/validation");
const logger = require("../config/logger");

// Obtener todas las bases de datos disponibles (excluyendo APPDATA) (solo admin)
router.get("/databases", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const databases = await activatedTablesService.getAllDatabases();
    res.json(databases);
  } catch (error) {
    console.error("Error obteniendo bases de datos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener todas las tablas de una base de datos específica (solo admin)
router.get(
  "/tables/:databaseName",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { databaseName } = req.params;
      const tables = await activatedTablesService.getTablesByDatabase(
        databaseName
      );
      res.json(tables);
    } catch (error) {
      console.error("Error obteniendo tablas de la base de datos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

// Obtener todas las tablas disponibles (solo admin)
router.get("/all-tables", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const tables = await activatedTablesService.getAllTables();
    res.json(tables);
  } catch (error) {
    console.error("Error obteniendo todas las tablas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener solo las tablas activadas (para todos los usuarios)
router.get("/activated", authenticateToken, async (req, res) => {
  try {
    const tables = await activatedTablesService.getActivatedTables();
    res.json(tables);
  } catch (error) {
    console.error("Error obteniendo tablas activadas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener estructura de una tabla específica (solo admin)
router.get(
  "/structure/:databaseName/:tableName",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { databaseName, tableName } = req.params;
      const structure = await activatedTablesService.getTableStructure(
        databaseName,
        tableName
      );
      res.json(structure);
    } catch (error) {
      console.error("Error obteniendo estructura de tabla:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

// Activar una tabla (solo admin)
router.post(
  "/activate",
  authenticateToken,
  requireAdmin,
  validate(schemas.activateTable),
  catchAsync(async (req, res) => {
    const { databaseName, tableName, description, conditions } = req.body;

    // Activar la tabla
    const activatedTableId = await activatedTablesService.activateTable(
      databaseName,
      tableName,
      description,
      req.user.id
    );

    // Guardar las condiciones si se proporcionan
    if (conditions && conditions.length > 0) {
      await activatedTablesService.saveTableConditions(
        activatedTableId,
        conditions,
        req.user.id
      );
    }

    logger.crud("CREATE", "activated_tables", {
      adminId: req.user.id,
      databaseName,
      tableName,
      activatedTableId,
      conditionsCount: conditions ? conditions.length : 0,
    });

    res.json({
      success: true,
      message: "Tabla activada correctamente",
      activatedTableId,
    });
  })
);

// Desactivar una tabla (solo admin)
router.post(
  "/deactivate/:databaseName/:tableName",
  authenticateToken,
  requireAdmin,
  validate(schemas.databaseTableParams, "params"),
  catchAsync(async (req, res) => {
    const { databaseName, tableName } = req.params;

    await activatedTablesService.deactivateTable(databaseName, tableName);

    logger.crud("DELETE", "activated_tables", {
      adminId: req.user.id,
      databaseName,
      tableName,
    });

    res.json({
      success: true,
      message: "Tabla desactivada correctamente",
    });
  })
);

// Obtener condiciones de una tabla activada por database y table name (solo admin)
// Esta ruta debe ir ANTES que la ruta /conditions/:activatedTableId para evitar conflictos
router.get(
  "/conditions/:databaseName/:tableName",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { databaseName, tableName } = req.params;
      const conditions =
        await activatedTablesService.getTableConditionsByDatabaseAndTable(
          databaseName,
          tableName
        );
      res.json(conditions);
    } catch (error) {
      console.error("Error obteniendo condiciones de tabla:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

// Actualizar condiciones de una tabla activada por database y table name (solo admin)
router.put(
  "/conditions/:databaseName/:tableName",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { databaseName, tableName } = req.params;
      const { conditions, description } = req.body;
      const userId = req.user.id;

      await activatedTablesService.updateTableConditions(
        databaseName,
        tableName,
        conditions,
        description,
        userId
      );
      res.json({
        success: true,
        message: "Condiciones y descripción actualizadas correctamente",
      });
    } catch (error) {
      console.error("Error actualizando condiciones de tabla:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

// Obtener condiciones de una tabla por ID (solo admin)
// Esta ruta debe ir DESPUÉS de las rutas más específicas
router.get(
  "/conditions-by-id/:activatedTableId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { activatedTableId } = req.params;
      const conditions = await activatedTablesService.getTableConditions(
        parseInt(activatedTableId)
      );
      res.json(conditions);
    } catch (error) {
      console.error("Error obteniendo condiciones de tabla:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

// Actualizar condiciones de una tabla por ID (solo admin)
router.put(
  "/conditions-by-id/:activatedTableId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { activatedTableId } = req.params;
      const { conditions } = req.body;

      if (!conditions || !Array.isArray(conditions)) {
        return res.status(400).json({ error: "Conditions debe ser un array" });
      }

      await activatedTablesService.saveTableConditions(
        parseInt(activatedTableId),
        conditions,
        req.user.id
      );

      res.json({ message: "Condiciones actualizadas exitosamente" });
    } catch (error) {
      console.error("Error actualizando condiciones de tabla:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

// Validar datos de una tabla (para operaciones de escritura)
router.post(
  "/validate/:databaseName/:tableName",
  authenticateToken,
  validate(schemas.databaseTableParams, "params"),
  validate(schemas.tableData),
  catchAsync(async (req, res) => {
    const { databaseName, tableName } = req.params;
    const { data } = req.body;

    // Verificar si la tabla está activada
    const isActivated = await activatedTablesService.isTableActivated(
      databaseName,
      tableName
    );
    if (!isActivated) {
      throw new AppError(
        "Esta tabla no está disponible para operaciones de escritura",
        403,
        "TABLE_NOT_ACTIVATED"
      );
    }

    // Validar los datos
    const validation = await activatedTablesService.validateTableData(
      databaseName,
      tableName,
      data
    );

    logger.crud("VALIDATE", `${databaseName}.${tableName}`, {
      userId: req.user.id,
      databaseName,
      tableName,
      validationResult: validation.isValid,
    });

    res.json(validation);
  })
);

module.exports = router;
