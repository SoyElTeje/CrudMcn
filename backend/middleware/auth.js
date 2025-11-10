const jwt = require("jsonwebtoken");

/**
 * Obtiene el JWT_SECRET de las variables de entorno
 * Lanza un error si no está configurado
 */
function getJWTSecret() {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret || jwtSecret.trim() === "" || jwtSecret === "your-secret-key") {
    throw new Error(
      "JWT_SECRET debe estar configurado en las variables de entorno (.env). " +
      "No se puede usar un valor por defecto por razones de seguridad."
    );
  }
  
  return jwtSecret;
}

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
    const jwtSecret = getJWTSecret();
    const decoded = jwt.verify(token, jwtSecret);

    req.user = decoded;
    next();
  } catch (error) {
    // Si el error es por JWT_SECRET no configurado, devolver error 500
    if (error.message.includes("JWT_SECRET")) {
      console.error("Error de configuración:", error.message);
      return res.status(500).json({ 
        error: "Error de configuración del servidor. Contacte al administrador." 
      });
    }
    
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
