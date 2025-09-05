/**
 * Configuración de Jest para testing del backend
 * Configuración optimizada para Node.js y Express
 */

module.exports = {
  // Entorno de testing
  testEnvironment: "node",
  
  // Directorios de tests
  testMatch: [
    "**/__tests__/**/*.js",
    "**/?(*.)+(spec|test).js"
  ],
  
  // Directorios a ignorar
  testPathIgnorePatterns: [
    "/node_modules/",
    "/logs/",
    "/dist/"
  ],
  
  // Configuración de coverage
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: [
    "text",
    "lcov",
    "html",
    "json"
  ],
  
  // Archivos a incluir en coverage
  collectCoverageFrom: [
    "**/*.js",
    "!**/node_modules/**",
    "!**/coverage/**",
    "!**/logs/**",
    "!**/dist/**",
    "!**/__tests__/**",
    "!**/*.test.js",
    "!**/*.spec.js",
    "!jest.config.js",
    "!server.js"
  ],
  
  // Umbrales de coverage
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Setup files
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.js"],
  
  // Timeout para tests
  testTimeout: 10000,
  
  // Configuración de módulos
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/$1"
  },
  
  // Configuración de transformación
  transform: {},
  
  // Configuración de verbose
  verbose: true,
  
  // Configuración de CI
  ci: process.env.CI === "true",
  
  // Configuración de watch
  watchman: false,
  
  // Configuración de clearMocks
  clearMocks: true,
  
  // Configuración de restoreMocks
  restoreMocks: true,
  
  // Configuración de resetMocks
  resetMocks: true
};
