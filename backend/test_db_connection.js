const sql = require("mssql");
require("dotenv").config();

console.log("🔍 Verificando configuración de base de datos...");
console.log("DB_SERVER:", process.env.DB_SERVER || "No configurado");
console.log("DB_PORT:", process.env.DB_PORT || "No configurado");
console.log("DB_USER:", process.env.DB_USER || "No configurado");
console.log(
  "DB_PASSWORD:",
  process.env.DB_PASSWORD ? "***configurado***" : "No configurado"
);
console.log("DB_DATABASE:", process.env.DB_DATABASE || "No configurado");

async function testConnection() {
  try {
    const config = {
      server: process.env.DB_SERVER || "localhost",
      port: parseInt(process.env.DB_PORT) || 1433,
      user: process.env.DB_USER || "sa",
      password: process.env.DB_PASSWORD || "simpleDev!",
      database: process.env.DB_DATABASE || "APPDATA",
      options: {
        encrypt: false, // Para conexiones locales/VPN
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000,
      },
    };

    console.log(
      "\n🔗 Intentando conectar a:",
      config.server + ":" + config.port
    );
    console.log("📊 Base de datos:", config.database);
    console.log("👤 Usuario:", config.user);

    const pool = await sql.connect(config);
    console.log("✅ ¡Conexión exitosa!");

    // Probar una consulta simple
    const result = await pool.request().query("SELECT @@VERSION as version");
    console.log("📋 Versión del servidor:", result.recordset[0].version);

    await pool.close();
    console.log("🔒 Conexión cerrada correctamente");
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
    console.error("🔍 Código de error:", error.code);

    if (error.code === "ESOCKET") {
      console.log("\n💡 Posibles soluciones:");
      console.log("1. Verificar que la VPN esté conectada");
      console.log("2. Verificar la IP del servidor SQL");
      console.log("3. Verificar que el puerto esté abierto");
      console.log("4. Verificar credenciales");
    }
  }
}

testConnection();
