require("dotenv").config();
const axios = require("axios");

async function testFrontendSimulation() {
  try {
    console.log("🔍 Simulando llamadas del frontend...");

    // Login como admin
    const loginResponse = await axios.post(
      "http://localhost:3001/api/auth/login",
      {
        username: "admin",
        password: "admin",
      }
    );

    const token = loginResponse.data.token;
    console.log("✅ Login exitoso");

    // Configurar axios como lo hace el frontend
    const api = axios.create({
      baseURL: "http://localhost:3001",
    });

    api.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Simular fetchAccessibleTables del frontend
    console.log("\n📊 Simulando fetchAccessibleTables...");

    // 1. Obtener bases de datos
    const res = await api.get("/api/databases");
    const dbList = res.data;
    console.log("Bases de datos obtenidas:", dbList.length);

    const allTables = [];
    for (const db of dbList) {
      // Saltar APPDATA como hace el frontend
      if (db === "APPDATA") {
        console.log(`Omitiendo base de datos de la aplicación: ${db}`);
        continue;
      }

      try {
        console.log(`\n🔍 Obteniendo tablas de ${db}...`);
        const tablesResponse = await api.get(`/api/databases/${db}/tables`);

        console.log(
          `Respuesta para ${db}:`,
          JSON.stringify(tablesResponse.data, null, 2)
        );

        const dbTables = tablesResponse.data.map((table) => ({
          ...table,
          database: db,
        }));

        console.log(`Tablas procesadas para ${db}:`, dbTables.length);
        allTables.push(...dbTables);
      } catch (error) {
        console.warn(
          `No se pudieron cargar las tablas de ${db}:`,
          error.response?.data?.error || error.message
        );
      }
    }

    console.log(`\n📋 Total de tablas encontradas: ${allTables.length}`);
    console.log("Tablas:", JSON.stringify(allTables, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Data:", error.response.data);
    }
  }
}

testFrontendSimulation();
