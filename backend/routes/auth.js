const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { catchAsync, AppError } = require("../middleware/errorHandler");
const { validate, schemas } = require("../middleware/validation");
const { sanitizeInput } = require("../middleware/sanitization");
const logger = require("../config/logger");

// Ruta de login
router.post(
  "/login",
  sanitizeInput("body"),
  validate(schemas.login),
  catchAsync(async (req, res) => {
    const { username, password } = req.body;

    const user = await authService.verifyCredentials(username, password);

    if (!user) {
      logger.security(`Intento de login fallido para usuario: ${username}`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      throw new AppError("Credenciales inválidas", 401, "INVALID_CREDENTIALS");
    }

    const token = authService.generateToken(user);

    logger.auth(`Login exitoso para usuario: ${username}`, {
      userId: user.id,
      isAdmin: user.isAdmin,
      ip: req.ip,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      },
    });
  })
);

// Ruta para verificar token
router.get("/verify", authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// Ruta para obtener todos los usuarios (solo admin)
router.get(
  "/users",
  authenticateToken,
  requireAdmin,
  catchAsync(async (req, res) => {
    const users = await authService.getAllUsers();

    logger.auth(
      `Listado de usuarios obtenido por admin: ${req.user.username}`,
      {
        adminId: req.user.id,
        userCount: users.length,
      }
    );

    res.json(users);
  })
);

// Ruta para crear un nuevo usuario (solo admin)
router.post(
  "/users",
  authenticateToken,
  requireAdmin,
  validate(schemas.createUser),
  catchAsync(async (req, res) => {
    const { username, password, isAdmin } = req.body;

    const newUser = await authService.createUser(
      username,
      password,
      isAdmin || false
    );

    logger.auth(`Usuario creado por admin: ${req.user.username}`, {
      adminId: req.user.id,
      newUserId: newUser.id,
      newUsername: newUser.username,
      isAdmin: newUser.isAdmin,
    });

    res.status(201).json({
      success: true,
      user: newUser,
    });
  })
);

// Ruta para actualizar contraseña de usuario (solo admin o el propio usuario)
router.put(
  "/users/:userId/password",
  authenticateToken,
  validate(schemas.userIdParam, "params"),
  validate(schemas.updatePassword),
  catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { newPassword } = req.body;

    // Verificar que el usuario puede cambiar esta contraseña
    if (!req.user.isAdmin && req.user.id !== parseInt(userId)) {
      throw new AppError(
        "No tienes permisos para cambiar esta contraseña",
        403,
        "INSUFFICIENT_PERMISSIONS"
      );
    }

    await authService.updateUserPassword(userId, newPassword);

    logger.auth(`Contraseña actualizada por: ${req.user.username}`, {
      adminId: req.user.id,
      targetUserId: userId,
      isSelfUpdate: req.user.id === parseInt(userId),
    });

    res.json({
      success: true,
      message: "Contraseña actualizada correctamente",
    });
  })
);

