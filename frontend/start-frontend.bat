@echo off
cd /d "%~dp0"
echo Iniciando servidor frontend...
npx serve -s dist -l 5173
