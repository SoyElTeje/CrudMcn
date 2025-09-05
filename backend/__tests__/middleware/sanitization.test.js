/**
 * Tests para middleware de sanitización
 * Verifica funcionalidad de limpieza de datos de entrada
 */

const { 
  sanitizeString,
  sanitizeObject,
  sanitizeInput,
  sanitizeDatabaseName,
  sanitizeColumnName,
  sanitizeDataValue,
  sanitizeDatabaseData
} = require("../../middleware/sanitization");

describe("Sanitization Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {}
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

  describe("sanitizeString", () => {
    it("debería limpiar string con caracteres peligrosos", () => {
      // Arrange
      const input = "<script>alert('xss')</script>Hello World!";
      
      // Act
      const result = sanitizeString(input);
      
      // Assert
      expect(result).toBe("Hello World!");
    });

    it("debería limpiar string con caracteres SQL injection", () => {
      // Arrange
      const input = "'; DROP TABLE users; --";
      
      // Act
      const result = sanitizeString(input);
      
      // Assert
      expect(result).toBe(" DROP TABLE users ");
    });

    it("debería mantener string limpio sin cambios", () => {
      // Arrange
      const input = "Hello World 123";
      
      // Act
      const result = sanitizeString(input);
      
      // Assert
      expect(result).toBe("Hello World 123");
    });

    it("debería manejar string vacío", () => {
      // Arrange
      const input = "";
      
      // Act
      const result = sanitizeString(input);
      
      // Assert
      expect(result).toBe("");
    });

    it("debería manejar string null", () => {
      // Arrange
      const input = null;
      
      // Act
      const result = sanitizeString(input);
      
      // Assert
      expect(result).toBe("");
    });
  });

  describe("sanitizeObject", () => {
    it("debería sanitizar objeto con strings", () => {
      // Arrange
      const input = {
        name: "<script>alert('xss')</script>John",
        email: "john@example.com",
        age: 25
      };
      
      // Act
      const result = sanitizeObject(input);
      
      // Assert
      expect(result).toEqual({
        name: "John",
        email: "john@example.com",
        age: 25
      });
    });

    it("debería sanitizar objeto anidado", () => {
      // Arrange
      const input = {
        user: {
          name: "<script>alert('xss')</script>John",
          profile: {
            bio: "'; DROP TABLE users; --"
          }
        }
      };
      
      // Act
      const result = sanitizeObject(input);
      
      // Assert
      expect(result).toEqual({
        user: {
          name: "John",
          profile: {
            bio: " DROP TABLE users "
          }
        }
      });
    });

    it("debería sanitizar array de strings", () => {
      // Arrange
      const input = {
        tags: ["<script>alert('xss')</script>tag1", "tag2", "'; DROP TABLE users; --"]
      };
      
      // Act
      const result = sanitizeObject(input);
      
      // Assert
      expect(result).toEqual({
        tags: ["tag1", "tag2", " DROP TABLE users "]
      });
    });

    it("debería manejar objeto vacío", () => {
      // Arrange
      const input = {};
      
      // Act
      const result = sanitizeObject(input);
      
      // Assert
      expect(result).toEqual({});
    });

    it("debería manejar objeto null", () => {
      // Arrange
      const input = null;
      
      // Act
      const result = sanitizeObject(input);
      
      // Assert
      expect(result).toBeNull();
    });
  });

  describe("sanitizeInput", () => {
    it("debería sanitizar body del request", () => {
      // Arrange
      req.body = {
        username: "<script>alert('xss')</script>user",
        password: "password123"
      };

      const middleware = sanitizeInput("body");

      // Act
      middleware(req, res, next);

      // Assert
      expect(req.body).toEqual({
        username: "user",
        password: "password123"
      });
      expect(next).toHaveBeenCalledWith();
    });

    it("debería sanitizar query del request", () => {
      // Arrange
      req.query = {
        search: "<script>alert('xss')</script>test",
        page: "1"
      };

      const middleware = sanitizeInput("query");

      // Act
      middleware(req, res, next);

      // Assert
      expect(req.query).toEqual({
        search: "test",
        page: "1"
      });
      expect(next).toHaveBeenCalledWith();
    });

    it("debería sanitizar params del request", () => {
      // Arrange
      req.params = {
        id: "<script>alert('xss')</script>123",
        name: "test"
      };

      const middleware = sanitizeInput("params");

      // Act
      middleware(req, res, next);

      // Assert
      expect(req.params).toEqual({
        id: "123",
        name: "test"
      });
      expect(next).toHaveBeenCalledWith();
    });

    it("debería manejar request sin el campo especificado", () => {
      // Arrange
      req.body = {};

      const middleware = sanitizeInput("query");

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("sanitizeDatabaseName", () => {
    it("debería sanitizar nombre de BD válido", () => {
      // Arrange
      const input = "test_database";
      
      // Act
      const result = sanitizeDatabaseName(input);
      
      // Assert
      expect(result).toBe("test_database");
    });

    it("debería sanitizar nombre de BD con caracteres especiales", () => {
      // Arrange
      const input = "test-database!@#";
      
      // Act
      const result = sanitizeDatabaseName(input);
      
      // Assert
      expect(result).toBe("test-database");
    });

    it("debería sanitizar nombre de BD con espacios", () => {
      // Arrange
      const input = "test database";
      
      // Act
      const result = sanitizeDatabaseName(input);
      
      // Assert
      expect(result).toBe("test_database");
    });

    it("debería manejar nombre de BD vacío", () => {
      // Arrange
      const input = "";
      
      // Act
      const result = sanitizeDatabaseName(input);
      
      // Assert
      expect(result).toBe("");
    });
  });

  describe("sanitizeColumnName", () => {
    it("debería sanitizar nombre de columna válido", () => {
      // Arrange
      const input = "user_name";
      
      // Act
      const result = sanitizeColumnName(input);
      
      // Assert
      expect(result).toBe("user_name");
    });

    it("debería sanitizar nombre de columna con caracteres especiales", () => {
      // Arrange
      const input = "user-name!@#";
      
      // Act
      const result = sanitizeColumnName(input);
      
      // Assert
      expect(result).toBe("user-name");
    });

    it("debería sanitizar nombre de columna con espacios", () => {
      // Arrange
      const input = "user name";
      
      // Act
      const result = sanitizeColumnName(input);
      
      // Assert
      expect(result).toBe("user_name");
    });
  });

  describe("sanitizeDataValue", () => {
    it("debería sanitizar valor de string", () => {
      // Arrange
      const input = "<script>alert('xss')</script>Hello";
      
      // Act
      const result = sanitizeDataValue(input);
      
      // Assert
      expect(result).toBe("Hello");
    });

    it("debería mantener valor numérico", () => {
      // Arrange
      const input = 123;
      
      // Act
      const result = sanitizeDataValue(input);
      
      // Assert
      expect(result).toBe(123);
    });

    it("debería mantener valor booleano", () => {
      // Arrange
      const input = true;
      
      // Act
      const result = sanitizeDataValue(input);
      
      // Assert
      expect(result).toBe(true);
    });

    it("debería mantener valor null", () => {
      // Arrange
      const input = null;
      
      // Act
      const result = sanitizeDataValue(input);
      
      // Assert
      expect(result).toBeNull();
    });

    it("debería sanitizar array de valores", () => {
      // Arrange
      const input = ["<script>alert('xss')</script>test", 123, true];
      
      // Act
      const result = sanitizeDataValue(input);
      
      // Assert
      expect(result).toEqual(["test", 123, true]);
    });
  });

  describe("sanitizeDatabaseData", () => {
    it("debería sanitizar datos de BD", () => {
      // Arrange
      const input = {
        name: "<script>alert('xss')</script>John",
        email: "john@example.com",
        age: 25,
        tags: ["<script>alert('xss')</script>tag1", "tag2"]
      };
      
      // Act
      const result = sanitizeDatabaseData(input);
      
      // Assert
      expect(result).toEqual({
        name: "John",
        email: "john@example.com",
        age: 25,
        tags: ["tag1", "tag2"]
      });
    });

    it("debería sanitizar datos de BD con objetos anidados", () => {
      // Arrange
      const input = {
        user: {
          name: "<script>alert('xss')</script>John",
          profile: {
            bio: "'; DROP TABLE users; --"
          }
        }
      };
      
      // Act
      const result = sanitizeDatabaseData(input);
      
      // Assert
      expect(result).toEqual({
        user: {
          name: "John",
          profile: {
            bio: " DROP TABLE users "
          }
        }
      });
    });

    it("debería manejar datos de BD vacíos", () => {
      // Arrange
      const input = {};
      
      // Act
      const result = sanitizeDatabaseData(input);
      
      // Assert
      expect(result).toEqual({});
    });
  });
});
