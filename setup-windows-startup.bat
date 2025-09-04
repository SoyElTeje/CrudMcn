@echo off
echo ========================================
echo   CONFIGURACION INICIO AUTOMATICO
echo ========================================
echo.

echo Creando tarea programada para inicio automatico...

REM Crear script de inicio
echo @echo off > startup-abm.bat
echo cd /d "%~dp0" >> startup-abm.bat
echo pm2 resurrect >> startup-abm.bat

REM Crear tarea programada
schtasks /create /tn "ABM MCN Startup" /tr "%~dp0startup-abm.bat" /sc onstart /ru "SYSTEM" /f

if errorlevel 1 (
    echo ❌ Error al crear la tarea programada
    echo.
    echo 💡 Alternativa manual:
    echo 1. Abrir "Tareas programadas" (Task Scheduler)
    echo 2. Crear tarea basica
    echo 3. Nombre: "ABM MCN Startup"
    echo 4. Disparador: "Al iniciar el equipo"
    echo 5. Accion: "Iniciar programa"
    echo 6. Programa: "%~dp0startup-abm.bat"
    echo.
) else (
    echo ✅ Tarea programada creada exitosamente
    echo.
    echo 🔄 El sistema se iniciara automaticamente al reiniciar el servidor
)

echo.
echo 📋 Para verificar la tarea:
echo    schtasks /query /tn "ABM MCN Startup"
echo.
echo 📋 Para eliminar la tarea:
echo    schtasks /delete /tn "ABM MCN Startup" /f
echo.
pause
