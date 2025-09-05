/**
 * Tests para PermissionService
 * Verifica funcionalidad de permisos granulares
 */

const permissionService = require("../../services/permissionService");
const { getPool } = require("../../db");

// Mock de la base de datos
jest.mock("../../db");

describe("PermissionService", () => {
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

  describe("hasDatabasePermission", () => {
    it("debería retornar true si el usuario tiene permisos de BD", async () => {
      // Arrange
      const userId = 1;
      const databaseName = "test_db";
      const permissionType = "READ";
      
      mockRequest.query.mockResolvedValue({
        recordset: [{ can_read: true }]
      });

      // Act
      const result = await permissionService.hasDatabasePermission(
        userId,
        databaseName,
        permissionType
      );

      // Assert
      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith("userId", userId);
      expect(mockRequest.input).toHaveBeenCalledWith("databaseName", databaseName);
    });

    it("debería retornar false si el usuario no tiene permisos de BD", async () => {
      // Arrange
      const userId = 1;
      const databaseName = "test_db";
      const permissionType = "READ";
      
      mockRequest.query.mockResolvedValue({
        recordset: []
      });

      // Act
      const result = await permissionService.hasDatabasePermission(
        userId,
        databaseName,
        permissionType
      );

      // Assert
      expect(result).toBe(false);
    });

    it("debería lanzar error para tipo de permiso inválido", async () => {
      // Arrange
      const userId = 1;
      const databaseName = "test_db";
      const permissionType = "INVALID";

      // Act & Assert
      await expect(
        permissionService.hasDatabasePermission(userId, databaseName, permissionType)
      ).rejects.toThrow("Tipo de permiso inválido: INVALID");
    });

    it("debería manejar errores de base de datos", async () => {
      // Arrange
      const userId = 1;
      const databaseName = "test_db";
      const permissionType = "READ";
      
      mockRequest.query.mockRejectedValue(new Error("Database error"));

      // Act
      const result = await permissionService.hasDatabasePermission(
        userId,
        databaseName,
        permissionType
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("hasTablePermission", () => {
    it("debería retornar true si el usuario tiene permisos de tabla", async () => {
      // Arrange
      const userId = 1;
      const databaseName = "test_db";
      const tableName = "test_table";
      const permissionType = "WRITE";
      
      mockRequest.query.mockResolvedValue({
        recordset: [{ can_write: true }]
      });

      // Act
      const result = await permissionService.hasTablePermission(
        userId,
        databaseName,
        tableName,
        permissionType
      );

      // Assert
      expect(result).toBe(true);
      expect(mockRequest.input).toHaveBeenCalledWith("userId", userId);
      expect(mockRequest.input).toHaveBeenCalledWith("databaseName", databaseName);
      expect(mockRequest.input).toHaveBeenCalledWith("tableName", tableName);
    });

    it("debería retornar false si el usuario no tiene permisos de tabla", async () => {
      // Arrange
      const userId = 1;
      const databaseName = "test_db";
      const tableName = "test_table";
      const permissionType = "WRITE";
      
      mockRequest.query.mockResolvedValue({
        recordset: []
      });

      // Act
      const result = await permissionService.hasTablePermission(
        userId,
        databaseName,
        tableName,
        permissionType
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("hasPermission", () => {
    it("debería verificar permisos de tabla primero si se especifica tabla", async () => {
      // Arrange
      const userId = 1;
      const databaseName = "test_db";
      const tableName = "test_table";
      const permissionType = "READ";
      
      // Mock para verificar que se llama hasTablePermission
      const hasTablePermissionSpy = jest.spyOn(permissionService, "hasTablePermission");
      hasTablePermissionSpy.mockResolvedValue(true);

      // Act
      const result = await permissionService.hasPermission(
        userId,
        databaseName,
        tableName,
        permissionType
      );

      // Assert
      expect(result).toBe(true);
      expect(hasTablePermissionSpy).toHaveBeenCalledWith(
        userId,
        databaseName,
        tableName,
        permissionType
      );
    });

    it("debería verificar permisos de BD si no se especifica tabla", async () => {
      // Arrange
      const userId = 1;
      const databaseName = "test_db";
      const permissionType = "READ";
      
      // Mock para verificar que se llama hasDatabasePermission
      const hasDatabasePermissionSpy = jest.spyOn(permissionService, "hasDatabasePermission");
      hasDatabasePermissionSpy.mockResolvedValue(true);

      // Act
      const result = await permissionService.hasPermission(
        userId,
        databaseName,
        null,
        permissionType
      );

      // Assert
      expect(result).toBe(true);
      expect(hasDatabasePermissionSpy).toHaveBeenCalledWith(
        userId,
        databaseName,
        permissionType
      );
    });
  });

  describe("assignDatabasePermission", () => {
    it("debería crear nuevo permiso si no existe", async () => {
      // Arrange
      const userId = 1;
      const databaseName = "test_db";
      const permissions = {
        canRead: true,
        canWrite: false,
        canDelete: false,
        canCreate: true
      };
      
      // Mock para verificar que no existe el permiso
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [] }) // existingQuery
        .mockResolvedValueOnce({ recordset: [] }); // insertQuery

      // Act
      await permissionService.assignDatabasePermission(
        userId,
        databaseName,
        permissions
      );

      // Assert
      expect(mockRequest.input).toHaveBeenCalledWith("userId", userId);
      expect(mockRequest.input).toHaveBeenCalledWith("databaseName", databaseName);
      expect(mockRequest.input).toHaveBeenCalledWith("canRead", true);
      expect(mockRequest.input).toHaveBeenCalledWith("canWrite", false);
      expect(mockRequest.input).toHaveBeenCalledWith("canDelete", false);
      expect(mockRequest.input).toHaveBeenCalledWith("canCreate", true);
    });

    it("debería actualizar permiso existente", async () => {
      // Arrange
      const userId = 1;
      const databaseName = "test_db";
      const permissions = {
        canRead: true,
        canWrite: true,
        canDelete: false,
        canCreate: false
      };
      
      // Mock para verificar que existe el permiso
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ id: 1 }] }) // existingQuery
        .mockResolvedValueOnce({ recordset: [] }); // updateQuery

      // Act
      await permissionService.assignDatabasePermission(
        userId,
        databaseName,
        permissions
      );

      // Assert
      expect(mockRequest.input).toHaveBeenCalledWith("userId", userId);
      expect(mockRequest.input).toHaveBeenCalledWith("databaseName", databaseName);
      expect(mockRequest.input).toHaveBeenCalledWith("canRead", true);
      expect(mockRequest.input).toHaveBeenCalledWith("canWrite", true);
    });
  });

  describe("getUserPermissions", () => {
    it("debería retornar permisos vacíos si la tabla no existe", async () => {
      // Arrange
      const userId = 1;
      
      mockRequest.query.mockResolvedValue({
        recordset: [{ count: 0 }]
      });

      // Act
      const result = await permissionService.getUserPermissions(userId);

      // Assert
      expect(result).toEqual({
        databasePermissions: [],
        tablePermissions: []
      });
    });

    it("debería retornar permisos del usuario", async () => {
      // Arrange
      const userId = 1;
      
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ count: 1 }] }) // tableExistsQuery
        .mockResolvedValueOnce({ recordset: [{ databaseName: "test_db", canRead: true }] }) // databasePermissionsQuery
        .mockResolvedValueOnce({ recordset: [{ databaseName: "test_db", tableName: "test_table", canWrite: true }] }); // tablePermissionsQuery

      // Act
      const result = await permissionService.getUserPermissions(userId);

      // Assert
      expect(result.databasePermissions).toHaveLength(1);
      expect(result.tablePermissions).toHaveLength(1);
      expect(result.databasePermissions[0].databaseName).toBe("test_db");
      expect(result.tablePermissions[0].tableName).toBe("test_table");
    });
  });

  describe("removeDatabasePermission", () => {
    it("debería eliminar permisos de BD del usuario", async () => {
      // Arrange
      const userId = 1;
      const databaseName = "test_db";
      
      mockRequest.query.mockResolvedValue({ recordset: [] });

      // Act
      await permissionService.removeDatabasePermission(userId, databaseName);

      // Assert
      expect(mockRequest.input).toHaveBeenCalledWith("userId", userId);
      expect(mockRequest.input).toHaveBeenCalledWith("databaseName", databaseName);
    });
  });

  describe("removeTablePermission", () => {
    it("debería eliminar permisos de tabla del usuario", async () => {
      // Arrange
      const userId = 1;
      const databaseName = "test_db";
      const tableName = "test_table";
      
      mockRequest.query.mockResolvedValue({ recordset: [] });

      // Act
      await permissionService.removeTablePermission(userId, databaseName, tableName);

      // Assert
      expect(mockRequest.input).toHaveBeenCalledWith("userId", userId);
      expect(mockRequest.input).toHaveBeenCalledWith("databaseName", databaseName);
      expect(mockRequest.input).toHaveBeenCalledWith("tableName", tableName);
    });
  });
});
