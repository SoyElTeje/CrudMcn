const axios = require('axios');

async function checkTableConditions() {
  try {
    console.log('=== Verificando Condiciones de Tabla ===\n');

    // 1. Probar login
    console.log('1. Iniciando sesión...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'user',
      password: 'user'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso\n');

    // 2. Verificar si la tabla está activada
    console.log('2. Verificando si la tabla está activada...');
    try {
      const activatedResponse = await axios.get('http://localhost:3001/api/activated-tables/activated', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const activatedTables = activatedResponse.data;
      const funcionarioTable = activatedTables.find(table => 
        table.DatabaseName === 'BD_ABM1' && table.TableName === 'Funcionario'
      );

      if (funcionarioTable) {
        console.log('✅ Tabla Funcionario está activada');
        console.log('  ID:', funcionarioTable.Id);
        console.log('  Descripción:', funcionarioTable.Description);
        console.log('');

        // 3. Obtener condiciones de la tabla
        console.log('3. Obteniendo condiciones de la tabla...');
        try {
          const conditionsResponse = await axios.get('http://localhost:3001/api/activated-tables/conditions/BD_ABM1/Funcionario', {
            headers: { Authorization: `Bearer ${token}` }
          });

          console.log('Condiciones configuradas:');
          conditionsResponse.data.forEach(condition => {
            console.log(`- Columna: ${condition.ColumnName}`);
            console.log(`  Tipo: ${condition.DataType}`);
            console.log(`  Requerido: ${condition.IsRequired ? 'SÍ' : 'NO'}`);
            console.log(`  Tipo de condición: ${condition.ConditionType || 'N/A'}`);
            console.log(`  Valor de condición: ${condition.ConditionValue || 'N/A'}`);
            console.log('');
          });

        } catch (conditionsError) {
          console.log('❌ Error obteniendo condiciones:');
          console.log('Status:', conditionsError.response?.status);
          console.log('Error:', conditionsError.response?.data);
        }

      } else {
        console.log('❌ Tabla Funcionario NO está activada');
      }

    } catch (activatedError) {
      console.log('❌ Error verificando tablas activadas:');
      console.log('Status:', activatedError.response?.status);
      console.log('Error:', activatedError.response?.data);
    }

  } catch (error) {
    console.error('Error en la prueba:', error.response?.data || error.message);
  }
}

checkTableConditions();
