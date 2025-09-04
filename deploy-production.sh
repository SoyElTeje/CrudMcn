#!/bin/bash

echo "========================================"
echo "    Despliegue en Produccion"
echo "========================================"
echo

echo "1. Configurando variables de entorno para produccion..."
if [ ! -f .env ]; then
    cp env.production.example .env
    echo "    Archivo .env creado desde env.production.example"
    echo "    IMPORTANTE: Editar .env con credenciales reales de produccion"
else
    echo "    Archivo .env ya existe"
fi

echo
echo "2. Instalando dependencias del backend..."
cd backend
npm install --production

echo
echo "3. Instalando dependencias del frontend..."
cd ../frontend
npm install

echo
echo "4. Construyendo frontend para produccion..."
npm run build

echo
echo "5. Despliegue completado!"
echo
echo "Para iniciar en produccion:"
echo "    1. Terminal 1: cd backend && npm start"
echo "    2. Terminal 2: cd frontend && npm run preview"
echo
echo "URLs de acceso:"
echo "    Frontend: http://IP_SERVIDOR:4173"
echo "    Backend:  http://IP_SERVIDOR:3001"
echo

read -p "Presiona Enter para continuar..."







