@echo off
title Market Intelligence Engine - ELT Runner
cd /d "%~dp0"

set SYMBOL=%1
if "%SYMBOL%"=="" set SYMBOL=BTCUSDT

set HOURS=%2
if "%HOURS%"=="" set HOURS=24

echo [*] Ejecutando pipeline para %SYMBOL% (%HOURS% horas)...
.\venv\Scripts\python -m src.main --symbol %SYMBOL% --hours %HOURS% --mock-nlp
pause
