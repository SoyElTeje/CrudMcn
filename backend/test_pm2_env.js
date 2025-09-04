console.log("🔍 Variables de entorno en PM2:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("DB_SERVER:", process.env.DB_SERVER);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log(
  "DB_PASSWORD:",
  process.env.DB_PASSWORD ? "***configurado***" : "No configurado"
);
console.log("DB_DATABASE:", process.env.DB_DATABASE);

console.log("\n📁 Directorio actual:", process.cwd());
console.log("📄 Archivo .env existe:", require("fs").existsSync(".env"));

if (process.env.DB_SERVER) {
  console.log("\n✅ Variables de base de datos configuradas correctamente");

  // Probar conexión
  const sql = require("mssql");

  async function testConnection() {
    try {
      const config = {
        server: process.env.DB_SERVER,
        port: parseInt(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        options: {
          encrypt: false,
          trustServerCertificate: true,
          enableArithAbort: true,
          connectionTimeout: 30000,
          requestTimeout: 30000,
        },
      };

      console.log("\n🔗 Probando conexión...");
      const pool = await sql.connect(config);
      console.log("✅ ¡Conexión exitosa desde PM2!");
      await pool.close();
    } catch (error) {
      console.error("❌ Error de conexión desde PM2:", error.message);
    }
  }

  testConnection();
} else {
  console.log("\n❌ Variables de base de datos NO configuradas");
}
