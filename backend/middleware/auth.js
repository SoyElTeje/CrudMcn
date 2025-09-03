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
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    // Los administradores tienen todos los permisos
    if (req.user.isAdmin) {
      return next();
    }

    // Aquí puedes implementar lógica más granular de permisos
    // Por ahora, solo permitimos administradores
    return res
      .status(403)
      .json({ error: `Acceso denegado. Se requiere permiso: ${permission}` });
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requirePermission,
};
