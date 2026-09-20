<#
.SYNOPSIS
    Script de inicio unificado para Market Intelligence Platform (Backend + Frontend).
.DESCRIPTION
    1. Verifica puertos 8080 y 3000 liberando procesos colgados si existen.
    2. Inicia el Backend Cuantitativo en Python (FinBERT + DuckDB + Pipeline ELT) en http://localhost:8080
    3. Espera a que el Backend esté listo y respondiendo saludablemente.
    4. Inicia el Frontend en Next.js en http://localhost:3000
    5. Abre el navegador automáticamente y permite detener ambos con Ctrl+C.
#>

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "Market Intelligence Platform • Launcher"
$env:NEXT_TELEMETRY_DISABLED = "1"
$env:HF_HUB_DISABLE_SYMLINKS_WARNING = "1"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   MARKET INTELLIGENCE PLATFORM • INICIO DE SERVICIOS    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$ROOT_DIR = $PSScriptRoot
if (-not $ROOT_DIR) { $ROOT_DIR = (Get-Location).Path }

$PYTHON_EXE = Join-Path $ROOT_DIR "venv\Scripts\python.exe"
$FRONTEND_DIR = Join-Path $ROOT_DIR "frontend"

# 1. Comprobar entorno virtual de Python
if (-not (Test-Path $PYTHON_EXE)) {
    Write-Host "[ERROR] No se encontro el interprete de Python en: $PYTHON_EXE" -ForegroundColor Red
    Write-Host "Por favor, crea el entorno virtual ejecutando: python -m venv venv" -ForegroundColor Yellow
    exit 1
}

# 2. Liberar puertos si ya estan ocupados
function Liberar-Puerto([int]$port) {
    try {
        $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
        if ($conn) {
            $pidToKill = $conn.OwningProcess
            if ($pidToKill -gt 0) {
                Write-Host "[INFO] Liberando puerto $port (PID: $pidToKill)..." -ForegroundColor Yellow
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                Start-Sleep -Milliseconds 500
            }
        }
    } catch {}
}

Liberar-Puerto 8080
Liberar-Puerto 3000

# 3. Iniciar el Backend (Python 8080)
Write-Host "`n[1/3] Iniciando Backend Cuantitativo (FinBERT + DuckDB en puerto 8080)..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath $PYTHON_EXE `
    -ArgumentList "-m", "src.dashboard.server", "--port", "8080" `
    -WorkingDirectory $ROOT_DIR `
    -PassThru

# 4. Esperar a que el Backend responda
Write-Host "[2/3] Verificando conexion con el Backend..." -NoNewline -ForegroundColor Cyan
$retries = 30
$backendReady = $false

while ($retries -gt 0) {
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/admin/diagnostics" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($resp.StatusCode -eq 200) {
            $backendReady = $true
            break
        }
    } catch {}
    Write-Host "." -NoNewline -ForegroundColor Cyan
    Start-Sleep -Seconds 1
    $retries--
}

if ($backendReady) {
    Write-Host " [LISTO]" -ForegroundColor Green
} else {
    Write-Host " [AVISO: El backend esta arrancando]" -ForegroundColor Yellow
}

# 5. Iniciar el Frontend (Next.js 3000)
Write-Host "`n[3/3] Iniciando Frontend Next.js (Dashboard en puerto 3000)..." -ForegroundColor Green
$hasBuild = Test-Path (Join-Path $FRONTEND_DIR ".next\BUILD_ID")
if (-not $hasBuild) {
    Write-Host "[INFO] Generando build de produccion de Next.js..." -ForegroundColor Cyan
    Push-Location $FRONTEND_DIR
    cmd.exe /c "npm run build"
    Pop-Location
    $hasBuild = Test-Path (Join-Path $FRONTEND_DIR ".next\BUILD_ID")
}

$startCmd = if ($hasBuild) { "npm run start" } else { "npm run dev" }

$frontendProcess = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c", $startCmd `
    -WorkingDirectory $FRONTEND_DIR `
    -PassThru

# 6. Esperar a que el Frontend responda
Write-Host "Verificando conexion con el Frontend en puerto 3000..." -NoNewline -ForegroundColor Cyan
$retriesFront = 35
$frontendReady = $false

while ($retriesFront -gt 0) {
    if ($frontendProcess.HasExited) {
        Write-Host " [ERROR: El proceso frontend finalizo inesperadamente]" -ForegroundColor Red
        break
    }
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($resp.StatusCode -eq 200) {
            $frontendReady = $true
            break
        }
    } catch {}
    Write-Host "." -NoNewline -ForegroundColor Cyan
    Start-Sleep -Seconds 1
    $retriesFront--
}

if ($frontendReady) {
    Write-Host " [LISTO]" -ForegroundColor Green
} else {
    Write-Host " [AVISO: El frontend esta iniciando]" -ForegroundColor Yellow
}

# 7. Abrir en el navegador
Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   SISTEMA ACTIVO Y OPERATIVO                             " -ForegroundColor Green
Write-Host "   - Terminal / Dashboard: http://localhost:3000         " -ForegroundColor White
Write-Host "   - API Cuantitativa:     http://localhost:8080         " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "`nPresiona [Ctrl+C] en esta ventana para cerrar ambos servicios.`n" -ForegroundColor DarkGray

try {
    Start-Process "http://localhost:3000"
} catch {}

# Manejo de cierre al pulsar Ctrl+C
try {
    while ($true) {
        if ($backendProcess.HasExited) {
            Write-Host "`n[ALERTA] El proceso Backend (Python) ha finalizado." -ForegroundColor Red
            break
        }
        if ($frontendProcess.HasExited) {
            Write-Host "`n[ALERTA] El proceso Frontend (Next.js) ha finalizado." -ForegroundColor Red
            break
        }
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "`nDeteniendo servicios..." -ForegroundColor Yellow
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    Liberar-Puerto 8080
    Liberar-Puerto 3000
    Write-Host "[OK] Todos los servicios se han detenido correctamente." -ForegroundColor Green
}
