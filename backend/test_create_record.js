const axios = require("axios");
const authService = require("./services/authService");

async function testCreateRecord() {
  try {
    console.log("🧪 Probando endpoint de creación de registros...");
    
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
      baseURL: 'http://localhost:3001',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // 3. Probar endpoint de creación de registros
    const dbName = "BD_ABM1";
    const tableName = "Maquinas";
    
    console.log(`\n📋 Probando endpoint: POST /api/databases/${dbName}/tables/${tableName}/records`);
    
    // Datos de prueba para crear un registro
    const testRecord = {
      Nombre: "Máquina de Prueba",
      Descripcion: "Máquina creada para pruebas",
      Estado: "Activo"
    };
    
    try {
      const response = await api.post(`/api/databases/${dbName}/tables/${tableName}/records`, {
        record: testRecord
      });
      
      console.log("✅ Registro creado exitosamente:");
      console.log(`  - Status: ${response.status}`);
      console.log(`  - Message: ${response.data.message}`);
      console.log(`  - Affected Rows: ${response.data.affectedRows}`);
      
      // 4. Verificar que el registro se creó consultando la tabla
      console.log(`\n📋 Verificando que el registro se creó...`);
      
      const verifyResponse = await api.get(`/api/databases/${dbName}/tables/${tableName}/records`, {
        params: {
          limit: 10,
          offset: 0
        }
      });
      
      console.log(`✅ Registros en la tabla: ${verifyResponse.data.count}`);
      
      // Buscar el registro creado
      const createdRecord = verifyResponse.data.data.find(record => 
        record.Nombre === testRecord.Nombre && 
        record.Descripcion === testRecord.Descripcion
      );
      
      if (createdRecord) {
        console.log("✅ Registro encontrado en la tabla:");
        Object.keys(createdRecord).forEach(key => {
          console.log(`    ${key}: ${createdRecord[key]}`);
        });
      } else {
        console.log("⚠️  No se pudo encontrar el registro creado");
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
    
    console.log("\n✅ Pruebas completadas");
    
  } catch (error) {
    console.error("❌ Error en las pruebas:", error);
  } finally {
    process.exit(0);
  }
}

testCreateRecord(); 