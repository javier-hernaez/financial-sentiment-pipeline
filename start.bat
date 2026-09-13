@echo off
title Market Intelligence Platform Launcher
setlocal
set NEXT_TELEMETRY_DISABLED=1
set HF_HUB_DISABLE_SYMLINKS_WARNING=1

echo ==========================================================
echo    MARKET INTELLIGENCE PLATFORM - INICIO DE SERVICIOS
echo ==========================================================

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"

pause
