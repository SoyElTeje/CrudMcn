const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔍 Verificando configuración para producción...\n");

// Verificar archivo .env
const envPath = path.join(__dirname, "..", ".env");
if (!fs.existsSync(envPath)) {
  console.error("❌ Archivo .env no encontrado");
  console.log(
    "💡 Copia env.production.example a .env y configura las variables"
  );
  process.exit(1);
}

// Verificar variables de entorno críticas
require("dotenv").config();
const requiredEnvVars = [
  "DB_SERVER",
  "DB_USER",
  "DB_PASSWORD",
  "DB_DATABASE",
  "JWT_SECRET",
  "PORT",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.error("❌ Variables de entorno faltantes:", missingVars.join(", "));
  process.exit(1);
}

console.log("✅ Variables de entorno configuradas");

// Verificar dependencias del backend
try {
  const backendPackagePath = path.join(
    __dirname,
    "..",
    "backend",
    "package.json"
  );
  if (!fs.existsSync(backendPackagePath)) {
    throw new Error("package.json del backend no encontrado");
  }

  const backendPackage = JSON.parse(
    fs.readFileSync(backendPackagePath, "utf8")
  );
  console.log("✅ Backend package.json encontrado");

  // Verificar dependencias críticas
  const criticalDeps = ["express", "mssql", "jsonwebtoken", "bcrypt"];
  const missingDeps = criticalDeps.filter(
    (dep) => !backendPackage.dependencies[dep]
  );

  if (missingDeps.length > 0) {
    console.error(
      "❌ Dependencias críticas faltantes en backend:",
      missingDeps.join(", ")
    );
    process.exit(1);
  }
} catch (error) {
  console.error("❌ Error verificando backend:", error.message);
  process.exit(1);
}

// Verificar dependencias del frontend
try {
  const frontendPackagePath = path.join(
    __dirname,
    "..",
    "frontend",
    "package.json"
  );
  if (!fs.existsSync(frontendPackagePath)) {
    throw new Error("package.json del frontend no encontrado");
  }

  const frontendPackage = JSON.parse(
    fs.readFileSync(frontendPackagePath, "utf8")
  );
  console.log("✅ Frontend package.json encontrado");

  // Verificar dependencias críticas
  const criticalDeps = ["react", "react-dom", "vite"];
  const missingDeps = criticalDeps.filter(
    (dep) =>
      !frontendPackage.dependencies[dep] &&
      !frontendPackage.devDependencies[dep]
  );

  if (missingDeps.length > 0) {
    console.error(
      "❌ Dependencias críticas faltantes en frontend:",
      missingDeps.join(", ")
    );
    process.exit(1);
  }
} catch (error) {
  console.error("❌ Error verificando frontend:", error.message);
  process.exit(1);
}

// Verificar archivos de configuración
const configFiles = [
  "backend/config/allowedDatabases.js",
  "backend/config/security.js",
  "frontend/src/config/production.ts",
  "ecosystem.config.js",
];

configFiles.forEach((file) => {
  const filePath = path.join(__dirname, "..", file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} encontrado`);
  } else {
    console.warn(`⚠️  ${file} no encontrado`);
  }
});

// Verificar scripts de despliegue
const deployScripts = [
  "deploy-scripts/deploy-app.ps1",
  "deploy-scripts/setup-database.ps1",
  "start-production.bat",
  "start-production.sh",
];

deployScripts.forEach((script) => {
  const scriptPath = path.join(__dirname, "..", script);
  if (fs.existsSync(scriptPath)) {
    console.log(`✅ ${script} encontrado`);
  } else {
    console.warn(`⚠️  ${script} no encontrado`);
  }
});

// Verificar conexión a base de datos
console.log("\n🔌 Verificando conexión a base de datos...");
try {
  const { getPool } = require("../backend/db");
  const pool = await getPool();
  await pool.request().query("SELECT 1 as test");
  console.log("✅ Conexión a base de datos exitosa");
  await pool.close();
} catch (error) {
  console.error("❌ Error conectando a base de datos:", error.message);
  console.log("💡 Verifica las credenciales en el archivo .env");
  process.exit(1);
}

// Verificar estructura de base de datos
console.log("\n📋 Verificando estructura de base de datos...");
try {
  const { getPool } = require("../backend/db");
  const pool = await getPool();

  const requiredTables = [
    "users",
    "user_permissions",
    "logs",
    "activated_tables",
  ];

  for (const table of requiredTables) {
    const result = await pool.request().query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = '${table}'
    `);

    if (result.recordset[0].count > 0) {
      console.log(`✅ Tabla ${table} existe`);
    } else {
      console.error(`❌ Tabla ${table} no encontrada`);
      process.exit(1);
    }
  }

  await pool.close();
} catch (error) {
  console.error("❌ Error verificando estructura de BD:", error.message);
  process.exit(1);
}

console.log("\n🎉 ¡Verificación completada exitosamente!");
console.log("\n📋 Próximos pasos:");
console.log("1. Ejecuta: npm install (en backend y frontend)");
console.log("2. Ejecuta: npm run build (en frontend)");
console.log("3. Ejecuta: pm2 start ecosystem.config.js --env production");
console.log(
  "4. Verifica que la aplicación esté funcionando en http://localhost:3001"
);




