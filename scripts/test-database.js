#!/usr/bin/env node

/**
 * Script de test de conexión a base de datos
 * Verifica la conectividad y configuración de la base de datos
 */

const path = require('path');
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
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`)
};

// Configuración de conexión
const dbConfig = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT) || 1433,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableArithAbort: true,
    requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT) || 30000,
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 15000
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    min: parseInt(process.env.DB_POOL_MIN) || 5,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 300000,
    acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
    createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT) || 30000,
    destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT) || 5000,
    reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL) || 1000,
    createRetryIntervalMillis: parseInt(process.env.DB_CREATE_RETRY_INTERVAL) || 200
  }
};

// Función para test de conexión básica
async function testBasicConnection() {
  log.header('🔌 Test de Conexión Básica');
  
  try {
    log.info(`Conectando a ${dbConfig.server}:${dbConfig.port}...`);
    
    const pool = await sql.connect(dbConfig);
    log.success('Conexión establecida exitosamente');
    
    // Test de query simple
    const result = await pool.request().query('SELECT @@VERSION as version, GETDATE() as current_time');
    log.success(`SQL Server Version: ${result.recordset[0].version.split('\n')[0]}`);
    log.success(`Server Time: ${result.recordset[0].current_time}`);
    
    await pool.close();
    return true;
  } catch (error) {
    log.error(`Error de conexión: ${error.message}`);
    return false;
  }
}

// Función para test de base de datos específica
async function testDatabaseAccess() {
  log.header('🗄️ Test de Acceso a Base de Datos');
  
  try {
    const pool = await sql.connect(dbConfig);
    
    // Verificar que la base de datos existe
    const dbResult = await pool.request().query(`
      SELECT name, database_id, create_date 
      FROM sys.databases 
      WHERE name = '${dbConfig.database}'
    `);
    
    if (dbResult.recordset.length === 0) {
      log.warning(`Base de datos '${dbConfig.database}' no encontrada`);
      return false;
    }
    
    log.success(`Base de datos '${dbConfig.database}' encontrada`);
    log.info(`Creada: ${dbResult.recordset[0].create_date}`);
    
    // Verificar permisos
    const permResult = await pool.request().query(`
      SELECT 
        HAS_PERMS_BY_NAME('${dbConfig.database}', 'DATABASE', 'SELECT') as can_select,
        HAS_PERMS_BY_NAME('${dbConfig.database}', 'DATABASE', 'INSERT') as can_insert,
        HAS_PERMS_BY_NAME('${dbConfig.database}', 'DATABASE', 'UPDATE') as can_update,
        HAS_PERMS_BY_NAME('${dbConfig.database}', 'DATABASE', 'DELETE') as can_delete
    `);
    
    const perms = permResult.recordset[0];
    log.info('Permisos de base de datos:');
    log.info(`  SELECT: ${perms.can_select ? '✓' : '✗'}`);
    log.info(`  INSERT: ${perms.can_insert ? '✓' : '✗'}`);
    log.info(`  UPDATE: ${perms.can_update ? '✓' : '✗'}`);
    log.info(`  DELETE: ${perms.can_delete ? '✓' : '✗'}`);
    
    await pool.close();
    return true;
  } catch (error) {
    log.error(`Error de acceso a base de datos: ${error.message}`);
    return false;
  }
}

// Función para test de pool de conexiones
async function testConnectionPool() {
  log.header('🏊 Test de Pool de Conexiones');
  
  try {
    const pool = await sql.connect(dbConfig);
    
    // Test de múltiples conexiones simultáneas
    const promises = [];
    const connectionCount = Math.min(5, dbConfig.pool.max);
    
    log.info(`Probando ${connectionCount} conexiones simultáneas...`);
    
    for (let i = 0; i < connectionCount; i++) {
      promises.push(
        pool.request().query(`SELECT ${i} as connection_id, GETDATE() as timestamp`)
      );
    }
    
    const results = await Promise.all(promises);
    log.success(`${results.length} conexiones simultáneas exitosas`);
    
    // Verificar estadísticas del pool
    log.info('Estadísticas del pool:');
    log.info(`  Conexiones totales: ${pool.totalConnections}`);
    log.info(`  Conexiones activas: ${pool.activeConnections}`);
    log.info(`  Conexiones inactivas: ${pool.idleConnections}`);
    
    await pool.close();
    return true;
  } catch (error) {
    log.error(`Error en test de pool: ${error.message}`);
    return false;
  }
}

// Función para test de tablas del sistema
async function testSystemTables() {
  log.header('📋 Test de Tablas del Sistema');
  
  try {
    const pool = await sql.connect(dbConfig);
    
    // Verificar tablas necesarias
    const requiredTables = ['users', 'user_permissions', 'activated_tables', 'audit_logs'];
    const existingTables = [];
    
    for (const table of requiredTables) {
      const result = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = '${table}' AND TABLE_SCHEMA = 'dbo'
      `);
      
      if (result.recordset[0].count > 0) {
        existingTables.push(table);
        log.success(`Tabla '${table}' encontrada`);
      } else {
        log.warning(`Tabla '${table}' no encontrada`);
      }
    }
    
    if (existingTables.length === 0) {
      log.warning('No se encontraron tablas del sistema. Ejecuta los scripts de setup.');
    } else {
      log.success(`${existingTables.length}/${requiredTables.length} tablas del sistema encontradas`);
    }
    
    await pool.close();
    return true;
  } catch (error) {
    log.error(`Error en test de tablas: ${error.message}`);
    return false;
  }
}

