@echo off
echo ========================================
echo    Iniciando Aplicacion en Produccion
echo ========================================
echo.

echo 1. Verificando archivo .env...
if not exist .env (
    echo    ERROR: Archivo .env no encontrado
    echo    Ejecutar primero: deploy-production.bat
    pause
    exit /b 1
)

echo.
echo 2. Iniciando Backend en produccion...
cd backend
start "Backend Produccion" cmd /k "npm start"

echo.
echo 3. Iniciando Frontend en produccion...
cd ../frontend
start "Frontend Produccion" cmd /k "npm run preview"

echo.
echo 4. Aplicacion iniciada!
echo.
echo URLs de acceso:
echo    Frontend: http://localhost:4173
echo    Backend:  http://localhost:3001
echo.
echo Para acceso desde red:
echo    Frontend: http://IP_SERVIDOR:4173
echo    Backend:  http://IP_SERVIDOR:3001
echo.
pause
