const { exec } = require("child_process");

async function testDateWithCurl() {
  console.log("=== Prueba con cURL ===\n");

  // 1. Login
  console.log("1. Haciendo login...");
  const loginCmd = `curl http://localhost:3001/api/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"user","password":"user"}'`;

  exec(loginCmd, (error, stdout, stderr) => {
    if (error) {
      console.error("Error en login:", error);
      return;
    }

    try {
      const loginResponse = JSON.parse(stdout);
      const token = loginResponse.token;
      console.log("✅ Login exitoso\n");

      // 2. Probar inserción con fecha 31/10/2025
      console.log("2. Probando inserción con fecha 31/10/2025...");
      const insertCmd = `curl http://localhost:3001/api/databases/BD_ABM1/tables/Funcionario/records -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" -d '{"record":{"Nombre":"Test cURL","Apellido":"Test cURL","Cedula":"33333333","FechaIngreso":"31/10/2025","Email":"testcurl@example.com"}}'`;

      exec(insertCmd, (error2, stdout2, stderr2) => {
        if (error2) {
          console.error("Error en inserción:", error2);
          return;
        }

        console.log("Respuesta de inserción:");
        console.log(stdout2);

        // 3. Probar con fecha 01/01/2025 para comparar
        console.log("\n3. Probando inserción con fecha 01/01/2025...");
        const insertCmd2 = `curl http://localhost:3001/api/databases/BD_ABM1/tables/Funcionario/records -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" -d '{"record":{"Nombre":"Test cURL 2","Apellido":"Test cURL 2","Cedula":"22222222","FechaIngreso":"01/01/2025","Email":"testcurl2@example.com"}}'`;

        exec(insertCmd2, (error3, stdout3, stderr3) => {
          if (error3) {
            console.error("Error en inserción 2:", error3);
            return;
          }

          console.log("Respuesta de inserción 2:");
          console.log(stdout3);
        });
      });
    } catch (parseError) {
      console.error("Error parseando respuesta de login:", parseError);
    }
  });
}

testDateWithCurl();
