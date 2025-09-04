require("dotenv").config();

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
} else {
  console.log("\n❌ Variables de base de datos NO configuradas");
}
