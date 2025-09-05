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

// Mock de mssql
jest.mock("mssql", () => ({
  connect: jest.fn(),
  close: jest.fn(),
  Request: jest.fn().mockImplementation(() => ({
    input: jest.fn().mockReturnThis(),
    query: jest.fn().mockResolvedValue({ recordset: [], rowsAffected: [1] }),
    execute: jest.fn().mockResolvedValue({ recordset: [], rowsAffected: [1] }),
  })),
  ConnectionPool: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({}),
    close: jest.fn().mockResolvedValue({}),
    request: jest.fn().mockReturnValue({
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [], rowsAffected: [1] }),
      execute: jest.fn().mockResolvedValue({ recordset: [], rowsAffected: [1] }),
    }),
  })),
}));

// Mock de bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password"),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue("salt"),
}));

// Mock de jsonwebtoken
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("mock_jwt_token"),
  verify: jest.fn().mockReturnValue({ userId: 1, username: "test_user" }),
  decode: jest.fn().mockReturnValue({ userId: 1, username: "test_user" }),
}));

// Mock de express-rate-limit
jest.mock("express-rate-limit", () => ({
  rateLimit: jest.fn().mockReturnValue((req, res, next) => next()),
}));

// Mock de helmet
jest.mock("helmet", () => jest.fn().mockReturnValue((req, res, next) => next()));

// Mock de multer
jest.mock("multer", () => ({
  memoryStorage: jest.fn().mockReturnValue({}),
  diskStorage: jest.fn().mockReturnValue({}),
}));

// Mock de database config
jest.mock("../config/database", () => ({
  getPool: jest.fn().mockResolvedValue({
    request: jest.fn().mockReturnValue({
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [], rowsAffected: [1] }),
      execute: jest.fn().mockResolvedValue({ recordset: [], rowsAffected: [1] }),
    }),
    close: jest.fn().mockResolvedValue({}),
  }),
  closePool: jest.fn().mockResolvedValue({}),
  closeAllPools: jest.fn().mockResolvedValue({}),
  getPoolStats: jest.fn().mockReturnValue({
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
  }),
}));

// Mock de authService
jest.mock("../services/authServiceRefactored", () => ({
  verifyCredentials: jest.fn(),
  getUserByUsername: jest.fn(),
  determineAdminStatus: jest.fn(),
  hasAdminColumn: jest.fn(),
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
  createUser: jest.fn(),
  updateUserPassword: jest.fn(),
  getAllUsers: jest.fn(),
  deleteUser: jest.fn(),
  createDefaultAdmin: jest.fn(),
  hasPermission: jest.fn(),
  assignDatabasePermission: jest.fn(),
  assignTablePermission: jest.fn(),
}));


// Configurar cleanup después de cada test
afterEach(() => {
  jest.clearAllMocks();
});

// Configurar cleanup después de todos los tests
afterAll(() => {
  jest.restoreAllMocks();
});
