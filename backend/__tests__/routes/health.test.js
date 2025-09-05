/**
 * Tests para rutas de salud
 * Verifica funcionalidad de endpoints de health check
 */

const request = require("supertest");
const express = require("express");
const healthRoutes = require("../../routes/health");
const { getPoolStats } = require("../../db");

// Mock de dependencias
jest.mock("../../db");

describe("Health Routes", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/health", healthRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/health", () => {
    it("debería retornar estado de salud básico", async () => {
      // Act
      const response = await request(app)
        .get("/api/health");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: "healthy",
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: "test",
        version: expect.any(String)
      });
    });
  });

  describe("GET /api/health/detailed", () => {
    it("debería retornar estado de salud detallado", async () => {
      // Arrange
      const mockPoolStats = {
        "test_db": {
          connected: true,
          totalConnections: 5,
          activeConnections: 2,
          idleConnections: 3
        }
      };

      getPoolStats.mockReturnValue(mockPoolStats);

      // Act
      const response = await request(app)
        .get("/api/health/detailed");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: "healthy",
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: "test",
        version: expect.any(String),
        memory: expect.any(Object),
        database: {
          status: "healthy",
          pools: mockPoolStats
        }
      });
    });
  });

  describe("GET /api/health/pools", () => {
    it("debería retornar estadísticas de pools", async () => {
      // Arrange
      const mockPoolStats = {
        "test_db": {
          connected: true,
          totalConnections: 5,
          activeConnections: 2,
          idleConnections: 3
        },
        "another_db": {
          connected: false,
          totalConnections: 0,
          activeConnections: 0,
          idleConnections: 0
        }
      };

      getPoolStats.mockReturnValue(mockPoolStats);

      // Act
      const response = await request(app)
        .get("/api/health/pools");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        pools: mockPoolStats
      });
    });
  });

  describe("POST /api/health/pools/:dbName/reconnect", () => {
    it("debería reconectar pool de BD exitosamente", async () => {
      // Arrange
      const dbName = "test_db";
      const mockPoolStats = {
        "test_db": {
          connected: true,
          totalConnections: 5,
          activeConnections: 2,
          idleConnections: 3
        }
      };

      getPoolStats.mockReturnValue(mockPoolStats);

      // Act
      const response = await request(app)
        .post(`/api/health/pools/${dbName}/reconnect`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: `Pool de ${dbName} reconectado exitosamente`,
        pool: mockPoolStats[dbName]
      });
    });

    it("debería manejar error al reconectar pool", async () => {
      // Arrange
      const dbName = "nonexistent_db";
      const mockPoolStats = {};

      getPoolStats.mockReturnValue(mockPoolStats);

      // Act
      const response = await request(app)
        .post(`/api/health/pools/${dbName}/reconnect`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: `Pool de ${dbName} no encontrado`
      });
    });
  });

  describe("GET /api/health/metrics", () => {
    it("debería retornar métricas de la aplicación", async () => {
      // Act
      const response = await request(app)
        .get("/api/health/metrics");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        metrics: {
          uptime: expect.any(Number),
          memory: expect.any(Object),
          cpu: expect.any(Object),
          environment: "test",
          nodeVersion: expect.any(String),
          platform: expect.any(String)
        }
      });
    });
  });
});