// Ruta para actualizar estado de administrador (solo admin)
router.put(
  "/users/:userId/admin",
  authenticateToken,
  requireAdmin,
  validate(schemas.userIdParam, "params"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { isAdmin } = req.body;

      if (typeof isAdmin !== "boolean") {
        return res
          .status(400)
          .json({ error: "isAdmin debe ser un valor booleano" });
      }

      await authService.updateAdminStatus(userId, isAdmin);

      res.json({
        success: true,
        message: "Estado de administrador actualizado correctamente",
      });
    } catch (error) {
      console.error("Error actualizando estado de admin:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

// Ruta para eliminar usuario (solo admin)
router.delete(
  "/users/:userId",
  authenticateToken,
  requireAdmin,
  validate(schemas.userIdParam, "params"),
  async (req, res) => {
    try {
      const { userId } = req.params;

      const deleted = await authService.deleteUser(userId);

      if (!deleted) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json({ success: true, message: "Usuario eliminado correctamente" });
    } catch (error) {
      console.error("Error eliminando usuario:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

// Ruta para obtener permisos de un usuario
router.get(
  "/users/:userId/permissions",
  authenticateToken,
  validate(schemas.userIdParam, "params"),
  async (req, res) => {
    try {
      const { userId } = req.params;

      console.log(`🔍 Debug: Endpoint llamado para usuario ${userId}`);
      console.log(`🔍 Debug: Usuario autenticado:`, req.user);

      // Verificar que el usuario puede ver estos permisos
      if (!req.user.isAdmin && req.user.id !== parseInt(userId)) {
        console.log(
          `🔍 Debug: Acceso denegado - no es admin y no es el propio usuario`
        );
        return res
          .status(403)
          .json({ error: "No tienes permisos para ver estos permisos" });
      }

      console.log(`🔍 Debug: Llamando a getUserPermissions(${userId})...`);
      const permissions = await authService.getUserPermissions(userId);

      console.log(
        `🔍 Debug: Permisos obtenidos para usuario ${userId}:`,
        JSON.stringify(permissions, null, 2)
      );
      console.log(`🔍 Debug: Enviando respuesta...`);

      res.json(permissions);
    } catch (error) {
      console.error("Error obteniendo permisos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

// Ruta para asignar permisos de base de datos (solo admin)
router.post(
  "/users/:userId/database-permissions",
  authenticateToken,
  requireAdmin,
  validate(schemas.userIdParam, "params"),
  validate(schemas.assignDatabasePermission),
  catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { databaseName, permissions } = req.body;

    await authService.assignDatabasePermission(
      userId,
      databaseName,
      permissions
    );

    logger.auth(
      `Permisos de base de datos asignados por admin: ${req.user.username}`,
      {
        adminId: req.user.id,
        targetUserId: userId,
        databaseName,
        permissions,
      }
    );

    res.json({
      success: true,
      message: "Permisos de base de datos asignados correctamente",
    });
  })
);

// Ruta para asignar permisos de tabla específica (solo admin)
router.post(
  "/users/:userId/table-permissions",
  authenticateToken,
  requireAdmin,
  validate(schemas.userIdParam, "params"),
  validate(schemas.assignTablePermission),
  catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { databaseName, tableName, permissions } = req.body;

    await authService.assignTablePermission(
      userId,
      databaseName,
      tableName,
      permissions
    );

    logger.auth(`Permisos de tabla asignados por admin: ${req.user.username}`, {
      adminId: req.user.id,
      targetUserId: userId,
      databaseName,
      tableName,
      permissions,
    });

    res.json({
      success: true,
      message: "Permisos de tabla asignados correctamente",
    });
  })
);

// Ruta para eliminar permisos de base de datos (solo admin)
router.delete(
  "/users/:userId/database-permissions",
  authenticateToken,
  requireAdmin,
  validate(schemas.userIdParam, "params"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { databaseName } = req.body;

      if (!databaseName) {
        return res.status(400).json({ error: "databaseName es requerido" });
      }

      await authService.removeDatabasePermission(userId, databaseName);

      res.json({
        success: true,
        message: "Permisos de base de datos eliminados correctamente",
      });
    } catch (error) {
      console.error("Error eliminando permisos de base de datos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

// Ruta para eliminar permisos de tabla específica (solo admin)
router.delete(
  "/users/:userId/table-permissions",
  authenticateToken,
  requireAdmin,
  validate(schemas.userIdParam, "params"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { databaseName, tableName } = req.body;

      if (!databaseName || !tableName) {
        return res.status(400).json({
          error: "databaseName y tableName son requeridos",
        });
      }

      await authService.removeTablePermission(userId, databaseName, tableName);

      res.json({
        success: true,
        message: "Permisos de tabla eliminados correctamente",
      });
    } catch (error) {
      console.error("Error eliminando permisos de tabla:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

module.exports = router;
