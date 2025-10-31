const activatedTablesService = require('./backend/services/activatedTablesService');

async function testActivatedTablesService() {
  try {
    console.log('🔍 Probando servicio activatedTablesService...');
    console.log('');

    // Probar getActivatedTables
    console.log('1️⃣ Probando getActivatedTables()...');
    try {
      const activatedTables = await activatedTablesService.getActivatedTables();
      console.log('✅ getActivatedTables() exitoso');
      console.log('📋 Tablas activadas:', activatedTables);
    } catch (error) {
      console.error('❌ Error en getActivatedTables():', error.message);
      console.error('🔍 Stack trace:', error.stack);
    }

    console.log('');

    // Probar getAllDatabases
    console.log('2️⃣ Probando getAllDatabases()...');
    try {
      const databases = await activatedTablesService.getAllDatabases();
      console.log('✅ getAllDatabases() exitoso');
      console.log('📋 Bases de datos:', databases);
    } catch (error) {
      console.error('❌ Error en getAllDatabases():', error.message);
    }

    console.log('');

    // Probar getAllTables
    console.log('3️⃣ Probando getAllTables()...');
    try {
      const allTables = await activatedTablesService.getAllTables();
      console.log('✅ getAllTables() exitoso');
      console.log(`📋 Total de tablas: ${allTables.length}`);
      if (allTables.length > 0) {
        console.log('📋 Primeras 3 tablas:', allTables.slice(0, 3));
      }
    } catch (error) {
      console.error('❌ Error en getAllTables():', error.message);
    }

    console.log('');
    console.log('🎉 Pruebas del servicio completadas!');

  } catch (error) {
    console.error('💥 Error general:', error.message);
  } finally {
    process.exit(0);
  }
}

testActivatedTablesService();
























