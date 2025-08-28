@echo off
echo ========================================
echo    Iniciando Frontend (Red Local)
echo ========================================
echo.

cd frontend
echo Puerto: 5173
echo URL local: http://localhost:5173
echo URL red: http://0.0.0.0:5173
echo.

npm run dev
