#!/usr/bin/env node

/**
 * Script de backup automatizado para producción
 * Crea backups completos del sistema incluyendo código, configuración, logs y base de datos
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`)
};

// Configuración de backup
const backupConfig = {
  backupDir: path.join(__dirname, '../backups'),
  maxBackups: 30, // Mantener 30 backups
  compressionLevel: 6, // Nivel de compresión (1-9)
  includeLogs: true,
  includeUploads: true,
  includeDatabase: true,
  encryptBackups: false, // Cambiar a true para encriptar backups
  retentionDays: 30 // Eliminar backups más antiguos que 30 días
};

// Función para ejecutar comando
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

// Función para generar nombre de backup
function generateBackupName(type = 'full') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const gitCommit = execCommand('git rev-parse --short HEAD', { silent: true }).output?.trim() || 'unknown';
  return `${type}-${timestamp}-${gitCommit}`;
}

// Función para crear backup de código
function backupCode(backupPath) {
  log.info('Creando backup de código fuente...');
  
  try {
    // Backup completo del repositorio
    const codeBackupFile = path.join(backupPath, 'code.tar.gz');
    const result = execCommand(`git archive --format=tar.gz --output="${codeBackupFile}" HEAD`);
    
    if (!result.success) {
      throw new Error('Error creando backup de código');
    }
    
    // Backup de archivos no versionados
    const uncommittedFiles = execCommand('git ls-files --others --exclude-standard', { silent: true });
    if (uncommittedFiles.success && uncommittedFiles.output.trim()) {
      const tempFile = path.join(backupPath, 'uncommitted-files.txt');
      fs.writeFileSync(tempFile, uncommittedFiles.output);
    }
    
    log.success('Backup de código completado');
    return true;
  } catch (error) {
    log.error(`Error en backup de código: ${error.message}`);
    return false;
  }
}

// Función para crear backup de configuración
function backupConfiguration(backupPath) {
  log.info('Creando backup de configuración...');
  
  try {
    const configFiles = [
      '.env',
      'ecosystem.config.js',
      'package.json',
      'package-lock.json'
    ];
    
    configFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const destPath = path.join(backupPath, file);
        const destDir = path.dirname(destPath);
        
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        fs.copyFileSync(file, destPath);
        log.info(`  Copiado: ${file}`);
      }
    });
    
    log.success('Backup de configuración completado');
    return true;
  } catch (error) {
    log.error(`Error en backup de configuración: ${error.message}`);
    return false;
  }
}

// Función para crear backup de logs
function backupLogs(backupPath) {
  if (!backupConfig.includeLogs) {
    return true;
  }
  
  log.info('Creando backup de logs...');
  
  try {
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      log.warning('Directorio de logs no encontrado');
      return true;
    }
    
    const logsBackupFile = path.join(backupPath, 'logs.tar.gz');
    const result = execCommand(`tar -czf "${logsBackupFile}" -C "${logsDir}" .`);
    
    if (!result.success) {
      throw new Error('Error creando backup de logs');
    }
    
    log.success('Backup de logs completado');
    return true;
  } catch (error) {
    log.error(`Error en backup de logs: ${error.message}`);
    return false;
  }
}

// Función para crear backup de uploads
function backupUploads(backupPath) {
  if (!backupConfig.includeUploads) {
    return true;
  }
  
  log.info('Creando backup de uploads...');
  
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      log.warning('Directorio de uploads no encontrado');
      return true;
    }
    
    const uploadsBackupFile = path.join(backupPath, 'uploads.tar.gz');
    const result = execCommand(`tar -czf "${uploadsBackupFile}" -C "${uploadsDir}" .`);
    
    if (!result.success) {
      throw new Error('Error creando backup de uploads');
    }
    
    log.success('Backup de uploads completado');
    return true;
  } catch (error) {
    log.error(`Error en backup de uploads: ${error.message}`);
    return false;
  }
}

// Función para crear backup de base de datos
function backupDatabase(backupPath) {
  if (!backupConfig.includeDatabase) {
    return true;
  }
  
  log.info('Creando backup de base de datos...');
  
  try {
    const dbBackupFile = path.join(backupPath, 'database.bak');
    
    // Comando de backup de SQL Server
    const backupCommand = `sqlcmd -S "${process.env.DB_SERVER}" -d "${process.env.DB_DATABASE}" -Q "BACKUP DATABASE ${process.env.DB_DATABASE} TO DISK = '${dbBackupFile}' WITH FORMAT, INIT, NAME = 'AbmMcn Full Backup', SKIP, NOREWIND, NOUNLOAD, STATS = 10"`;
    
    const result = execCommand(backupCommand, { silent: true });
    
    if (!result.success) {
      throw new Error(`Error en backup de base de datos: ${result.error}`);
    }
    
    log.success('Backup de base de datos completado');
    return true;
  } catch (error) {
    log.error(`Error en backup de base de datos: ${error.message}`);
    return false;
  }
}

// Función para crear metadatos del backup
function createBackupMetadata(backupPath, backupName) {
  log.info('Creando metadatos del backup...');
  
  try {
    const metadata = {
      name: backupName,
      timestamp: new Date().toISOString(),
      gitCommit: execCommand('git rev-parse HEAD', { silent: true }).output?.trim(),
      gitBranch: execCommand('git branch --show-current', { silent: true }).output?.trim(),
      version: require('../package.json').version,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      environment: process.env.NODE_ENV || 'production',
      database: {
        server: process.env.DB_SERVER,
        database: process.env.DB_DATABASE
      },
      files: {
        code: fs.existsSync(path.join(backupPath, 'code.tar.gz')),
        config: fs.existsSync(path.join(backupPath, '.env')),
        logs: fs.existsSync(path.join(backupPath, 'logs.tar.gz')),
        uploads: fs.existsSync(path.join(backupPath, 'uploads.tar.gz')),
        database: fs.existsSync(path.join(backupPath, 'database.bak'))
      }
    };
    
    const metadataFile = path.join(backupPath, 'metadata.json');
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    
    log.success('Metadatos del backup creados');
    return true;
  } catch (error) {
    log.error(`Error creando metadatos: ${error.message}`);
    return false;
  }
}

// Función para comprimir backup completo
function compressBackup(backupPath, backupName) {
  log.info('Comprimiendo backup completo...');
  
  try {
    const compressedFile = path.join(backupConfig.backupDir, `${backupName}.tar.gz`);
    const result = execCommand(`tar -czf "${compressedFile}" -C "${backupConfig.backupDir}" "${backupName}"`);
    
    if (!result.success) {
      throw new Error('Error comprimiendo backup');
    }
    
    // Eliminar directorio temporal
    fs.rmSync(backupPath, { recursive: true, force: true });
    
    // Calcular tamaño del archivo
    const stats = fs.statSync(compressedFile);
    const sizeMB = Math.round(stats.size / 1024 / 1024);
    
    log.success(`Backup comprimido: ${path.basename(compressedFile)} (${sizeMB}MB)`);
    return compressedFile;
  } catch (error) {
    log.error(`Error comprimiendo backup: ${error.message}`);
    return null;
  }
}

// Función para limpiar backups antiguos
function cleanupOldBackups() {
  log.info('Limpiando backups antiguos...');
  
  try {
    if (!fs.existsSync(backupConfig.backupDir)) {
      return;
    }
    
    const files = fs.readdirSync(backupConfig.backupDir)
      .filter(name => name.endsWith('.tar.gz'))
      .map(name => ({
        name,
        path: path.join(backupConfig.backupDir, name),
        mtime: fs.statSync(path.join(backupConfig.backupDir, name)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);
    
    // Eliminar por cantidad
    if (files.length > backupConfig.maxBackups) {
      const toDelete = files.slice(backupConfig.maxBackups);
      toDelete.forEach(file => {
        fs.unlinkSync(file.path);
        log.info(`  Eliminado: ${file.name}`);
      });
    }
    
    // Eliminar por antigüedad
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - backupConfig.retentionDays);
    
    files.forEach(file => {
      if (file.mtime < cutoffDate) {
        fs.unlinkSync(file.path);
        log.info(`  Eliminado (antiguo): ${file.name}`);
      }
    });
    
    log.success('Limpieza de backups completada');
  } catch (error) {
    log.warning(`Error en limpieza de backups: ${error.message}`);
  }
}

// Función para verificar integridad del backup
function verifyBackup(backupFile) {
  log.info('Verificando integridad del backup...');
  
  try {
    // Verificar que el archivo existe y no está corrupto
    const stats = fs.statSync(backupFile);
    if (stats.size === 0) {
      throw new Error('Backup vacío');
    }
    
    // Verificar que se puede extraer
    const testResult = execCommand(`tar -tzf "${backupFile}" | head -5`, { silent: true });
    if (!testResult.success) {
      throw new Error('Backup corrupto o no se puede leer');
    }
    
    log.success('Integridad del backup verificada');
    return true;
  } catch (error) {
    log.error(`Error verificando backup: ${error.message}`);
    return false;
  }
}

// Función principal de backup
async function createBackup(type = 'full') {
  const startTime = Date.now();
  const backupName = generateBackupName(type);
  const backupPath = path.join(backupConfig.backupDir, backupName);
  
  try {
    log.header(`💾 CREANDO BACKUP: ${backupName}`);
    
    // Crear directorio de backup
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }
    
    // Crear backups individuales
    const results = {
      code: backupCode(backupPath),
      config: backupConfiguration(backupPath),
      logs: backupLogs(backupPath),
      uploads: backupUploads(backupPath),
      database: backupDatabase(backupPath)
    };
    
    // Crear metadatos
    createBackupMetadata(backupPath, backupName);
    
    // Verificar que al menos el código y configuración se respaldaron
    if (!results.code || !results.config) {
      throw new Error('Backup crítico falló (código o configuración)');
    }
    
    // Comprimir backup
    const compressedFile = compressBackup(backupPath, backupName);
    if (!compressedFile) {
      throw new Error('Error comprimiendo backup');
    }
    
    // Verificar integridad
    if (!verifyBackup(compressedFile)) {
      throw new Error('Backup no pasó verificación de integridad');
    }
    
    // Limpiar backups antiguos
    cleanupOldBackups();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    const stats = fs.statSync(compressedFile);
    const sizeMB = Math.round(stats.size / 1024 / 1024);
    
    log.header('✅ BACKUP COMPLETADO');
    log.success(`Archivo: ${path.basename(compressedFile)}`);
    log.success(`Tamaño: ${sizeMB}MB`);
    log.success(`Duración: ${duration} segundos`);
    
    // Resumen de componentes
    log.info('Componentes incluidos:');
    Object.entries(results).forEach(([component, success]) => {
      const status = success ? '✓' : '✗';
      log.info(`  ${component}: ${status}`);
    });
    
    return compressedFile;
    
  } catch (error) {
    log.error(`Error durante backup: ${error.message}`);
    
    // Limpiar en caso de error
    if (fs.existsSync(backupPath)) {
      fs.rmSync(backupPath, { recursive: true, force: true });
    }
    
    throw error;
  }
}

// Función para mostrar ayuda
function showHelp() {
  console.log(`
Uso: node backup-automated.js [opciones]

Opciones:
  --full       Backup completo (default)
  --code       Solo código fuente
  --config     Solo configuración
  --database   Solo base de datos
  --logs       Solo logs
  --help       Mostrar esta ayuda

Ejemplos:
  node backup-automated.js
  node backup-automated.js --code
  node backup-automated.js --database
`);
}

// Parsear argumentos de línea de comandos
const args = process.argv.slice(2);
let backupType = 'full';

if (args.includes('--help')) {
  showHelp();
  process.exit(0);
} else if (args.includes('--code')) {
  backupType = 'code';
} else if (args.includes('--config')) {
  backupType = 'config';
} else if (args.includes('--database')) {
  backupType = 'database';
} else if (args.includes('--logs')) {
  backupType = 'logs';
}

// Ejecutar backup
if (require.main === module) {
  createBackup(backupType).catch(error => {
    log.error(`Error fatal: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { createBackup, cleanupOldBackups, verifyBackup };
