const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function setupDatabase() {
  let connection;

  try {
    // Crear conexión a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_DATABASE || "test_db",
      port: process.env.DB_PORT || 3306,
    });

    console.log("✅ Conectado a la base de datos");

    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, "create_users_table.sql");
    const sqlContent = fs.readFileSync(sqlFile, "utf8");

    // Dividir el SQL en comandos individuales
    const commands = sqlContent
      .split(";")
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd.length > 0 && !cmd.startsWith("--"));

    console.log(`📝 Ejecutando ${commands.length} comandos SQL...`);

    // Ejecutar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          await connection.execute(command);
          console.log(`✅ Comando ${i + 1} ejecutado correctamente`);
        } catch (error) {
          if (error.code === "ER_TABLE_EXISTS_ERROR") {
            console.log(`⚠️  Tabla ya existe (comando ${i + 1})`);
          } else {
            console.error(`❌ Error en comando ${i + 1}:`, error.message);
          }
        }
      }
    }

    console.log("🎉 Configuración de base de datos completada");
    console.log("📋 Tablas creadas:");
    console.log("   - USERS_TABLE");
    console.log("   - USER_DATABASE_PERMISSIONS");
    console.log("   - USER_TABLE_PERMISSIONS");
    console.log("");
    console.log("👤 Usuario admin creado:");
    console.log("   Usuario: admin");
    console.log("   Contraseña: admin");
    console.log("   Es Admin: Sí");
  } catch (error) {
    console.error("❌ Error configurando la base de datos:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Conexión cerrada");
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
