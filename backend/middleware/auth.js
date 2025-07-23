const authService = require("../services/authService");

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Token de acceso requerido" });
  }

  const decoded = authService.verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }

  req.user = decoded;
  next();
};

// Middleware para verificar si es administrador
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res
      .status(403)
      .json({ error: "Se requieren permisos de administrador" });
  }
  next();
};

// Middleware para verificar permisos de lectura
const requireReadPermission = async (req, res, next) => {
  try {
    const { dbName, tableName } = req.params;

    // Si no hay tableName, verificar permisos de base de datos
    if (!tableName) {
      const hasPermission = await authService.checkDatabasePermission(
        req.user.id,
        dbName,
        "read"
      );

      if (!hasPermission) {
        return res
          .status(403)
          .json({ error: "Sin permisos de lectura en la base de datos" });
      }
    } else {
      // Si hay tableName, verificar permisos de tabla
      const hasPermission = await authService.checkTablePermission(
        req.user.id,
        dbName,
        tableName,
        "read"
      );

      if (!hasPermission) {
        return res
          .status(403)
          .json({ error: "Sin permisos de lectura en la tabla" });
      }
    }

    next();
  } catch (error) {
    console.error("Error verificando permisos de lectura:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Middleware para verificar permisos de escritura
const requireWritePermission = async (req, res, next) => {
  try {
    const { dbName, tableName } = req.params;
    const hasPermission = await authService.checkTablePermission(
      req.user.id,
      dbName,
      tableName,
      "write"
    );

    if (!hasPermission) {
      return res.status(403).json({ error: "Sin permisos de escritura" });
    }

    next();
  } catch (error) {
    console.error("Error verificando permisos de escritura:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Middleware para verificar permisos de eliminación
const requireDeletePermission = async (req, res, next) => {
  try {
    const { dbName, tableName } = req.params;
    const hasPermission = await authService.checkTablePermission(
      req.user.id,
      dbName,
      tableName,
      "delete"
    );

    if (!hasPermission) {
      return res.status(403).json({ error: "Sin permisos de eliminación" });
    }

    next();
  } catch (error) {
    console.error("Error verificando permisos de eliminación:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Middleware para verificar permisos de creación
const requireCreatePermission = async (req, res, next) => {
  try {
    const { dbName, tableName } = req.params;
    const hasPermission = await authService.checkTablePermission(
      req.user.id,
      dbName,
      tableName,
      "write"
    );

    if (!hasPermission) {
      return res.status(403).json({ error: "Sin permisos de creación" });
    }

    next();
  } catch (error) {
    console.error("Error verificando permisos de creación:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireReadPermission,
  requireWritePermission,
  requireDeletePermission,
  requireCreatePermission,
};
