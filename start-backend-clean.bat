@echo off
echo ========================================
echo    INICIANDO BACKEND ABM - LIMPIO
echo ========================================

REM Cambiar al directorio backend
cd /d "%~dp0backend"

REM Verificar si el puerto 3001 está en uso
echo Verificando puerto 3001...
netstat -ano | findstr :3001 >nul
if %errorlevel% == 0 (
    echo Puerto 3001 está en uso. Liberando...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
        echo Terminando proceso PID: %%a
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

REM Verificar que el puerto esté libre
netstat -ano | findstr :3001 >nul
if %errorlevel% == 0 (
    echo ERROR: No se pudo liberar el puerto 3001
    pause
    exit /b 1
)

echo Puerto 3001 libre. Iniciando servidor...
echo.

REM Iniciar el servidor
npm run dev

pause
