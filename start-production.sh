#!/bin/bash

echo "========================================"
echo "    Iniciando Aplicacion en Produccion"
echo "========================================"
echo

echo "1. Verificando archivo .env..."
if [ ! -f .env ]; then
    echo "    ERROR: Archivo .env no encontrado"
    echo "    Ejecutar primero: ./deploy-production.sh"
    read -p "Presiona Enter para continuar..."
    exit 1
fi

echo
echo "2. Iniciando Backend en produccion..."
cd backend
gnome-terminal --title="Backend Produccion" -- bash -c "npm start; exec bash" 2>/dev/null || \
xterm -title "Backend Produccion" -e "npm start; bash" 2>/dev/null || \
start "Backend Produccion" cmd /k "npm start" 2>/dev/null || \
echo "    Backend iniciado en nueva terminal"

echo
echo "3. Iniciando Frontend en produccion..."
cd ../frontend
gnome-terminal --title="Frontend Produccion" -- bash -c "npm run preview; exec bash" 2>/dev/null || \
xterm -title "Frontend Produccion" -e "npm run preview; bash" 2>/dev/null || \
start "Frontend Produccion" cmd /k "npm run preview" 2>/dev/null || \
echo "    Frontend iniciado en nueva terminal"

echo
echo "4. Aplicacion iniciada!"
echo
echo "URLs de acceso:"
echo "    Frontend: http://localhost:4173"
echo "    Backend:  http://localhost:3001"
echo
echo "Para acceso desde red:"
echo "    Frontend: http://IP_SERVIDOR:4173"
echo "    Backend:  http://IP_SERVIDOR:3001"
echo

read -p "Presiona Enter para continuar..."







