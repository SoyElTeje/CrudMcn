const authService = require("./services/authService");

async function testGetUserPermissions() {
  console.log("🧪 Probando función getUserPermissions directamente...\n");

  try {
    // Probar con user2 (ID: 3)
    console.log("1️⃣ Probando getUserPermissions para user2 (ID: 3)...");
    const user2Permissions = await authService.getUserPermissions(3);
    console.log("📋 Permisos de user2:");
    console.log(JSON.stringify(user2Permissions, null, 2));

    // Probar con user (ID: 2)
    console.log("\n2️⃣ Probando getUserPermissions para user (ID: 2)...");
    const userPermissions = await authService.getUserPermissions(2);
    console.log("📋 Permisos de user:");
    console.log(JSON.stringify(userPermissions, null, 2));

    // Probar con admin (ID: 1)
    console.log("\n3️⃣ Probando getUserPermissions para admin (ID: 1)...");
    const adminPermissions = await authService.getUserPermissions(1);
    console.log("📋 Permisos de admin:");
    console.log(JSON.stringify(adminPermissions, null, 2));

    console.log("\n🎉 Pruebas completadas!");
  } catch (error) {
    console.error("❌ Error en las pruebas:", error);
  }
}

testGetUserPermissions();
