/**
 * Script para verificar la conexión a la base de datos usando las variables de .docker.env
 * 
 * Uso:
 *   node verify-db-connection.js
 * 
 * Este script lee las variables de entorno del archivo .docker.env y verifica
 * si puede conectarse a la base de datos configurada.
 */

const fs = require('fs');
const path = require('path');
const sql = require('mssql');

// Colores para la consola
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

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

/**
 * Parsea el archivo .docker.env y extrae las variables de entorno
 */
function parseEnvFile(filePath) {
  const env = {};
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`El archivo ${filePath} no existe`);
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Ignorar comentarios y líneas vacías
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }
    
    // Buscar líneas con formato KEY=VALUE
    const match = trimmedLine.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remover comillas si están presentes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      env[key] = value;
    }
  }
  
  return env;
}

async function verifyConnection() {
  try {
    logSection('🔍 Verificación de Conexión a Base de Datos');
    log('Leyendo configuración desde .docker.env...', 'yellow');
    console.log('');

    // Leer el archivo .docker.env
    const envFilePath = path.join(__dirname, '.docker.env');
    const env = parseEnvFile(envFilePath);

    // Extraer variables de conexión
    const config = {
      server: env.DB_SERVER || 'localhost',
      port: parseInt(env.DB_PORT || '1433', 10),
      user: env.DB_USER || 'sa',
      password: env.DB_PASSWORD || '',
      database: env.DB_DATABASE || 'APPDATA',
      options: {
        encrypt: env.DB_ENCRYPT === 'true',
        trustServerCertificate: env.DB_TRUST_CERT !== 'false',
        enableArithAbort: true,
        requestTimeout: parseInt(env.DB_REQUEST_TIMEOUT || '30000', 10),
        connectionTimeout: parseInt(env.DB_CONNECTION_TIMEOUT || '15000', 10),
      },
    };

    // Validar que las variables requeridas estén presentes
    const requiredVars = ['DB_SERVER', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE'];
    const missingVars = requiredVars.filter(varName => !env[varName] || env[varName].trim() === '');

    if (missingVars.length > 0) {
      logError('Variables de entorno faltantes:');
      missingVars.forEach(varName => {
        log(`  - ${varName}`, 'red');
      });
      console.log('');
      logWarning('Por favor, configura estas variables en .docker.env');
      process.exit(1);
    }

    // Mostrar configuración (sin mostrar la contraseña completa)
    logSection('📋 Configuración de Conexión');
    logInfo('Servidor', config.server);
    logInfo('Puerto', config.port.toString());
    logInfo('Usuario', config.user);
    logInfo('Contraseña', config.password ? `${config.password.substring(0, 3)}***` : '(no configurada)');
    logInfo('Base de datos', config.database);
    logInfo('Encriptación', config.options.encrypt ? 'Sí' : 'No');
    logInfo('Trust Certificate', config.options.trustServerCertificate ? 'Sí' : 'No');

    console.log('');
    log('⏳ Intentando conectar...', 'yellow');

    // Intentar conexión
    const pool = await sql.connect(config);
    logSuccess('Conexión exitosa a la base de datos!');
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
      logWarning(`No se pudieron verificar permisos: ${permError.message}`);
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
        tables.recordset.slice(0, 10).forEach((table, index) => {
          log(`  ${(index + 1).toString().padStart(3)}. ${table.schemaName}.${table.tableName}`, 'blue');
        });
        if (tables.recordset.length > 10) {
          log(`  ... y ${tables.recordset.length - 10} tablas más`, 'blue');
        }
      } else {
        logWarning('No se encontraron tablas en la base de datos');
      }

    } catch (tableError) {
      logWarning(`No se pudieron listar las tablas: ${tableError.message}`);
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
          logSuccess(`${tableName.padEnd(25)}: Existe (${count} registros)`);
        } else {
          logError(`${tableName.padEnd(25)}: No existe`);
        }
      } catch (error) {
        logWarning(`${tableName.padEnd(25)}: Error al verificar (${error.message})`);
      }
    }

    // Cerrar conexión
    await pool.close();
    console.log('');
    logSuccess('Verificación completada exitosamente!');
    console.log('');

    process.exit(0);

  } catch (error) {
    console.log('');
    logSection('❌ Error de Conexión');
    
    logError(`Mensaje: ${error.message}`);
    
    if (error.code) {
      logError(`Código: ${error.code}`);
    }
    
    if (error.number) {
      logError(`Número de error SQL: ${error.number}`);
    }

    // Errores comunes y sus soluciones
    console.log('');
    logSection('💡 Posibles Soluciones');

    if (error.message.includes('Login failed')) {
      logWarning('Verifica que el usuario y contraseña sean correctos');
      logWarning('Verifica que el usuario tenga permisos en la base de datos');
    }
    
    if (error.message.includes('Cannot connect') || error.message.includes('timeout')) {
      logWarning('Verifica que el servidor SQL esté corriendo');
      logWarning('Verifica que el puerto esté correcto y accesible');
      logWarning('Verifica la configuración de firewall');
      
      if (config && config.server === 'host.docker.internal') {
        logWarning('Si estás en Linux, host.docker.internal puede no funcionar');
        logWarning('Usa la IP del host en su lugar (ej: 192.168.1.100)');
      }
    }
    
    if (error.message.includes('Cannot open database')) {
      logWarning('Verifica que la base de datos exista');
      logWarning('Verifica que el usuario tenga permisos en la base de datos');
    }

    console.log('');
    process.exit(1);
  }
}

// Ejecutar la verificación
verifyConnection().catch((error) => {
  logError(`Error inesperado: ${error.message}`);
  console.error(error);
  process.exit(1);
});





