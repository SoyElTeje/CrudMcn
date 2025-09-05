/**
 * Tests de integración para la aplicación
 * Verifica funcionalidad end-to-end
 */

const request = require("supertest");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Importar rutas
const authRoutes = require("../../routes/auth");
const healthRoutes = require("../../routes/health");

// Mock de dependencias
jest.mock("../../db");
jest.mock("../../services/authServiceRefactored");

describe("Application Integration Tests", () => {
  let app;

  beforeEach(() => {
    app = express();
    
    // Middleware
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100 // límite de 100 requests por IP
    });
    app.use(limiter);
    
    // Rutas
    app.use("/api/auth", authRoutes);
    app.use("/api/health", healthRoutes);
    
    // Middleware de manejo de errores
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        status: "error",
        message: err.message || "Error interno del servidor"
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Health Check Endpoints", () => {
    it("debería responder a health check básico", async () => {
      // Act
      const response = await request(app)
        .get("/api/health");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("healthy");
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });

    it("debería responder a health check detallado", async () => {
      // Act
      const response = await request(app)
        .get("/api/health/detailed");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("healthy");
      expect(response.body.memory).toBeDefined();
      expect(response.body.database).toBeDefined();
    });

    it("debería responder a métricas", async () => {
      // Act
      const response = await request(app)
        .get("/api/health/metrics");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toBeDefined();
    });
  });

  describe("Authentication Flow", () => {
    it("debería manejar flujo completo de autenticación", async () => {
      // Arrange
      const authService = require("../../services/authServiceRefactored");
      const mockUser = {
        id: 1,
        username: "testuser",
        isAdmin: false
      };
      const mockToken = "mock.jwt.token";

      authService.verifyCredentials.mockResolvedValue(mockUser);
      authService.generateToken.mockReturnValue(mockToken);
      authService.getAllUsers.mockResolvedValue([mockUser]);

      // Act 1: Login
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          username: "testuser",
          password: "testpassword123"
        });

      // Assert 1: Login exitoso
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.token).toBe(mockToken);
      expect(loginResponse.body.user).toEqual(mockUser);

      // Act 2: Listar usuarios
      const usersResponse = await request(app)
        .get("/api/auth/users");

      // Assert 2: Lista de usuarios
      expect(usersResponse.status).toBe(200);
      expect(usersResponse.body.success).toBe(true);
      expect(usersResponse.body.users).toHaveLength(1);
    });

    it("debería manejar error de autenticación", async () => {
      // Arrange
      const authService = require("../../services/authServiceRefactored");
      authService.verifyCredentials.mockResolvedValue(null);

      // Act
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: "testuser",
          password: "wrongpassword"
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Credenciales inválidas");
    });
  });

  describe("User Management Flow", () => {
    it("debería manejar flujo completo de gestión de usuarios", async () => {
      // Arrange
      const authService = require("../../services/authServiceRefactored");
      const mockNewUser = {
        id: 2,
        username: "newuser",
        isAdmin: false,
        createdAt: new Date()
      };

      authService.createUser.mockResolvedValue(mockNewUser);
      authService.updateUserPassword.mockResolvedValue();
      authService.assignDatabasePermission.mockResolvedValue();

      // Act 1: Crear usuario
      const createResponse = await request(app)
        .post("/api/auth/users")
        .send({
          username: "newuser",
          password: "newpassword123",
          isAdmin: false
        });

      // Assert 1: Usuario creado
      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.user).toEqual(mockNewUser);

      // Act 2: Actualizar contraseña
      const updatePasswordResponse = await request(app)
        .put("/api/auth/users/2/password")
        .send({
          newPassword: "newpassword456"
        });

      // Assert 2: Contraseña actualizada
      expect(updatePasswordResponse.status).toBe(200);
      expect(updatePasswordResponse.body.success).toBe(true);

      // Act 3: Asignar permisos de BD
      const assignPermissionResponse = await request(app)
        .post("/api/auth/users/2/database-permissions")
        .send({
          databaseName: "test_database",
          permissions: {
            canRead: true,
            canWrite: false,
            canDelete: false,
            canCreate: true
          }
        });

      // Assert 3: Permisos asignados
      expect(assignPermissionResponse.status).toBe(200);
      expect(assignPermissionResponse.body.success).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("debería manejar rutas no encontradas", async () => {
      // Act
      const response = await request(app)
        .get("/api/nonexistent");

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Ruta no encontrada");
    });

    it("debería manejar errores de validación", async () => {
      // Act
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: "", // Username vacío
          password: "123" // Password muy corto
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toContain("Datos de entrada inválidos");
    });

    it("debería manejar errores internos del servidor", async () => {
      // Arrange
      const authService = require("../../services/authServiceRefactored");
      authService.verifyCredentials.mockRejectedValue(new Error("Database connection failed"));

      // Act
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: "testuser",
          password: "testpassword123"
        });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Error interno del servidor");
    });
  });

  describe("Security Features", () => {
    it("debería aplicar rate limiting", async () => {
      // Act: Hacer múltiples requests rápidamente
      const promises = [];
      for (let i = 0; i < 105; i++) {
        promises.push(
          request(app)
            .get("/api/health")
        );
      }

      const responses = await Promise.all(promises);

      // Assert: Algunos requests deberían ser limitados
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it("debería aplicar headers de seguridad", async () => {
      // Act
      const response = await request(app)
        .get("/api/health");

      // Assert
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBe("DENY");
      expect(response.headers["x-xss-protection"]).toBe("0");
    });
  });

  describe("CORS Configuration", () => {
    it("debería permitir requests desde cualquier origen", async () => {
      // Act
      const response = await request(app)
        .get("/api/health")
        .set("Origin", "http://localhost:3000");

      // Assert
      expect(response.headers["access-control-allow-origin"]).toBe("*");
    });
  });
});
