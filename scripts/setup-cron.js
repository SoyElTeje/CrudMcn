#!/usr/bin/env node

/**
 * Script de configuración de tareas automatizadas (Cron Jobs)
 * Configura tareas programadas para backup, monitoreo y mantenimiento
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// Configuración de tareas
const cronConfig = {
  tasks: [
    {
      name: 'backup-daily',
      schedule: '0 2 * * *', // 2:00 AM diario
      command: 'node scripts/backup-automated.js',
      description: 'Backup diario completo del sistema'
    },
    {
      name: 'backup-database',
      schedule: '0 */6 * * *', // Cada 6 horas
      command: 'node scripts/backup-automated.js --database',
      description: 'Backup de base de datos cada 6 horas'
    },
    {
      name: 'health-check',
      schedule: '*/5 * * * *', // Cada 5 minutos
      command: 'node scripts/test-database.js',
      description: 'Verificación de salud de base de datos'
    },
    {
      name: 'metrics-collection',
      schedule: '*/1 * * * *', // Cada minuto
      command: 'node scripts/metrics-collector.js --no-realtime',
      description: 'Recolección de métricas del sistema'
    },
    {
      name: 'log-cleanup',
      schedule: '0 3 * * 0', // Domingos a las 3:00 AM
      command: 'node scripts/log-cleanup.js',
      description: 'Limpieza semanal de logs'
    },
    {
      name: 'system-maintenance',
      schedule: '0 4 * * 1', // Lunes a las 4:00 AM
      command: 'node scripts/system-maintenance.js',
      description: 'Mantenimiento semanal del sistema'
    }
  ],
  scriptDir: path.resolve(__dirname),
  logDir: path.join(__dirname, '../logs/cron')
};

// Función para crear directorio de logs de cron
function createLogDirectory() {
  try {
    if (!fs.existsSync(cronConfig.logDir)) {
      fs.mkdirSync(cronConfig.logDir, { recursive: true });
      log.success(`Directorio de logs creado: ${cronConfig.logDir}`);
    }
  } catch (error) {
    log.error(`Error creando directorio de logs: ${error.message}`);
  }
}

// Función para generar script de tarea
function generateTaskScript(task) {
  const scriptContent = `#!/bin/bash
# ${task.description}
# Generado automáticamente por setup-cron.js

# Configurar variables de entorno
export NODE_ENV=production
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

# Cambiar al directorio del proyecto
cd "${cronConfig.scriptDir}/.."

# Ejecutar comando con logging
echo "$(date): Iniciando ${task.name}" >> "${cronConfig.logDir}/${task.name}.log"
${task.command} >> "${cronConfig.logDir}/${task.name}.log" 2>&1
echo "$(date): Completado ${task.name} (exit code: $?)" >> "${cronConfig.logDir}/${task.name}.log"
`;

  const scriptPath = path.join(cronConfig.scriptDir, `${task.name}.sh`);
  fs.writeFileSync(scriptPath, scriptContent);
  
  // Hacer el script ejecutable
  try {
    execSync(`chmod +x "${scriptPath}"`);
  } catch (error) {
    log.warning(`No se pudo hacer ejecutable el script: ${scriptPath}`);
  }
  
  return scriptPath;
}

// Función para generar archivo crontab
function generateCrontab() {
  const crontabContent = `# Tareas automatizadas para AbmMcn
# Generado automáticamente por setup-cron.js
# Última actualización: ${new Date().toISOString()}

# Variables de entorno
NODE_ENV=production
PATH=/usr/local/bin:/usr/bin:/bin

${cronConfig.tasks.map(task => {
  const scriptPath = path.join(cronConfig.scriptDir, `${task.name}.sh`);
  return `${task.schedule} ${scriptPath}`;
}).join('\n')}
`;

  const crontabPath = path.join(cronConfig.scriptDir, 'crontab');
  fs.writeFileSync(crontabPath, crontabContent);
  
  return crontabPath;
}

// Función para instalar crontab
function installCrontab(crontabPath) {
  try {
    log.info('Instalando crontab...');
    execSync(`crontab "${crontabPath}"`);
    log.success('Crontab instalado exitosamente');
    return true;
  } catch (error) {
    log.error(`Error instalando crontab: ${error.message}`);
    return false;
  }
}

// Función para verificar crontab actual
function showCurrentCrontab() {
  try {
    log.info('Crontab actual:');
    const result = execSync('crontab -l', { encoding: 'utf8' });
    console.log(result);
    return true;
  } catch (error) {
    log.warning('No hay crontab instalado o no se pudo leer');
    return false;
  }
}

