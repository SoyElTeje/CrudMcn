@echo off
echo Deteniendo procesos en puerto 3001...

REM Buscar procesos en puerto 3001
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo Terminando proceso PID: %%a
    taskkill /PID %%a /F
)

echo Puerto 3001 liberado.
pause
