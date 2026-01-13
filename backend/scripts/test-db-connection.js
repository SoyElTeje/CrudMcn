/**
 * Script para verificar la conexión a la base de datos SQL Server
 * 
 * Uso:
 *   - Desde el contenedor: docker exec abmmcn-app node /app/backend/scripts/test-db-connection.js
 *   - Desde el host (con .env): node backend/scripts/test-db-connection.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const sql = require('mssql');

// Cargar configuración desde variables de entorno
const config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'APPDATA',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT !== 'false',
    enableArithAbort: true,
    requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT || '30000', 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '15000', 10),
  },
};

// Colores para la consola (si está disponible)
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log(`═══════════════════════════════════════════════════════════`, 'cyan');
  log(`  ${title}`, 'bright');
  log(`═══════════════════════════════════════════════════════════`, 'cyan');
  console.log('');
}

function logInfo(label, value) {
  log(`  ${label.padEnd(25)}: ${value}`, 'blue');
}

async function testConnection() {
  logSection('🔍 Verificación de Conexión a Base de Datos');

  // Mostrar configuración (sin mostrar la contraseña completa)
  logInfo('Servidor', config.server);
  logInfo('Puerto', config.port.toString());
  logInfo('Usuario', config.user);
  logInfo('Contraseña', config.password ? `${config.password.substring(0, 3)}***` : '(no configurada)');
  logInfo('Base de datos', config.database);
  logInfo('Encriptación', config.options.encrypt ? 'Sí' : 'No');
  logInfo('Trust Certificate', config.options.trustServerCertificate ? 'Sí' : 'No');

  console.log('');
  log('⏳ Intentando conectar...', 'yellow');

  try {
    // Intentar conexión
    const pool = await sql.connect(config);
    log('✅ Conexión exitosa a la base de datos!', 'green');
    console.log('');

    // Obtener información del servidor
    logSection('📊 Información del Servidor');

    const serverInfo = await pool.request().query(`
      SELECT 
        @@VERSION as version,
        @@SERVERNAME as serverName,
        DB_NAME() as currentDatabase,
        USER_NAME() as currentUser,
        SUSER_NAME() as loginName,
        GETDATE() as serverTime
    `);

    const info = serverInfo.recordset[0];
    
    logInfo('Nombre del servidor', info.serverName || '(no disponible)');
    logInfo('Base de datos actual', info.currentDatabase);
    logInfo('Usuario actual', info.currentUser);
    logInfo('Login actual', info.loginName);
    logInfo('Hora del servidor', info.serverTime.toISOString());
    
    // Versión de SQL Server (primera línea)
    const versionLine = info.version.split('\n')[0];
    logInfo('Versión SQL Server', versionLine);

    // Verificar que la base de datos existe y es accesible
    logSection('🔐 Verificación de Permisos');

    try {
      const dbCheck = await pool.request().query(`
        SELECT 
          HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'VIEW DEFINITION') as canViewDefinition,
          HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'SELECT') as canSelect,
          HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'INSERT') as canInsert,
          HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'UPDATE') as canUpdate,
          HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'DELETE') as canDelete
      `);

      const perms = dbCheck.recordset[0];
      logInfo('Ver definiciones', perms.canViewDefinition ? '✅ Sí' : '❌ No');
      logInfo('SELECT', perms.canSelect ? '✅ Sí' : '❌ No');
      logInfo('INSERT', perms.canInsert ? '✅ Sí' : '❌ No');
      logInfo('UPDATE', perms.canUpdate ? '✅ Sí' : '❌ No');
      logInfo('DELETE', perms.canDelete ? '✅ Sí' : '❌ No');

    } catch (permError) {
      log(`⚠️  No se pudieron verificar permisos: ${permError.message}`, 'yellow');
    }

    // Verificar tablas en la base de datos
    logSection('📋 Tablas en la Base de Datos');

    try {
      const tables = await pool.request().query(`
        SELECT 
          TABLE_SCHEMA as schemaName,
          TABLE_NAME as tableName,
          TABLE_TYPE as tableType
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_SCHEMA, TABLE_NAME
      `);

      if (tables.recordset.length > 0) {
        log(`  Se encontraron ${tables.recordset.length} tablas:`, 'blue');
        console.log('');
        tables.recordset.forEach((table, index) => {
          log(`  ${(index + 1).toString().padStart(3)}. ${table.schemaName}.${table.tableName}`, 'blue');
        });
      } else {
        log('  ⚠️  No se encontraron tablas en la base de datos', 'yellow');
      }

    } catch (tableError) {
      log(`⚠️  No se pudieron listar las tablas: ${tableError.message}`, 'yellow');
    }

    // Verificar tablas específicas que la aplicación necesita
    logSection('🔍 Verificación de Tablas Requeridas');

    const requiredTables = ['users', 'user_permissions', 'activated_tables'];
    for (const tableName of requiredTables) {
      try {
        const tableExists = await pool.request()
          .input('tableName', sql.VarChar, tableName)
          .query(`
            SELECT COUNT(*) as count
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_NAME = @tableName
          `);

        const exists = tableExists.recordset[0].count > 0;
        if (exists) {
          // Contar registros
          const countResult = await pool.request().query(`SELECT COUNT(*) as count FROM [${tableName}]`);
          const count = countResult.recordset[0].count;
          log(`  ✅ ${tableName.padEnd(25)}: Existe (${count} registros)`, 'green');
        } else {
          log(`  ❌ ${tableName.padEnd(25)}: No existe`, 'red');
        }
      } catch (error) {
        log(`  ⚠️  ${tableName.padEnd(25)}: Error al verificar (${error.message})`, 'yellow');
      }
    }

    // Cerrar conexión
    await pool.close();
    console.log('');
    log('✅ Verificación completada exitosamente!', 'green');
    console.log('');

    process.exit(0);

  } catch (error) {
    console.log('');
    logSection('❌ Error de Conexión');
    
    log(`  Mensaje: ${error.message}`, 'red');
    
    if (error.code) {
      log(`  Código: ${error.code}`, 'red');
    }
    
    if (error.number) {
      log(`  Número de error SQL: ${error.number}`, 'red');
    }

    // Errores comunes y sus soluciones
    console.log('');
    logSection('💡 Posibles Soluciones');

    if (error.message.includes('Login failed')) {
      log('  • Verifica que el usuario y contraseña sean correctos', 'yellow');
      log('  • Verifica que el usuario tenga permisos en la base de datos', 'yellow');
    }
    
    if (error.message.includes('Cannot connect')) {
      log('  • Verifica que el servidor SQL esté corriendo', 'yellow');
      log('  • Verifica que el puerto esté correcto y accesible', 'yellow');
      log('  • Verifica la configuración de firewall', 'yellow');
    }
    
    if (error.message.includes('Cannot open database')) {
      log('  • Verifica que la base de datos exista', 'yellow');
      log('  • Verifica que el usuario tenga permisos en la base de datos', 'yellow');
    }
    
    if (error.message.includes('timeout')) {
      log('  • El servidor no responde, verifica la conectividad de red', 'yellow');
      log('  • Verifica que el servidor SQL esté accesible desde el contenedor', 'yellow');
    }

    if (config.server === 'localhost') {
      log('  ⚠️  Estás usando "localhost" - desde Docker usa "host.docker.internal" (Windows/Mac)', 'yellow');
      log('     o la IP del host (Linux)', 'yellow');
    }

    console.log('');
    process.exit(1);
  }
}

// Ejecutar la verificación
testConnection().catch((error) => {
  log(`\n❌ Error inesperado: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});






