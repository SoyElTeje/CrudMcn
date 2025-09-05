const fs = require('fs');
const path = require('path');

console.log('🔧 Arreglando servicio de autenticación para usar tabla users...');

const authServicePath = path.join(__dirname, 'backend', 'services', 'authService.js');

if (!fs.existsSync(authServicePath)) {
  console.error('❌ No se encontró el archivo authService.js');
  process.exit(1);
}

let content = fs.readFileSync(authServicePath, 'utf8');

// Reemplazar todas las referencias a USERS_TABLE por users
content = content.replace(/USERS_TABLE/g, 'users');

// Reemplazar nombres de columnas
content = content.replace(/NombreUsuario/g, 'username');
content = content.replace(/Contrasena/g, 'password_hash');
content = content.replace(/EsAdmin/g, 'is_admin');
content = content.replace(/FechaCreacion/g, 'created_at');

// Reemplazar consultas específicas que necesitan ajustes
content = content.replace(
  /"SELECT \* FROM users WHERE username = @username"/g,
  '"SELECT * FROM users WHERE username = @username"'
);

content = content.replace(
  /"INSERT INTO users \(username, password_hash, is_admin, created_at\) VALUES \(@username, @password, @isAdmin, GETDATE\(\)\); SELECT SCOPE_IDENTITY\(\) AS id;"/g,
  '"INSERT INTO users (username, password_hash, is_admin, created_at) VALUES (@username, @password, @isAdmin, GETDATE()); SELECT SCOPE_IDENTITY() AS id;"'
);

content = content.replace(
  /"SELECT Id, username, created_at FROM users ORDER BY Id DESC"/g,
  '"SELECT id, username, created_at FROM users ORDER BY id DESC"'
);

content = content.replace(
  /"SELECT Id, username, is_admin, created_at FROM users ORDER BY Id DESC"/g,
  '"SELECT id, username, is_admin, created_at FROM users ORDER BY id DESC"'
);

content = content.replace(
  /"UPDATE users SET password_hash = @password WHERE Id = @userId"/g,
  '"UPDATE users SET password_hash = @password WHERE id = @userId"'
);

content = content.replace(
  /"SELECT username FROM users WHERE Id = @userId"/g,
  '"SELECT username FROM users WHERE id = @userId"'
);

content = content.replace(
  /"UPDATE users SET is_admin = @isAdmin WHERE Id = @userId"/g,
  '"UPDATE users SET is_admin = @isAdmin WHERE id = @userId"'
);

content = content.replace(
  /"DELETE FROM users WHERE Id = @userId"/g,
  '"DELETE FROM users WHERE id = @userId"'
);

content = content.replace(
  /"SELECT username FROM users WHERE Id = @userId"/g,
  '"SELECT username FROM users WHERE id = @userId"'
);

content = content.replace(
  /"SELECT is_admin FROM users WHERE Id = @userId"/g,
  '"SELECT is_admin FROM users WHERE id = @userId"'
);

content = content.replace(
  /"SELECT \* FROM users WHERE username = @username"/g,
  '"SELECT * FROM users WHERE username = @username"'
);

content = content.replace(
  /"INSERT INTO users \(username, password_hash, is_admin\) VALUES \(@username, @password, 1\)"/g,
  '"INSERT INTO users (username, password_hash, is_admin) VALUES (@username, @password, 1)"'
);

// Arreglar la función canListTables específicamente
content = content.replace(
  /const checkColumnQuery = `\s*SELECT COUNT\(\*\) as count\s*FROM INFORMATION_SCHEMA\.COLUMNS\s*WHERE TABLE_NAME = 'users'\s*AND COLUMN_NAME = 'is_admin'\s*`;/g,
  `const checkColumnQuery = \`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'is_admin'
      \`;`
);

content = content.replace(
  /const userQuery =\s*"SELECT username FROM users WHERE Id = @userId";/g,
  'const userQuery = "SELECT username FROM users WHERE id = @userId";'
);

content = content.replace(
  /const userQuery = "SELECT is_admin FROM users WHERE Id = @userId";/g,
  'const userQuery = "SELECT is_admin FROM users WHERE id = @userId";'
);

// Arreglar otras funciones que usan Id en lugar de id
content = content.replace(
  /"SELECT Id FROM users WHERE username = @username"/g,
  '"SELECT id FROM users WHERE username = @username"'
);

// Guardar el archivo actualizado
fs.writeFileSync(authServicePath, content);

console.log('✅ Servicio de autenticación actualizado exitosamente');
console.log('📋 Cambios realizados:');
console.log('   - USERS_TABLE → users');
console.log('   - NombreUsuario → username');
console.log('   - Contrasena → password_hash');
console.log('   - EsAdmin → is_admin');
console.log('   - FechaCreacion → created_at');
console.log('   - Id → id (en consultas)');

console.log('\n🔄 Reinicia el servidor para aplicar los cambios');





