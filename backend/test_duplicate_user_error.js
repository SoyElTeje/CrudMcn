const authService = require("./services/authService");

console.log("🧪 Probando error de usuario duplicado en SQL Server...\n");

async function testDuplicateUserError() {
  try {
    // 1. Crear un usuario de prueba
    console.log("👤 Creando usuario de prueba...");
    const testUser = {
      username: "test_duplicate_user",
      password: "testpass123",
      isAdmin: false,
    };

    const newUser = await authService.createUser(
      testUser.username,
      testUser.password,
      testUser.isAdmin
    );
    console.log("✅ Usuario creado:", newUser);

    // 2. Intentar crear el mismo usuario nuevamente
    console.log("\n🔄 Intentando crear el mismo usuario nuevamente...");
    try {
      const duplicateUser = await authService.createUser(
        testUser.username,
        testUser.password,
        testUser.isAdmin
      );
      console.log("❌ Error: Se creó el usuario duplicado:", duplicateUser);
    } catch (error) {
      console.log("✅ Error capturado correctamente");
      console.log("📋 Error completo:", error);
      console.log("📋 Error message:", error.message);
      console.log("📋 Error code:", error.code);
      console.log("📋 Error number:", error.number);
      console.log("📋 Error state:", error.state);
      console.log("📋 Error class:", error.class);
      console.log("📋 Error lineNumber:", error.lineNumber);
      console.log("📋 Error serverName:", error.serverName);
      console.log("📋 Error procName:", error.procName);
    }
  } catch (error) {
    console.log("❌ Error general:", error);
    console.log("📋 Error details:", {
      message: error.message,
      code: error.code,
      number: error.number,
      state: error.state,
      class: error.class,
    });
  }
}

// Ejecutar la prueba
testDuplicateUserError();
