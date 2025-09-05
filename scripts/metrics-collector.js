#!/usr/bin/env node

/**
 * Recolector de métricas avanzadas para AbmMcn
 * Recopila métricas de aplicación, sistema, base de datos y negocio
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sql = require('mssql');
const os = require('os');
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

// Configuración de métricas
const metricsConfig = {
  outputDir: path.join(__dirname, '../metrics'),
  retentionDays: 30,
  collectionInterval: 60000, // 1 minuto
  enableRealTime: true,
  enableHistorical: true
};

// Función para obtener métricas del sistema
function getSystemMetrics() {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    // CPU usage (aproximado)
    let cpuUsage = 0;
    try {
      const cpuResult = execSync('wmic cpu get loadpercentage /value', { encoding: 'utf8' });
      const cpuMatch = cpuResult.match(/LoadPercentage=(\d+)/);
      cpuUsage = cpuMatch ? parseInt(cpuMatch[1]) : 0;
    } catch (error) {
      // Fallback: calcular basado en load average
      const loadAvg = os.loadavg();
      cpuUsage = Math.min(100, (loadAvg[0] / cpus.length) * 100);
    }
    
    // Disk usage
    let diskUsage = {};
    try {
      const diskResult = execSync('wmic logicaldisk where size>0 get size,freespace,caption /value', { encoding: 'utf8' });
      const diskLines = diskResult.split('\n').filter(line => line.includes('Caption='));
      
      diskLines.forEach(line => {
        const size = parseInt(line.match(/Size=(\d+)/)?.[1] || '0');
        const free = parseInt(line.match(/FreeSpace=(\d+)/)?.[1] || '0');
        const used = size - free;
        const percent = size > 0 ? Math.round((used / size) * 100) : 0;
        
        const drive = line.match(/Caption=([A-Z]:)/)?.[1];
        if (drive) {
          diskUsage[drive] = {
            total: size,
            used: used,
            free: free,
            percent: percent
          };
        }
      });
    } catch (error) {
      log.warning('No se pudieron obtener métricas de disco');
    }
    
    return {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: Math.round(cpuUsage),
        cores: cpus.length,
        model: cpus[0]?.model || 'Unknown'
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        percent: Math.round((usedMem / totalMem) * 100)
      },
      disk: diskUsage,
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname()
    };
  } catch (error) {
    log.error(`Error obteniendo métricas del sistema: ${error.message}`);
    return null;
  }
}

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
      timestamp: new Date().toISOString(),
      name: app.name,
      status: app.pm2_env.status,
      uptime: app.pm2_env.uptime,
      restarts: app.pm2_env.restart_time,
      cpu: app.monit.cpu,
      memory: app.monit.memory,
      pid: app.pid,
      instances: app.pm2_env.instances || 1,
      execMode: app.pm2_env.exec_mode || 'fork'
    };
  } catch (error) {
    log.error(`Error obteniendo métricas de PM2: ${error.message}`);
    return null;
  }
}

// Función para obtener métricas de la aplicación
async function getApplicationMetrics() {
  try {
    const response = await fetch('http://localhost:3001/api/health/detailed');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Métricas adicionales de la aplicación
    const additionalMetrics = {
      timestamp: new Date().toISOString(),
      version: data.version || '1.0.0',
      environment: data.environment || 'production',
      uptime: data.uptime || 0,
      memory: data.memory || {},
      database: data.database || {}
    };
    
    return { ...data, ...additionalMetrics };
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
        COUNT(*) as total_connections,
        COUNT(CASE WHEN status = 'sleeping' THEN 1 END) as idle_connections,
        COUNT(CASE WHEN status = 'running' THEN 1 END) as active_connections,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_connections
      FROM sys.dm_exec_sessions 
      WHERE is_user_process = 1
    `);
    
    // Queries en ejecución
    const runningQueriesResult = await pool.request().query(`
      SELECT 
        COUNT(*) as running_queries,
        AVG(DATEDIFF(millisecond, start_time, GETDATE())) as avg_execution_time
      FROM sys.dm_exec_requests
      WHERE status IN ('running', 'runnable', 'suspended')
    `);
    
    // Tamaño de base de datos
    const dbSizeResult = await pool.request().query(`
      SELECT 
        name,
        size * 8 / 1024 as size_mb,
        max_size * 8 / 1024 as max_size_mb,
        growth * 8 / 1024 as growth_mb
      FROM sys.master_files
      WHERE database_id = DB_ID('${config.database}')
    `);
    
    // Estadísticas de transacciones
    const transactionStatsResult = await pool.request().query(`
      SELECT 
        COUNT(*) as active_transactions,
        SUM(CASE WHEN transaction_type = 1 THEN 1 ELSE 0 END) as read_write_transactions,
        SUM(CASE WHEN transaction_type = 2 THEN 1 ELSE 0 END) as read_only_transactions
      FROM sys.dm_tran_active_transactions
    `);
    
    // Estadísticas de locks
    const lockStatsResult = await pool.request().query(`
      SELECT 
        COUNT(*) as total_locks,
        COUNT(CASE WHEN request_mode = 'X' THEN 1 END) as exclusive_locks,
        COUNT(CASE WHEN request_mode = 'S' THEN 1 END) as shared_locks,
        COUNT(CASE WHEN request_mode = 'U' THEN 1 END) as update_locks
      FROM sys.dm_tran_locks
    `);
    
    await pool.close();
    
    return {
      timestamp: new Date().toISOString(),
      connections: connectionsResult.recordset[0],
      runningQueries: runningQueriesResult.recordset[0],
      databaseSize: dbSizeResult.recordset,
      transactions: transactionStatsResult.recordset[0],
      locks: lockStatsResult.recordset[0]
    };
  } catch (error) {
    log.error(`Error obteniendo métricas de base de datos: ${error.message}`);
    return null;
  }
}

// Función para obtener métricas de negocio
async function getBusinessMetrics() {
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
    
    // Usuarios activos
    const activeUsersResult = await pool.request().query(`
      SELECT COUNT(*) as total_users
      FROM users
      WHERE created_at >= DATEADD(day, -30, GETDATE())
    `);
    
    // Operaciones por día
    const dailyOperationsResult = await pool.request().query(`
      SELECT 
        COUNT(*) as total_operations,
        COUNT(CASE WHEN level = 'info' THEN 1 END) as successful_operations,
        COUNT(CASE WHEN level = 'error' THEN 1 END) as failed_operations
      FROM audit_logs
      WHERE timestamp >= DATEADD(day, -1, GETDATE())
    `);
    
    // Tablas más utilizadas
    const tableUsageResult = await pool.request().query(`
      SELECT TOP 10
        t.name as table_name,
        p.rows as row_count,
        SUM(a.user_seeks + a.user_scans + a.user_lookups) as total_accesses
      FROM sys.tables t
      INNER JOIN sys.partitions p ON t.object_id = p.object_id
      LEFT JOIN sys.dm_db_index_usage_stats a ON t.object_id = a.object_id
      WHERE p.index_id IN (0,1)
      GROUP BY t.name, p.rows
      ORDER BY total_accesses DESC
    `);
    
    await pool.close();
    
    return {
      timestamp: new Date().toISOString(),
      users: activeUsersResult.recordset[0],
      operations: dailyOperationsResult.recordset[0],
      tableUsage: tableUsageResult.recordset
    };
  } catch (error) {
    log.error(`Error obteniendo métricas de negocio: ${error.message}`);
    return null;
  }
}

// Función para recopilar todas las métricas
async function collectAllMetrics() {
  const timestamp = new Date().toISOString();
  
  log.info(`Recopilando métricas - ${timestamp}`);
  
  const metrics = {
    timestamp,
    system: getSystemMetrics(),
    pm2: getPM2Metrics(),
    application: await getApplicationMetrics(),
    database: await getDatabaseMetrics(),
    business: await getBusinessMetrics()
  };
  
  return metrics;
}

// Función para guardar métricas en archivo
function saveMetrics(metrics) {
  try {
    if (!fs.existsSync(metricsConfig.outputDir)) {
      fs.mkdirSync(metricsConfig.outputDir, { recursive: true });
    }
    
    const date = new Date().toISOString().split('T')[0];
    const filename = `metrics-${date}.jsonl`;
    const filepath = path.join(metricsConfig.outputDir, filename);
    
    const line = JSON.stringify(metrics) + '\n';
    fs.appendFileSync(filepath, line);
    
    log.success(`Métricas guardadas: ${filename}`);
    return true;
  } catch (error) {
    log.error(`Error guardando métricas: ${error.message}`);
    return false;
  }
}

// Función para limpiar métricas antiguas
function cleanupOldMetrics() {
  try {
    if (!fs.existsSync(metricsConfig.outputDir)) {
      return;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - metricsConfig.retentionDays);
    
    const files = fs.readdirSync(metricsConfig.outputDir)
      .filter(name => name.startsWith('metrics-') && name.endsWith('.jsonl'))
      .map(name => ({
        name,
        path: path.join(metricsConfig.outputDir, name),
        mtime: fs.statSync(path.join(metricsConfig.outputDir, name)).mtime
      }));
    
    files.forEach(file => {
      if (file.mtime < cutoffDate) {
        fs.unlinkSync(file.path);
        log.info(`Métricas eliminadas: ${file.name}`);
      }
    });
    
  } catch (error) {
    log.warning(`Error limpiando métricas antiguas: ${error.message}`);
  }
}

// Función para mostrar métricas en tiempo real
function displayMetrics(metrics) {
  console.clear();
  log.header('📊 MÉTRICAS EN TIEMPO REAL - AbmMcn');
  console.log(`Última actualización: ${new Date().toLocaleString()}\n`);
  
  // Sistema
  if (metrics.system) {
    log.header('💻 Sistema');
    console.log(`CPU: ${metrics.system.cpu.usage}% (${metrics.system.cpu.cores} cores)`);
    console.log(`Memoria: ${metrics.system.memory.percent}% (${Math.round(metrics.system.memory.used / 1024 / 1024)}MB / ${Math.round(metrics.system.memory.total / 1024 / 1024)}MB)`);
    console.log(`Uptime: ${Math.round(metrics.system.uptime / 3600)} horas`);
    
    if (Object.keys(metrics.system.disk).length > 0) {
      console.log('Disco:');
      Object.entries(metrics.system.disk).forEach(([drive, info]) => {
        console.log(`  ${drive}: ${info.percent}% (${Math.round(info.used / 1024 / 1024 / 1024)}GB / ${Math.round(info.total / 1024 / 1024 / 1024)}GB)`);
      });
    }
  }
  
  // PM2
  if (metrics.pm2) {
    log.header('🚀 Aplicación');
    console.log(`Estado: ${metrics.pm2.status}`);
    console.log(`CPU: ${metrics.pm2.cpu}%`);
    console.log(`Memoria: ${Math.round(metrics.pm2.memory / 1024 / 1024)}MB`);
    console.log(`Uptime: ${Math.round(metrics.pm2.uptime / 1000 / 60)} minutos`);
    console.log(`Reinicios: ${metrics.pm2.restarts}`);
  }
  
  // Base de datos
  if (metrics.database) {
    log.header('🗄️ Base de Datos');
    console.log(`Conexiones: ${metrics.database.connections.total_connections} total, ${metrics.database.connections.active_connections} activas`);
    console.log(`Queries ejecutándose: ${metrics.database.runningQueries.running_queries}`);
    console.log(`Transacciones activas: ${metrics.database.transactions.active_transactions}`);
    console.log(`Locks: ${metrics.database.locks.total_locks} total`);
    
    if (metrics.database.databaseSize.length > 0) {
      const dbSize = metrics.database.databaseSize[0];
      console.log(`Tamaño BD: ${dbSize.size_mb}MB`);
    }
  }
  
  // Negocio
  if (metrics.business) {
    log.header('📈 Negocio');
    console.log(`Usuarios (30 días): ${metrics.business.users.total_users}`);
    console.log(`Operaciones (24h): ${metrics.business.operations.total_operations}`);
    console.log(`Éxito: ${metrics.business.operations.successful_operations}, Fallos: ${metrics.business.operations.failed_operations}`);
    
    if (metrics.business.tableUsage.length > 0) {
      console.log('Tablas más utilizadas:');
      metrics.business.tableUsage.slice(0, 3).forEach(table => {
        console.log(`  ${table.table_name}: ${table.total_accesses} accesos`);
      });
    }
  }
}

// Función principal de recolección
async function startMetricsCollection(interval = metricsConfig.collectionInterval) {
  log.header('📊 INICIANDO RECOLECCIÓN DE MÉTRICAS');
  log.info(`Intervalo: ${interval / 1000} segundos`);
  log.info('Presiona Ctrl+C para detener\n');
  
  let isRunning = true;
  
  // Manejar señal de interrupción
  process.on('SIGINT', () => {
    log.info('\nDeteniendo recolección de métricas...');
    isRunning = false;
    process.exit(0);
  });
  
  // Limpiar métricas antiguas al inicio
  cleanupOldMetrics();
  
  while (isRunning) {
    try {
      const metrics = await collectAllMetrics();
      
      // Guardar métricas
      if (metricsConfig.enableHistorical) {
        saveMetrics(metrics);
      }
      
      // Mostrar en tiempo real
      if (metricsConfig.enableRealTime) {
        displayMetrics(metrics);
      }
      
      // Esperar antes del siguiente ciclo
      await new Promise(resolve => setTimeout(resolve, interval));
      
    } catch (error) {
      log.error(`Error en recolección de métricas: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
}

// Función para mostrar ayuda
function showHelp() {
  console.log(`
Uso: node metrics-collector.js [opciones]

Opciones:
  --interval <ms>    Intervalo de recolección en milisegundos (default: 60000)
  --no-realtime      Deshabilitar visualización en tiempo real
  --no-historical    Deshabilitar guardado histórico
  --cleanup          Limpiar métricas antiguas y salir
  --help             Mostrar esta ayuda

Ejemplos:
  node metrics-collector.js
  node metrics-collector.js --interval 30000
  node metrics-collector.js --no-realtime
  node metrics-collector.js --cleanup
`);
}

// Parsear argumentos de línea de comandos
const args = process.argv.slice(2);
let interval = metricsConfig.collectionInterval;
let enableRealTime = true;
let enableHistorical = true;

if (args.includes('--help')) {
  showHelp();
  process.exit(0);
} else if (args.includes('--cleanup')) {
  cleanupOldMetrics();
  log.success('Limpieza de métricas completada');
  process.exit(0);
}

const intervalIndex = args.indexOf('--interval');
if (intervalIndex !== -1 && args[intervalIndex + 1]) {
  interval = parseInt(args[intervalIndex + 1]);
}

if (args.includes('--no-realtime')) {
  enableRealTime = false;
}

if (args.includes('--no-historical')) {
  enableHistorical = false;
}

// Actualizar configuración
metricsConfig.collectionInterval = interval;
metricsConfig.enableRealTime = enableRealTime;
metricsConfig.enableHistorical = enableHistorical;

// Ejecutar recolección
if (require.main === module) {
  startMetricsCollection(interval).catch(error => {
    log.error(`Error fatal: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  collectAllMetrics,
  getSystemMetrics,
  getPM2Metrics,
  getApplicationMetrics,
  getDatabaseMetrics,
  getBusinessMetrics,
  saveMetrics,
  cleanupOldMetrics
};
