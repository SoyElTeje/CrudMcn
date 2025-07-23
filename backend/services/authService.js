const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getPool } = require("../db");

class AuthService {
  // Función para verificar credenciales de usuario
  async verifyCredentials(username, password) {
    try {
      const pool = await getPool();
      const query = "SELECT * FROM USERS_TABLE WHERE NombreUsuario = @username";
      const result = await pool
        .request()
        .input("username", username)
        .query(query);

      if (result.recordset.length === 0) {
        return null;
      }

      const user = result.recordset[0];
      const isValidPassword = await bcrypt.compare(password, user.Contrasena);

      if (!isValidPassword) {
        return null;
      }

      return {
        id: user.Id,
        username: user.NombreUsuario,
        isAdmin: user.EsAdmin === true || user.EsAdmin === 1,
        createdAt: user.FechaCreacion,
      };
    } catch (error) {
      console.error("Error verifying credentials:", error);
      throw error;
    }
  }

  // Función para generar token JWT
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );
  }

  // Función para verificar token JWT
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    } catch (error) {
      return null;
    }
  }

  // Función para crear un nuevo usuario
  async createUser(username, password, isAdmin = false) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const pool = await getPool();
      const query =
        "INSERT INTO USERS_TABLE (NombreUsuario, Contrasena, EsAdmin) VALUES (@username, @password, @isAdmin); SELECT SCOPE_IDENTITY() AS id;";
      const result = await pool
        .request()
        .input("username", username)
        .input("password", hashedPassword)
        .input("isAdmin", isAdmin ? 1 : 0)
        .query(query);

      return {
        id: result.recordset[0].id,
        username,
        isAdmin,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // Función para obtener todos los usuarios
  async getAllUsers() {
    try {
      const pool = await getPool();
      const query =
        "SELECT Id, NombreUsuario, EsAdmin, FechaCreacion, FechaModificacion FROM USERS_TABLE ORDER BY FechaCreacion DESC";
      const result = await pool.request().query(query);

      return result.recordset.map((user) => ({
        id: user.Id,
        username: user.NombreUsuario,
        isAdmin: user.EsAdmin === true || user.EsAdmin === 1,
        createdAt: user.FechaCreacion,
        updatedAt: user.FechaModificacion,
      }));
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }

  // Función para actualizar contraseña de usuario
  async updateUserPassword(userId, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const pool = await getPool();
      const query =
        "UPDATE USERS_TABLE SET Contrasena = @password WHERE Id = @userId";
      await pool
        .request()
        .input("password", hashedPassword)
        .input("userId", userId)
        .query(query);

      return true;
    } catch (error) {
      console.error("Error updating user password:", error);
      throw error;
    }
  }

  // Función para actualizar permisos de administrador
  async updateAdminStatus(userId, isAdmin) {
    try {
      const pool = await getPool();
      const query =
        "UPDATE USERS_TABLE SET EsAdmin = @isAdmin WHERE Id = @userId";
      await pool
        .request()
        .input("isAdmin", isAdmin ? 1 : 0)
        .input("userId", userId)
        .query(query);

      return true;
    } catch (error) {
      console.error("Error updating admin status:", error);
      throw error;
    }
  }

  // Función para eliminar usuario
  async deleteUser(userId) {
    try {
      const pool = await getPool();
      const query = "DELETE FROM USERS_TABLE WHERE Id = @userId";
      const result = await pool.request().input("userId", userId).query(query);

      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  // Función para verificar permisos de usuario en una base de datos
  async checkDatabasePermission(userId, databaseName, operation) {
    try {
      // Si el usuario es admin, tiene todos los permisos
      const pool = await getPool();
      const userQuery = "SELECT EsAdmin FROM USERS_TABLE WHERE Id = @userId";
      const userResult = await pool
        .request()
        .input("userId", userId)
        .query(userQuery);

      if (userResult.recordset.length === 0) return false;
      if (
        userResult.recordset[0].EsAdmin === true ||
        userResult.recordset[0].EsAdmin === 1
      )
        return true;

      // Verificar permisos específicos de la base de datos
      const permissionQuery =
        "SELECT * FROM USER_DATABASE_PERMISSIONS WHERE UserId = @userId AND DatabaseName = @databaseName";
      const permissionResult = await pool
        .request()
        .input("userId", userId)
        .input("databaseName", databaseName)
        .query(permissionQuery);

      if (permissionResult.recordset.length === 0) return false;

      const permission = permissionResult.recordset[0];

      switch (operation) {
        case "read":
          return permission.CanRead === 1;
        case "write":
          return permission.CanWrite === 1;
        case "delete":
          return permission.CanDelete === 1;
        default:
          return false;
      }
    } catch (error) {
      console.error("Error checking database permission:", error);
      return false;
    }
  }

  // Función para verificar permisos de usuario en una tabla específica
  async checkTablePermission(userId, databaseName, tableName, operation) {
    try {
      // Si el usuario es admin, tiene todos los permisos
      const pool = await getPool();
      const userQuery = "SELECT EsAdmin FROM USERS_TABLE WHERE Id = @userId";
      const userResult = await pool
        .request()
        .input("userId", userId)
        .query(userQuery);

      if (userResult.recordset.length === 0) return false;
      if (
        userResult.recordset[0].EsAdmin === true ||
        userResult.recordset[0].EsAdmin === 1
      )
        return true;

      // Verificar permisos específicos de la tabla
      const permissionQuery =
        "SELECT * FROM USER_TABLE_PERMISSIONS WHERE UserId = @userId AND DatabaseName = @databaseName AND TableName = @tableName";
      const permissionResult = await pool
        .request()
        .input("userId", userId)
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .query(permissionQuery);

      if (permissionResult.recordset.length === 0) {
        // Si no hay permisos específicos de tabla, verificar permisos de base de datos
        return await this.checkDatabasePermission(
          userId,
          databaseName,
          operation
        );
      }

      const permission = permissionResult.recordset[0];

      switch (operation) {
        case "read":
          return permission.CanRead === 1;
        case "write":
          return permission.CanWrite === 1;
        case "delete":
          return permission.CanDelete === 1;
        default:
          return false;
      }
    } catch (error) {
      console.error("Error checking table permission:", error);
      return false;
    }
  }

  // Función para asignar permisos de base de datos a un usuario
  async assignDatabasePermission(userId, databaseName, permissions) {
    try {
      const {
        canRead = true,
        canWrite = false,
        canDelete = false,
      } = permissions;

      const pool = await getPool();
      const query = `
        MERGE USER_DATABASE_PERMISSIONS AS target
        USING (SELECT @userId AS UserId, @databaseName AS DatabaseName) AS source
        ON target.UserId = source.UserId AND target.DatabaseName = source.DatabaseName
        WHEN MATCHED THEN
          UPDATE SET 
            CanRead = @canRead,
            CanWrite = @canWrite,
            CanDelete = @canDelete
        WHEN NOT MATCHED THEN
          INSERT (UserId, DatabaseName, CanRead, CanWrite, CanDelete)
          VALUES (@userId, @databaseName, @canRead, @canWrite, @canDelete);
      `;

      await pool
        .request()
        .input("userId", userId)
        .input("databaseName", databaseName)
        .input("canRead", canRead ? 1 : 0)
        .input("canWrite", canWrite ? 1 : 0)
        .input("canDelete", canDelete ? 1 : 0)
        .query(query);

      return true;
    } catch (error) {
      console.error("Error assigning database permission:", error);
      throw error;
    }
  }

  // Función para asignar permisos de tabla específica a un usuario
  async assignTablePermission(userId, databaseName, tableName, permissions) {
    try {
      const {
        canRead = true,
        canWrite = false,
        canDelete = false,
      } = permissions;

      const pool = await getPool();
      const query = `
        MERGE USER_TABLE_PERMISSIONS AS target
        USING (SELECT @userId AS UserId, @databaseName AS DatabaseName, @tableName AS TableName) AS source
        ON target.UserId = source.UserId AND target.DatabaseName = source.DatabaseName AND target.TableName = source.TableName
        WHEN MATCHED THEN
          UPDATE SET 
            CanRead = @canRead,
            CanWrite = @canWrite,
            CanDelete = @canDelete
        WHEN NOT MATCHED THEN
          INSERT (UserId, DatabaseName, TableName, CanRead, CanWrite, CanDelete)
          VALUES (@userId, @databaseName, @tableName, @canRead, @canWrite, @canDelete);
      `;

      await pool
        .request()
        .input("userId", userId)
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .input("canRead", canRead ? 1 : 0)
        .input("canWrite", canWrite ? 1 : 0)
        .input("canDelete", canDelete ? 1 : 0)
        .query(query);

      return true;
    } catch (error) {
      console.error("Error assigning table permission:", error);
      throw error;
    }
  }

  // Función para obtener permisos de un usuario
  async getUserPermissions(userId) {
    try {
      const pool = await getPool();
      const databasePermissionsQuery = `
        SELECT DatabaseName, CanRead, CanWrite, CanDelete 
        FROM USER_DATABASE_PERMISSIONS 
        WHERE UserId = @userId
      `;
      const databasePermissionsResult = await pool
        .request()
        .input("userId", userId)
        .query(databasePermissionsQuery);

      const tablePermissionsQuery = `
        SELECT DatabaseName, TableName, CanRead, CanWrite, CanDelete 
        FROM USER_TABLE_PERMISSIONS 
        WHERE UserId = @userId
      `;
      const tablePermissionsResult = await pool
        .request()
        .input("userId", userId)
        .query(tablePermissionsQuery);

      return {
        databasePermissions: databasePermissionsResult.recordset.map((p) => ({
          databaseName: p.DatabaseName,
          canRead: p.CanRead === 1,
          canWrite: p.CanWrite === 1,
          canDelete: p.CanDelete === 1,
        })),
        tablePermissions: tablePermissionsResult.recordset.map((p) => ({
          databaseName: p.DatabaseName,
          tableName: p.TableName,
          canRead: p.CanRead === 1,
          canWrite: p.CanWrite === 1,
          canDelete: p.CanDelete === 1,
        })),
      };
    } catch (error) {
      console.error("Error getting user permissions:", error);
      throw error;
    }
  }

  // Función para crear el usuario admin por defecto si no existe
  async createDefaultAdmin() {
    try {
      const pool = await getPool();
      const query = "SELECT * FROM USERS_TABLE WHERE NombreUsuario = @username";
      const result = await pool
        .request()
        .input("username", "admin")
        .query(query);

      if (result.recordset.length === 0) {
        const hashedPassword = await bcrypt.hash("admin", 10);
        const insertQuery =
          "INSERT INTO USERS_TABLE (NombreUsuario, Contrasena, EsAdmin) VALUES (@username, @password, @isAdmin)";
        await pool
          .request()
          .input("username", "admin")
          .input("password", hashedPassword)
          .input("isAdmin", 1)
          .query(insertQuery);
        console.log("Usuario admin creado por defecto");
      }
    } catch (error) {
      console.error("Error creating default admin:", error);
    }
  }
}

module.exports = new AuthService();
