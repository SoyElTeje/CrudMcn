/**
 * Tests para middleware de manejo de errores
 * Verifica funcionalidad de manejo global de errores
 */

const { AppError, errorHandler, notFound, catchAsync } = require("../../middleware/errorHandler");

describe("Error Handler Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: "GET",
      url: "/api/test",
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

  describe("AppError", () => {
    it("debería crear error con mensaje y código de estado", () => {
      // Arrange & Act
      const error = new AppError("Test error", 400);

      // Assert
      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(400);
      expect(error.status).toBe("fail");
      expect(error.isOperational).toBe(true);
    });

    it("debería crear error con código de estado 500 por defecto", () => {
      // Arrange & Act
      const error = new AppError("Test error");

      // Assert
      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(500);
      expect(error.status).toBe("error");
    });

    it("debería crear error con código de estado personalizado", () => {
      // Arrange & Act
      const error = new AppError("Not found", 404, "NOT_FOUND");

      // Assert
      expect(error.message).toBe("Not found");
      expect(error.statusCode).toBe(404);
      expect(error.status).toBe("fail");
      expect(error.code).toBe("NOT_FOUND");
    });
  });

  describe("errorHandler", () => {
    it("debería manejar AppError correctamente", () => {
      // Arrange
      const error = new AppError("Test error", 400);

      // Act
      errorHandler(error, req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: "fail",
        message: "Test error",
        code: undefined
      });
    });

    it("debería manejar error de validación Joi", () => {
      // Arrange
      const error = new Error("Validation error");
      error.isJoi = true;
      error.details = [
        { message: "Username is required", path: ["username"] },
        { message: "Password is required", path: ["password"] }
      ];

      // Act
      errorHandler(error, req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: "fail",
        message: "Datos de entrada inválidos",
        errors: [
          { field: "username", message: "Username is required" },
          { field: "password", message: "Password is required" }
        ]
      });
    });

    it("debería manejar error de JWT", () => {
      // Arrange
      const error = new Error("jwt malformed");
      error.name = "JsonWebTokenError";

      // Act
      errorHandler(error, req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: "fail",
        message: "Token inválido"
      });
    });

    it("debería manejar error de JWT expirado", () => {
      // Arrange
      const error = new Error("jwt expired");
      error.name = "TokenExpiredError";

      // Act
      errorHandler(error, req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: "fail",
        message: "Token expirado"
      });
    });

    it("debería manejar error de base de datos", () => {
      // Arrange
      const error = new Error("Database connection failed");
      error.code = "ECONNREFUSED";

      // Act
      errorHandler(error, req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Error de conexión a la base de datos"
      });
    });

    it("debería manejar error de archivo", () => {
      // Arrange
      const error = new Error("File not found");
      error.code = "ENOENT";

      // Act
      errorHandler(error, req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Error de archivo"
      });
    });

    it("debería manejar error genérico", () => {
      // Arrange
      const error = new Error("Generic error");

      // Act
      errorHandler(error, req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor"
      });
    });

    it("debería incluir stack trace en desarrollo", () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      
      const error = new Error("Test error");

      // Act
      errorHandler(error, req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Error interno del servidor",
        stack: error.stack
      });

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("notFound", () => {
    it("debería crear error 404 para rutas no encontradas", () => {
      // Act
      notFound(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Ruta no encontrada");
    });
  });

  describe("catchAsync", () => {
    it("debería ejecutar función async correctamente", async () => {
      // Arrange
      const asyncFn = jest.fn().mockResolvedValue("success");
      const wrappedFn = catchAsync(asyncFn);

      // Act
      await wrappedFn(req, res, next);

      // Assert
      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    it("debería capturar error de función async", async () => {
      // Arrange
      const error = new Error("Async error");
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = catchAsync(asyncFn);

      // Act
      await wrappedFn(req, res, next);

      // Assert
      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });

    it("debería manejar error de función async con AppError", async () => {
      // Arrange
      const error = new AppError("App error", 400);
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = catchAsync(asyncFn);

      // Act
      await wrappedFn(req, res, next);

      // Assert
      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
