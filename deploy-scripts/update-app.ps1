# Script para actualizar la aplicación AbmMcn
# Ejecutar como Administrador

Write-Host "🔄 Actualizando aplicación AbmMcn..." -ForegroundColor Green

# Configuración
$appDir = "C:\apps\AbmMcn"
$backupDir = "C:\backups"

# Verificar que el directorio existe
if (!(Test-Path $appDir)) {
    Write-Host "❌ Directorio de aplicación no encontrado: $appDir" -ForegroundColor Red
    Write-Host "💡 Ejecuta primero el script de despliegue inicial" -ForegroundColor Yellow
    exit 1
}

# Crear backup antes de actualizar
Write-Host "📦 Creando backup antes de actualizar..." -ForegroundColor Yellow
$date = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "$backupDir\code\AbmMcn_update_$date.zip"

try {
    Compress-Archive -Path $appDir -DestinationPath $backupFile -Force
    Write-Host "✅ Backup creado: $backupFile" -ForegroundColor Green
} catch {
    Write-Host "❌ Error creando backup: $_" -ForegroundColor Red
    exit 1
}

# Detener aplicación
Write-Host "🛑 Deteniendo aplicación..." -ForegroundColor Yellow
try {
    pm2 stop abmmcn-backend
    Write-Host "✅ Aplicación detenida" -ForegroundColor Green
} catch {
    Write-Host "⚠️ No se pudo detener la aplicación: $_" -ForegroundColor Yellow
}

# Actualizar código desde Git
Write-Host "📥 Actualizando código desde Git..." -ForegroundColor Yellow
try {
    Set-Location $appDir
    git fetch origin
    git reset --hard origin/main
    Write-Host "✅ Código actualizado exitosamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error actualizando código: $_" -ForegroundColor Red
    Write-Host "🔄 Restaurando desde backup..." -ForegroundColor Yellow
    
    # Restaurar desde backup
    try {
        pm2 start abmmcn-backend
        Write-Host "✅ Aplicación restaurada desde backup" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error restaurando aplicación: $_" -ForegroundColor Red
    }
    exit 1
}

# Instalar dependencias del backend
Write-Host "📦 Actualizando dependencias del backend..." -ForegroundColor Yellow
try {
    Set-Location "$appDir\backend"
    npm install --production
    Write-Host "✅ Dependencias del backend actualizadas" -ForegroundColor Green
} catch {
    Write-Host "❌ Error actualizando dependencias del backend: $_" -ForegroundColor Red
    exit 1
}

# Instalar dependencias del frontend
Write-Host "📦 Actualizando dependencias del frontend..." -ForegroundColor Yellow
try {
    Set-Location "$appDir\frontend"
    npm install --production
    Write-Host "✅ Dependencias del frontend actualizadas" -ForegroundColor Green
} catch {
    Write-Host "❌ Error actualizando dependencias del frontend: $_" -ForegroundColor Red
    exit 1
}

# Construir frontend
Write-Host "🔨 Reconstruyendo frontend..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✅ Frontend reconstruido exitosamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error reconstruyendo frontend: $_" -ForegroundColor Red
    exit 1
}

# Reiniciar aplicación
Write-Host "🚀 Reiniciando aplicación..." -ForegroundColor Yellow
try {
    Set-Location $appDir
    pm2 restart abmmcn-backend
    Write-Host "✅ Aplicación reiniciada exitosamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error reiniciando aplicación: $_" -ForegroundColor Red
    exit 1
}

# Verificar estado de la aplicación
Write-Host "🔍 Verificando estado de la aplicación..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
try {
    $status = pm2 status
    Write-Host "✅ Estado de la aplicación:" -ForegroundColor Green
    Write-Host $status -ForegroundColor White
} catch {
    Write-Host "❌ Error verificando estado: $_" -ForegroundColor Red
}

# Limpiar backups antiguos (mantener solo los últimos 5)
Write-Host "🧹 Limpiando backups antiguos..." -ForegroundColor Yellow
try {
    $backupFiles = Get-ChildItem "$backupDir\code\AbmMcn_*.zip" | Sort-Object LastWriteTime -Descending
    if ($backupFiles.Count -gt 5) {
        $filesToDelete = $backupFiles | Select-Object -Skip 5
        foreach ($file in $filesToDelete) {
            Remove-Item $file.FullName -Force
            Write-Host "🗑️ Eliminado: $($file.Name)" -ForegroundColor Gray
        }
        Write-Host "✅ Limpieza de backups completada" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ No hay backups antiguos para eliminar" -ForegroundColor Cyan
    }
} catch {
    Write-Host "⚠️ No se pudo limpiar backups antiguos: $_" -ForegroundColor Yellow
}

Write-Host "✅ Actualización completada exitosamente!" -ForegroundColor Green
Write-Host "🌐 La aplicación debería estar disponible en: http://localhost:3001" -ForegroundColor Green

# Mostrar información de la versión
try {
    $commitHash = git rev-parse --short HEAD
    $commitDate = git log -1 --format="%cd" --date=short
    Write-Host "📋 Información de la versión:" -ForegroundColor Cyan
    Write-Host "   Commit: $commitHash" -ForegroundColor White
    Write-Host "   Fecha: $commitDate" -ForegroundColor White
} catch {
    Write-Host "⚠️ No se pudo obtener información de la versión" -ForegroundColor Yellow
}
