/**
 * Setup global para tests
 * Configuración de entorno y mocks globales
 */

// Configurar variables de entorno para testing
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";
process.env.DB_SERVER = "localhost";
process.env.DB_DATABASE = "test_db";
process.env.DB_USER = "test_user";
process.env.DB_PASSWORD = "test_password";
process.env.PORT = "3001";

// Configurar timeout global
jest.setTimeout(10000);

// Mock de console para tests más limpios
global.console = {
  ...console,
  // Mantener console.error para debugging
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

// Mock de winston logger
jest.mock("../config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  auth: jest.fn(),
  database: jest.fn(),
  crud: jest.fn(),
  security: jest.fn(),
  performance: jest.fn(),
  api: jest.fn(),
}));

// Mock de base de datos
jest.mock("../db", () => ({
  getPool: jest.fn(),
  closePool: jest.fn(),
  closeAllPools: jest.fn(),
  getPoolStats: jest.fn(),
}));

// Configurar cleanup después de cada test
afterEach(() => {
  jest.clearAllMocks();
});

// Configurar cleanup después de todos los tests
afterAll(() => {
  jest.restoreAllMocks();
});
