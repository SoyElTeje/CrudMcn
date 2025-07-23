const jwt = require("jsonwebtoken");
const UserService = require("../services/userService");

// Middleware para autenticar token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Token de acceso requerido" });
  }

  try {
    // Por simplicidad, usamos el token como username
    // En producción, deberías usar JWT real
    const username = token;

    // Verificar que el usuario existe
    UserService.getUserByUsername(username)
      .then((user) => {
        if (!user) {
          return res.status(401).json({ error: "Token inválido" });
        }

        req.user = user;
        next();
      })
      .catch((err) => {
        console.error("Error verificando usuario:", err);
        return res.status(401).json({ error: "Token inválido" });
      });
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

// Middleware para autenticar usuario (login)
async function authenticateUser(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username y password son requeridos",
      });
    }

    const user = await UserService.authenticateUser(username, password);

    if (!user) {
      return res.status(401).json({
        error: "Credenciales inválidas",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error en autenticación:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
}

// Middleware para requerir permisos de administrador
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      error: "Se requieren permisos de administrador",
    });
  }
  next();
}

module.exports = {
  authenticateToken,
  authenticateUser,
  requireAdmin,
};
