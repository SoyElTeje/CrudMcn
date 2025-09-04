#!/bin/bash

echo "========================================"
echo "    Verificacion de Produccion"
echo "========================================"
echo

echo "1. Obteniendo IP del servidor..."
IP=$(ipconfig | grep "IPv4" | head -1 | awk '{print $NF}' | tr -d '\r')
echo "    IP del servidor: $IP"

echo
echo "2. Verificando puertos activos..."
echo "    Puerto 3001 (Backend):"
if netstat -an | grep ":3001" > /dev/null; then
    echo "    ✅ Puerto 3001 activo"
else
    echo "    ❌ Puerto 3001 inactivo"
fi

echo "    Puerto 4173 (Frontend):"
if netstat -an | grep ":4173" > /dev/null; then
    echo "    ✅ Puerto 4173 activo"
else
    echo "    ❌ Puerto 4173 inactivo"
fi

echo "    Puerto 1433 (SQL Server):"
if netstat -an | grep ":1433" > /dev/null; then
    echo "    ✅ Puerto 1433 activo"
else
    echo "    ❌ Puerto 1433 inactivo"
fi

echo
echo "3. Verificando servicios..."
echo "    Backend Health Check:"
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "    ✅ Backend respondiendo"
else
    echo "    ❌ Backend no responde"
fi

echo "    Frontend:"
if curl -s -I http://localhost:4173 > /dev/null; then
    echo "    ✅ Frontend respondiendo"
else
    echo "    ❌ Frontend no responde"
fi

echo
echo "4. URLs de acceso:"
echo "    Frontend local:  http://localhost:4173"
echo "    Frontend red:    http://$IP:4173"
echo "    Backend local:   http://localhost:3001"
echo "    Backend red:     http://$IP:3001"
echo "    Health Check:    http://localhost:3001/api/health"

echo
echo "5. Comandos de prueba:"
echo "    curl http://localhost:3001/api/health"
echo "    curl http://$IP:3001/api/health"

echo
echo "6. Verificacion de base de datos..."
if [ -f "testDb/test_db.js" ]; then
    echo "    Ejecutando test de base de datos..."
    cd testDb
    node test_db.js
    cd ..
else
    echo "    ⚠️  Script de test de base de datos no encontrado"
fi

echo
read -p "Presiona Enter para continuar..."







