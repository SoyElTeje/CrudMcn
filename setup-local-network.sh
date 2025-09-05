#!/bin/bash

echo "========================================"
echo "    Configuracion para Red Local"
echo "========================================"
echo

echo "1. Configurando variables de entorno para red local..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "    Archivo .env creado desde env.example"
else
    echo "    Archivo .env encontrado, actualizando..."
fi

echo
echo "2. Configuracion CORS para red local..."
echo "    CORS_ORIGIN=http://localhost:5173,http://0.0.0.0:5173"

echo
echo "3. Obteniendo IP local..."
IP=$(ipconfig | grep "IPv4" | head -1 | awk '{print $NF}' | tr -d '\r')
echo "    Tu IP local es: $IP"

echo
echo "4. URLs de acceso:"
echo "    Frontend local: http://localhost:5173"
echo "    Frontend red:   http://$IP:5173"
echo "    Backend local:  http://localhost:3001"
echo "    Backend red:    http://$IP:3001"
echo

echo "5. Configuracion completada!"
echo
echo "Para iniciar la aplicacion:"
echo "    1. Terminal 1: cd backend && npm run dev"
echo "    2. Terminal 2: cd frontend && npm run dev"
echo
echo "Para acceso desde otros dispositivos:"
echo "    - Frontend: http://$IP:5173"
echo "    - Backend:  http://$IP:3001"
echo

read -p "Presiona Enter para continuar..."








