const authService = require("./services/authService");

async function simpleTest() {
  console.log("🧪 Prueba simple de getUserPermissions...\n");

  try {
    console.log("Probando getUserPermissions(3)...");
    const permissions = await authService.getUserPermissions(3);
    console.log("Resultado:");
    console.log(JSON.stringify(permissions, null, 2));

    console.log("\n🎉 Prueba completada!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

simpleTest();
