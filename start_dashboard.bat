@echo off
title Market Intelligence Engine - Dashboard Server
echo ============================================================
echo   Iniciando Servidor del Market Intelligence Engine
echo ============================================================
echo.

cd /d "%~dp0"

if not exist "venv\Scripts\python.exe" (
    echo [!] No se encontro el entorno virtual en .\venv.
    echo [*] Creando entorno virtual e instalando dependencias...
    py -m venv venv
    call .\venv\Scripts\pip install -r requirements.txt
)

echo [*] Abriendo navegador en http://localhost:8080...
start http://localhost:8080

echo [*] Servidor activo en http://localhost:8080 (Presiona Ctrl+C para detenerlo)
echo.
.\venv\Scripts\python -m src.dashboard.server --port 8080
pause
