/**
 * Script para verificar la configuración del servidor
 */

const os = require('os');
const { exec } = require('child_process');

function checkServerConfig() {
  console.log('🔍 VERIFICACIÓN DE CONFIGURACIÓN DEL SERVIDOR');
  console.log('==============================================');

  // Información del sistema
  console.log('\n📊 Información del Sistema:');
  console.log(`   OS: ${os.platform()} ${os.arch()}`);
  console.log(`   Hostname: ${os.hostname()}`);
  console.log(`   Node.js: ${process.version}`);

  // Interfaces de red
  console.log('\n🌐 Interfaces de Red:');
  const interfaces = os.networkInterfaces();
  
  Object.keys(interfaces).forEach(interfaceName => {
    const interfaceInfo = interfaces[interfaceName];
    console.log(`   ${interfaceName}:`);
    
    interfaceInfo.forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`     - ${iface.address} (${iface.mac})`);
      }
    });
  });

  // Verificar puerto 3001
  console.log('\n🔌 Verificación de Puerto 3001:');
  
  exec('netstat -an | findstr :3001', (error, stdout, stderr) => {
    if (error) {
      console.log('   ❌ Error verificando puerto:', error.message);
      return;
    }
    
    if (stdout.trim()) {
      console.log('   📋 Conexiones en puerto 3001:');
      console.log(stdout);
    } else {
      console.log('   ⚠️ No hay conexiones activas en puerto 3001');
    }
  });

  // Verificar firewall (Windows)
  console.log('\n🛡️ Verificación de Firewall:');
  
  exec('netsh advfirewall firewall show rule name="Node.js"', (error, stdout, stderr) => {
    if (error) {
      console.log('   ⚠️ No se pudo verificar firewall o no hay reglas para Node.js');
      console.log('   💡 Considera agregar una regla de firewall para el puerto 3001');
    } else {
      console.log('   📋 Reglas de firewall para Node.js:');
      console.log(stdout);
    }
  });

  // Recomendaciones
  console.log('\n💡 Recomendaciones para Conexiones Externas:');
  console.log('   1. ✅ Servidor configurado para escuchar en 0.0.0.0:3001');
  console.log('   2. ✅ CORS configurado para permitir cualquier origen');
  console.log('   3. 🔧 Verificar que el firewall permita conexiones en puerto 3001');
  console.log('   4. 🔧 Verificar que el router/proxy permita conexiones al servidor');
  console.log('   5. 🔧 Usar la IP del servidor en lugar de localhost desde clientes externos');
  
  console.log('\n📝 URLs de Acceso:');
  console.log('   Local: http://localhost:3001');
  console.log('   Red: http://[IP_DEL_SERVIDOR]:3001');
  
  // Mostrar IPs disponibles
  const networkInterfaces = os.networkInterfaces();
  const externalIPs = [];
  
  Object.keys(networkInterfaces).forEach(interfaceName => {
    const interfaceInfo = networkInterfaces[interfaceName];
    interfaceInfo.forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        externalIPs.push(iface.address);
      }
    });
  });
  
  if (externalIPs.length > 0) {
    console.log('\n🌐 IPs Disponibles para Acceso Externo:');
    externalIPs.forEach(ip => {
      console.log(`   http://${ip}:3001`);
    });
  }
}

// Ejecutar verificación
if (require.main === module) {
  checkServerConfig();
}

module.exports = { checkServerConfig };

















