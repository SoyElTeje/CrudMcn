const sql = require("mssql");
const readline = require("readline");
require("dotenv").config();

// Configuración de la conexión desde variables de entorno
const config = {
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE || "APPDATA",
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "simpleDev!",
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false, // Para desarrollo local
    trustServerCertificate: true, // Para desarrollo local
    enableArithAbort: true,
  },
};

// Crear interfaz de lectura
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function testDatabaseConnection() {
  let pool;

  try {
    console.log("🔌 Conectando a la base de datos...");
    console.log(`📊 Servidor: ${config.server}:${config.port}`);
    console.log(`🗄️  Base de datos: ${config.database}`);
    console.log(`👤 Usuario: ${config.user}`);
    console.log("");

    // Crear pool de conexión
    pool = await sql.connect(config);
    console.log("✅ Conexión exitosa a SQL Server!");
    console.log("");

    // Listar todas las tablas
    console.log("📋 Tablas disponibles:");
    console.log("=".repeat(50));

    const result = await pool.request().query(`
            SELECT 
                TABLE_SCHEMA,
                TABLE_NAME,
                TABLE_TYPE
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_SCHEMA, TABLE_NAME
        `);

    if (result.recordset.length === 0) {
      console.log("❌ No se encontraron tablas en la base de datos.");
    } else {
      result.recordset.forEach((table, index) => {
        console.log(
          `${index + 1}. [${table.TABLE_SCHEMA}] ${table.TABLE_NAME}`
        );
      });
    }

    console.log("");
    console.log(`📊 Total de tablas: ${result.recordset.length}`);
    console.log("");

    // Mostrar información adicional de la base de datos
    console.log("ℹ️  Información adicional:");
    console.log("=".repeat(50));

    const dbInfo = await pool.request().query(`
            SELECT 
                DB_NAME() as DatabaseName,
                DATABASEPROPERTYEX(DB_NAME(), 'Status') as Status,
                DATABASEPROPERTYEX(DB_NAME(), 'Recovery') as RecoveryModel,
                DATABASEPROPERTYEX(DB_NAME(), 'Version') as Version
        `);

    if (dbInfo.recordset.length > 0) {
      const info = dbInfo.recordset[0];
      console.log(`📁 Nombre: ${info.DatabaseName}`);
      console.log(`🟢 Estado: ${info.Status}`);
      console.log(`🔄 Modelo de recuperación: ${info.RecoveryModel}`);
      console.log(`📈 Versión: ${info.Version}`);
    }
  } catch (err) {
    console.error("❌ Error conectando a la base de datos:");
    console.error("   Mensaje:", err.message);
    console.error("   Código:", err.code);

    if (err.code === "ELOGIN") {
      console.error("");
      console.error("💡 Posibles soluciones:");
      console.error("   1. Verificar que SQL Server esté ejecutándose");
      console.error("   2. Verificar credenciales en el archivo .env");
      console.error("   3. Verificar que el puerto 1433 esté abierto");
      console.error("   4. Si usas Docker: docker-compose up -d");
    }

    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log("");
      console.log("🔌 Conexión cerrada");
    }
  }
}

// Función para esperar input del usuario
function waitForUserInput() {
  console.log("");
  console.log('⌨️  Presiona "X" y Enter para salir...');

  rl.on("line", (input) => {
    if (input.trim().toUpperCase() === "X") {
      console.log("👋 ¡Hasta luego!");
      rl.close();
      process.exit(0);
    } else {
      console.log('⌨️  Presiona "X" y Enter para salir...');
    }
  });
}

// Función principal
async function main() {
  console.log("🚀 Test de Conexión a Base de Datos SQL Server");
  console.log("=".repeat(50));
  console.log("");

  await testDatabaseConnection();
  waitForUserInput();
}

// Manejar señales de interrupción
process.on("SIGINT", () => {
  console.log("\n👋 ¡Hasta luego!");
  rl.close();
  process.exit(0);
});

// Ejecutar el script
main().catch((err) => {
  console.error("❌ Error inesperado:", err);
  process.exit(1);
});
