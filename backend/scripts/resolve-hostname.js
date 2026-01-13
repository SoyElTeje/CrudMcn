/**
 * Script para resolver un hostname a su IP
 * 
 * Uso:
 *   node scripts/resolve-hostname.js <hostname>
 *   node scripts/resolve-hostname.js mcn-bidb-svr
 */

const dns = require('dns');
const { promisify } = require('util');

const resolve4 = promisify(dns.resolve4);
const lookup = promisify(dns.lookup);

async function resolveHostname(hostname) {
  try {
    console.log(`🔍 Resolviendo hostname: ${hostname}\n`);

    // Intentar lookup (más rápido, usa el cache del sistema)
    try {
      const { address, family } = await lookup(hostname);
      console.log(`✅ IP encontrada (lookup):`);
      console.log(`   Hostname: ${hostname}`);
      console.log(`   IP: ${address}`);
      console.log(`   Familia: IPv${family}\n`);
      return address;
    } catch (lookupError) {
      console.log(`⚠️  Lookup falló: ${lookupError.message}`);
    }

    // Intentar resolve4 (más completo)
    try {
      const addresses = await resolve4(hostname);
      console.log(`✅ IPs encontradas (resolve4):`);
      addresses.forEach((ip, index) => {
        console.log(`   ${index + 1}. ${ip}`);
      });
      console.log('');
      return addresses[0]; // Retornar la primera IP
    } catch (resolveError) {
      console.log(`⚠️  Resolve4 falló: ${resolveError.message}\n`);
    }

    console.log(`❌ No se pudo resolver el hostname: ${hostname}`);
    process.exit(1);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Obtener hostname de los argumentos
const hostname = process.argv[2];

if (!hostname) {
  console.log('Uso: node scripts/resolve-hostname.js <hostname>');
  console.log('Ejemplo: node scripts/resolve-hostname.js mcn-bidb-svr');
  process.exit(1);
}

resolveHostname(hostname).then((ip) => {
  console.log(`\n💡 IP para usar en .docker.env: ${ip}`);
  console.log(`   O puedes usar el hostname directamente: ${hostname}`);
});





