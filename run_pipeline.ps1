<#
.SYNOPSIS
    Ejecuta el pipeline asíncrono ELT del Market Intelligence Engine.

.PARAMETER Symbol
    Par de trading (por defecto: BTCUSDT).

.PARAMETER Hours
    Velas históricas a extraer (por defecto: 24).
#>

param(
    [string]$Symbol = "BTCUSDT",
    [int]$Hours = 24,
    [switch]$FullNlp
)

$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location -Path $PSScriptRoot

$PythonExe = Join-Path $PSScriptRoot "venv\Scripts\python.exe"

$ArgsList = @("-m", "src.main", "--symbol", $Symbol, "--hours", $Hours)
if (-not $FullNlp) {
    $ArgsList += "--mock-nlp"
}

Write-Host "[*] Ejecutando ELT para $Symbol ($Hours horas)..." -ForegroundColor Cyan
& $PythonExe $ArgsList
