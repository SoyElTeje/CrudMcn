const axios = require("axios");

const BASE_URL = "http://localhost:3001";

async function testLogin(username, password) {
  try {
    console.log(`🔐 Probando login con: ${username}/${password}`);
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username,
      password,
    });
    console.log(`✅ Login exitoso para ${username}`);
    return response.data.token;
  } catch (error) {
    console.log(
      `❌ Login falló para ${username}: ${
        error.response?.data?.error || error.message
      }`
    );
    return null;
  }
}

async function testAllLogins() {
  console.log("🧪 Probando diferentes credenciales de login...\n");

  const testCredentials = [
    { username: "admin", password: "admin123" },
    { username: "user", password: "user123" },
    { username: "user", password: "password" },
    { username: "user", password: "user" },
    { username: "testuser_ui", password: "test123" },
    { username: "testuser_ui", password: "password" },
    { username: "testuser_ui", password: "testuser_ui" },
    { username: "testuser_red_modals", password: "test123" },
    { username: "testuser_red_modals", password: "password" },
    { username: "testuser_red_modals", password: "testuser_red_modals" },
    { username: "testuser_close_button", password: "test123" },
    { username: "testuser_close_button", password: "password" },
    { username: "testuser_close_button", password: "testuser_close_button" },
    { username: "testuser_close_visible", password: "test123" },
    { username: "testuser_close_visible", password: "password" },
    { username: "testuser_close_visible", password: "testuser_close_visible" },
  ];

  for (const cred of testCredentials) {
    await testLogin(cred.username, cred.password);
    console.log("---");
  }
}

if (require.main === module) {
  testAllLogins();
}

module.exports = { testLogin };
