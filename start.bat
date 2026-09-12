@echo off
title Market Intelligence Platform Launcher
setlocal

echo ==========================================================
echo    MARKET INTELLIGENCE PLATFORM - INICIO DE SERVICIOS
echo ==========================================================

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"

pause
