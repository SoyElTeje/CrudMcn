/**
 * Tests para AuthService
 * Verifica funcionalidad de autenticación y gestión de usuarios
 */

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authService = require("../../services/authServiceRefactored");
const { getPool } = require("../../db");

// Mock de dependencias
jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("../../db");

describe("AuthService", () => {
  let mockPool;
  let mockRequest;

  beforeEach(() => {
    // Crear mock del pool de conexión
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn(),
    };

    mockPool = {
      request: jest.fn().mockReturnValue(mockRequest),
    };

    getPool.mockResolvedValue(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("verifyCredentials", () => {
    it("debería retornar usuario si las credenciales son válidas", async () => {
      // Arrange
      const username = "testuser";
      const password = "testpassword";
      const hashedPassword = "hashedpassword";
      
      const mockUser = {
        id: 1,
        username: "testuser",
        password_hash: hashedPassword,
        is_admin: 1,
        created_at: new Date()
      };

      mockRequest.query.mockResolvedValue({
        recordset: [mockUser]
      });

      bcrypt.compare.mockResolvedValue(true);
      jest.spyOn(authService, "determineAdminStatus").mockResolvedValue(true);

      // Act
      const result = await authService.verifyCredentials(username, password);

      // Assert
      expect(result).toEqual({
        id: 1,
        username: "testuser",
        isAdmin: true,
        createdAt: mockUser.created_at
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it("debería retornar null si el usuario no existe", async () => {
      // Arrange
      const username = "nonexistent";
      const password = "testpassword";
      
      mockRequest.query.mockResolvedValue({
        recordset: []
      });

      // Act
      const result = await authService.verifyCredentials(username, password);

      // Assert
      expect(result).toBeNull();
    });

    it("debería retornar null si la contraseña es incorrecta", async () => {
      // Arrange
      const username = "testuser";
      const password = "wrongpassword";
      const hashedPassword = "hashedpassword";
      
      const mockUser = {
        id: 1,
        username: "testuser",
        password_hash: hashedPassword,
        is_admin: 0,
        created_at: new Date()
      };

      mockRequest.query.mockResolvedValue({
        recordset: [mockUser]
      });

      bcrypt.compare.mockResolvedValue(false);

      // Act
      const result = await authService.verifyCredentials(username, password);

      // Assert
      expect(result).toBeNull();
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });
  });

  describe("getUserByUsername", () => {
    it("debería retornar usuario si existe", async () => {
      // Arrange
      const username = "testuser";
      const mockUser = {
        id: 1,
        username: "testuser",
        password_hash: "hashedpassword",
        is_admin: 1
      };

      mockRequest.query.mockResolvedValue({
        recordset: [mockUser]
      });

      // Act
      const result = await authService.getUserByUsername(username);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockRequest.input).toHaveBeenCalledWith("username", username);
    });

    it("debería retornar null si el usuario no existe", async () => {
      // Arrange
      const username = "nonexistent";
      
      mockRequest.query.mockResolvedValue({
        recordset: []
      });

      // Act
      const result = await authService.getUserByUsername(username);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("determineAdminStatus", () => {
    it("debería retornar true si la columna is_admin existe y es 1", async () => {
      // Arrange
      const user = { id: 1, username: "admin", is_admin: 1 };
      
      jest.spyOn(authService, "hasAdminColumn").mockResolvedValue(true);

      // Act
      const result = await authService.determineAdminStatus(user);

      // Assert
      expect(result).toBe(true);
    });

    it("debería retornar false si la columna is_admin existe y es 0", async () => {
      // Arrange
      const user = { id: 1, username: "user", is_admin: 0 };
      
      jest.spyOn(authService, "hasAdminColumn").mockResolvedValue(true);

      // Act
      const result = await authService.determineAdminStatus(user);

      // Assert
      expect(result).toBe(false);
    });

    it("debería usar lógica de fallback si la columna is_admin no existe", async () => {
      // Arrange
      const adminUser = { id: 1, username: "admin", is_admin: undefined };
      const regularUser = { id: 2, username: "user", is_admin: undefined };
      
      jest.spyOn(authService, "hasAdminColumn").mockResolvedValue(false);

      // Act
      const adminResult = await authService.determineAdminStatus(adminUser);
      const userResult = await authService.determineAdminStatus(regularUser);

      // Assert
      expect(adminResult).toBe(true);
      expect(userResult).toBe(false);
    });
  });

  describe("hasAdminColumn", () => {
    it("debería retornar true si la columna is_admin existe", async () => {
      // Arrange
      mockRequest.query.mockResolvedValue({
        recordset: [{ count: 1 }]
      });

      // Act
      const result = await authService.hasAdminColumn();

      // Assert
      expect(result).toBe(true);
    });

    it("debería retornar false si la columna is_admin no existe", async () => {
      // Arrange
      mockRequest.query.mockResolvedValue({
        recordset: [{ count: 0 }]
      });

      // Act
      const result = await authService.hasAdminColumn();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("generateToken", () => {
    it("debería generar un token JWT válido", () => {
      // Arrange
      const user = {
        id: 1,
        username: "testuser",
        isAdmin: true
      };
      
      const mockToken = "mock.jwt.token";
      jwt.sign.mockReturnValue(mockToken);

      // Act
      const result = authService.generateToken(user);

      // Assert
      expect(result).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: 1,
          username: "testuser",
          isAdmin: true
        },
        "test-secret-key",
        { expiresIn: "24h" }
      );
    });
  });

  describe("verifyToken", () => {
    it("debería retornar payload si el token es válido", () => {
      // Arrange
      const token = "valid.jwt.token";
      const mockPayload = {
        id: 1,
        username: "testuser",
        isAdmin: true
      };
      
      jwt.verify.mockReturnValue(mockPayload);

      // Act
      const result = authService.verifyToken(token);

      // Assert
      expect(result).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith(token, "test-secret-key");
    });

    it("debería retornar null si el token es inválido", () => {
      // Arrange
      const token = "invalid.jwt.token";
      
      jwt.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      // Act
      const result = authService.verifyToken(token);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("createUser", () => {
    it("debería crear un nuevo usuario exitosamente", async () => {
      // Arrange
      const username = "newuser";
      const password = "newpassword";
      const isAdmin = false;
      const hashedPassword = "hashedpassword";
      
      bcrypt.hash.mockResolvedValue(hashedPassword);
      
      mockRequest.query.mockResolvedValue({
        recordset: [{ id: 2 }]
      });

      // Act
      const result = await authService.createUser(username, password, isAdmin);

      // Assert
      expect(result).toEqual({
        id: 2,
        username: "newuser",
        isAdmin: false,
        createdAt: expect.any(Date)
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(mockRequest.input).toHaveBeenCalledWith("username", username);
      expect(mockRequest.input).toHaveBeenCalledWith("password", hashedPassword);
      expect(mockRequest.input).toHaveBeenCalledWith("isAdmin", isAdmin);
    });
  });

  describe("updateUserPassword", () => {
    it("debería actualizar la contraseña del usuario", async () => {
      // Arrange
      const userId = 1;
      const newPassword = "newpassword";
      const hashedPassword = "hashedpassword";
      
      bcrypt.hash.mockResolvedValue(hashedPassword);
      mockRequest.query.mockResolvedValue({ recordset: [] });

      // Act
      await authService.updateUserPassword(userId, newPassword);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(mockRequest.input).toHaveBeenCalledWith("userId", userId);
      expect(mockRequest.input).toHaveBeenCalledWith("password", hashedPassword);
    });
  });

  describe("getAllUsers", () => {
    it("debería retornar lista de usuarios", async () => {
      // Arrange
      const mockUsers = [
        { id: 1, username: "user1", isAdmin: 1, createdAt: new Date() },
        { id: 2, username: "user2", isAdmin: 0, createdAt: new Date() }
      ];
      
      mockRequest.query.mockResolvedValue({
        recordset: mockUsers
      });

      // Act
      const result = await authService.getAllUsers();

      // Assert
      expect(result).toEqual(mockUsers);
    });
  });

  describe("deleteUser", () => {
    it("debería eliminar usuario y sus permisos", async () => {
      // Arrange
      const userId = 1;
      
      jest.spyOn(authService, "removeAllUserPermissions").mockResolvedValue();
      mockRequest.query.mockResolvedValue({ recordset: [] });

      // Act
      await authService.deleteUser(userId);

      // Assert
      expect(authService.removeAllUserPermissions).toHaveBeenCalledWith(userId);
      expect(mockRequest.input).toHaveBeenCalledWith("userId", userId);
    });
  });

  describe("createDefaultAdmin", () => {
    it("debería crear admin por defecto si no existe", async () => {
      // Arrange
      jest.spyOn(authService, "getUserByUsername").mockResolvedValue(null);
      jest.spyOn(authService, "createUser").mockResolvedValue({
        id: 1,
        username: "admin",
        isAdmin: true
      });

      // Act
      await authService.createDefaultAdmin();

      // Assert
      expect(authService.getUserByUsername).toHaveBeenCalledWith("admin");
      expect(authService.createUser).toHaveBeenCalledWith("admin", "admin123", true);
    });

    it("no debería crear admin si ya existe", async () => {
      // Arrange
      const existingAdmin = { id: 1, username: "admin", isAdmin: true };
      jest.spyOn(authService, "getUserByUsername").mockResolvedValue(existingAdmin);
      jest.spyOn(authService, "createUser").mockResolvedValue();

      // Act
      await authService.createDefaultAdmin();

      // Assert
      expect(authService.getUserByUsername).toHaveBeenCalledWith("admin");
      expect(authService.createUser).not.toHaveBeenCalled();
    });
  });
});
