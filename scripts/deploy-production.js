#!/usr/bin/env node

/**
 * Script de despliegue automatizado para producción
 * Maneja el despliegue completo con backup, tests y rollback automático
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const crypto = require('crypto');

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
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  step: (msg) => console.log(`\n${colors.magenta}→${colors.reset} ${msg}`)
};

// Configuración de despliegue
const deployConfig = {
  backupDir: path.join(__dirname, '../backups'),
  logsDir: path.join(__dirname, '../logs'),
  tempDir: path.join(__dirname, '../temp'),
  maxBackups: 10,
  healthCheckTimeout: 30000, // 30 segundos
  rollbackTimeout: 60000     // 1 minuto
};

// Función para ejecutar comando con output
function execCommand(command, options = {}) {
  try {
    log.info(`Ejecutando: ${command}`);
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout };
  }
}

// Función para crear backup
async function createBackup() {
  log.step('Creando backup del sistema');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `backup-${timestamp}`;
  const backupPath = path.join(deployConfig.backupDir, backupName);
  
  try {
    // Crear directorio de backup
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }
    
    // Backup de código
    log.info('Backup de código fuente...');
    execCommand(`git archive --format=tar.gz --output="${backupPath}/code.tar.gz" HEAD`);
    
    // Backup de configuración
    log.info('Backup de configuración...');
    if (fs.existsSync('.env')) {
      fs.copyFileSync('.env', path.join(backupPath, '.env'));
    }
    if (fs.existsSync('ecosystem.config.js')) {
      fs.copyFileSync('ecosystem.config.js', path.join(backupPath, 'ecosystem.config.js'));
    }
    
    // Backup de logs
    log.info('Backup de logs...');
    if (fs.existsSync('../logs')) {
      execCommand(`tar -czf "${backupPath}/logs.tar.gz" -C ../logs .`);
    }
    
    // Backup de base de datos (si está disponible)
    log.info('Backup de base de datos...');
    const dbBackupResult = execCommand(
      `sqlcmd -S "${process.env.DB_SERVER}" -d "${process.env.DB_DATABASE}" -Q "BACKUP DATABASE ${process.env.DB_DATABASE} TO DISK = '${backupPath}/database.bak'"`,
      { silent: true }
    );
    
    if (dbBackupResult.success) {
      log.success('Backup de base de datos creado');
    } else {
      log.warning('No se pudo crear backup de base de datos (continuando...)');
    }
    
    // Crear archivo de metadatos
    const metadata = {
      timestamp: new Date().toISOString(),
      gitCommit: execCommand('git rev-parse HEAD', { silent: true }).output?.trim(),
      gitBranch: execCommand('git branch --show-current', { silent: true }).output?.trim(),
      version: require('../package.json').version,
      nodeVersion: process.version,
      platform: process.platform
    };
    
    fs.writeFileSync(
      path.join(backupPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    log.success(`Backup creado: ${backupName}`);
    return backupName;
    
  } catch (error) {
    log.error(`Error creando backup: ${error.message}`);
    throw error;
  }
}

// Función para limpiar backups antiguos
function cleanupOldBackups() {
  log.step('Limpiando backups antiguos');
  
  try {
    if (!fs.existsSync(deployConfig.backupDir)) {
      return;
    }
    
    const backups = fs.readdirSync(deployConfig.backupDir)
      .filter(name => name.startsWith('backup-'))
      .map(name => ({
        name,
        path: path.join(deployConfig.backupDir, name),
        mtime: fs.statSync(path.join(deployConfig.backupDir, name)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);
    
    if (backups.length > deployConfig.maxBackups) {
      const toDelete = backups.slice(deployConfig.maxBackups);
      toDelete.forEach(backup => {
        fs.rmSync(backup.path, { recursive: true, force: true });
        log.info(`Backup eliminado: ${backup.name}`);
      });
    }
    
    log.success('Limpieza de backups completada');
  } catch (error) {
    log.warning(`Error en limpieza de backups: ${error.message}`);
  }
}

// Función para ejecutar tests
async function runTests() {
  log.step('Ejecutando tests');
  
  try {
    // Test de base de datos
    log.info('Test de conexión a base de datos...');
    const dbTestResult = execCommand('node scripts/test-database.js', { silent: true });
    
    if (!dbTestResult.success) {
      throw new Error('Tests de base de datos fallaron');
    }
    
    // Test de aplicación
    log.info('Test de aplicación...');
    const appTestResult = execCommand('npm test', { silent: true });
    
    if (!appTestResult.success) {
      throw new Error('Tests de aplicación fallaron');
    }
    
    log.success('Todos los tests pasaron');
    return true;
    
  } catch (error) {
    log.error(`Error en tests: ${error.message}`);
    throw error;
  }
}

// Función para build de producción
async function buildProduction() {
  log.step('Build de producción');
  
  try {
    // Instalar dependencias
    log.info('Instalando dependencias...');
    const installResult = execCommand('npm ci --production');
    
    if (!installResult.success) {
      throw new Error('Error instalando dependencias');
    }
    
    // Build del frontend (si existe)
    if (fs.existsSync('../frontend')) {
      log.info('Build del frontend...');
      const frontendBuildResult = execCommand('cd ../frontend && npm run build:production');
      
      if (!frontendBuildResult.success) {
        throw new Error('Error en build del frontend');
      }
    }
    
    log.success('Build de producción completado');
    return true;
    
  } catch (error) {
    log.error(`Error en build: ${error.message}`);
    throw error;
  }
}

// Función para health check
async function healthCheck() {
  log.step('Verificando salud de la aplicación');
  
  const maxAttempts = 10;
  const delay = 3000; // 3 segundos
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      log.info(`Intento ${attempt}/${maxAttempts}...`);
      
      const result = execCommand('curl -f http://localhost:3001/api/health', { silent: true });
      
      if (result.success) {
        log.success('Health check exitoso');
        return true;
      }
      
      if (attempt < maxAttempts) {
        log.info(`Esperando ${delay/1000} segundos...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
    } catch (error) {
      log.warning(`Health check falló (intento ${attempt}): ${error.message}`);
    }
  }
  
  throw new Error('Health check falló después de todos los intentos');
}

// Función para rollback
async function rollback(backupName) {
  log.step(`Ejecutando rollback a backup: ${backupName}`);
  
  try {
    const backupPath = path.join(deployConfig.backupDir, backupName);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup no encontrado: ${backupName}`);
    }
    
    // Detener aplicación
    log.info('Deteniendo aplicación...');
    execCommand('pm2 stop abmmcn-backend', { silent: true });
    
    // Restaurar código
    log.info('Restaurando código...');
    execCommand(`tar -xzf "${backupPath}/code.tar.gz" -C .`);
    
    // Restaurar configuración
    log.info('Restaurando configuración...');
    if (fs.existsSync(path.join(backupPath, '.env'))) {
      fs.copyFileSync(path.join(backupPath, '.env'), '.env');
    }
    
    // Reinstalar dependencias
    log.info('Reinstalando dependencias...');
    execCommand('npm ci --production');
    
    // Reiniciar aplicación
    log.info('Reiniciando aplicación...');
    execCommand('pm2 start ecosystem.config.js --env production');
    
    // Verificar salud
    await healthCheck();
    
    log.success('Rollback completado exitosamente');
    return true;
    
  } catch (error) {
    log.error(`Error en rollback: ${error.message}`);
    throw error;
  }
}

// Función principal de despliegue
async function deploy(options = {}) {
  const startTime = Date.now();
  let backupName = null;
  
  try {
    log.header('🚀 DESPLIEGUE DE PRODUCCIÓN - AbmMcn');
    
    // Verificar prerrequisitos
    log.step('Verificando prerrequisitos');
    
    if (!fs.existsSync('package.json')) {
      throw new Error('Este script debe ejecutarse desde el directorio backend/');
    }
    
    if (!fs.existsSync('.env')) {
      throw new Error('Archivo .env no encontrado. Ejecuta setup-production.js primero');
    }
    
    // Crear backup
    if (!options.skipBackup) {
      backupName = await createBackup();
    }
    
    // Limpiar backups antiguos
    cleanupOldBackups();
    
    // Ejecutar tests
    if (!options.skipTests) {
      await runTests();
    }
    
    // Build de producción
    await buildProduction();
    
    // Detener aplicación actual
    log.step('Deteniendo aplicación actual');
    execCommand('pm2 stop abmmcn-backend', { silent: true });
    
    // Actualizar código
    log.step('Actualizando código');
    if (options.pullCode !== false) {
      execCommand('git pull origin main');
    }
    
    // Reiniciar aplicación
    log.step('Iniciando aplicación');
    execCommand('pm2 start ecosystem.config.js --env production');
    
    // Health check
    await healthCheck();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    log.header('✅ DESPLIEGUE COMPLETADO');
    log.success(`Tiempo total: ${duration} segundos`);
    log.success('Aplicación desplegada y funcionando correctamente');
    
    if (backupName) {
      log.info(`Backup disponible: ${backupName}`);
    }
    
  } catch (error) {
    log.error(`Error durante despliegue: ${error.message}`);
    
    // Rollback automático si hay backup
    if (backupName && !options.skipRollback) {
      log.warning('Iniciando rollback automático...');
      try {
        await rollback(backupName);
        log.success('Rollback completado');
      } catch (rollbackError) {
        log.error(`Error en rollback: ${rollbackError.message}`);
        log.error('ROLLBACK FALLÓ - INTERVENCIÓN MANUAL REQUERIDA');
      }
    }
    
    process.exit(1);
  }
}

// Función para mostrar ayuda
function showHelp() {
  console.log(`
Uso: node deploy-production.js [opciones]

Opciones:
  --skip-backup     Omitir creación de backup
  --skip-tests      Omitir ejecución de tests
  --skip-rollback   Omitir rollback automático en caso de error
  --no-pull         No actualizar código desde git
  --help            Mostrar esta ayuda

Ejemplos:
  node deploy-production.js
  node deploy-production.js --skip-tests
  node deploy-production.js --skip-backup --no-pull
`);
}

// Parsear argumentos de línea de comandos
const args = process.argv.slice(2);
const options = {
  skipBackup: args.includes('--skip-backup'),
  skipTests: args.includes('--skip-tests'),
  skipRollback: args.includes('--skip-rollback'),
  pullCode: !args.includes('--no-pull')
};

if (args.includes('--help')) {
  showHelp();
  process.exit(0);
}

// Ejecutar despliegue
if (require.main === module) {
  deploy(options).catch(error => {
    log.error(`Error fatal: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { deploy, rollback, createBackup, healthCheck };
