/**
 * Tests para middleware de permisos
 * Verifica funcionalidad de verificación de permisos
 */

const { 
  requirePermission,
  requireReadPermission,
  requireWritePermission,
  requireDeletePermission,
  requireCreatePermission,
  requireAllPermissions,
  requireAnyPermission,
  requireDynamicPermission,
  createPermissionResolver,
  PERMISSION_TYPES
} = require("../../middleware/permissions");

const authService = require("../../services/authServiceRefactored");
const { AppError } = require("../../middleware/errorHandler");

describe("Permissions Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: {
        id: 1,
        username: "testuser",
        isAdmin: false
      },
      ip: "127.0.0.1",
      get: jest.fn().mockReturnValue("Mozilla/5.0")
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("requirePermission", () => {
    it("debería permitir acceso a administradores", async () => {
      // Arrange
      req.user.isAdmin = true;
      const middleware = requirePermission("READ", "test_db", "test_table");

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
      expect(authService.hasPermission).not.toHaveBeenCalled();
    });

    it("debería permitir acceso si el usuario tiene permisos", async () => {
      // Arrange
      authService.hasPermission.mockResolvedValue(true);
      const middleware = requirePermission("READ", "test_db", "test_table");

      // Act
      await middleware(req, res, next);

      // Assert
      expect(authService.hasPermission).toHaveBeenCalledWith(1, "test_db", "test_table", "READ");
      expect(next).toHaveBeenCalledWith();
    });

    it("debería denegar acceso si el usuario no tiene permisos", async () => {
      // Arrange
      authService.hasPermission.mockResolvedValue(false);
      const middleware = requirePermission("READ", "test_db", "test_table");

      // Act
      await middleware(req, res, next);

      // Assert
      expect(authService.hasPermission).toHaveBeenCalledWith(1, "test_db", "test_table", "READ");
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it("debería lanzar error para tipo de permiso inválido", async () => {
      // Arrange
      const middleware = requirePermission("INVALID", "test_db", "test_table");

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe("requireReadPermission", () => {
    it("debería crear middleware para permisos de lectura", async () => {
      // Arrange
      authService.hasPermission.mockResolvedValue(true);
      const middleware = requireReadPermission("test_db", "test_table");

      // Act
      await middleware(req, res, next);

      // Assert
      expect(authService.hasPermission).toHaveBeenCalledWith(1, "test_db", "test_table", "READ");
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("requireWritePermission", () => {
    it("debería crear middleware para permisos de escritura", async () => {
      // Arrange
      authService.hasPermission.mockResolvedValue(true);
      const middleware = requireWritePermission("test_db", "test_table");

      // Act
      await middleware(req, res, next);

      // Assert
      expect(authService.hasPermission).toHaveBeenCalledWith(1, "test_db", "test_table", "WRITE");
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("requireDeletePermission", () => {
    it("debería crear middleware para permisos de eliminación", async () => {
      // Arrange
      authService.hasPermission.mockResolvedValue(true);
      const middleware = requireDeletePermission("test_db", "test_table");

      // Act
      await middleware(req, res, next);

      // Assert
      expect(authService.hasPermission).toHaveBeenCalledWith(1, "test_db", "test_table", "DELETE");
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("requireCreatePermission", () => {
    it("debería crear middleware para permisos de creación", async () => {
      // Arrange
      authService.hasPermission.mockResolvedValue(true);
      const middleware = requireCreatePermission("test_db", "test_table");

      // Act
      await middleware(req, res, next);

      // Assert
      expect(authService.hasPermission).toHaveBeenCalledWith(1, "test_db", "test_table", "CREATE");
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("requireAllPermissions", () => {
    it("debería permitir acceso si el usuario tiene todos los permisos", async () => {
      // Arrange
      authService.hasPermission.mockResolvedValue(true);
      const permissions = [
        { type: "READ", databaseName: "test_db", tableName: "test_table" },
        { type: "WRITE", databaseName: "test_db", tableName: "test_table" }
      ];
      const middleware = requireAllPermissions(permissions);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(authService.hasPermission).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenCalledWith();
    });

    it("debería denegar acceso si el usuario no tiene todos los permisos", async () => {
      // Arrange
      authService.hasPermission
        .mockResolvedValueOnce(true)  // READ permission
        .mockResolvedValueOnce(false); // WRITE permission
      
      const permissions = [
        { type: "READ", databaseName: "test_db", tableName: "test_table" },
        { type: "WRITE", databaseName: "test_db", tableName: "test_table" }
      ];
      const middleware = requireAllPermissions(permissions);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(authService.hasPermission).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe("requireAnyPermission", () => {
    it("debería permitir acceso si el usuario tiene al menos un permiso", async () => {
      // Arrange
      authService.hasPermission
        .mockResolvedValueOnce(false) // READ permission
        .mockResolvedValueOnce(true);  // WRITE permission
      
      const permissions = [
        { type: "READ", databaseName: "test_db", tableName: "test_table" },
        { type: "WRITE", databaseName: "test_db", tableName: "test_table" }
      ];
      const middleware = requireAnyPermission(permissions);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(authService.hasPermission).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenCalledWith();
    });

    it("debería denegar acceso si el usuario no tiene ningún permiso", async () => {
      // Arrange
      authService.hasPermission.mockResolvedValue(false);
      
      const permissions = [
        { type: "READ", databaseName: "test_db", tableName: "test_table" },
        { type: "WRITE", databaseName: "test_db", tableName: "test_table" }
      ];
      const middleware = requireAnyPermission(permissions);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(authService.hasPermission).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe("requireDynamicPermission", () => {
    it("debería permitir acceso con permisos dinámicos válidos", async () => {
      // Arrange
      req.params = { databaseName: "test_db", tableName: "test_table" };
      authService.hasPermission.mockResolvedValue(true);
      
      const permissionResolver = (req) => ({
        type: "READ",
        databaseName: req.params.databaseName,
        tableName: req.params.tableName
      });
      
      const middleware = requireDynamicPermission(permissionResolver);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(authService.hasPermission).toHaveBeenCalledWith(1, "test_db", "test_table", "READ");
      expect(next).toHaveBeenCalledWith();
    });

    it("debería denegar acceso con permisos dinámicos inválidos", async () => {
      // Arrange
      req.params = { databaseName: "test_db", tableName: "test_table" };
      authService.hasPermission.mockResolvedValue(false);
      
      const permissionResolver = (req) => ({
        type: "READ",
        databaseName: req.params.databaseName,
        tableName: req.params.tableName
      });
      
      const middleware = requireDynamicPermission(permissionResolver);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(authService.hasPermission).toHaveBeenCalledWith(1, "test_db", "test_table", "READ");
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it("debería lanzar error si el resolver no puede resolver permisos", async () => {
      // Arrange
      req.params = {};
      
      const permissionResolver = (req) => null;
      const middleware = requireDynamicPermission(permissionResolver);

      // Act
      await middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe("createPermissionResolver", () => {
    it("debería crear un resolver de permisos válido", () => {
      // Arrange
      req.params = { databaseName: "test_db", tableName: "test_table" };
      
      const resolver = createPermissionResolver("databaseName", "tableName", "READ");

      // Act
      const result = resolver(req);

      // Assert
      expect(result).toEqual({
        type: "READ",
        databaseName: "test_db",
        tableName: "test_table"
      });
    });

    it("debería crear un resolver de permisos sin tabla", () => {
      // Arrange
      req.params = { databaseName: "test_db" };
      
      const resolver = createPermissionResolver("databaseName", null, "READ");

      // Act
      const result = resolver(req);

      // Assert
      expect(result).toEqual({
        type: "READ",
        databaseName: "test_db",
        tableName: null
      });
    });

    it("debería retornar null si falta el parámetro de BD", () => {
      // Arrange
      req.params = {};
      
      const resolver = createPermissionResolver("databaseName", "tableName", "READ");

      // Act
      const result = resolver(req);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("PERMISSION_TYPES", () => {
    it("debería contener todos los tipos de permisos", () => {
      expect(PERMISSION_TYPES).toEqual({
        READ: "READ",
        WRITE: "WRITE",
        DELETE: "DELETE",
        CREATE: "CREATE"
      });
    });
  });
});
