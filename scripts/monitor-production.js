#!/usr/bin/env node

/**
 * Script de monitoreo avanzado para producción
 * Monitorea aplicación, base de datos, recursos del sistema y alertas
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sql = require('mssql');
require('dotenv').config({ path: path.join(__dirname, '.env') });

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
  alert: (msg) => console.log(`${colors.red}🚨${colors.reset} ${msg}`)
};

// Configuración de monitoreo
const monitorConfig = {
  thresholds: {
    cpu: 80,           // Porcentaje de CPU
    memory: 85,        // Porcentaje de memoria
    disk: 90,          // Porcentaje de disco
    responseTime: 2000, // Tiempo de respuesta en ms
    errorRate: 5,      // Porcentaje de errores
    dbConnections: 15  // Conexiones de BD activas
  },
  intervals: {
    quick: 5000,       // 5 segundos
    normal: 30000,     // 30 segundos
    slow: 300000       // 5 minutos
  },
  logFile: path.join(__dirname, '../logs/monitor.log')
};

// Función para obtener métricas de PM2
function getPM2Metrics() {
  try {
    const result = execSync('pm2 jlist', { encoding: 'utf8' });
    const processes = JSON.parse(result);
    
    if (processes.length === 0) {
      return null;
    }
    
    const app = processes.find(p => p.name === 'abmmcn-backend') || processes[0];
    
    return {
      status: app.pm2_env.status,
      uptime: app.pm2_env.uptime,
      restarts: app.pm2_env.restart_time,
      cpu: app.monit.cpu,
      memory: app.monit.memory,
      pid: app.pid
    };
  } catch (error) {
    log.error(`Error obteniendo métricas PM2: ${error.message}`);
    return null;
  }
}

// Función para obtener métricas del sistema
function getSystemMetrics() {
  try {
    // CPU
    const cpuResult = execSync('wmic cpu get loadpercentage /value', { encoding: 'utf8' });
    const cpuMatch = cpuResult.match(/LoadPercentage=(\d+)/);
    const cpu = cpuMatch ? parseInt(cpuMatch[1]) : 0;
    
    // Memoria
    const memResult = execSync('wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value', { encoding: 'utf8' });
    const totalMem = parseInt(memResult.match(/TotalVisibleMemorySize=(\d+)/)?.[1] || '0');
    const freeMem = parseInt(memResult.match(/FreePhysicalMemory=(\d+)/)?.[1] || '0');
    const usedMem = totalMem - freeMem;
    const memoryPercent = totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : 0;
    
    // Disco
    const diskResult = execSync('wmic logicaldisk where size>0 get size,freespace,caption /value', { encoding: 'utf8' });
    const diskLines = diskResult.split('\n').filter(line => line.includes('Caption='));
    let totalDisk = 0;
    let freeDisk = 0;
    
    diskLines.forEach(line => {
      const size = parseInt(line.match(/Size=(\d+)/)?.[1] || '0');
      const free = parseInt(line.match(/FreeSpace=(\d+)/)?.[1] || '0');
      totalDisk += size;
      freeDisk += free;
    });
    
    const usedDisk = totalDisk - freeDisk;
    const diskPercent = totalDisk > 0 ? Math.round((usedDisk / totalDisk) * 100) : 0;
    
    return {
      cpu,
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        percent: memoryPercent
      },
      disk: {
        total: totalDisk,
        used: usedDisk,
        free: freeDisk,
        percent: diskPercent
      }
    };
  } catch (error) {
    log.error(`Error obteniendo métricas del sistema: ${error.message}`);
    return null;
  }
}

// Función para obtener métricas de la aplicación
async function getAppMetrics() {
  try {
    const response = await fetch('http://localhost:3001/api/health/detailed');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    log.error(`Error obteniendo métricas de aplicación: ${error.message}`);
    return null;
  }
}

// Función para obtener métricas de base de datos
async function getDatabaseMetrics() {
  try {
    const config = {
      server: process.env.DB_SERVER,
      port: parseInt(process.env.DB_PORT) || 1433,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_CERT === 'true'
      }
    };
    
    const pool = await sql.connect(config);
    
    // Conexiones activas
    const connectionsResult = await pool.request().query(`
      SELECT 
        COUNT(*) as active_connections,
        COUNT(CASE WHEN status = 'sleeping' THEN 1 END) as idle_connections
      FROM sys.dm_exec_sessions 
      WHERE is_user_process = 1
    `);
    
    // Queries lentas
    const slowQueriesResult = await pool.request().query(`
      SELECT TOP 5
        t.text as query_text,
        s.execution_count,
        s.total_elapsed_time / s.execution_count as avg_elapsed_time,
        s.last_execution_time
      FROM sys.dm_exec_query_stats s
      CROSS APPLY sys.dm_exec_sql_text(s.sql_handle) t
      WHERE s.total_elapsed_time / s.execution_count > 1000
      ORDER BY avg_elapsed_time DESC
    `);
    
    // Tamaño de base de datos
    const dbSizeResult = await pool.request().query(`
      SELECT 
        name,
        size * 8 / 1024 as size_mb,
        max_size * 8 / 1024 as max_size_mb
      FROM sys.master_files
      WHERE database_id = DB_ID('${config.database}')
    `);
    
    await pool.close();
    
    return {
      connections: connectionsResult.recordset[0],
      slowQueries: slowQueriesResult.recordset,
      databaseSize: dbSizeResult.recordset[0]
    };
  } catch (error) {
    log.error(`Error obteniendo métricas de base de datos: ${error.message}`);
    return null;
  }
}

// Función para verificar alertas
function checkAlerts(pm2Metrics, systemMetrics, appMetrics, dbMetrics) {
  const alerts = [];
  
  // Alertas de PM2
  if (pm2Metrics) {
    if (pm2Metrics.status !== 'online') {
      alerts.push({
        level: 'critical',
        component: 'PM2',
        message: `Aplicación no está online: ${pm2Metrics.status}`
      });
    }
    
    if (pm2Metrics.cpu > monitorConfig.thresholds.cpu) {
      alerts.push({
        level: 'warning',
        component: 'PM2',
        message: `CPU alto: ${pm2Metrics.cpu}%`
      });
    }
    
    if (pm2Metrics.memory > monitorConfig.thresholds.memory * 1024 * 1024) {
      alerts.push({
        level: 'warning',
        component: 'PM2',
        message: `Memoria alta: ${Math.round(pm2Metrics.memory / 1024 / 1024)}MB`
      });
    }
  }
  
  // Alertas del sistema
  if (systemMetrics) {
    if (systemMetrics.cpu > monitorConfig.thresholds.cpu) {
      alerts.push({
        level: 'warning',
        component: 'System',
        message: `CPU del sistema alto: ${systemMetrics.cpu}%`
      });
    }
    
    if (systemMetrics.memory.percent > monitorConfig.thresholds.memory) {
      alerts.push({
        level: 'warning',
        component: 'System',
        message: `Memoria del sistema alta: ${systemMetrics.memory.percent}%`
      });
    }
    
    if (systemMetrics.disk.percent > monitorConfig.thresholds.disk) {
      alerts.push({
        level: 'critical',
        component: 'System',
        message: `Disco lleno: ${systemMetrics.disk.percent}%`
      });
    }
  }
  
  // Alertas de base de datos
  if (dbMetrics) {
    if (dbMetrics.connections.active_connections > monitorConfig.thresholds.dbConnections) {
      alerts.push({
        level: 'warning',
        component: 'Database',
        message: `Muchas conexiones activas: ${dbMetrics.connections.active_connections}`
      });
    }
  }
  
  return alerts;
}

// Función para mostrar dashboard
function displayDashboard(pm2Metrics, systemMetrics, appMetrics, dbMetrics, alerts) {
  console.clear();
  log.header('📊 DASHBOARD DE MONITOREO - AbmMcn');
  console.log(`Última actualización: ${new Date().toLocaleString()}\n`);
  
  // Estado de la aplicación
  log.header('🚀 Estado de la Aplicación');
  if (pm2Metrics) {
    const statusColor = pm2Metrics.status === 'online' ? colors.green : colors.red;
    console.log(`Estado: ${statusColor}${pm2Metrics.status.toUpperCase()}${colors.reset}`);
    console.log(`PID: ${pm2Metrics.pid}`);
    console.log(`Uptime: ${Math.round(pm2Metrics.uptime / 1000 / 60)} minutos`);
    console.log(`Reinicios: ${pm2Metrics.restarts}`);
    console.log(`CPU: ${pm2Metrics.cpu}%`);
    console.log(`Memoria: ${Math.round(pm2Metrics.memory / 1024 / 1024)}MB`);
  } else {
    log.error('No se pudieron obtener métricas de PM2');
  }
  
  // Métricas del sistema
  log.header('💻 Sistema');
  if (systemMetrics) {
    console.log(`CPU: ${systemMetrics.cpu}%`);
    console.log(`Memoria: ${systemMetrics.memory.percent}% (${Math.round(systemMetrics.memory.used / 1024 / 1024)}MB / ${Math.round(systemMetrics.memory.total / 1024 / 1024)}MB)`);
    console.log(`Disco: ${systemMetrics.disk.percent}% (${Math.round(systemMetrics.disk.used / 1024 / 1024 / 1024)}GB / ${Math.round(systemMetrics.disk.total / 1024 / 1024 / 1024)}GB)`);
  } else {
    log.error('No se pudieron obtener métricas del sistema');
  }
  
  // Métricas de base de datos
  log.header('🗄️ Base de Datos');
  if (dbMetrics) {
    console.log(`Conexiones activas: ${dbMetrics.connections.active_connections}`);
    console.log(`Conexiones inactivas: ${dbMetrics.connections.idle_connections}`);
    console.log(`Tamaño BD: ${dbMetrics.databaseSize?.size_mb || 'N/A'}MB`);
    
    if (dbMetrics.slowQueries.length > 0) {
      console.log(`\nQueries lentas detectadas: ${dbMetrics.slowQueries.length}`);
    }
  } else {
    log.error('No se pudieron obtener métricas de base de datos');
  }
  
  // Alertas
  if (alerts.length > 0) {
    log.header('🚨 Alertas');
    alerts.forEach(alert => {
      const color = alert.level === 'critical' ? colors.red : colors.yellow;
      console.log(`${color}[${alert.level.toUpperCase()}]${colors.reset} ${alert.component}: ${alert.message}`);
    });
  } else {
    log.success('✅ Sin alertas - Sistema funcionando correctamente');
  }
  
  // Logs recientes
  log.header('📝 Logs Recientes');
  try {
    const logFile = path.join(__dirname, '../logs/combined.log');
    if (fs.existsSync(logFile)) {
      const logs = fs.readFileSync(logFile, 'utf8').split('\n').slice(-5);
      logs.forEach(log => {
        if (log.trim()) {
          console.log(log);
        }
      });
    }
  } catch (error) {
    log.warning('No se pudieron leer los logs');
  }
}

// Función para guardar métricas en log
function logMetrics(pm2Metrics, systemMetrics, appMetrics, dbMetrics, alerts) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    pm2: pm2Metrics,
    system: systemMetrics,
    app: appMetrics,
    database: dbMetrics,
    alerts: alerts.length
  };
  
  try {
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(monitorConfig.logFile, logLine);
  } catch (error) {
    log.error(`Error guardando métricas: ${error.message}`);
  }
}

// Función principal de monitoreo
async function startMonitoring(interval = monitorConfig.intervals.normal) {
  log.header('🔍 INICIANDO MONITOREO DE PRODUCCIÓN');
  log.info(`Intervalo de monitoreo: ${interval / 1000} segundos`);
  log.info('Presiona Ctrl+C para detener\n');
  
  let isRunning = true;
  
  // Manejar señal de interrupción
  process.on('SIGINT', () => {
    log.info('\nDeteniendo monitoreo...');
    isRunning = false;
    process.exit(0);
  });
  
  while (isRunning) {
    try {
      // Obtener métricas
      const pm2Metrics = getPM2Metrics();
      const systemMetrics = getSystemMetrics();
      const appMetrics = await getAppMetrics();
      const dbMetrics = await getDatabaseMetrics();
      
      // Verificar alertas
      const alerts = checkAlerts(pm2Metrics, systemMetrics, appMetrics, dbMetrics);
      
      // Mostrar dashboard
      displayDashboard(pm2Metrics, systemMetrics, appMetrics, dbMetrics, alerts);
      
      // Guardar métricas
      logMetrics(pm2Metrics, systemMetrics, appMetrics, dbMetrics, alerts);
      
      // Enviar alertas críticas
      const criticalAlerts = alerts.filter(alert => alert.level === 'critical');
      if (criticalAlerts.length > 0) {
        log.alert(`ALERTAS CRÍTICAS: ${criticalAlerts.length}`);
        // Aquí se podría implementar envío de notificaciones
      }
      
      // Esperar antes del siguiente ciclo
      await new Promise(resolve => setTimeout(resolve, interval));
      
    } catch (error) {
      log.error(`Error en ciclo de monitoreo: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
}

// Función para mostrar ayuda
function showHelp() {
  console.log(`
Uso: node monitor-production.js [opciones]

Opciones:
  --quick      Monitoreo rápido (5 segundos)
  --slow       Monitoreo lento (5 minutos)
  --normal     Monitoreo normal (30 segundos) [default]
  --help       Mostrar esta ayuda

Ejemplos:
  node monitor-production.js
  node monitor-production.js --quick
  node monitor-production.js --slow
`);
}

// Parsear argumentos de línea de comandos
const args = process.argv.slice(2);
let interval = monitorConfig.intervals.normal;

if (args.includes('--help')) {
  showHelp();
  process.exit(0);
} else if (args.includes('--quick')) {
  interval = monitorConfig.intervals.quick;
} else if (args.includes('--slow')) {
  interval = monitorConfig.intervals.slow;
}

// Ejecutar monitoreo
if (require.main === module) {
  startMonitoring(interval).catch(error => {
    log.error(`Error fatal: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  startMonitoring,
  getPM2Metrics,
  getSystemMetrics,
  getAppMetrics,
  getDatabaseMetrics,
  checkAlerts
};
