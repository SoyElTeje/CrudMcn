const axios = require('axios');

async function testUniqueDates() {
  try {
    console.log('=== Prueba con Cédulas Únicas ===\n');

    // 1. Probar login
    console.log('1. Iniciando sesión...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'user',
      password: 'user'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso\n');

    // 2. Probar inserción con fecha 01/01/2025 (cédula única)
    console.log('2. Probando inserción con fecha 01/01/2025...');
    const insertData1 = {
      Nombre: 'Test Fecha 1',
      Apellido: 'Test Apellido 1',
      Cedula: '11111111', // Cédula única
      FechaIngreso: '01/01/2025',
      Email: 'testfecha1@example.com'
    };

    try {
      const insertResponse1 = await axios.post('http://localhost:3001/api/databases/BD_ABM1/tables/Funcionario/records', {
        record: insertData1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Inserción exitosa con fecha 01/01/2025:');
      console.log(insertResponse1.data);
    } catch (insertError1) {
      console.log('❌ Error en inserción 1:');
      console.log('Status:', insertError1.response?.status);
      console.log('Error:', insertError1.response?.data);
    }

    // 3. Probar inserción con fecha 31/10/2025 (cédula única)
    console.log('\n3. Probando inserción con fecha 31/10/2025...');
    const insertData2 = {
      Nombre: 'Test Fecha 2',
      Apellido: 'Test Apellido 2',
      Cedula: '22222222', // Cédula única
      FechaIngreso: '31/10/2025',
      Email: 'testfecha2@example.com'
    };

    try {
      const insertResponse2 = await axios.post('http://localhost:3001/api/databases/BD_ABM1/tables/Funcionario/records', {
        record: insertData2
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Inserción exitosa con fecha 31/10/2025:');
      console.log(insertResponse2.data);
    } catch (insertError2) {
      console.log('❌ Error en inserción 2:');
      console.log('Status:', insertError2.response?.status);
      console.log('Error:', insertError2.response?.data);
    }

    // 4. Probar con formato MM/DD/AAAA (debería fallar)
    console.log('\n4. Probando con formato MM/DD/AAAA (10/31/2025)...');
    const insertData3 = {
      Nombre: 'Test MM/DD',
      Apellido: 'Test Apellido 3',
      Cedula: '33333333', // Cédula única
      FechaIngreso: '10/31/2025', // Formato MM/DD/AAAA (debería fallar)
      Email: 'testmmdd@example.com'
    };

    try {
      const insertResponse3 = await axios.post('http://localhost:3001/api/databases/BD_ABM1/tables/Funcionario/records', {
        record: insertData3
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('❌ Inserción exitosa (no debería ser exitosa):');
      console.log(insertResponse3.data);
    } catch (insertError3) {
      console.log('✅ Error esperado con formato MM/DD/AAAA:');
      console.log('Status:', insertError3.response?.status);
      console.log('Error:', insertError3.response?.data);
    }

  } catch (error) {
    console.error('Error en la prueba:', error.response?.data || error.message);
  }
}

testUniqueDates();
