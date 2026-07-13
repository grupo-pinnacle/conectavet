param(
    [switch]$Tunnel,
    [switch]$ADB
)

$port = 8081
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

# ── Free port 8081 ──
$foundPid = netstat -ano | Select-String ":$port " | ForEach-Object { ($_ -replace '.*\s+(\d+)$', '$1') } | Select-Object -First 1
if ($foundPid) { Stop-Process -Id $foundPid -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1 }

# ── Detect IP ──
$allIps = ipconfig | Select-String 'IPv4.*\d+\.\d+\.\d+\.\d+' | ForEach-Object { $_ -replace '.*:\s*', '' }
$usbIp = $allIps | Select-String '192\.168\.4[2-3]\.' | Select-Object -First 1
$lanIp10 = $allIps | Select-String '10\.' | Select-Object -First 1
$lanIp192 = $allIps | Select-String '192\.168\.' | Select-Object -First 1

if ($ADB) { $ip = "127.0.0.1"; $mode = "ADB REVERSE (USB)" }
elseif ($usbIp) { $ip = $usbIp; $mode = "USB TETHERING" }
elseif ($lanIp10) { $ip = $lanIp10; $mode = "LAN" }
elseif ($lanIp192) { $ip = $lanIp192; $mode = "LAN" }
else { $ip = "127.0.0.1"; $mode = "LOCALHOST" }
$ip = $ip.Trim()

# ── ADB reverse ports ──
if ($ADB) {
    $adbPath = (Get-Command "adb" -ErrorAction SilentlyContinue).Source
    if (-not $adbPath) {
        Write-Host "ADB no encontrado. Instalalo con: winget install Google.PlatformTools" -ForegroundColor Red
        exit 1
    }
    Write-Host "Configurando ADB reverse ports..." -ForegroundColor Yellow
    & $adbPath reverse tcp:8081 tcp:8081 2>&1 | Out-Null
    & $adbPath reverse tcp:3001 tcp:3001 2>&1 | Out-Null
    Write-Host "  Puertos 8081 y 3001 redirigidos por USB" -ForegroundColor Green
    Write-Host "  (No necesita WiFi - usa el cable USB)" -ForegroundColor Green
    Write-Host ""
}

# ── Info ──
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VetConnect Mobile" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Modo: $mode" -ForegroundColor Green
Write-Host "  IP:   $ip" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Generate backup QR ──
Write-Host "Generando QR imagen en Escritorio..." -ForegroundColor Gray
$qrDir = "$env:TEMP\qrgen"
if (-not (Test-Path $qrDir)) { New-Item -ItemType Directory -Path $qrDir -Force | Out-Null }
Push-Location $qrDir
if (-not (Test-Path "node_modules\qrcode")) { npm install qrcode --legacy-peer-deps 2>&1 | Out-Null }
$expUrl = "exp://${ip}:${port}"
node -e "const QR=require('qrcode'); QR.toFile('expo-qr.png','$expUrl',{width:500})" 2>&1 | Out-Null
Copy-Item "expo-qr.png" "$rootDir\expo-qr.png" -Force
$desktop = [Environment]::GetFolderPath("Desktop")
Copy-Item "expo-qr.png" "$desktop\expo-qr.png" -Force
Pop-Location
Invoke-Item "$rootDir\expo-qr.png"
Write-Host "  QR: $desktop\expo-qr.png" -ForegroundColor Green
Write-Host ""

# ── Start Expo ──
Write-Host "Iniciando Expo..." -ForegroundColor Yellow
Write-Host "  'a'=Android | 'i'=iOS | 'w'=web | Ctrl+C=detener" -ForegroundColor Gray
Write-Host ""

$expoArgs = @("expo", "start", "--clear")
if ($Tunnel) { $expoArgs += "--tunnel" }
if ($ADB) { $expoArgs += "--localhost" }
& "npx" $expoArgs
