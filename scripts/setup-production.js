#!/usr/bin/env node

/**
 * Script de configuración de producción para AbmMcn
 * Configura automáticamente el entorno de producción con validaciones de seguridad
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`)
};

// Configuración por defecto de producción
const defaultConfig = {
  // Base de datos
  DB_SERVER: 'localhost',
  DB_PORT: '1433',
  DB_USER: 'abmmcn_user',
  DB_PASSWORD: '',
  DB_DATABASE: 'APPDATA',
  
  // Servidor
  PORT: '3001',
  NODE_ENV: 'production',
  
  // CORS
  CORS_ORIGIN: '*',
  
  // JWT
  JWT_SECRET: '',
  JWT_EXPIRES_IN: '24h',
  
  // Logging
  LOG_LEVEL: 'warn',
  LOG_FILE: '../logs/backend-production.log',
  
  // Upload
  UPLOAD_DIR: '../uploads',
  MAX_FILE_SIZE: '50MB',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '50',
  
  // Security
  HELMET_ENABLED: 'true',
  TRUST_PROXY: 'true',
  
  // Database Pool (Production optimized)
  DB_POOL_MAX: '20',
  DB_POOL_MIN: '5',
  DB_IDLE_TIMEOUT: '300000',
  DB_ACQUIRE_TIMEOUT: '60000',
  DB_CREATE_TIMEOUT: '30000',
  DB_DESTROY_TIMEOUT: '5000',
  DB_REAP_INTERVAL: '1000',
  DB_CREATE_RETRY_INTERVAL: '200',
  DB_REQUEST_TIMEOUT: '30000',
  DB_CONNECTION_TIMEOUT: '15000',
  DB_ENCRYPT: 'false',
  DB_TRUST_CERT: 'true'
};

// Función para generar JWT secret seguro
function generateJWTSecret() {
  return crypto.randomBytes(64).toString('hex');
}

// Función para validar configuración
function validateConfig(config) {
  const errors = [];
  
  // Validar campos requeridos
  if (!config.DB_SERVER) errors.push('DB_SERVER es requerido');
  if (!config.DB_USER) errors.push('DB_USER es requerido');
  if (!config.DB_PASSWORD) errors.push('DB_PASSWORD es requerido');
  if (!config.DB_DATABASE) errors.push('DB_DATABASE es requerido');
  if (!config.JWT_SECRET) errors.push('JWT_SECRET es requerido');
  
  // Validar formato de puerto
  const port = parseInt(config.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT debe ser un número entre 1 y 65535');
  }
  
  // Validar formato de DB_PORT
  const dbPort = parseInt(config.DB_PORT);
  if (isNaN(dbPort) || dbPort < 1 || dbPort > 65535) {
    errors.push('DB_PORT debe ser un número entre 1 y 65535');
  }
  
  // Validar pool de conexiones
  const poolMax = parseInt(config.DB_POOL_MAX);
  const poolMin = parseInt(config.DB_POOL_MIN);
  if (poolMin > poolMax) {
    errors.push('DB_POOL_MIN no puede ser mayor que DB_POOL_MAX');
  }
  
  return errors;
}

// Función para crear directorios necesarios
function createDirectories() {
  const dirs = [
    '../logs',
    '../uploads',
    '../backups',
    '../temp'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.resolve(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      log.success(`Directorio creado: ${dir}`);
    }
  });
}

// Función para escribir archivo .env
function writeEnvFile(config, envPath) {
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(envPath, envContent);
  log.success(`Archivo .env creado: ${envPath}`);
}

// Función para leer input del usuario
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Función principal
async function setupProduction() {
  try {
    log.header('🚀 CONFIGURACIÓN DE PRODUCCIÓN - AbmMcn');
    
    // Verificar que estamos en el directorio correcto
    if (!fs.existsSync('package.json')) {
      log.error('Este script debe ejecutarse desde el directorio backend/');
      process.exit(1);
    }
    
    log.info('Configurando entorno de producción...');
    
    // Crear directorios necesarios
    createDirectories();
    
    // Configuración interactiva
    const config = { ...defaultConfig };
    
    log.header('📊 Configuración de Base de Datos');
    config.DB_SERVER = await askQuestion(`Servidor de base de datos [${config.DB_SERVER}]: `) || config.DB_SERVER;
    config.DB_PORT = await askQuestion(`Puerto de base de datos [${config.DB_PORT}]: `) || config.DB_PORT;
    config.DB_USER = await askQuestion(`Usuario de base de datos [${config.DB_USER}]: `) || config.DB_USER;
    config.DB_PASSWORD = await askQuestion('Contraseña de base de datos: ') || config.DB_PASSWORD;
    config.DB_DATABASE = await askQuestion(`Base de datos [${config.DB_DATABASE}]: `) || config.DB_DATABASE;
    
    log.header('🌐 Configuración del Servidor');
    config.PORT = await askQuestion(`Puerto del servidor [${config.PORT}]: `) || config.PORT;
    
    log.header('🔐 Configuración de Seguridad');
    const generateSecret = await askQuestion('¿Generar JWT secret automáticamente? (y/n) [y]: ');
    if (generateSecret.toLowerCase() !== 'n') {
      config.JWT_SECRET = generateJWTSecret();
      log.success('JWT secret generado automáticamente');
    } else {
      config.JWT_SECRET = await askQuestion('JWT secret personalizado: ') || config.JWT_SECRET;
    }
    
    log.header('📝 Configuración de Logs');
    config.LOG_LEVEL = await askQuestion(`Nivel de logs (debug/info/warn/error) [${config.LOG_LEVEL}]: `) || config.LOG_LEVEL;
    
    // Validar configuración
    const errors = validateConfig(config);
    if (errors.length > 0) {
      log.error('Errores de configuración:');
      errors.forEach(error => log.error(`  - ${error}`));
      process.exit(1);
    }
    
    // Crear archivo .env
    const envPath = path.join(__dirname, '.env');
    writeEnvFile(config, envPath);
    
    // Crear archivo de backup
    const backupPath = path.join(__dirname, `../backups/env.production.backup.${Date.now()}`);
    writeEnvFile(config, backupPath);
    
    log.header('✅ Configuración Completada');
    log.success('Variables de entorno configuradas');
    log.success('Backup de configuración creado');
    log.success('Directorios necesarios creados');
    
    log.header('📋 Próximos Pasos');
    log.info('1. Verificar conexión a base de datos: npm run test:db');
    log.info('2. Ejecutar tests: npm test');
    log.info('3. Iniciar aplicación: pm2 start ecosystem.config.js --env production');
    log.info('4. Verificar estado: pm2 status');
    
    log.warning('⚠️  IMPORTANTE: Guarda el JWT_SECRET en un lugar seguro');
    log.warning('⚠️  IMPORTANTE: Verifica que la base de datos esté accesible');
    
  } catch (error) {
    log.error(`Error durante la configuración: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  setupProduction();
}

module.exports = { setupProduction, generateJWTSecret, validateConfig };
