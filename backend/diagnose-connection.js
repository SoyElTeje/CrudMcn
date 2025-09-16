/**
 * Script para diagnosticar problemas de conexión externa
 */

const os = require("os");
const { exec } = require("child_process");
const util = require("util");

const execAsync = util.promisify(exec);

async function diagnoseConnection() {
  console.log("🔍 DIAGNÓSTICO DE CONEXIÓN EXTERNA");
  console.log("===================================");

  // 1. Obtener IPs del servidor
  console.log("\n🌐 IPs del Servidor:");
  const interfaces = os.networkInterfaces();
  const serverIPs = [];

  Object.keys(interfaces).forEach((interfaceName) => {
    const interfaceInfo = interfaces[interfaceName];
    interfaceInfo.forEach((iface) => {
      if (iface.family === "IPv4" && !iface.internal) {
        serverIPs.push({
          interface: interfaceName,
          ip: iface.address,
          mac: iface.mac,
        });
        console.log(`   ${interfaceName}: ${iface.address}`);
      }
    });
  });

  if (serverIPs.length === 0) {
    console.log("   ❌ No se encontraron IPs externas");
    return;
  }

  // 2. Verificar si el puerto 3001 está abierto
  console.log("\n🔌 Verificación de Puerto 3001:");

  try {
    const { stdout } = await execAsync("netstat -an | findstr :3001");
    if (stdout.trim()) {
      console.log("   ✅ Puerto 3001 está en uso:");
      console.log(stdout);
    } else {
      console.log("   ❌ Puerto 3001 no está en uso");
      console.log("   💡 Asegúrate de que el servidor esté ejecutándose");
    }
  } catch (error) {
    console.log("   ⚠️ Error verificando puerto:", error.message);
  }

  // 3. Verificar firewall
  console.log("\n🛡️ Verificación de Firewall:");

  try {
    const { stdout } = await execAsync(
      'netsh advfirewall firewall show rule name="Node.js"'
    );
    if (stdout.includes("No rules match")) {
      console.log("   ⚠️ No hay reglas de firewall para Node.js");
      console.log("   💡 Necesitas crear una regla de firewall");
    } else {
      console.log("   ✅ Reglas de firewall encontradas:");
      console.log(stdout);
    }
  } catch (error) {
    console.log("   ⚠️ Error verificando firewall:", error.message);
  }

  // 4. Crear regla de firewall si es necesario
  console.log("\n🔧 Creando Regla de Firewall:");

  try {
    await execAsync(
      'netsh advfirewall firewall add rule name="Node.js Port 3001" dir=in action=allow protocol=TCP localport=3001'
    );
    console.log("   ✅ Regla de firewall creada exitosamente");
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log("   ✅ Regla de firewall ya existe");
    } else {
      console.log("   ❌ Error creando regla de firewall:", error.message);
      console.log("   💡 Ejecuta como administrador para crear la regla");
    }
  }

  // 5. URLs de prueba
  console.log("\n🌐 URLs para Probar desde Cliente Externo:");
  serverIPs.forEach(({ ip }) => {
    console.log(`   http://${ip}:3001`);
  });

  // 6. Comandos de prueba
  console.log("\n🧪 Comandos de Prueba:");
  console.log("   Desde el cliente externo, prueba:");
  serverIPs.forEach(({ ip }) => {
    console.log(`   curl http://${ip}:3001/api/health`);
    console.log(`   telnet ${ip} 3001`);
  });

  // 7. Verificar configuración del servidor
  console.log("\n⚙️ Configuración del Servidor:");
  console.log("   ✅ Debe escuchar en 0.0.0.0:3001 (no localhost)");
  console.log('   ✅ CORS debe permitir origin: "*"');
  console.log("   ✅ Firewall debe permitir puerto 3001");

  // 8. Pasos de solución
  console.log("\n🔧 Pasos de Solución:");
  console.log("   1. ✅ Servidor configurado para 0.0.0.0:3001");
  console.log("   2. 🔧 Crear regla de firewall (ejecutar como admin)");
  console.log("   3. 🔧 Usar IP del servidor en lugar de localhost");
  console.log("   4. 🔧 Verificar que no hay proxy bloqueando");
  console.log("   5. 🔧 Reiniciar servidor después de cambios");

  // 9. Script de firewall
  console.log("\n📝 Script de Firewall (ejecutar como administrador):");
  console.log(
    '   netsh advfirewall firewall add rule name="Node.js Port 3001" dir=in action=allow protocol=TCP localport=3001'
  );
  console.log(
    '   netsh advfirewall firewall add rule name="Node.js Port 3001 Out" dir=out action=allow protocol=TCP localport=3001'
  );
}

// Ejecutar diagnóstico
if (require.main === module) {
  diagnoseConnection()
    .then(() => {
      console.log("\n✅ Diagnóstico completado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Error en diagnóstico:", error);
      process.exit(1);
    });
}

module.exports = { diagnoseConnection };
