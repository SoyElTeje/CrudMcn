#!/bin/bash

echo "========================================"
echo "    Verificacion de Estado de Red"
echo "========================================"
echo

echo "1. Obteniendo IP local..."
IP=$(ipconfig | grep "IPv4" | head -1 | awk '{print $NF}' | tr -d '\r')
echo "    IP Local: $IP"

echo
echo "2. Verificando puertos activos..."
echo "    Puerto 3001 (Backend):"
if netstat -an | grep ":3001" > /dev/null; then
    echo "    ✅ Puerto 3001 activo"
else
    echo "    ❌ Puerto 3001 inactivo"
fi

echo "    Puerto 5173 (Frontend):"
if netstat -an | grep ":5173" > /dev/null; then
    echo "    ✅ Puerto 5173 activo"
else
    echo "    ❌ Puerto 5173 inactivo"
fi

echo "    Puerto 1433 (SQL Server):"
if netstat -an | grep ":1433" > /dev/null; then
    echo "    ✅ Puerto 1433 activo"
else
    echo "    ❌ Puerto 1433 inactivo"
fi

echo
echo "3. URLs de acceso:"
echo "    Frontend local:  http://localhost:5173"
echo "    Frontend red:    http://$IP:5173"
echo "    Backend local:   http://localhost:3001"
echo "    Backend red:     http://$IP:3001"
echo "    Health Check:    http://localhost:3001/api/health"

echo
echo "4. Comandos de prueba:"
echo "    curl http://localhost:3001/api/health"
echo "    curl http://$IP:3001/api/health"

echo
read -p "Presiona Enter para continuar..."

















