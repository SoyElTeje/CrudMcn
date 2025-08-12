const axios = require("axios");

const BASE_URL = "http://localhost:3001/api";
let authToken = "";

// Función para hacer login como admin
async function loginAsAdmin() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: "user",
      password: "user",
    });

    authToken = response.data.token;
    console.log("✅ Login exitoso");
    return authToken;
  } catch (error) {
    console.error("❌ Error en login:", error.response?.data || error.message);
    throw error;
  }
}

// Función para crear un usuario de prueba
async function createTestUser() {
  try {
    const testUsername = `testuser_${Date.now()}`;
    const testPassword = "test123";

    console.log(`🔧 Creando usuario de prueba: ${testUsername}`);

    const response = await axios.post(
      `${BASE_URL}/auth/users`,
      {
        username: testUsername,
        password: testPassword,
        isAdmin: false,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    console.log("✅ Usuario creado exitosamente");
    console.log("📋 Datos del usuario:", response.data.user);

    return response.data.user;
  } catch (error) {
    console.error(
      "❌ Error creando usuario:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Función para obtener todos los usuarios
async function getAllUsers() {
  try {
    const response = await axios.get(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    console.log("📋 Lista de usuarios:");
    response.data.forEach((user) => {
      console.log(
        `  - ID: ${user.id}, Usuario: ${user.username}, Admin: ${user.isAdmin}, Creado: ${user.createdAt}`
      );
    });

    return response.data;
  } catch (error) {
    console.error(
      "❌ Error obteniendo usuarios:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Función para verificar la fecha de creación
function checkCreationDate(user) {
  if (!user.createdAt) {
    console.log("⚠️  Usuario sin fecha de creación");
    return false;
  }

  const creationDate = new Date(user.createdAt);
  const now = new Date();
  const timeDiff = now.getTime() - creationDate.getTime();
  const minutesDiff = Math.floor(timeDiff / (1000 * 60));

  console.log(`📅 Fecha de creación: ${creationDate.toLocaleString()}`);
  console.log(`⏰ Diferencia con ahora: ${minutesDiff} minutos`);

  // Verificar que la fecha no sea 1969 (timestamp inválido)
  if (creationDate.getFullYear() === 1969) {
    console.log("❌ ERROR: Fecha de creación inválida (1969)");
    return false;
  }

  // Verificar que la fecha sea razonable (no más de 10 minutos en el futuro o pasado)
  if (Math.abs(minutesDiff) > 10) {
    console.log("⚠️  ADVERTENCIA: Fecha de creación parece incorrecta");
    return false;
  }

  console.log("✅ Fecha de creación válida");
  return true;
}

// Función principal de prueba
async function testUserCreation() {
  try {
    console.log("🚀 Iniciando prueba de creación de usuarios...\n");

    // 1. Login como admin
    await loginAsAdmin();
    console.log("");

    // 2. Obtener usuarios existentes
    console.log("📋 Usuarios existentes:");
    const existingUsers = await getAllUsers();
    console.log("");

    // 3. Crear usuario de prueba
    const newUser = await createTestUser();
    console.log("");

    // 4. Verificar fecha de creación del nuevo usuario
    console.log("🔍 Verificando fecha de creación del nuevo usuario...");
    const isDateValid = checkCreationDate(newUser);
    console.log("");

    // 5. Obtener lista actualizada
    console.log("📋 Lista actualizada de usuarios:");
    const updatedUsers = await getAllUsers();
    console.log("");

    // 6. Verificar que el usuario aparece en la lista
    const foundUser = updatedUsers.find((u) => u.id === newUser.id);
    if (foundUser) {
      console.log("✅ Usuario encontrado en la lista actualizada");
      console.log("🔍 Verificando fecha en la lista...");
      checkCreationDate(foundUser);
    } else {
      console.log("❌ Usuario no encontrado en la lista actualizada");
    }

    console.log("\n✅ Prueba completada");
  } catch (error) {
    console.error("💥 Error en la prueba:", error.message);
  }
}

// Ejecutar la prueba
testUserCreation();
