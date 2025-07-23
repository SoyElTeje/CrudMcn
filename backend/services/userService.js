const sql = require("mssql");
const bcrypt = require("bcrypt");
const { getPool } = require("../db");
require("dotenv").config();

class UserService {
  // Crear un nuevo usuario
  static async createUser(username, password, isAdmin = false) {
    try {
      const pool = await getPool(process.env.DB_DATABASE);

      // Verificar si el usuario ya existe
      const checkQuery = `
        SELECT Id FROM ${process.env.USERS_TABLE} WHERE NombreUsuario = @username
      `;
      const checkResult = await pool
        .request()
        .input("username", username)
        .query(checkQuery);

      if (checkResult.recordset.length > 0) {
        throw new Error("El usuario ya existe");
      }

      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insertar el nuevo usuario
      const insertQuery = `
        INSERT INTO ${process.env.USERS_TABLE} (NombreUsuario, Contrasena, EsAdmin)
        VALUES (@username, @password, @isAdmin);
        SELECT SCOPE_IDENTITY() as userId;
      `;

      const insertResult = await pool
        .request()
        .input("username", username)
        .input("password", hashedPassword)
        .input("isAdmin", isAdmin)
        .query(insertQuery);

      return {
        userId: parseInt(insertResult.recordset[0].userId),
        username,
        isAdmin,
      };
    } catch (error) {
      console.error("Error creando usuario:", error);
      throw error;
    }
  }

  // Obtener todos los usuarios
  static async getAllUsers() {
    try {
      const pool = await getPool(process.env.DB_DATABASE);

      const query = `
        SELECT Id, NombreUsuario, EsAdmin
        FROM ${process.env.USERS_TABLE}
        ORDER BY NombreUsuario
      `;

      const result = await pool.request().query(query);

      return result.recordset.map((user) => ({
        id: user.Id,
        username: user.NombreUsuario,
        isAdmin: Boolean(user.EsAdmin),
        createdAt: new Date().toISOString(), // Valor por defecto
      }));
    } catch (error) {
      console.error("Error obteniendo usuarios:", error);
      throw error;
    }
  }

  // Obtener un usuario por ID
  static async getUserById(userId) {
    try {
      const pool = await getPool(process.env.DB_DATABASE);

      const query = `
        SELECT Id, NombreUsuario, EsAdmin
        FROM ${process.env.USERS_TABLE}
        WHERE Id = @userId
      `;

      const result = await pool.request().input("userId", userId).query(query);

      if (result.recordset.length === 0) {
        return null;
      }

      const user = result.recordset[0];
      return {
        id: user.Id,
        username: user.NombreUsuario,
        isAdmin: Boolean(user.EsAdmin),
        createdAt: new Date().toISOString(), // Valor por defecto
      };
    } catch (error) {
      console.error("Error obteniendo usuario:", error);
      throw error;
    }
  }

  // Actualizar contraseña de un usuario
  static async updatePassword(userId, newPassword) {
    try {
      const pool = await getPool(process.env.DB_DATABASE);

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const query = `
        UPDATE ${process.env.USERS_TABLE}
        SET Contrasena = @password
        WHERE Id = @userId
      `;

      const result = await pool
        .request()
        .input("password", hashedPassword)
        .input("userId", userId)
        .query(query);

      if (result.rowsAffected[0] === 0) {
        throw new Error("Usuario no encontrado");
      }

      return true;
    } catch (error) {
      console.error("Error actualizando contraseña:", error);
      throw error;
    }
  }

  // Eliminar un usuario
  static async deleteUser(userId) {
    try {
      const pool = await getPool(process.env.DB_DATABASE);

      const query = `
        DELETE FROM ${process.env.USERS_TABLE}
        WHERE Id = @userId
      `;

      const result = await pool.request().input("userId", userId).query(query);

      if (result.rowsAffected[0] === 0) {
        throw new Error("Usuario no encontrado");
      }

      return true;
    } catch (error) {
      console.error("Error eliminando usuario:", error);
      throw error;
    }
  }

