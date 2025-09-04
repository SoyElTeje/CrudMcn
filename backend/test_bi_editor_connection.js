require("dotenv").config();
const sql = require("mssql");

async function testBIEditorConnection() {
  try {
    console.log("🔍 Probando conexión a BI_Editor...");

    // Configuración de conexión desde variables de entorno
    const config = {
      server: process.env.DB_SERVER || "MCN-BIDB-SVR",
      database: "BI_Editor",
      user: process.env.DB_USER || "app_user",
      password: process.env.DB_PASSWORD || "App_User_2024!",
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    };

    console.log(`🔌 Conectando a ${config.server}...`);
    console.log(`🗄️ Base de datos: ${config.database}`);
    console.log(`👤 Usuario: ${config.user}`);

    const pool = await sql.connect(config);

    console.log("✅ Conexión exitosa a BI_Editor!");

    // Probar una consulta simple
    const result = await pool.request().query(`
      SELECT COUNT(*) as tableCount 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);

    console.log(`📊 Tablas disponibles: ${result.recordset[0].tableCount}`);

    // Listar algunas tablas como ejemplo
    const tablesResult = await pool.request().query(`
      SELECT TOP 5 TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    console.log("📋 Ejemplos de tablas:");
    tablesResult.recordset.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.TABLE_NAME}`);
    });

    await pool.close();
  } catch (error) {
    console.error("❌ Error conectando a BI_Editor:", error.message);

    if (error.code === "ELOGIN") {
      console.log("\n📝 SOLUCIÓN:");
      console.log(
        "El usuario app_user no tiene permisos para acceder a BI_Editor."
      );
      console.log("Un administrador de SQL Server debe ejecutar:");
      console.log("");
      console.log("1. Abrir SQL Server Management Studio");
      console.log("2. Conectar como administrador");
      console.log("3. Ejecutar el script: setup_bi_editor_permissions.sql");
      console.log("");
      console.log("O ejecutar manualmente:");
      console.log("USE BI_Editor;");
      console.log("CREATE USER app_user FOR LOGIN app_user;");
      console.log("GRANT CONTROL ON SCHEMA::dbo TO app_user;");
      console.log("GRANT SELECT ON SCHEMA::INFORMATION_SCHEMA TO app_user;");
      console.log("GRANT SELECT ON SCHEMA::sys TO app_user;");
    }
  } finally {
    process.exit(0);
  }
}

testBIEditorConnection();





