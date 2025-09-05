/**
 * Middleware de permisos refactorizado con clean code
 * Proporciona funciones para verificar permisos granulares
 */

const { AppError } = require("./errorHandler");
const authService = require("../services/authServiceRefactored");
const logger = require("../config/logger");

/**
 * Tipos de permisos disponibles
 */
const PERMISSION_TYPES = {
  READ: "READ",
  WRITE: "WRITE", 
  DELETE: "DELETE",
  CREATE: "CREATE",
};

/**
 * Verifica si un usuario tiene permisos específicos
 * @param {string} permissionType - Tipo de permiso (READ, WRITE, DELETE, CREATE)
 * @param {string} databaseName - Nombre de la base de datos
 * @param {string} tableName - Nombre de la tabla (opcional)
 * @returns {Function} Middleware de Express
 */
const requirePermission = (permissionType, databaseName, tableName = null) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.isAdmin;

      // Los administradores tienen todos los permisos
      if (isAdmin) {
        return next();
      }

      // Verificar si el tipo de permiso es válido
      if (!Object.values(PERMISSION_TYPES).includes(permissionType)) {
        throw new AppError(
          `Tipo de permiso inválido: ${permissionType}`,
          400,
          "INVALID_PERMISSION_TYPE"
        );
      }

      // Verificar permisos
      const hasPermission = await authService.hasPermission(
        userId,
        databaseName,
        tableName,
        permissionType
      );

      if (!hasPermission) {
        logger.security(`Acceso denegado por falta de permisos`, {
          userId,
          username: req.user.username,
          permissionType,
          databaseName,
          tableName,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        });

        throw new AppError(
          `No tienes permisos de ${permissionType} en ${databaseName}${tableName ? `.${tableName}` : ""}`,
          403,
          "INSUFFICIENT_PERMISSIONS"
        );
      }

      logger.auth(`Permiso ${permissionType} verificado exitosamente`, {
        userId,
        username: req.user.username,
        permissionType,
        databaseName,
        tableName,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar permisos de lectura
 * @param {string} databaseName - Nombre de la base de datos
 * @param {string} tableName - Nombre de la tabla (opcional)
 * @returns {Function} Middleware de Express
 */
const requireReadPermission = (databaseName, tableName = null) => {
  return requirePermission(PERMISSION_TYPES.READ, databaseName, tableName);
};

/**
 * Middleware para verificar permisos de escritura
 * @param {string} databaseName - Nombre de la base de datos
 * @param {string} tableName - Nombre de la tabla (opcional)
 * @returns {Function} Middleware de Express
 */
const requireWritePermission = (databaseName, tableName = null) => {
  return requirePermission(PERMISSION_TYPES.WRITE, databaseName, tableName);
};

/**
 * Middleware para verificar permisos de eliminación
 * @param {string} databaseName - Nombre de la base de datos
 * @param {string} tableName - Nombre de la tabla (opcional)
 * @returns {Function} Middleware de Express
 */
const requireDeletePermission = (databaseName, tableName = null) => {
  return requirePermission(PERMISSION_TYPES.DELETE, databaseName, tableName);
};

/**
 * Middleware para verificar permisos de creación
 * @param {string} databaseName - Nombre de la base de datos
 * @param {string} tableName - Nombre de la tabla (opcional)
 * @returns {Function} Middleware de Express
 */
const requireCreatePermission = (databaseName, tableName = null) => {
  return requirePermission(PERMISSION_TYPES.CREATE, databaseName, tableName);
};

/**
 * Middleware para verificar múltiples permisos (todos requeridos)
 * @param {Array} permissions - Array de objetos {type, databaseName, tableName}
 * @returns {Function} Middleware de Express
 */
const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.isAdmin;

      // Los administradores tienen todos los permisos
      if (isAdmin) {
        return next();
      }

      // Verificar todos los permisos
      for (const permission of permissions) {
        const hasPermission = await authService.hasPermission(
          userId,
          permission.databaseName,
          permission.tableName,
          permission.type
        );

        if (!hasPermission) {
          logger.security(`Acceso denegado por falta de permisos múltiples`, {
            userId,
            username: req.user.username,
            requiredPermissions: permissions,
            failedPermission: permission,
            ip: req.ip,
            userAgent: req.get("User-Agent"),
          });

          throw new AppError(
            `No tienes permisos de ${permission.type} en ${permission.databaseName}${permission.tableName ? `.${permission.tableName}` : ""}`,
            403,
            "INSUFFICIENT_PERMISSIONS"
          );
        }
      }

      logger.auth(`Todos los permisos múltiples verificados exitosamente`, {
        userId,
        username: req.user.username,
        permissions,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar al menos uno de varios permisos
 * @param {Array} permissions - Array de objetos {type, databaseName, tableName}
 * @returns {Function} Middleware de Express
 */
const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.isAdmin;

      // Los administradores tienen todos los permisos
      if (isAdmin) {
        return next();
      }

      // Verificar al menos uno de los permisos
      for (const permission of permissions) {
        const hasPermission = await authService.hasPermission(
          userId,
          permission.databaseName,
          permission.tableName,
          permission.type
        );

        if (hasPermission) {
          logger.auth(`Al menos un permiso verificado exitosamente`, {
            userId,
            username: req.user.username,
            grantedPermission: permission,
            allPermissions: permissions,
          });

          return next();
        }
      }

      logger.security(`Acceso denegado por falta de cualquier permiso`, {
        userId,
        username: req.user.username,
        requiredPermissions: permissions,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      throw new AppError(
        "No tienes ninguno de los permisos requeridos",
        403,
        "INSUFFICIENT_PERMISSIONS"
      );
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar permisos dinámicos basados en parámetros de la URL
 * @param {Function} permissionResolver - Función que resuelve permisos basado en req
 * @returns {Function} Middleware de Express
 */
const requireDynamicPermission = (permissionResolver) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.isAdmin;

      // Los administradores tienen todos los permisos
      if (isAdmin) {
        return next();
      }

      // Resolver permisos dinámicamente
      const permission = permissionResolver(req);
      
      if (!permission) {
        throw new AppError(
          "No se pudo resolver el permiso requerido",
          400,
          "PERMISSION_RESOLUTION_ERROR"
        );
      }

      const hasPermission = await authService.hasPermission(
        userId,
        permission.databaseName,
        permission.tableName,
        permission.type
      );

      if (!hasPermission) {
        logger.security(`Acceso denegado por falta de permisos dinámicos`, {
          userId,
          username: req.user.username,
          resolvedPermission: permission,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        });

        throw new AppError(
          `No tienes permisos de ${permission.type} en ${permission.databaseName}${permission.tableName ? `.${permission.tableName}` : ""}`,
          403,
          "INSUFFICIENT_PERMISSIONS"
        );
      }

      logger.auth(`Permiso dinámico verificado exitosamente`, {
        userId,
        username: req.user.username,
        resolvedPermission: permission,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Función helper para crear resolvers de permisos dinámicos
 * @param {string} databaseParam - Nombre del parámetro de BD en req.params
 * @param {string} tableParam - Nombre del parámetro de tabla en req.params
 * @param {string} permissionType - Tipo de permiso
 * @returns {Function} Resolver de permisos
 */
const createPermissionResolver = (databaseParam, tableParam, permissionType) => {
  return (req) => {
    const databaseName = req.params[databaseParam];
    const tableName = req.params[tableParam];
    
    if (!databaseName) {
      return null;
    }

    return {
      type: permissionType,
      databaseName,
      tableName: tableName || null,
    };
  };
};

module.exports = {
  PERMISSION_TYPES,
  requirePermission,
  requireReadPermission,
  requireWritePermission,
  requireDeletePermission,
  requireCreatePermission,
  requireAllPermissions,
  requireAnyPermission,
  requireDynamicPermission,
  createPermissionResolver,
};
