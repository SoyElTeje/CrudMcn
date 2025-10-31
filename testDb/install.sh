#!/bin/bash

echo "========================================"
echo "    Instalacion del Test de Base de Datos"
echo "========================================"
echo

echo "1. Instalando dependencias..."
npm install

echo
echo "2. Configurando archivo de variables de entorno..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "    Archivo .env creado desde env.example"
else
    echo "    Archivo .env ya existe"
fi

echo
echo "3. Instalacion completada!"
echo
echo "Para ejecutar el test:"
echo "    npm start"
echo
echo "Para editar la configuracion:"
echo "    nano .env"
echo

read -p "Presiona Enter para continuar..."


























