/**
 * Tests para middleware de validación
 * Verifica funcionalidad de validación de entrada con Joi
 */

const { validate, schemas } = require("../../middleware/validation");
const { AppError } = require("../../middleware/errorHandler");

// Mock de dependencias
jest.mock("../../middleware/errorHandler");

describe("Validation Middleware", () => {
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

  describe("validate middleware", () => {
    it("debería validar datos del body correctamente", () => {
      // Arrange
      req.body = {
        username: "testuser",
        password: "testpassword123"
      };

      const middleware = validate(schemas.login);

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it("debería validar datos de query correctamente", () => {
      // Arrange
      req.query = {
        page: "1",
        limit: "10"
      };

      const middleware = validate(schemas.pagination, "query");

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it("debería validar datos de params correctamente", () => {
      // Arrange
      req.params = {
        userId: "123"
      };

      const middleware = validate(schemas.userId, "params");

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it("debería lanzar error para datos inválidos", () => {
      // Arrange
      req.body = {
        username: "", // Username vacío
        password: "123" // Password muy corto
      };

      const middleware = validate(schemas.login);

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe("schemas", () => {
    describe("login schema", () => {
      it("debería validar login correcto", () => {
        const validData = {
          username: "testuser",
          password: "testpassword123"
        };

        const { error } = schemas.login.validate(validData);
        expect(error).toBeUndefined();
      });

      it("debería rechazar login con username vacío", () => {
        const invalidData = {
          username: "",
          password: "testpassword123"
        };

        const { error } = schemas.login.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("username");
      });

      it("debería rechazar login con password muy corto", () => {
        const invalidData = {
          username: "testuser",
          password: "123"
        };

        const { error } = schemas.login.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("password");
      });
    });

    describe("createUser schema", () => {
      it("debería validar creación de usuario correcta", () => {
        const validData = {
          username: "newuser",
          password: "newpassword123",
          isAdmin: false
        };

        const { error } = schemas.createUser.validate(validData);
        expect(error).toBeUndefined();
      });

      it("debería rechazar username con caracteres especiales", () => {
        const invalidData = {
          username: "user@#$",
          password: "newpassword123",
          isAdmin: false
        };

        const { error } = schemas.createUser.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("username");
      });
    });

    describe("updatePassword schema", () => {
      it("debería validar actualización de contraseña correcta", () => {
        const validData = {
          newPassword: "newpassword123"
        };

        const { error } = schemas.updatePassword.validate(validData);
        expect(error).toBeUndefined();
      });

      it("debería rechazar contraseña muy corta", () => {
        const invalidData = {
          newPassword: "123"
        };

        const { error } = schemas.updatePassword.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("newPassword");
      });
    });

    describe("assignDatabasePermission schema", () => {
      it("debería validar asignación de permisos de BD correcta", () => {
        const validData = {
          databaseName: "test_database",
          permissions: {
            canRead: true,
            canWrite: false,
            canDelete: false,
            canCreate: true
          }
        };

        const { error } = schemas.assignDatabasePermission.validate(validData);
        expect(error).toBeUndefined();
      });

      it("debería rechazar nombre de BD inválido", () => {
        const invalidData = {
          databaseName: "test-database!", // Caracteres especiales
          permissions: {
            canRead: true,
            canWrite: false,
            canDelete: false,
            canCreate: true
          }
        };

        const { error } = schemas.assignDatabasePermission.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("databaseName");
      });
    });

    describe("assignTablePermission schema", () => {
      it("debería validar asignación de permisos de tabla correcta", () => {
        const validData = {
          databaseName: "test_database",
          tableName: "test_table",
          permissions: {
            canRead: true,
            canWrite: true,
            canDelete: false,
            canCreate: false
          }
        };

        const { error } = schemas.assignTablePermission.validate(validData);
        expect(error).toBeUndefined();
      });

      it("debería rechazar nombre de tabla inválido", () => {
        const invalidData = {
          databaseName: "test_database",
          tableName: "test-table!", // Caracteres especiales
          permissions: {
            canRead: true,
            canWrite: true,
            canDelete: false,
            canCreate: false
          }
        };

        const { error } = schemas.assignTablePermission.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("tableName");
      });
    });

    describe("userId schema", () => {
      it("debería validar ID de usuario correcto", () => {
        const validData = {
          userId: "123"
        };

        const { error } = schemas.userId.validate(validData);
        expect(error).toBeUndefined();
      });

      it("debería rechazar ID de usuario no numérico", () => {
        const invalidData = {
          userId: "abc"
        };

        const { error } = schemas.userId.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("userId");
      });
    });

    describe("pagination schema", () => {
      it("debería validar paginación correcta", () => {
        const validData = {
          page: "1",
          limit: "10"
        };

        const { error } = schemas.pagination.validate(validData);
        expect(error).toBeUndefined();
      });

      it("debería rechazar página negativa", () => {
        const invalidData = {
          page: "-1",
          limit: "10"
        };

        const { error } = schemas.pagination.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("page");
      });

      it("debería rechazar límite muy alto", () => {
        const invalidData = {
          page: "1",
          limit: "1000"
        };

        const { error } = schemas.pagination.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("limit");
      });
    });

    describe("dateFilter schema", () => {
      it("debería validar filtro de fecha correcto", () => {
        const validData = {
          startDate: "01/01/2024",
          endDate: "31/12/2024"
        };

        const { error } = schemas.dateFilter.validate(validData);
        expect(error).toBeUndefined();
      });

      it("debería rechazar formato de fecha incorrecto", () => {
        const invalidData = {
          startDate: "2024-01-01", // Formato ISO
          endDate: "31/12/2024"
        };

        const { error } = schemas.dateFilter.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("startDate");
      });
    });

    describe("activateTable schema", () => {
      it("debería validar activación de tabla correcta", () => {
        const validData = {
          databaseName: "test_database",
          tableName: "test_table"
        };

        const { error } = schemas.activateTable.validate(validData);
        expect(error).toBeUndefined();
      });
    });

    describe("deactivateTable schema", () => {
      it("debería validar desactivación de tabla correcta", () => {
        const validData = {
          databaseName: "test_database",
          tableName: "test_table"
        };

        const { error } = schemas.deactivateTable.validate(validData);
        expect(error).toBeUndefined();
      });
    });

    describe("tableData schema", () => {
      it("debería validar datos de tabla correctos", () => {
        const validData = {
          data: {
            name: "test",
            value: 123
          }
        };

        const { error } = schemas.tableData.validate(validData);
        expect(error).toBeUndefined();
      });

      it("debería rechazar datos vacíos", () => {
        const invalidData = {
          data: {}
        };

        const { error } = schemas.tableData.validate(invalidData);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("data");
      });
    });

    describe("databaseTableParams schema", () => {
      it("debería validar parámetros de BD y tabla correctos", () => {
        const validData = {
          databaseName: "test_database",
          tableName: "test_table"
        };

        const { error } = schemas.databaseTableParams.validate(validData);
        expect(error).toBeUndefined();
      });
    });
  });
});
