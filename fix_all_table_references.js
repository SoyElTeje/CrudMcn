const fs = require('fs');
const path = require('path');

console.log('🔧 Arreglando todas las referencias a USERS_TABLE...');

// Archivos que necesitan ser actualizados
const filesToUpdate = [
  'backend/services/activatedTablesService.js',
  'backend/middleware/auth.js'
];

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`📝 Actualizando ${filePath}...`);
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Reemplazar referencias a USERS_TABLE
    content = content.replace(/USERS_TABLE/g, 'users');
    content = content.replace(/NombreUsuario/g, 'username');
    content = content.replace(/Contrasena/g, 'password_hash');
    content = content.replace(/EsAdmin/g, 'is_admin');
    content = content.replace(/FechaCreacion/g, 'created_at');
    
    // Arreglar referencias específicas de columnas
    content = content.replace(/u\.Id/g, 'u.id');
    content = content.replace(/u2\.Id/g, 'u2.id');
    content = content.replace(/tc\.CreatedBy/g, 'tc.created_by');
    content = content.replace(/tc\.UpdatedBy/g, 'tc.updated_by');
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ ${filePath} actualizado`);
  } else {
    console.log(`⚠️  Archivo ${filePath} no encontrado`);
  }
});

console.log('\n✅ Todas las referencias han sido actualizadas');
console.log('🔄 Reinicia el servidor para aplicar los cambios');





