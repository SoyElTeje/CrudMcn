const jwt = require("jsonwebtoken");

/**
 * Middleware para verificar el token JWT
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Token de acceso requerido" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error verificando token:", error);
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
};

/**
 * Middleware para verificar si el usuario es administrador
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Usuario no autenticado" });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      error: "Acceso denegado. Se requieren permisos de administrador",
    });
  }

  next();
};

/**
 * Middleware para verificar si el usuario tiene permisos específicos
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    // Los administradores tienen todos los permisos
    if (req.user.isAdmin) {
      return next();
    }

    try {
      const { dbName, tableName } = req.params;
      const authService = require("../services/authService");

      // Verificar permisos de tabla si se especifica
      if (tableName) {
        const hasPermission = await authService.checkTablePermission(
          req.user.id,
          dbName,
          tableName,
          permission
        );

        if (hasPermission) {
          return next();
        }
      } else {
        // Verificar permisos de base de datos
        const hasPermission = await authService.checkDatabasePermission(
          req.user.id,
          dbName,
          permission
        );

        if (hasPermission) {
          return next();
        }
      }

      return res
        .status(403)
        .json({ error: `Acceso denegado. Se requiere permiso: ${permission}` });
    } catch (error) {
      console.error("Error verificando permisos:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  };
};

/**
 * Middleware para verificar permisos de lectura
 */
const requireReadPermission = requirePermission("read");

/**
 * Middleware para verificar permisos de escritura
 */
const requireWritePermission = requirePermission("write");

/**
 * Middleware para verificar permisos de creación
 */
const requireCreatePermission = requirePermission("create");

/**
 * Middleware para verificar permisos de eliminación
 */
const requireDeletePermission = requirePermission("delete");

module.exports = {
  authenticateToken,
  requireAdmin,
  requirePermission,
  requireReadPermission,
  requireWritePermission,
  requireCreatePermission,
  requireDeletePermission,
};
