<#
.SYNOPSIS
    Inicia el servidor de desarrollo de Next.js para el Market Intelligence Lakehouse.
#>
$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location -Path (Join-Path $PSScriptRoot "frontend")
Write-Host "[*] Iniciando Frontend Next.js en http://localhost:3000..." -ForegroundColor Green
npm run dev
