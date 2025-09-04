#!/bin/bash

echo "========================================"
echo "    Test de Conexion a Base de Datos"
echo "========================================"
echo

if [ ! -f .env ]; then
    echo "ERROR: Archivo .env no encontrado"
    echo
    echo "Ejecuta primero: ./install.sh"
    echo
    read -p "Presiona Enter para continuar..."
    exit 1
fi

echo "Ejecutando test de conexion..."
echo
npm start







