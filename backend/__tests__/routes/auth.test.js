/**
 * Tests para rutas de autenticación
 * Verifica funcionalidad de endpoints de auth
 */

const request = require("supertest");
const express = require("express");
const authRoutes = require("../../routes/auth");
const authService = require("../../services/authServiceRefactored");
const { AppError } = require("../../middleware/errorHandler");

// Mock de dependencias
jest.mock("../../services/authServiceRefactored");
jest.mock("../../middleware/errorHandler");

describe("Auth Routes", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/auth", authRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/login", () => {
    it("debería hacer login exitoso", async () => {
      // Arrange
      const loginData = {
        username: "testuser",
        password: "testpassword123"
      };

      const mockUser = {
        id: 1,
        username: "testuser",
        isAdmin: false
      };

      const mockToken = "mock.jwt.token";

      authService.verifyCredentials.mockResolvedValue(mockUser);
      authService.generateToken.mockReturnValue(mockToken);

      // Act
      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Login exitoso",
        token: mockToken,
        user: {
          id: 1,
          username: "testuser",
          isAdmin: false
        }
      });
      expect(authService.verifyCredentials).toHaveBeenCalledWith("testuser", "testpassword123");
      expect(authService.generateToken).toHaveBeenCalledWith(mockUser);
    });

    it("debería fallar login con credenciales incorrectas", async () => {
      // Arrange
      const loginData = {
        username: "testuser",
        password: "wrongpassword"
      };

      authService.verifyCredentials.mockResolvedValue(null);

      // Act
      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: "Credenciales inválidas"
      });
    });

    it("debería fallar login con datos inválidos", async () => {
      // Arrange
      const loginData = {
        username: "", // Username vacío
        password: "123" // Password muy corto
      };

      // Act
      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Datos de entrada inválidos");
    });

    it("debería manejar error interno del servidor", async () => {
      // Arrange
      const loginData = {
        username: "testuser",
        password: "testpassword123"
      };

      authService.verifyCredentials.mockRejectedValue(new Error("Database error"));

      // Act
      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.message).toContain("Error interno del servidor");
    });
  });

  describe("GET /api/auth/users", () => {
    it("debería listar usuarios exitosamente", async () => {
      // Arrange
      const mockUsers = [
        { id: 1, username: "user1", isAdmin: true },
        { id: 2, username: "user2", isAdmin: false }
      ];

      authService.getAllUsers.mockResolvedValue(mockUsers);

      // Act
      const response = await request(app)
        .get("/api/auth/users");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        users: mockUsers
      });
      expect(authService.getAllUsers).toHaveBeenCalled();
    });

    it("debería manejar error al listar usuarios", async () => {
      // Arrange
      authService.getAllUsers.mockRejectedValue(new Error("Database error"));

      // Act
      const response = await request(app)
        .get("/api/auth/users");

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.message).toContain("Error interno del servidor");
    });
  });

  describe("POST /api/auth/users", () => {
    it("debería crear usuario exitosamente", async () => {
      // Arrange
      const userData = {
        username: "newuser",
        password: "newpassword123",
        isAdmin: false
      };

      const mockUser = {
        id: 3,
        username: "newuser",
        isAdmin: false,
        createdAt: new Date()
      };

      authService.createUser.mockResolvedValue(mockUser);

      // Act
      const response = await request(app)
        .post("/api/auth/users")
        .send(userData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        message: "Usuario creado exitosamente",
        user: mockUser
      });
      expect(authService.createUser).toHaveBeenCalledWith("newuser", "newpassword123", false);
    });

    it("debería fallar creación con datos inválidos", async () => {
      // Arrange
      const userData = {
        username: "", // Username vacío
        password: "123", // Password muy corto
        isAdmin: false
      };

      // Act
      const response = await request(app)
        .post("/api/auth/users")
        .send(userData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Datos de entrada inválidos");
    });

    it("debería manejar error al crear usuario", async () => {
      // Arrange
      const userData = {
        username: "newuser",
        password: "newpassword123",
        isAdmin: false
      };

      authService.createUser.mockRejectedValue(new Error("Database error"));

      // Act
      const response = await request(app)
        .post("/api/auth/users")
        .send(userData);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.message).toContain("Error interno del servidor");
    });
  });

  describe("PUT /api/auth/users/:userId/password", () => {
    it("debería actualizar contraseña exitosamente", async () => {
      // Arrange
      const userId = "1";
      const passwordData = {
        newPassword: "newpassword123"
      };

      authService.updateUserPassword.mockResolvedValue();

      // Act
      const response = await request(app)
        .put(`/api/auth/users/${userId}/password`)
        .send(passwordData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Contraseña actualizada exitosamente"
      });
      expect(authService.updateUserPassword).toHaveBeenCalledWith(1, "newpassword123");
    });

    it("debería fallar actualización con datos inválidos", async () => {
      // Arrange
      const userId = "1";
      const passwordData = {
        newPassword: "123" // Password muy corto
      };

      // Act
      const response = await request(app)
        .put(`/api/auth/users/${userId}/password`)
        .send(passwordData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Datos de entrada inválidos");
    });

    it("debería fallar actualización con ID inválido", async () => {
      // Arrange
      const userId = "abc"; // ID no numérico
      const passwordData = {
        newPassword: "newpassword123"
      };

      // Act
      const response = await request(app)
        .put(`/api/auth/users/${userId}/password`)
        .send(passwordData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Datos de entrada inválidos");
    });
  });

  describe("POST /api/auth/users/:userId/database-permissions", () => {
    it("debería asignar permisos de BD exitosamente", async () => {
      // Arrange
      const userId = "1";
      const permissionData = {
        databaseName: "test_database",
        permissions: {
          canRead: true,
          canWrite: false,
          canDelete: false,
          canCreate: true
        }
      };

      authService.assignDatabasePermission.mockResolvedValue();

      // Act
      const response = await request(app)
        .post(`/api/auth/users/${userId}/database-permissions`)
        .send(permissionData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Permisos de base de datos asignados exitosamente"
      });
      expect(authService.assignDatabasePermission).toHaveBeenCalledWith(
        1,
        "test_database",
        permissionData.permissions
      );
    });

    it("debería fallar asignación con datos inválidos", async () => {
      // Arrange
      const userId = "1";
      const permissionData = {
        databaseName: "test-database!", // Nombre inválido
        permissions: {
          canRead: true,
          canWrite: false,
          canDelete: false,
          canCreate: true
        }
      };

      // Act
      const response = await request(app)
        .post(`/api/auth/users/${userId}/database-permissions`)
        .send(permissionData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Datos de entrada inválidos");
    });
  });

  describe("POST /api/auth/users/:userId/table-permissions", () => {
    it("debería asignar permisos de tabla exitosamente", async () => {
      // Arrange
      const userId = "1";
      const permissionData = {
        databaseName: "test_database",
        tableName: "test_table",
        permissions: {
          canRead: true,
          canWrite: true,
          canDelete: false,
          canCreate: false
        }
      };

      authService.assignTablePermission.mockResolvedValue();

      // Act
      const response = await request(app)
        .post(`/api/auth/users/${userId}/table-permissions`)
        .send(permissionData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Permisos de tabla asignados exitosamente"
      });
      expect(authService.assignTablePermission).toHaveBeenCalledWith(
        1,
        "test_database",
        "test_table",
        permissionData.permissions
      );
    });

    it("debería fallar asignación con datos inválidos", async () => {
      // Arrange
      const userId = "1";
      const permissionData = {
        databaseName: "test_database",
        tableName: "test-table!", // Nombre inválido
        permissions: {
          canRead: true,
          canWrite: true,
          canDelete: false,
          canCreate: false
        }
      };

      // Act
      const response = await request(app)
        .post(`/api/auth/users/${userId}/table-permissions`)
        .send(permissionData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Datos de entrada inválidos");
    });
  });
});
