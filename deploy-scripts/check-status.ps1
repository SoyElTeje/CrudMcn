# Script para verificar el estado de la aplicación AbmMcn
# Ejecutar como Administrador

Write-Host "🔍 Verificando estado de la aplicación AbmMcn..." -ForegroundColor Green

# Configuración
$appDir = "C:\apps\AbmMcn"

# Verificar que el directorio existe
if (!(Test-Path $appDir)) {
    Write-Host "❌ Directorio de aplicación no encontrado: $appDir" -ForegroundColor Red
    exit 1
}

# Verificar estado de PM2
Write-Host "📋 Estado de PM2:" -ForegroundColor Yellow
try {
    $pm2Status = pm2 status
    Write-Host $pm2Status -ForegroundColor White
} catch {
    Write-Host "❌ Error obteniendo estado de PM2: $_" -ForegroundColor Red
}

# Verificar puertos en uso
Write-Host "🔌 Puertos en uso:" -ForegroundColor Yellow
try {
    $port3001 = netstat -ano | findstr :3001
    if ($port3001) {
        Write-Host "✅ Puerto 3001 está en uso:" -ForegroundColor Green
        Write-Host $port3001 -ForegroundColor White
    } else {
        Write-Host "❌ Puerto 3001 no está en uso" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error verificando puertos: $_" -ForegroundColor Red
}

# Verificar logs recientes
Write-Host "📝 Logs recientes (últimas 10 líneas):" -ForegroundColor Yellow
try {
    $logs = pm2 logs abmmcn-backend --lines 10 --nostream
    if ($logs) {
        Write-Host $logs -ForegroundColor White
    } else {
        Write-Host "ℹ️ No hay logs recientes" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Error obteniendo logs: $_" -ForegroundColor Red
}

# Verificar uso de memoria y CPU
Write-Host "💾 Uso de recursos:" -ForegroundColor Yellow
try {
    $monit = pm2 monit --nostream
    if ($monit) {
        Write-Host $monit -ForegroundColor White
    } else {
        Write-Host "ℹ️ No se pudo obtener información de recursos" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Error obteniendo información de recursos: $_" -ForegroundColor Red
}

# Verificar archivos de configuración
Write-Host "⚙️ Verificando archivos de configuración:" -ForegroundColor Yellow

# Verificar archivo .env
$envFile = "$appDir\backend\.env"
if (Test-Path $envFile) {
    Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green
    $envContent = Get-Content $envFile
    Write-Host "📋 Variables de entorno configuradas:" -ForegroundColor Cyan
    foreach ($line in $envContent) {
        if ($line -and !$line.StartsWith("#")) {
            $key = $line.Split("=")[0]
            Write-Host "   $key" -ForegroundColor White
        }
    }
} else {
    Write-Host "❌ Archivo .env no encontrado" -ForegroundColor Red
}

# Verificar archivo ecosystem.config.js
$ecosystemFile = "$appDir\ecosystem.config.js"
if (Test-Path $ecosystemFile) {
    Write-Host "✅ Archivo ecosystem.config.js encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ Archivo ecosystem.config.js no encontrado" -ForegroundColor Red
}

# Verificar directorio de logs
$logsDir = "$appDir\logs"
if (Test-Path $logsDir) {
    Write-Host "✅ Directorio de logs encontrado" -ForegroundColor Green
    $logFiles = Get-ChildItem $logsDir
    Write-Host "📋 Archivos de log:" -ForegroundColor Cyan
    foreach ($file in $logFiles) {
        $size = [math]::Round($file.Length / 1KB, 2)
        Write-Host "   $($file.Name) ($size KB)" -ForegroundColor White
    }
} else {
    Write-Host "❌ Directorio de logs no encontrado" -ForegroundColor Red
}

# Verificar conexión a la base de datos
Write-Host "🗄️ Verificando conexión a la base de datos:" -ForegroundColor Yellow
try {
    $envContent = Get-Content $envFile
    $dbServer = ($envContent | Where-Object { $_ -like "DB_SERVER=*" }).Split("=")[1]
    $dbDatabase = ($envContent | Where-Object { $_ -like "DB_DATABASE=*" }).Split("=")[1]
    
    Write-Host "📋 Configuración de BD:" -ForegroundColor Cyan
    Write-Host "   Servidor: $dbServer" -ForegroundColor White
    Write-Host "   Base de datos: $dbDatabase" -ForegroundColor White
    
    # Intentar conexión simple
    $testQuery = "SELECT 1 as test"
    $result = sqlcmd -S $dbServer -d $dbDatabase -Q $testQuery -h -1
    if ($result -like "*1*") {
        Write-Host "✅ Conexión a la base de datos exitosa" -ForegroundColor Green
    } else {
        Write-Host "❌ Error conectando a la base de datos" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error verificando base de datos: $_" -ForegroundColor Red
}

# Verificar firewall
Write-Host "🔥 Verificando reglas de firewall:" -ForegroundColor Yellow
try {
    $firewallRule = Get-NetFirewallRule -DisplayName "AbmMcn Backend" -ErrorAction SilentlyContinue
    if ($firewallRule) {
        Write-Host "✅ Regla de firewall encontrada" -ForegroundColor Green
        Write-Host "   Estado: $($firewallRule.Enabled)" -ForegroundColor White
        Write-Host "   Acción: $($firewallRule.Action)" -ForegroundColor White
    } else {
        Write-Host "❌ Regla de firewall no encontrada" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error verificando firewall: $_" -ForegroundColor Red
}

# Verificar servicios de Windows
Write-Host "🖥️ Verificando servicios relacionados:" -ForegroundColor Yellow
$services = @("MSSQLSERVER", "SQLBrowser")
foreach ($service in $services) {
    try {
        $serviceStatus = Get-Service -Name $service -ErrorAction SilentlyContinue
        if ($serviceStatus) {
            $status = if ($serviceStatus.Status -eq "Running") { "✅" } else { "❌" }
            Write-Host "$status $service : $($serviceStatus.Status)" -ForegroundColor $(if ($serviceStatus.Status -eq "Running") { "Green" } else { "Red" })
        } else {
            Write-Host "❌ $service : No encontrado" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error verificando servicio $service : $_" -ForegroundColor Red
    }
}

# Verificar espacio en disco
Write-Host "💿 Verificando espacio en disco:" -ForegroundColor Yellow
try {
    $drive = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
    $freeSpaceGB = [math]::Round($drive.FreeSpace / 1GB, 2)
    $totalSpaceGB = [math]::Round($drive.Size / 1GB, 2)
    $usedSpaceGB = $totalSpaceGB - $freeSpaceGB
    $usedPercentage = [math]::Round(($usedSpaceGB / $totalSpaceGB) * 100, 2)
    
    Write-Host "📋 Disco C:" -ForegroundColor Cyan
    Write-Host "   Espacio total: $totalSpaceGB GB" -ForegroundColor White
    Write-Host "   Espacio usado: $usedSpaceGB GB ($usedPercentage%)" -ForegroundColor White
    Write-Host "   Espacio libre: $freeSpaceGB GB" -ForegroundColor White
    
    if ($freeSpaceGB -lt 5) {
        Write-Host "⚠️ Espacio libre bajo (< 5 GB)" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Espacio libre suficiente" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error verificando espacio en disco: $_" -ForegroundColor Red
}

Write-Host "✅ Verificación completada!" -ForegroundColor Green
