/**
 * Servicio de autenticación refactorizado con clean code
 * Maneja autenticación, usuarios y delegación de permisos
 */

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getPool } = require("../db");
const permissionService = require("./permissionService");
const logger = require("../config/logger");

/**
 * Servicio de autenticación y gestión de usuarios
 */
class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || "your-secret-key";
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || "24h";
    this.bcryptRounds = 10;
  }

  /**
   * Verifica las credenciales de un usuario
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @returns {Promise<Object|null>} Usuario si las credenciales son válidas
   */
  async verifyCredentials(username, password) {
    try {
      const pool = await getPool();
      const user = await this.getUserByUsername(username);
      
      if (!user) {
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        return null;
      }

      const isAdmin = await this.determineAdminStatus(user);

      return {
        id: user.id,
        username: user.username,
        isAdmin,
        createdAt: user.created_at,
      };
    } catch (error) {
      logger.database(`Error verificando credenciales: ${error.message}`, {
        username,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Obtiene un usuario por nombre de usuario
   * @param {string} username - Nombre de usuario
   * @returns {Promise<Object|null>} Usuario encontrado
   */
  async getUserByUsername(username) {
    try {
      const pool = await getPool();
      const query = "SELECT * FROM users WHERE username = @username";
      
      const result = await pool
        .request()
        .input("username", username)
        .query(query);

      return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
      logger.database(`Error obteniendo usuario por username: ${error.message}`, {
        username,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Determina si un usuario es administrador
   * @param {Object} user - Objeto usuario
   * @returns {Promise<boolean>} True si es admin
   */
  async determineAdminStatus(user) {
    try {
      // Verificar si la columna is_admin existe
      const hasAdminColumn = await this.hasAdminColumn();
      
      if (!hasAdminColumn) {
        // Fallback a lógica anterior
        return user.username === "admin";
      }

      // Usar la columna is_admin
      return user.is_admin === 1 || user.is_admin === true;
    } catch (error) {
      logger.database(`Error determinando estado de admin: ${error.message}`, {
        userId: user.id,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Verifica si la tabla users tiene la columna is_admin
   * @returns {Promise<boolean>} True si la columna existe
   */
  async hasAdminColumn() {
    try {
      const pool = await getPool();
      const query = `
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'is_admin'
      `;
      
      const result = await pool.request().query(query);
      return result.recordset[0].count > 0;
    } catch (error) {
      logger.database(`Error verificando columna is_admin: ${error.message}`, {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Genera un token JWT para un usuario
   * @param {Object} user - Objeto usuario
   * @returns {string} Token JWT
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    };

    return jwt.sign(payload, this.jwtSecret, { 
      expiresIn: this.jwtExpiresIn 
    });
  }

  /**
   * Verifica y decodifica un token JWT
   * @param {string} token - Token JWT
   * @returns {Object|null} Payload del token si es válido
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      logger.security(`Token JWT inválido: ${error.message}`, {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Crea un nuevo usuario
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @param {boolean} isAdmin - Si es administrador
   * @returns {Promise<Object>} Usuario creado
   */
  async createUser(username, password, isAdmin = false) {
    try {
      const hashedPassword = await bcrypt.hash(password, this.bcryptRounds);
      const pool = await getPool();
      
      const query = `
        INSERT INTO users (username, password_hash, is_admin, created_at) 
        VALUES (@username, @password, @isAdmin, GETDATE()); 
        SELECT SCOPE_IDENTITY() AS id;
      `;
      
      const result = await pool
        .request()
        .input("username", username)
        .input("password", hashedPassword)
        .input("isAdmin", isAdmin)
        .query(query);

      const newUser = {
        id: result.recordset[0].id,
        username,
        isAdmin,
        createdAt: new Date(),
      };

      logger.auth(`Usuario creado exitosamente`, {
        userId: newUser.id,
        username,
        isAdmin,
      });

      return newUser;
    } catch (error) {
      logger.database(`Error creando usuario: ${error.message}`, {
        username,
        isAdmin,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Actualiza la contraseña de un usuario
   * @param {number} userId - ID del usuario
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<void>}
   */
  async updateUserPassword(userId, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, this.bcryptRounds);
      const pool = await getPool();
      
      const query = `
        UPDATE users 
        SET password_hash = @password, updated_at = GETDATE()
        WHERE id = @userId
      `;
      
      await pool
        .request()
        .input("userId", userId)
        .input("password", hashedPassword)
        .query(query);

      logger.auth(`Contraseña actualizada`, {
        userId,
      });
    } catch (error) {
      logger.database(`Error actualizando contraseña: ${error.message}`, {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Actualiza el estado de administrador de un usuario
   * @param {number} userId - ID del usuario
   * @param {boolean} isAdmin - Nuevo estado de admin
   * @returns {Promise<void>}
   */
  async updateAdminStatus(userId, isAdmin) {
    try {
      const pool = await getPool();
      
      const query = `
        UPDATE users 
        SET is_admin = @isAdmin, updated_at = GETDATE()
        WHERE id = @userId
      `;
      
      await pool
        .request()
        .input("userId", userId)
        .input("isAdmin", isAdmin)
        .query(query);

      logger.auth(`Estado de admin actualizado`, {
        userId,
        isAdmin,
      });
    } catch (error) {
      logger.database(`Error actualizando estado de admin: ${error.message}`, {
        userId,
        isAdmin,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Obtiene todos los usuarios
   * @returns {Promise<Array>} Lista de usuarios
   */
  async getAllUsers() {
    try {
      const pool = await getPool();
      
      const query = `
        SELECT 
          id, 
          username, 
          is_admin as isAdmin, 
          created_at as createdAt,
          updated_at as updatedAt
        FROM users 
        ORDER BY username
      `;
      
      const result = await pool.request().query(query);
      
      logger.auth(`Usuarios listados`, {
        userCount: result.recordset.length,
      });

      return result.recordset;
    } catch (error) {
      logger.database(`Error obteniendo usuarios: ${error.message}`, {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Elimina un usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<void>}
   */
  async deleteUser(userId) {
    try {
      const pool = await getPool();
      
      // Primero eliminar permisos del usuario
      await this.removeAllUserPermissions(userId);
      
      // Luego eliminar el usuario
      const query = "DELETE FROM users WHERE id = @userId";
      
      await pool
        .request()
        .input("userId", userId)
        .query(query);

      logger.auth(`Usuario eliminado`, {
        userId,
      });
    } catch (error) {
      logger.database(`Error eliminando usuario: ${error.message}`, {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Elimina todos los permisos de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<void>}
   */
  async removeAllUserPermissions(userId) {
    try {
      const pool = await getPool();
      
      const query = "DELETE FROM user_permissions WHERE user_id = @userId";
      
      await pool
        .request()
        .input("userId", userId)
        .query(query);

      logger.auth(`Todos los permisos del usuario eliminados`, {
        userId,
      });
    } catch (error) {
      logger.database(`Error eliminando permisos del usuario: ${error.message}`, {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Crea el usuario administrador por defecto si no existe
   * @returns {Promise<void>}
   */
  async createDefaultAdmin() {
    try {
      const existingAdmin = await this.getUserByUsername("admin");
      
      if (!existingAdmin) {
        await this.createUser("admin", "admin123", true);
        logger.info("Usuario administrador por defecto creado");
      } else {
        logger.info("Usuario administrador ya existe");
      }
    } catch (error) {
      logger.error(`Error creando administrador por defecto: ${error.message}`, {
        error: error.message,
      });
      throw error;
    }
  }

  // Métodos de delegación para el servicio de permisos
  async hasDatabasePermission(userId, databaseName, permissionType) {
    return await permissionService.hasDatabasePermission(userId, databaseName, permissionType);
  }

  async hasTablePermission(userId, databaseName, tableName, permissionType) {
    return await permissionService.hasTablePermission(userId, databaseName, tableName, permissionType);
  }

  async hasPermission(userId, databaseName, tableName, permissionType) {
    return await permissionService.hasPermission(userId, databaseName, tableName, permissionType);
  }

  async assignDatabasePermission(userId, databaseName, permissions) {
    return await permissionService.assignDatabasePermission(userId, databaseName, permissions);
  }

  async assignTablePermission(userId, databaseName, tableName, permissions) {
    return await permissionService.assignTablePermission(userId, databaseName, tableName, permissions);
  }

  async removeDatabasePermission(userId, databaseName) {
    return await permissionService.removeDatabasePermission(userId, databaseName);
  }

  async removeTablePermission(userId, databaseName, tableName) {
    return await permissionService.removeTablePermission(userId, databaseName, tableName);
  }

  async getUserPermissions(userId) {
    return await permissionService.getUserPermissions(userId);
  }

  async getUsersWithDatabasePermission(databaseName) {
    return await permissionService.getUsersWithDatabasePermission(databaseName);
  }

  async getUsersWithTablePermission(databaseName, tableName) {
    return await permissionService.getUsersWithTablePermission(databaseName, tableName);
  }
}

module.exports = new AuthService();
