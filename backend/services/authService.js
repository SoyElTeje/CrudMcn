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

      // Verificar si la columna EsAdmin existe
      const checkColumnQuery = `
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'USERS_TABLE' 
        AND COLUMN_NAME = 'EsAdmin'
      `;
      const columnResult = await pool.request().query(checkColumnQuery);

      let isAdmin = false;
      if (columnResult.recordset[0].count === 0) {
        // Si la columna no existe, usar la lógica anterior
        isAdmin = user.NombreUsuario === "admin";
      } else {
        // Si la columna existe, usar la nueva lógica
        // En SQL Server, BIT se puede almacenar como 1/0 o true/false
        isAdmin = user.EsAdmin === 1 || user.EsAdmin === true;
      }

      return {
        id: user.Id,
        username: user.NombreUsuario,
        isAdmin: isAdmin,
        createdAt: null, // No tenemos esta columna
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
        "INSERT INTO USERS_TABLE (NombreUsuario, Contrasena, EsAdmin, FechaCreacion) VALUES (@username, @password, @isAdmin, GETDATE()); SELECT SCOPE_IDENTITY() AS id;";
      const result = await pool
        .request()
        .input("username", username)
        .input("password", hashedPassword)
        .input("isAdmin", isAdmin)
        .query(query);

      return {
        id: result.recordset[0].id,
        username,
        isAdmin: isAdmin,
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

      // Verificar si la columna EsAdmin existe
      const checkColumnQuery = `
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'USERS_TABLE' 
        AND COLUMN_NAME = 'EsAdmin'
      `;
      const columnResult = await pool.request().query(checkColumnQuery);

      if (columnResult.recordset[0].count === 0) {
        // Si la columna no existe, usar la lógica anterior
        const query =
          "SELECT Id, NombreUsuario, FechaCreacion FROM USERS_TABLE ORDER BY Id DESC";
        const result = await pool.request().query(query);

        return result.recordset.map((user) => ({
          id: user.Id,
          username: user.NombreUsuario,
          isAdmin: user.NombreUsuario === "admin", // Por ahora, solo el usuario 'admin' es administrador
          createdAt: user.FechaCreacion,
          updatedAt: null, // No tenemos esta columna
        }));
      } else {
        // Si la columna existe, usar la nueva lógica
        const query =
          "SELECT Id, NombreUsuario, EsAdmin, FechaCreacion FROM USERS_TABLE ORDER BY Id DESC";
        const result = await pool.request().query(query);

        return result.recordset.map((user) => ({
          id: user.Id,
          username: user.NombreUsuario,
          isAdmin: user.EsAdmin === 1 || user.EsAdmin === true,
          createdAt: user.FechaCreacion,
          updatedAt: null, // No tenemos esta columna
        }));
      }
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

      // Verificar si la columna EsAdmin existe
      const checkColumnQuery = `
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'USERS_TABLE' 
        AND COLUMN_NAME = 'EsAdmin'
      `;
      const columnResult = await pool.request().query(checkColumnQuery);

      if (columnResult.recordset[0].count === 0) {
        // Si la columna no existe, usar la lógica anterior
        const userQuery =
          "SELECT NombreUsuario FROM USERS_TABLE WHERE Id = @userId";
        const userResult = await pool
          .request()
          .input("userId", userId)
          .query(userQuery);

        if (userResult.recordset.length === 0) {
          throw new Error("Usuario no encontrado");
        }

        const username = userResult.recordset[0].NombreUsuario;

        // Solo permitir que el usuario 'admin' sea administrador
        if (isAdmin && username !== "admin") {
          throw new Error(
            "Por ahora, solo el usuario 'admin' puede ser administrador. Ejecute el script add_admin_column.sql para habilitar esta funcionalidad."
          );
        }

        // No permitir quitar admin al usuario 'admin'
        if (!isAdmin && username === "admin") {
          throw new Error(
            "No se puede quitar los permisos de administrador al usuario 'admin'"
          );
        }

        return true;
      } else {
        // Si la columna existe, actualizar el estado de administrador
        const updateQuery =
          "UPDATE USERS_TABLE SET EsAdmin = @isAdmin WHERE Id = @userId";
        const result = await pool
          .request()
          .input("isAdmin", isAdmin ? 1 : 0)
          .input("userId", userId)
          .query(updateQuery);

        if (result.rowsAffected[0] === 0) {
          throw new Error("Usuario no encontrado");
        }

        return true;
      }
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
      // Verificar si el usuario es admin
      const pool = await getPool();

      // Verificar si la columna EsAdmin existe
      const checkColumnQuery = `
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'USERS_TABLE' 
        AND COLUMN_NAME = 'EsAdmin'
      `;
      const columnResult = await pool.request().query(checkColumnQuery);

      let isAdmin = false;
      if (columnResult.recordset[0].count === 0) {
        // Si la columna no existe, usar la lógica anterior
        const userQuery =
          "SELECT NombreUsuario FROM USERS_TABLE WHERE Id = @userId";
        const userResult = await pool
          .request()
          .input("userId", userId)
          .query(userQuery);

        if (userResult.recordset.length === 0) return false;
        isAdmin = userResult.recordset[0].NombreUsuario === "admin";
      } else {
        // Si la columna existe, usar la nueva lógica
        const userQuery = "SELECT EsAdmin FROM USERS_TABLE WHERE Id = @userId";
        const userResult = await pool
          .request()
          .input("userId", userId)
          .query(userQuery);

        if (userResult.recordset.length === 0) return false;
        isAdmin =
          userResult.recordset[0].EsAdmin === 1 ||
          userResult.recordset[0].EsAdmin === true;
      }

      // Si el usuario es admin, tiene todos los permisos
      if (isAdmin) return true;

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
          return permission.CanRead === 1 || permission.CanRead === true;
        case "write":
          return permission.CanWrite === 1 || permission.CanWrite === true;
        case "delete":
          return permission.CanDelete === 1 || permission.CanDelete === true;
        default:
          return false;
      }
    } catch (error) {
      console.error("Error checking database permission:", error);
      return false;
    }
  }

  // Función para verificar si un usuario puede listar tablas de una base de datos
  async canListTables(userId, databaseName) {
    try {
      // Verificar si el usuario es admin
      const pool = await getPool();

      // Verificar si la columna EsAdmin existe
      const checkColumnQuery = `
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'USERS_TABLE' 
        AND COLUMN_NAME = 'EsAdmin'
      `;
      const columnResult = await pool.request().query(checkColumnQuery);

      let isAdmin = false;
      if (columnResult.recordset[0].count === 0) {
        // Si la columna no existe, usar la lógica anterior
        const userQuery =
          "SELECT NombreUsuario FROM USERS_TABLE WHERE Id = @userId";
        const userResult = await pool
          .request()
          .input("userId", userId)
          .query(userQuery);

        if (userResult.recordset.length === 0) return false;
        isAdmin = userResult.recordset[0].NombreUsuario === "admin";
      } else {
        // Si la columna existe, usar la nueva lógica
        const userQuery = "SELECT EsAdmin FROM USERS_TABLE WHERE Id = @userId";
        const userResult = await pool
          .request()
          .input("userId", userId)
          .query(userQuery);

        if (userResult.recordset.length === 0) return false;
        isAdmin =
          userResult.recordset[0].EsAdmin === 1 ||
          userResult.recordset[0].EsAdmin === true;
      }

      // Si el usuario es admin, puede listar todas las tablas
      if (isAdmin) return true;

      // Verificar si tiene permisos de base de datos
      const hasDatabasePermission = await this.checkDatabasePermission(
        userId,
        databaseName,
        "read"
      );
      if (hasDatabasePermission) return true;

      // Verificar si tiene permisos en al menos una tabla de la base de datos
      const tablePermissionsQuery =
        "SELECT COUNT(*) as count FROM USER_TABLE_PERMISSIONS WHERE UserId = @userId AND DatabaseName = @databaseName";
      const tablePermissionsResult = await pool
        .request()
        .input("userId", userId)
        .input("databaseName", databaseName)
        .query(tablePermissionsQuery);

      return tablePermissionsResult.recordset[0].count > 0;
    } catch (error) {
      console.error("Error checking table listing permission:", error);
      return false;
    }
  }

  // Función para verificar permisos de usuario en una tabla específica
  async checkTablePermission(userId, databaseName, tableName, operation) {
    try {
      // Verificar si el usuario es admin
      const pool = await getPool();

      // Verificar si la columna EsAdmin existe
      const checkColumnQuery = `
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'USERS_TABLE' 
        AND COLUMN_NAME = 'EsAdmin'
      `;
      const columnResult = await pool.request().query(checkColumnQuery);

      let isAdmin = false;
      if (columnResult.recordset[0].count === 0) {
        // Si la columna no existe, usar la lógica anterior
        const userQuery =
          "SELECT NombreUsuario FROM USERS_TABLE WHERE Id = @userId";
        const userResult = await pool
          .request()
          .input("userId", userId)
          .query(userQuery);

        if (userResult.recordset.length === 0) return false;
        isAdmin = userResult.recordset[0].NombreUsuario === "admin";
      } else {
        // Si la columna existe, usar la nueva lógica
        const userQuery = "SELECT EsAdmin FROM USERS_TABLE WHERE Id = @userId";
        const userResult = await pool
          .request()
          .input("userId", userId)
          .query(userQuery);

        if (userResult.recordset.length === 0) return false;
        isAdmin =
          userResult.recordset[0].EsAdmin === 1 ||
          userResult.recordset[0].EsAdmin === true;
      }

      // Si el usuario es admin, tiene todos los permisos
      if (isAdmin) return true;

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
          return permission.CanRead === 1 || permission.CanRead === true;
        case "write":
          return permission.CanWrite === 1 || permission.CanWrite === true;
        case "delete":
          return permission.CanDelete === 1 || permission.CanDelete === true;
        default:
          return false;
      }
    } catch (error) {
      console.error("Error checking table permission:", error);
      return false;
    }
  }

  // Función para crear usuario de SQL Server con permisos granulares
  async createSQLServerUser(userId, databaseName, tableName, permissions) {
    try {
      const pool = await getPool();

      // Obtener información del usuario
      const userQuery =
        "SELECT NombreUsuario FROM USERS_TABLE WHERE Id = @userId";
      const userResult = await pool
        .request()
        .input("userId", userId)
        .query(userQuery);

      if (userResult.recordset.length === 0) {
        throw new Error("Usuario no encontrado");
      }

      const username = userResult.recordset[0].NombreUsuario;
      const sqlUsername = `user_${userId}_${databaseName.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}`;

      // Crear usuario de SQL Server si no existe
      const createUserQuery = `
        IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = @sqlUsername)
        BEGIN
          CREATE USER [${sqlUsername}] WITHOUT LOGIN;
        END
      `;

      await pool
        .request()
        .input("sqlUsername", sqlUsername)
        .query(createUserQuery);

      // Conectar a la base de datos específica para asignar permisos
      const targetPool = await getPool(databaseName);

      // Crear usuario en la base de datos específica
      const createUserInDbQuery = `
        IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = @sqlUsername)
        BEGIN
          CREATE USER [${sqlUsername}] WITHOUT LOGIN;
        END
      `;

      await targetPool
        .request()
        .input("sqlUsername", sqlUsername)
        .query(createUserInDbQuery);

      // Asignar permisos específicos a la tabla
      const permissionsList = [];
      if (permissions.canRead) {
        permissionsList.push("SELECT");
      }
      if (permissions.canWrite) {
        permissionsList.push("UPDATE");
      }
      if (permissions.canDelete) {
        permissionsList.push("DELETE");
      }
      if (permissions.canCreate) {
        permissionsList.push("INSERT");
      }

      if (permissionsList.length > 0) {
        const grantQuery = `
          GRANT ${permissionsList.join(
            ", "
          )} ON [${tableName}] TO [${sqlUsername}]
        `;

        await targetPool.request().query(grantQuery);
      }

      // Denegar permisos a otras tablas de la misma base de datos
      const denyOtherTablesQuery = `
        DECLARE @sql NVARCHAR(MAX) = '';
        SELECT @sql = @sql + 'DENY SELECT, INSERT, UPDATE, DELETE ON [' + TABLE_NAME + '] TO [${sqlUsername}];' + CHAR(13)
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE' 
        AND TABLE_NAME != @tableName;
        
        IF @sql != ''
        BEGIN
          EXEC sp_executesql @sql;
        END
      `;

      await targetPool
        .request()
        .input("tableName", tableName)
        .query(denyOtherTablesQuery);

      return true;
    } catch (error) {
      console.error("Error creating SQL Server user:", error);
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
        canCreate = false,
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
            CanDelete = @canDelete,
            CanCreate = @canCreate
        WHEN NOT MATCHED THEN
          INSERT (UserId, DatabaseName, TableName, CanRead, CanWrite, CanDelete, CanCreate)
          VALUES (@userId, @databaseName, @tableName, @canRead, @canWrite, @canDelete, @canCreate);
      `;

      await pool
        .request()
        .input("userId", userId)
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .input("canRead", canRead ? 1 : 0)
        .input("canWrite", canWrite ? 1 : 0)
        .input("canDelete", canDelete ? 1 : 0)
        .input("canCreate", canCreate ? 1 : 0)
        .query(query);

      // Crear usuario de SQL Server con permisos granulares
      await this.createSQLServerUser(
        userId,
        databaseName,
        tableName,
        permissions
      );

      return true;
    } catch (error) {
      console.error("Error assigning table permission:", error);
      throw error;
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

  // Función para eliminar permisos de base de datos de un usuario
  async removeDatabasePermission(userId, databaseName) {
    try {
      const pool = await getPool();
      const query = `
        DELETE FROM USER_DATABASE_PERMISSIONS 
        WHERE UserId = @userId AND DatabaseName = @databaseName
      `;

      await pool
        .request()
        .input("userId", userId)
        .input("databaseName", databaseName)
        .query(query);

      return true;
    } catch (error) {
      console.error("Error removing database permission:", error);
      throw error;
    }
  }

  // Función para eliminar permisos de tabla específica de un usuario
  async removeTablePermission(userId, databaseName, tableName) {
    try {
      const pool = await getPool();
      const query = `
        DELETE FROM USER_TABLE_PERMISSIONS 
        WHERE UserId = @userId AND DatabaseName = @databaseName AND TableName = @tableName
      `;

      await pool
        .request()
        .input("userId", userId)
        .input("databaseName", databaseName)
        .input("tableName", tableName)
        .query(query);

      // También eliminar el usuario de SQL Server si existe
      try {
        const sqlUserName = `user_${userId}_${databaseName}_${tableName}`;
        const dbPool = await getPool(databaseName);

        // Revocar permisos del usuario en la tabla específica
        await dbPool.request().query(`
          REVOKE ALL PRIVILEGES ON ${tableName} FROM [${sqlUserName}]
        `);

        // Eliminar el usuario de SQL Server
        await dbPool.request().query(`
          DROP USER [${sqlUserName}]
        `);
      } catch (sqlError) {
        console.warn(
          "Warning: Could not remove SQL Server user:",
          sqlError.message
        );
        // No lanzar error aquí ya que el permiso ya se eliminó de la tabla de control
      }

      return true;
    } catch (error) {
      console.error("Error removing table permission:", error);
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
        SELECT DatabaseName, TableName, CanRead, CanWrite, CanDelete, CanCreate
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
          canRead: p.CanRead === 1 || p.CanRead === true,
          canWrite: p.CanWrite === 1 || p.CanWrite === true,
          canDelete: p.CanDelete === 1 || p.CanDelete === true,
        })),
        tablePermissions: tablePermissionsResult.recordset.map((p) => ({
          databaseName: p.DatabaseName,
          tableName: p.TableName,
          canRead: p.CanRead === 1 || p.CanRead === true,
          canWrite: p.CanWrite === 1 || p.CanWrite === true,
          canDelete: p.CanDelete === 1 || p.CanDelete === true,
          canCreate: p.CanCreate === 1 || p.CanCreate === true,
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
          "INSERT INTO USERS_TABLE (NombreUsuario, Contrasena, EsAdmin) VALUES (@username, @password, 1)";
        await pool
          .request()
          .input("username", "admin")
          .input("password", hashedPassword)
          .query(insertQuery);
        console.log("Usuario admin creado por defecto");
      }
    } catch (error) {
      console.error("Error creating default admin:", error);
    }
  }
}

module.exports = new AuthService();
