<#
.SYNOPSIS
    Inicia el servidor web del Market Intelligence Dashboard.

.PARAMETER Port
    Puerto local donde escuchar (por defecto: 8080).

.PARAMETER NoBrowser
    Si se especifica, no abre automáticamente el navegador.
#>

param(
    [int]$Port = 8080,
    [switch]$NoBrowser
)

$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location -Path $PSScriptRoot

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Market Intelligence Engine - Dashboard Server" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$PythonExe = Join-Path $PSScriptRoot "venv\Scripts\python.exe"

if (-not (Test-Path $PythonExe)) {
    Write-Host "[!] Entorno virtual no detectado en .\venv. Creando..." -ForegroundColor Yellow
    py -m venv venv
    & ".\venv\Scripts\pip" install -r requirements.txt
}

if (-not $NoBrowser) {
    Write-Host "[*] Abriendo navegador en http://localhost:$Port..." -ForegroundColor Green
    Start-Process "http://localhost:$Port"
}

Write-Host "[*] Servidor iniciado en http://localhost:$Port (Ctrl+C para detener)" -ForegroundColor Green
& $PythonExe -m src.dashboard.server --port $Port
