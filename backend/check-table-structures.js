/**
 * Script para verificar la estructura real de las tablas users y user_permissions
 */

const sql = require("mssql");
require("dotenv").config();

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true",
    enableArithAbort: true,
  },
};

async function checkTableStructures() {
  let pool;

  try {
    console.log("🔗 Conectando a la base de datos...");
    pool = await sql.connect(config);
    console.log("✅ Conectado exitosamente");

    // Verificar si las tablas existen
    console.log("📋 Verificando existencia de tablas...");
    
    const tablesCheck = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'dbo' 
      AND TABLE_NAME IN ('users', 'user_permissions', 'activated_tables', 'audit_logs')
      ORDER BY TABLE_NAME
    `);

    console.log("📊 Tablas encontradas:");
    tablesCheck.recordset.forEach(row => {
      console.log(`   ✅ ${row.TABLE_NAME}`);
    });

    // Verificar estructura de la tabla users
    console.log("\n👤 Estructura de la tabla 'users':");
    console.log("=====================================");
    
    const usersStructure = await pool.request().query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'dbo' 
      AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);

    if (usersStructure.recordset.length > 0) {
      usersStructure.recordset.forEach(col => {
        const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.COLUMN_DEFAULT ? ` DEFAULT ${col.COLUMN_DEFAULT}` : '';
        console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} ${nullable}${defaultVal}`);
      });
    } else {
      console.log("   ❌ Tabla 'users' no encontrada");
    }

    // Verificar estructura de la tabla user_permissions
    console.log("\n🔐 Estructura de la tabla 'user_permissions':");
    console.log("=============================================");
    
    const permissionsStructure = await pool.request().query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'dbo' 
      AND TABLE_NAME = 'user_permissions'
      ORDER BY ORDINAL_POSITION
    `);

    if (permissionsStructure.recordset.length > 0) {
      permissionsStructure.recordset.forEach(col => {
        const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.COLUMN_DEFAULT ? ` DEFAULT ${col.COLUMN_DEFAULT}` : '';
        console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} ${nullable}${defaultVal}`);
      });
    } else {
      console.log("   ❌ Tabla 'user_permissions' no encontrada");
    }

    // Verificar estructura de la tabla activated_tables
    console.log("\n📋 Estructura de la tabla 'activated_tables':");
    console.log("=============================================");
    
    const activatedTablesStructure = await pool.request().query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'dbo' 
      AND TABLE_NAME = 'activated_tables'
      ORDER BY ORDINAL_POSITION
    `);

    if (activatedTablesStructure.recordset.length > 0) {
      activatedTablesStructure.recordset.forEach(col => {
        const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.COLUMN_DEFAULT ? ` DEFAULT ${col.COLUMN_DEFAULT}` : '';
        console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} ${nullable}${defaultVal}`);
      });
    } else {
      console.log("   ❌ Tabla 'activated_tables' no encontrada");
    }

    // Verificar estructura de la tabla audit_logs
    console.log("\n📝 Estructura de la tabla 'audit_logs':");
    console.log("=======================================");
    
    const auditLogsStructure = await pool.request().query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'dbo' 
      AND TABLE_NAME = 'audit_logs'
      ORDER BY ORDINAL_POSITION
    `);

    if (auditLogsStructure.recordset.length > 0) {
      auditLogsStructure.recordset.forEach(col => {
        const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.COLUMN_DEFAULT ? ` DEFAULT ${col.COLUMN_DEFAULT}` : '';
        console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} ${nullable}${defaultVal}`);
      });
    } else {
      console.log("   ❌ Tabla 'audit_logs' no encontrada");
    }

    // Verificar claves foráneas
    console.log("\n🔗 Claves foráneas:");
    console.log("===================");
    
    const foreignKeys = await pool.request().query(`
      SELECT 
        fk.name AS foreign_key_name,
        tp.name AS parent_table,
        cp.name AS parent_column,
        tr.name AS referenced_table,
        cr.name AS referenced_column
      FROM sys.foreign_keys fk
      INNER JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
      INNER JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
      INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      INNER JOIN sys.columns cp ON fkc.parent_column_id = cp.column_id AND fkc.parent_object_id = cp.object_id
      INNER JOIN sys.columns cr ON fkc.referenced_column_id = cr.column_id AND fkc.referenced_object_id = cr.object_id
      WHERE tp.name IN ('users', 'user_permissions', 'activated_tables', 'audit_logs')
      ORDER BY tp.name, fk.name
    `);

    if (foreignKeys.recordset.length > 0) {
      foreignKeys.recordset.forEach(fk => {
        console.log(`   ${fk.parent_table}.${fk.parent_column} -> ${fk.referenced_table}.${fk.referenced_column}`);
      });
    } else {
      console.log("   ❌ No se encontraron claves foráneas");
    }

    console.log("\n✅ Verificación completada");

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Ejecutar
if (require.main === module) {
  checkTableStructures()
    .then(() => {
      console.log("\n✅ Script completado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Error:", error);
      process.exit(1);
    });
}

module.exports = { checkTableStructures };
