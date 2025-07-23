const express = require("express");
const router = express.Router();
const authService = require("../services/authService");

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token de acceso requerido" });
  }

  const user = authService.verifyToken(token);
  if (!user) {
    return res.status(403).json({ error: "Token inválido" });
  }

  req.user = user;
  next();
};

// Middleware para verificar si es administrador
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res
      .status(403)
      .json({
        error: "Acceso denegado. Se requieren permisos de administrador",
      });
  }
  next();
};

// Ruta de login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Usuario y contraseña son requeridos" });
    }

    const user = await authService.verifyCredentials(username, password);

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = authService.generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta para verificar token
router.get("/verify", authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// Ruta para obtener todos los usuarios (solo admin)
router.get("/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await authService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta para crear un nuevo usuario (solo admin)
router.post("/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, isAdmin } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Usuario y contraseña son requeridos" });
    }

    const newUser = await authService.createUser(
      username,
      password,
      isAdmin || false
    );

    res.status(201).json({
      success: true,
      user: newUser,
    });
  } catch (error) {
    console.error("Error creando usuario:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "El nombre de usuario ya existe" });
    }

    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta para actualizar contraseña de usuario (solo admin o el propio usuario)
router.put("/users/:userId/password", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    // Verificar que el usuario puede cambiar esta contraseña
    if (!req.user.isAdmin && req.user.id !== parseInt(userId)) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para cambiar esta contraseña" });
    }

    if (!newPassword) {
      return res.status(400).json({ error: "Nueva contraseña es requerida" });
    }

    await authService.updateUserPassword(userId, newPassword);

    res.json({
      success: true,
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    console.error("Error actualizando contraseña:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta para actualizar estado de administrador (solo admin)
router.put(
  "/users/:userId/admin",
  authenticateToken,
  requireAdmin,
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
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Verificar que el usuario puede ver estos permisos
      if (!req.user.isAdmin && req.user.id !== parseInt(userId)) {
        return res
          .status(403)
          .json({ error: "No tienes permisos para ver estos permisos" });
      }

      const permissions = await authService.getUserPermissions(userId);

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
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { databaseName, permissions } = req.body;

      if (!databaseName || !permissions) {
        return res
          .status(400)
          .json({ error: "databaseName y permissions son requeridos" });
      }

      await authService.assignDatabasePermission(
        userId,
        databaseName,
        permissions
      );

      res.json({
        success: true,
        message: "Permisos de base de datos asignados correctamente",
      });
    } catch (error) {
      console.error("Error asignando permisos de base de datos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

// Ruta para asignar permisos de tabla específica (solo admin)
router.post(
  "/users/:userId/table-permissions",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { databaseName, tableName, permissions } = req.body;

      if (!databaseName || !tableName || !permissions) {
        return res
          .status(400)
          .json({
            error: "databaseName, tableName y permissions son requeridos",
          });
      }

      await authService.assignTablePermission(
        userId,
        databaseName,
        tableName,
        permissions
      );

      res.json({
        success: true,
        message: "Permisos de tabla asignados correctamente",
      });
    } catch (error) {
      console.error("Error asignando permisos de tabla:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

module.exports = { router, authenticateToken, requireAdmin };
