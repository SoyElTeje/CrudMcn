const sql = require("mssql");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(__dirname, "..", "backups");
  const backupFileName = `abmmcn_backup_${timestamp}.bak`;
  const backupPath = path.join(backupDir, backupFileName);

  // Crear directorio de backups si no existe
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    console.log("🔌 Conectando a la base de datos...");
    const pool = await sql.connect(config);

    console.log("💾 Creando backup de la base de datos...");

    // Crear backup usando T-SQL
    const backupQuery = `
      BACKUP DATABASE [${process.env.DB_DATABASE}] 
      TO DISK = '${backupPath.replace(/\\/g, "\\\\")}'
      WITH FORMAT, 
           MEDIANAME = 'AbmMcnBackup',
           NAME = 'AbmMcn Database Backup';
    `;

    await pool.request().query(backupQuery);

    console.log(`✅ Backup creado exitosamente: ${backupFileName}`);

    // Limpiar backups antiguos (mantener solo los últimos 7 días)
    await cleanupOldBackups(backupDir);

    await pool.close();
  } catch (error) {
    console.error("❌ Error creando backup:", error.message);
    process.exit(1);
  }
}

async function cleanupOldBackups(backupDir) {
  try {
    const files = fs.readdirSync(backupDir);
    const backupFiles = files.filter(
      (file) => file.startsWith("abmmcn_backup_") && file.endsWith(".bak")
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let deletedCount = 0;

    for (const file of backupFiles) {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);

      if (stats.mtime < sevenDaysAgo) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Eliminado backup antiguo: ${file}`);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`✅ Limpieza completada: ${deletedCount} backups eliminados`);
    }
  } catch (error) {
    console.warn("⚠️  Error durante la limpieza de backups:", error.message);
  }
}

async function restoreBackup(backupPath) {
  try {
    console.log("🔌 Conectando a la base de datos...");
    const pool = await sql.connect(config);

    console.log("🔄 Restaurando backup...");

    // Restaurar backup usando T-SQL
    const restoreQuery = `
      USE master;
      ALTER DATABASE [${
        process.env.DB_DATABASE
      }] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
      RESTORE DATABASE [${process.env.DB_DATABASE}] 
      FROM DISK = '${backupPath.replace(/\\/g, "\\\\")}'
      WITH REPLACE;
      ALTER DATABASE [${process.env.DB_DATABASE}] SET MULTI_USER;
    `;

    await pool.request().query(restoreQuery);

    console.log("✅ Backup restaurado exitosamente");

    await pool.close();
  } catch (error) {
    console.error("❌ Error restaurando backup:", error.message);
    process.exit(1);
  }
}

// Ejecutar según argumentos
const args = process.argv.slice(2);
const command = args[0];

if (command === "restore" && args[1]) {
  restoreBackup(args[1]);
} else if (command === "backup" || !command) {
  createBackup();
} else {
  console.log("Uso:");
  console.log("  node backup-database.js [backup]     - Crear backup");
  console.log("  node backup-database.js restore <path> - Restaurar backup");
}