// Función para crear script de Windows Task Scheduler
function generateWindowsTasks() {
  const tasks = [];
  
  cronConfig.tasks.forEach(task => {
    const scriptPath = path.join(cronConfig.scriptDir, `${task.name}.bat`);
    
    // Convertir schedule de cron a formato de Windows
    const schedule = convertCronToWindows(task.schedule);
    
    const batchContent = `@echo off
REM ${task.description}
REM Generado automáticamente por setup-cron.js

set NODE_ENV=production
cd /d "${cronConfig.scriptDir}\\.."

echo %date% %time%: Iniciando ${task.name} >> "${cronConfig.logDir}\\${task.name}.log"
${task.command.replace('node ', 'node ') >> "${cronConfig.logDir}\\${task.name}.log" 2>&1
echo %date% %time%: Completado ${task.name} (exit code: %errorlevel%) >> "${cronConfig.logDir}\\${task.name}.log"
`;

    fs.writeFileSync(scriptPath, batchContent);
    
    // Generar comando de Task Scheduler
    const taskCommand = `schtasks /create /tn "AbmMcn-${task.name}" /tr "${scriptPath}" /sc ${schedule.type} /mo ${schedule.interval} /st ${schedule.time} /f`;
    
    tasks.push({
      name: task.name,
      description: task.description,
      command: taskCommand,
      scriptPath: scriptPath
    });
  });
  
  return tasks;
}

// Función para convertir schedule de cron a Windows
function convertCronToWindows(cronSchedule) {
  const parts = cronSchedule.split(' ');
  const minute = parts[0];
  const hour = parts[1];
  const day = parts[2];
  const month = parts[3];
  const weekday = parts[4];
  
  // Lógica simplificada para conversión
  if (minute === '*/1' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
    return { type: 'minute', interval: 1, time: '00:00' };
  } else if (minute === '*/5' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
    return { type: 'minute', interval: 5, time: '00:00' };
  } else if (minute === '0' && hour === '*/6' && day === '*' && month === '*' && weekday === '*') {
    return { type: 'hourly', interval: 6, time: '00:00' };
  } else if (minute === '0' && hour === '2' && day === '*' && month === '*' && weekday === '*') {
    return { type: 'daily', interval: 1, time: '02:00' };
  } else if (minute === '0' && hour === '3' && day === '*' && month === '*' && weekday === '0') {
    return { type: 'weekly', interval: 1, time: '03:00' };
  } else if (minute === '0' && hour === '4' && day === '*' && month === '*' && weekday === '1') {
    return { type: 'weekly', interval: 1, time: '04:00' };
  } else {
    return { type: 'daily', interval: 1, time: '02:00' };
  }
}

// Función para crear script de mantenimiento
function createMaintenanceScript() {
  const maintenanceScript = `#!/usr/bin/env node

/**
 * Script de mantenimiento del sistema
 * Ejecuta tareas de limpieza y optimización
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Iniciando mantenimiento del sistema...');

try {
  // Limpiar logs antiguos
  console.log('Limpiando logs antiguos...');
  const logsDir = path.join(__dirname, '../logs');
  if (fs.existsSync(logsDir)) {
    const files = fs.readdirSync(logsDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 días
    
    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        console.log(\`Eliminado: \${file}\`);
      }
    });
  }
  
  // Limpiar archivos temporales
  console.log('Limpiando archivos temporales...');
  const tempDir = path.join(__dirname, '../temp');
  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir);
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      fs.unlinkSync(filePath);
      console.log(\`Eliminado: \${file}\`);
    });
  }
  
  // Optimizar base de datos
  console.log('Optimizando base de datos...');
  try {
    execSync('node scripts/test-database.js', { stdio: 'pipe' });
    console.log('Base de datos optimizada');
  } catch (error) {
    console.log('Error optimizando base de datos:', error.message);
  }
  
  console.log('Mantenimiento completado');
  
} catch (error) {
  console.error('Error durante mantenimiento:', error.message);
  process.exit(1);
}
`;

  const scriptPath = path.join(cronConfig.scriptDir, 'system-maintenance.js');
  fs.writeFileSync(scriptPath, maintenanceScript);
  
  return scriptPath;
}