  // Asignar permisos de base de datos a un usuario
  static async assignDatabasePermission(userId, databaseName) {
    try {
      const pool = await getPool(process.env.DB_DATABASE);

      // Verificar si el permiso ya existe
      const checkQuery = `
        SELECT Id FROM PermisosBasesDatos 
        WHERE UserId = @userId AND DatabaseName = @databaseName
      `;

      const checkResult = await pool
        .request()
        .input("userId", userId)
        .input("databaseName", databaseName)
        .query(checkQuery);

      if (checkResult.recordset.length > 0) {
        return { message: "El permiso ya existe" };
      }

      // Insertar el permiso
      const insertQuery = `
        INSERT INTO PermisosBasesDatos (UserId, DatabaseName)
        VALUES (@userId, @databaseName)
      `;

      await pool
        .request()
        .input("userId", userId)
        .input("databaseName", databaseName)
        .query(insertQuery);

      return { message: "Permiso asignado correctamente" };
    } catch (error) {
      console.error("Error asignando permiso de base de datos:", error);
      throw error;
    }
  }

  // Asignar permisos de tabla a un usuario
  static async assignTablePermission(
    userId,
    databaseName,
    tableName,
    schemaName = "dbo"
  ) {
    try {
      const pool = await getPool(process.env.DB_DATABASE);

      // Verificar si el permiso ya existe
      const checkQuery = `
        SELECT Id FROM PermisosTablas 
        WHERE UserId = @userId AND DatabaseName = @databaseName AND TableName = @tableName
      `;

      const checkResult = await pool
        .request()
        .input("userId", userId)
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .query(checkQuery);

      if (checkResult.recordset.length > 0) {
        return { message: "El permiso ya existe" };
      }

      // Insertar el permiso
      const insertQuery = `
        INSERT INTO PermisosTablas (UserId, DatabaseName, TableName, SchemaName)
        VALUES (@userId, @databaseName, @tableName, @schemaName)
      `;

      await pool
        .request()
        .input("userId", userId)
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .input("schemaName", schemaName)
        .query(insertQuery);

      return { message: "Permiso asignado correctamente" };
    } catch (error) {
      console.error("Error asignando permiso de tabla:", error);
      throw error;
    }
  }

  // Obtener permisos de un usuario
  static async getUserPermissions(userId) {
    try {
      const pool = await getPool(process.env.DB_DATABASE);

      // Obtener permisos de bases de datos
      const dbPermissionsQuery = `
        SELECT DatabaseName FROM PermisosBasesDatos 
        WHERE UserId = @userId
        ORDER BY DatabaseName
      `;

      const dbPermissionsResult = await pool
        .request()
        .input("userId", userId)
        .query(dbPermissionsQuery);

      // Obtener permisos de tablas
      const tablePermissionsQuery = `
        SELECT DatabaseName, TableName, SchemaName FROM PermisosTablas 
        WHERE UserId = @userId
        ORDER BY DatabaseName, SchemaName, TableName
      `;

      const tablePermissionsResult = await pool
        .request()
        .input("userId", userId)
        .query(tablePermissionsQuery);

      return {
        databases: dbPermissionsResult.recordset.map(
          (perm) => perm.DatabaseName
        ),
        tables: tablePermissionsResult.recordset.map((perm) => ({
          database: perm.DatabaseName,
          table: perm.TableName,
          schema: perm.SchemaName,
        })),
      };
    } catch (error) {
      console.error("Error obteniendo permisos del usuario:", error);
      throw error;
    }
  }

  // Remover permisos de base de datos
  static async removeDatabasePermission(userId, databaseName) {
    try {
      const pool = await getPool(process.env.DB_DATABASE);

      const query = `
        DELETE FROM PermisosBasesDatos 
        WHERE UserId = @userId AND DatabaseName = @databaseName
      `;

      const result = await pool
        .request()
        .input("userId", userId)
        .input("databaseName", databaseName)
        .query(query);

      return { message: "Permiso removido correctamente" };
    } catch (error) {
      console.error("Error removiendo permiso de base de datos:", error);
      throw error;
    }
  }

  // Remover permisos de tabla
  static async removeTablePermission(userId, databaseName, tableName) {
    try {
      const pool = await getPool(process.env.DB_DATABASE);

      const query = `
        DELETE FROM PermisosTablas 
        WHERE UserId = @userId AND DatabaseName = @databaseName AND TableName = @tableName
      `;

      const result = await pool
        .request()
        .input("userId", userId)
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .query(query);

      return { message: "Permiso removido correctamente" };
    } catch (error) {
      console.error("Error removiendo permiso de tabla:", error);
      throw error;
    }
  }
}

module.exports = UserService;