// Función para test de rendimiento
async function testPerformance() {
  log.header('⚡ Test de Rendimiento');
  
  try {
    const pool = await sql.connect(dbConfig);
    
    // Test de query simple
    const startTime = Date.now();
    await pool.request().query('SELECT 1 as test');
    const simpleQueryTime = Date.now() - startTime;
    
    // Test de query compleja
    const complexStartTime = Date.now();
    await pool.request().query(`
      SELECT 
        COUNT(*) as table_count,
        SUM(rows) as total_rows
      FROM (
        SELECT 
          t.name as table_name,
          p.rows
        FROM sys.tables t
        INNER JOIN sys.partitions p ON t.object_id = p.object_id
        WHERE p.index_id IN (0,1)
      ) as table_stats
    `);
    const complexQueryTime = Date.now() - complexStartTime;
    
    log.info('Tiempos de respuesta:');
    log.info(`  Query simple: ${simpleQueryTime}ms`);
    log.info(`  Query compleja: ${complexQueryTime}ms`);
    
    // Evaluar rendimiento
    if (simpleQueryTime < 100) {
      log.success('Rendimiento excelente');
    } else if (simpleQueryTime < 500) {
      log.warning('Rendimiento aceptable');
    } else {
      log.error('Rendimiento lento - revisar configuración');
    }
    
    await pool.close();
    return true;
  } catch (error) {
    log.error(`Error en test de rendimiento: ${error.message}`);
    return false;
  }
}

// Función principal
async function runDatabaseTests() {
  log.header('🧪 TESTS DE BASE DE DATOS - AbmMcn');
  
  const tests = [
    { name: 'Conexión Básica', fn: testBasicConnection },
    { name: 'Acceso a Base de Datos', fn: testDatabaseAccess },
    { name: 'Pool de Conexiones', fn: testConnectionPool },
    { name: 'Tablas del Sistema', fn: testSystemTables },
    { name: 'Rendimiento', fn: testPerformance }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      log.error(`Error en test '${test.name}': ${error.message}`);
    }
  }
  
  log.header('📊 Resumen de Tests');
  log.info(`Tests pasados: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    log.success('✅ Todos los tests pasaron exitosamente');
    process.exit(0);
  } else {
    log.error('❌ Algunos tests fallaron');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runDatabaseTests().catch(error => {
    log.error(`Error fatal: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testBasicConnection,
  testDatabaseAccess,
  testConnectionPool,
  testSystemTables,
  testPerformance,
  runDatabaseTests
};
