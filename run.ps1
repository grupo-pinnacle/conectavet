param(
    [switch]$NoBackend,
    [switch]$ClearCache
)

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VetConnect - RUN ALL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Detect LAN IP
$ip = (ipconfig | Select-String 'IPv4.*10\.' | ForEach-Object { $_ -replace '.*:\s*', '' } | Select-Object -First 1)
if (-not $ip) { $ip = (ipconfig | Select-String 'IPv4.*192\.' | ForEach-Object { $_ -replace '.*:\s*', '' } | Select-Object -First 1) }
Write-Host "  IP: $ip" -ForegroundColor Green

# Free ports 8081 and 8082
Write-Host "[1/5] Liberando puertos 8081 y 8082..." -ForegroundColor Yellow
foreach ($port in @(8081, 8082)) {
    $procId = netstat -ano | Select-String ":$port " | ForEach-Object { $_ -replace '.*\s+(\d+)$', '$1' } | Select-Object -First 1
    if ($procId) {
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        Write-Host "  Puerto $port liberado" -ForegroundColor Green
    }
}
Start-Sleep -Seconds 1

# Start Backend in background
if (-not $NoBackend) {
    Write-Host "[2/5] Backend (puerto 3001)..." -ForegroundColor Yellow
    $backendJob = Start-Job -Name "VetConnect-Backend" -ScriptBlock {
        param($dir) Set-Location $dir; npx tsx src/server.ts
    } -ArgumentList "$rootDir\backend"
    Start-Sleep -Seconds 8
    Write-Host "  Backend iniciado (Job $($backendJob.Id))" -ForegroundColor Green
} else {
    Write-Host "[2/5] Backend omitido" -ForegroundColor Gray
}

# Generate backup QR and start Expo in foreground
Write-Host "[3/5] Generando QR de respaldo..." -ForegroundColor Yellow
$qrDir = "$env:TEMP\qrgen"
if (-not (Test-Path $qrDir)) { New-Item -ItemType Directory -Path $qrDir -Force | Out-Null }
Push-Location $qrDir
if (-not (Test-Path "node_modules\qrcode")) {
    npm install qrcode --legacy-peer-deps 2>&1 | Out-Null
}
$qrUrl = "exp://${ip}:8081"
node -e "const QR=require('qrcode'); QR.toFile('expo-qr.png','$qrUrl',{width:400})" 2>&1 | Out-Null
Copy-Item "expo-qr.png" "$env:TEMP\expo-qr.png" -Force
Invoke-Item "$env:TEMP\expo-qr.png"
Pop-Location

Write-Host "[4/5] Iniciando Expo Mobile..." -ForegroundColor Yellow
Write-Host "  QR aparecera abajo ^^^" -ForegroundColor Green
Write-Host "  Ctrl+C para detener" -ForegroundColor Gray
Write-Host ""

# Start Expo in the same window (foreground) so QR appears here
Push-Location "$rootDir\mobile"
if ($ClearCache) {
    npx expo start --clear
} else {
    npx expo start
}
Pop-Location
