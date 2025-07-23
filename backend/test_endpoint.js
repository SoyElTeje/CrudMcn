const axios = require("axios");
const authService = require("./services/authService");

async function testEndpoint() {
  try {
    console.log("🧪 Probando endpoint HTTP completo...");

    // 1. Obtener token de admin
    const user = await authService.verifyCredentials("admin", "admin");
    if (!user) {
      console.log("❌ Login fallido");
      return;
    }

    const token = authService.generateToken(user);
    console.log("✅ Token generado");

    // 2. Configurar axios con el token
    const api = axios.create({
      baseURL: "http://localhost:3001",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // 3. Probar endpoint de registros
    const dbName = "BD_ABM1";
    const tableName = "Maquinas";

    console.log(
      `\n📋 Probando endpoint: GET /api/databases/${dbName}/tables/${tableName}/records`
    );

    try {
      const response = await api.get(
        `/api/databases/${dbName}/tables/${tableName}/records`,
        {
          params: {
            limit: 10,
            offset: 0,
          },
        }
      );

      console.log("✅ Respuesta exitosa:");
      console.log(`  - Status: ${response.status}`);
      console.log(`  - Database: ${response.data.database}`);
      console.log(`  - Table: ${response.data.table}`);
      console.log(`  - Count: ${response.data.count}`);
      console.log(`  - Records: ${response.data.data.length}`);

      if (response.data.data.length > 0) {
        console.log("📊 Primer registro:");
        const firstRecord = response.data.data[0];
        Object.keys(firstRecord)
          .slice(0, 5)
          .forEach((key) => {
            console.log(`    ${key}: ${firstRecord[key]}`);
          });
      }
    } catch (error) {
      console.error("❌ Error en la petición HTTP:");
      if (error.response) {
        console.error(`  - Status: ${error.response.status}`);
        console.error(`  - Data:`, error.response.data);
      } else {
        console.error(`  - Error: ${error.message}`);
      }
    }

    // 4. Probar otra tabla
    const tableName2 = "Funcionario";
    console.log(
      `\n📋 Probando endpoint: GET /api/databases/${dbName}/tables/${tableName2}/records`
    );

    try {
      const response = await api.get(
        `/api/databases/${dbName}/tables/${tableName2}/records`,
        {
          params: {
            limit: 10,
            offset: 0,
          },
        }
      );

      console.log("✅ Respuesta exitosa:");
      console.log(`  - Status: ${response.status}`);
      console.log(`  - Database: ${response.data.database}`);
      console.log(`  - Table: ${response.data.table}`);
      console.log(`  - Count: ${response.data.count}`);
      console.log(`  - Records: ${response.data.data.length}`);
    } catch (error) {
      console.error("❌ Error en la petición HTTP:");
      if (error.response) {
        console.error(`  - Status: ${error.response.status}`);
        console.error(`  - Data:`, error.response.data);
      } else {
        console.error(`  - Error: ${error.message}`);
      }
    }

    console.log("\n✅ Pruebas completadas");
  } catch (error) {
    console.error("❌ Error en las pruebas:", error);
  } finally {
    process.exit(0);
  }
}

testEndpoint();
