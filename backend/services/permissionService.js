/**
 * Servicio de permisos refactorizado con clean code
 * Maneja permisos granulares de base de datos y tablas
 */

const { getPool } = require("../db");
const logger = require("../config/logger");

/**
 * Servicio para manejo de permisos granulares
 */
class PermissionService {
  constructor() {
    this.permissionTypes = {
      READ: "can_read",
      WRITE: "can_write",
      DELETE: "can_delete",
      CREATE: "can_create",
    };
  }

  /**
   * Verifica si un usuario tiene permisos específicos en una base de datos
   * @param {number} userId - ID del usuario
   * @param {string} databaseName - Nombre de la base de datos
   * @param {string} permissionType - Tipo de permiso (READ, WRITE, DELETE, CREATE)
   * @returns {Promise<boolean>} True si tiene permisos
   */
  async hasDatabasePermission(userId, databaseName, permissionType) {
    try {
      const pool = await getPool();
      const permissionColumn = this.permissionTypes[permissionType];

      if (!permissionColumn) {
        throw new Error(`Tipo de permiso inválido: ${permissionType}`);
      }

      const query = `
        SELECT ${permissionColumn}
        FROM user_permissions 
        WHERE user_id = @userId 
        AND database_name = @databaseName 
        AND table_name IS NULL
      `;

      const result = await pool
        .request()
        .input("userId", userId)
        .input("databaseName", databaseName)
        .query(query);

      return (
        result.recordset.length > 0 &&
        result.recordset[0][permissionColumn] === true
      );
    } catch (error) {
      logger.database(`Error verificando permiso de BD: ${error.message}`, {
        userId,
        databaseName,
        permissionType,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Verifica si un usuario tiene permisos específicos en una tabla
   * @param {number} userId - ID del usuario
   * @param {string} databaseName - Nombre de la base de datos
   * @param {string} tableName - Nombre de la tabla
   * @param {string} permissionType - Tipo de permiso (READ, WRITE, DELETE, CREATE)
   * @returns {Promise<boolean>} True si tiene permisos
   */
  async hasTablePermission(userId, databaseName, tableName, permissionType) {
    try {
      const pool = await getPool();
      const permissionColumn = this.permissionTypes[permissionType];

      if (!permissionColumn) {
        throw new Error(`Tipo de permiso inválido: ${permissionType}`);
      }

      const query = `
        SELECT ${permissionColumn}
        FROM user_permissions 
        WHERE user_id = @userId 
        AND database_name = @databaseName 
        AND table_name = @tableName
      `;

      const result = await pool
        .request()
        .input("userId", userId)
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .query(query);

      return (
        result.recordset.length > 0 &&
        result.recordset[0][permissionColumn] === true
      );
    } catch (error) {
      logger.database(`Error verificando permiso de tabla: ${error.message}`, {
        userId,
        databaseName,
        tableName,
        permissionType,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Verifica si un usuario tiene permisos en una base de datos o tabla específica
   * Los permisos de tabla tienen prioridad sobre los de base de datos
   * @param {number} userId - ID del usuario
   * @param {string} databaseName - Nombre de la base de datos
   * @param {string} tableName - Nombre de la tabla (opcional)
   * @param {string} permissionType - Tipo de permiso
   * @returns {Promise<boolean>} True si tiene permisos
   */
  async hasPermission(userId, databaseName, tableName, permissionType) {
    // Si se especifica tabla, verificar permisos de tabla primero
    if (tableName) {
      const hasTablePermission = await this.hasTablePermission(
        userId,
        databaseName,
        tableName,
        permissionType
      );

      if (hasTablePermission) {
        return true;
      }
    }

    // Si no tiene permisos de tabla o no se especificó tabla, verificar permisos de BD
    return await this.hasDatabasePermission(
      userId,
      databaseName,
      permissionType
    );
  }

  /**
   * Asigna permisos de base de datos a un usuario
   * @param {number} userId - ID del usuario
   * @param {string} databaseName - Nombre de la base de datos
   * @param {Object} permissions - Objeto con permisos (canRead, canWrite, canDelete, canCreate)
   * @returns {Promise<void>}
   */
  async assignDatabasePermission(userId, databaseName, permissions) {
    try {
      const pool = await getPool();

      // Verificar si ya existe el permiso
      const existingQuery = `
        SELECT id FROM user_permissions 
        WHERE user_id = @userId 
        AND database_name = @databaseName 
        AND table_name IS NULL
      `;

      const existingResult = await pool
        .request()
        .input("userId", userId)
        .input("databaseName", databaseName)
        .query(existingQuery);

      if (existingResult.recordset.length > 0) {
        // Actualizar permiso existente
        const updateQuery = `
          UPDATE user_permissions 
          SET can_read = @canRead, can_write = @canWrite, can_delete = @canDelete, can_create = @canCreate,
              updated_at = GETDATE()
          WHERE user_id = @userId 
          AND database_name = @databaseName 
          AND table_name IS NULL
        `;

        await pool
          .request()
          .input("userId", userId)
          .input("databaseName", databaseName)
          .input("canRead", permissions.canRead || false)
          .input("canWrite", permissions.canWrite || false)
          .input("canDelete", permissions.canDelete || false)
          .input("canCreate", permissions.canCreate || false)
          .query(updateQuery);
      } else {
        // Crear nuevo permiso
        const insertQuery = `
          INSERT INTO user_permissions 
          (user_id, database_name, table_name, can_read, can_write, can_delete, can_create, created_at, updated_at)
          VALUES (@userId, @databaseName, NULL, @canRead, @canWrite, @canDelete, @canCreate, GETDATE(), GETDATE())
        `;

        await pool
          .request()
          .input("userId", userId)
          .input("databaseName", databaseName)
          .input("canRead", permissions.canRead || false)
          .input("canWrite", permissions.canWrite || false)
          .input("canDelete", permissions.canDelete || false)
          .input("canCreate", permissions.canCreate || false)
          .query(insertQuery);
      }

      logger.auth(`Permisos de BD asignados`, {
        userId,
        databaseName,
        permissions,
      });
    } catch (error) {
      logger.database(`Error asignando permisos de BD: ${error.message}`, {
        userId,
        databaseName,
        permissions,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Asigna permisos de tabla específica a un usuario
   * @param {number} userId - ID del usuario
   * @param {string} databaseName - Nombre de la base de datos
   * @param {string} tableName - Nombre de la tabla
   * @param {Object} permissions - Objeto con permisos
   * @returns {Promise<void>}
   */
  async assignTablePermission(userId, databaseName, tableName, permissions) {
    try {
      const pool = await getPool();

      // Verificar si ya existe el permiso
      const existingQuery = `
        SELECT id FROM user_permissions 
        WHERE user_id = @userId 
        AND database_name = @databaseName 
        AND table_name = @tableName
      `;

      const existingResult = await pool
        .request()
        .input("userId", userId)
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .query(existingQuery);

      if (existingResult.recordset.length > 0) {
        // Actualizar permiso existente
        const updateQuery = `
          UPDATE user_permissions 
          SET can_read = @canRead, can_write = @canWrite, can_delete = @canDelete, can_create = @canCreate,
              updated_at = GETDATE()
          WHERE user_id = @userId 
          AND database_name = @databaseName 
          AND table_name = @tableName
        `;

        await pool
          .request()
          .input("userId", userId)
          .input("databaseName", databaseName)
          .input("tableName", tableName)
          .input("canRead", permissions.canRead || false)
          .input("canWrite", permissions.canWrite || false)
          .input("canDelete", permissions.canDelete || false)
          .input("canCreate", permissions.canCreate || false)
          .query(updateQuery);
      } else {
        // Crear nuevo permiso
        const insertQuery = `
          INSERT INTO user_permissions 
          (user_id, database_name, table_name, can_read, can_write, can_delete, can_create, created_at, updated_at)
          VALUES (@userId, @databaseName, @tableName, @canRead, @canWrite, @canDelete, @canCreate, GETDATE(), GETDATE())
        `;

        await pool
          .request()
          .input("userId", userId)
          .input("databaseName", databaseName)
          .input("tableName", tableName)
          .input("canRead", permissions.canRead || false)
          .input("canWrite", permissions.canWrite || false)
          .input("canDelete", permissions.canDelete || false)
          .input("canCreate", permissions.canCreate || false)
          .query(insertQuery);
      }

      logger.auth(`Permisos de tabla asignados`, {
        userId,
        databaseName,
        tableName,
        permissions,
      });
    } catch (error) {
      logger.database(`Error asignando permisos de tabla: ${error.message}`, {
        userId,
        databaseName,
        tableName,
        permissions,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Remueve permisos de base de datos de un usuario
   * @param {number} userId - ID del usuario
   * @param {string} databaseName - Nombre de la base de datos
   * @returns {Promise<void>}
   */
  async removeDatabasePermission(userId, databaseName) {
    try {
      const pool = await getPool();

      const query = `
        DELETE FROM user_permissions 
        WHERE user_id = @userId 
        AND database_name = @databaseName 
        AND table_name IS NULL
      `;

      await pool
        .request()
        .input("userId", userId)
        .input("databaseName", databaseName)
        .query(query);

      logger.auth(`Permisos de BD removidos`, {
        userId,
        databaseName,
      });
    } catch (error) {
      logger.database(`Error removiendo permisos de BD: ${error.message}`, {
        userId,
        databaseName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Remueve permisos de tabla específica de un usuario
   * @param {number} userId - ID del usuario
   * @param {string} databaseName - Nombre de la base de datos
   * @param {string} tableName - Nombre de la tabla
   * @returns {Promise<void>}
   */
  async removeTablePermission(userId, databaseName, tableName) {
    try {
      const pool = await getPool();

      const query = `
        DELETE FROM user_permissions 
        WHERE user_id = @userId 
        AND database_name = @databaseName 
        AND table_name = @tableName
      `;

      await pool
        .request()
        .input("userId", userId)
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .query(query);

      logger.auth(`Permisos de tabla removidos`, {
        userId,
        databaseName,
        tableName,
      });
    } catch (error) {
      logger.database(`Error removiendo permisos de tabla: ${error.message}`, {
        userId,
        databaseName,
        tableName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Obtiene todos los permisos de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Objeto con permisos de BD y tablas
   */
  async getUserPermissions(userId) {
    try {
      const pool = await getPool();

      // Verificar si la tabla de permisos existe
      const tableExistsQuery = `
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'user_permissions'
      `;

      const tableExistsResult = await pool.request().query(tableExistsQuery);
      const tableExists = tableExistsResult.recordset[0].count === 1;

      if (!tableExists) {
        logger.database(
          "Tabla de permisos no existe, retornando permisos vacíos",
          {
            userId,
          }
        );
        return {
          databasePermissions: [],
          tablePermissions: [],
        };
      }

      // Obtener permisos de base de datos
      const databasePermissionsQuery = `
        SELECT 
          database_name as databaseName, 
          can_read as canRead, 
          can_write as canWrite, 
          can_delete as canDelete,
          can_create as canCreate,
          created_at as createdAt,
          updated_at as updatedAt
        FROM user_permissions 
        WHERE user_id = @userId AND table_name IS NULL
        ORDER BY database_name
      `;

      const databasePermissionsResult = await pool
        .request()
        .input("userId", userId)
        .query(databasePermissionsQuery);

      // Obtener permisos de tablas específicas
      const tablePermissionsQuery = `
        SELECT 
          database_name as databaseName, 
          table_name as tableName, 
          can_read as canRead, 
          can_write as canWrite, 
          can_delete as canDelete, 
          can_create as canCreate,
          created_at as createdAt,
          updated_at as updatedAt
        FROM user_permissions 
        WHERE user_id = @userId AND table_name IS NOT NULL
        ORDER BY database_name, table_name
      `;

      const tablePermissionsResult = await pool
        .request()
        .input("userId", userId)
        .query(tablePermissionsQuery);

      return {
        databasePermissions: databasePermissionsResult.recordset,
        tablePermissions: tablePermissionsResult.recordset,
      };
    } catch (error) {
      logger.database(
        `Error obteniendo permisos de usuario: ${error.message}`,
        {
          userId,
          error: error.message,
        }
      );
      throw error;
    }
  }

  /**
   * Obtiene todos los usuarios que tienen permisos en una base de datos específica
   * @param {string} databaseName - Nombre de la base de datos
   * @returns {Promise<Array>} Lista de usuarios con permisos
   */
  async getUsersWithDatabasePermission(databaseName) {
    try {
      const pool = await getPool();

      const query = `
        SELECT DISTINCT 
          u.id, 
          u.username,
          up.database_name as databaseName,
          up.can_read as canRead,
          up.can_write as canWrite,
          up.can_delete as canDelete,
          up.can_create as canCreate
        FROM users u
        INNER JOIN user_permissions up ON u.id = up.user_id
        WHERE up.database_name = @databaseName 
        AND up.table_name IS NULL
        ORDER BY u.username
      `;

      const result = await pool
        .request()
        .input("databaseName", databaseName)
        .query(query);

      return result.recordset;
    } catch (error) {
      logger.database(
        `Error obteniendo usuarios con permisos de BD: ${error.message}`,
        {
          databaseName,
          error: error.message,
        }
      );
      throw error;
    }
  }

  /**
   * Obtiene todos los usuarios que tienen permisos en una tabla específica
   * @param {string} databaseName - Nombre de la base de datos
   * @param {string} tableName - Nombre de la tabla
   * @returns {Promise<Array>} Lista de usuarios con permisos
   */
  async getUsersWithTablePermission(databaseName, tableName) {
    try {
      const pool = await getPool();

      const query = `
        SELECT DISTINCT 
          u.id, 
          u.username,
          up.database_name as databaseName,
          up.table_name as tableName,
          up.can_read as canRead,
          up.can_write as canWrite,
          up.can_delete as canDelete,
          up.can_create as canCreate
        FROM users u
        INNER JOIN user_permissions up ON u.id = up.user_id
        WHERE up.database_name = @databaseName 
        AND up.table_name = @tableName
        ORDER BY u.username
      `;

      const result = await pool
        .request()
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .query(query);

      return result.recordset;
    } catch (error) {
      logger.database(
        `Error obteniendo usuarios con permisos de tabla: ${error.message}`,
        {
          databaseName,
          tableName,
          error: error.message,
        }
      );
      throw error;
    }
  }
}

module.exports = new PermissionService();