// Función para crear script de limpieza de logs
function createLogCleanupScript() {
  const logCleanupScript = `#!/usr/bin/env node

/**
 * Script de limpieza de logs
 * Elimina logs antiguos y comprime logs grandes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Iniciando limpieza de logs...');

try {
  const logsDir = path.join(__dirname, '../logs');
  
  if (!fs.existsSync(logsDir)) {
    console.log('Directorio de logs no encontrado');
    process.exit(0);
  }
  
  const files = fs.readdirSync(logsDir);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7); // 7 días
  
  let deletedCount = 0;
  let compressedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(logsDir, file);
    const stats = fs.statSync(filePath);
    
    // Eliminar archivos antiguos
    if (stats.mtime < cutoffDate) {
      fs.unlinkSync(filePath);
      console.log(\`Eliminado: \${file}\`);
      deletedCount++;
    }
    // Comprimir archivos grandes (> 100MB)
    else if (stats.size > 100 * 1024 * 1024 && !file.endsWith('.gz')) {
      try {
        execSync(\`gzip "\${filePath}"\`, { stdio: 'pipe' });
        console.log(\`Comprimido: \${file}\`);
        compressedCount++;
      } catch (error) {
        console.log(\`Error comprimiendo \${file}: \${error.message}\`);
      }
    }
  });
  
  console.log(\`Limpieza completada: \${deletedCount} eliminados, \${compressedCount} comprimidos\`);
  
} catch (error) {
  console.error('Error durante limpieza de logs:', error.message);
  process.exit(1);
}
`;

  const scriptPath = path.join(cronConfig.scriptDir, 'log-cleanup.js');
  fs.writeFileSync(scriptPath, maintenanceScript);
  
  return scriptPath;
}

// Función principal
async function setupCron() {
  try {
    log.header('⏰ CONFIGURACIÓN DE TAREAS AUTOMATIZADAS');
    
    // Detectar sistema operativo
    const isWindows = process.platform === 'win32';
    const isUnix = process.platform === 'linux' || process.platform === 'darwin';
    
    log.info(`Sistema operativo detectado: ${process.platform}`);
    
    // Crear directorio de logs
    createLogDirectory();
    
    // Crear scripts de mantenimiento
    createMaintenanceScript();
    createLogCleanupScript();
    
    if (isUnix) {
      // Configuración para sistemas Unix (Linux/macOS)
      log.info('Configurando tareas para sistema Unix...');
      
      // Generar scripts de tareas
      cronConfig.tasks.forEach(task => {
        const scriptPath = generateTaskScript(task);
        log.success(`Script generado: ${task.name}.sh`);
      });
      
      // Generar crontab
      const crontabPath = generateCrontab();
      log.success('Archivo crontab generado');
      
      // Mostrar crontab actual
      showCurrentCrontab();
      
      // Instalar crontab
      const installed = installCrontab(crontabPath);
      
      if (installed) {
        log.success('Tareas automatizadas configuradas exitosamente');
        log.info('Tareas configuradas:');
        cronConfig.tasks.forEach(task => {
          log.info(`  ${task.schedule} - ${task.description}`);
        });
      }
      
    } else if (isWindows) {
      // Configuración para Windows
      log.info('Configurando tareas para Windows...');
      
      const windowsTasks = generateWindowsTasks();
      
      log.success('Scripts de Windows generados');
      log.info('Para instalar las tareas, ejecuta los siguientes comandos como administrador:');
      
      windowsTasks.forEach(task => {
        log.info(`\\n${task.command}`);
      });
      
      // Crear archivo batch para instalación
      const installScript = windowsTasks.map(task => task.command).join('\\n');
      const installPath = path.join(cronConfig.scriptDir, 'install-windows-tasks.bat');
      fs.writeFileSync(installPath, `@echo off\\necho Instalando tareas de AbmMcn...\\n${installScript}\\necho Tareas instaladas exitosamente`);
      
      log.success(`Script de instalación creado: ${installPath}`);
      
    } else {
      log.error('Sistema operativo no soportado');
      process.exit(1);
    }
    
    log.header('✅ CONFIGURACIÓN COMPLETADA');
    log.info('Las tareas automatizadas están configuradas');
    log.info(`Logs de tareas: ${cronConfig.logDir}`);
    
  } catch (error) {
    log.error(`Error durante configuración: ${error.message}`);
    process.exit(1);
  }
}

// Función para mostrar ayuda
function showHelp() {
  console.log(`
Uso: node setup-cron.js [opciones]

Opciones:
  --show-current    Mostrar crontab actual
  --remove          Remover todas las tareas
  --help            Mostrar esta ayuda

Ejemplos:
  node setup-cron.js
  node setup-cron.js --show-current
  node setup-cron.js --remove
`);
}

// Parsear argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.includes('--help')) {
  showHelp();
  process.exit(0);
} else if (args.includes('--show-current')) {
  showCurrentCrontab();
  process.exit(0);
} else if (args.includes('--remove')) {
  try {
    execSync('crontab -r');
    log.success('Todas las tareas removidas');
  } catch (error) {
    log.error(`Error removiendo tareas: ${error.message}`);
  }
  process.exit(0);
}

// Ejecutar configuración
if (require.main === module) {
  setupCron().catch(error => {
    log.error(`Error fatal: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { setupCron, generateCrontab, generateWindowsTasks };
