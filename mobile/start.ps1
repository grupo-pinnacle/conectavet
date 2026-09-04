param(
    [switch]$Tunnel,
    [switch]$ADB,
    [switch]$Fast,
    [string]$NgrokUrl
)

$port = 8081
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

# ── Free port 8081 ──
$foundPid = netstat -ano | Select-String ":$port " | ForEach-Object { ($_ -replace '.*\s+(\d+)$', '$1') } | Select-Object -First 1
if ($foundPid) { Stop-Process -Id $foundPid -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1 }

# ── Locate ADB ──
$adbPath = (Get-Command "adb" -ErrorAction SilentlyContinue).Source
if (-not $adbPath -and (Test-Path "$env:LOCALAPPDATA\Android\platform-tools\adb.exe")) {
    $adbPath = "$env:LOCALAPPDATA\Android\platform-tools\adb.exe"
}
if (-not $adbPath -and (Test-Path "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe")) {
    $adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
}

function Get-AdbDeviceSerial {
    param([string]$Adb)
    if (-not $Adb) { return @{ Serial = $null; State = $null } }
    $lines = & $Adb devices 2>$null | Where-Object { $_ -match '\t|  ' -and $_ -notmatch '^List of devices' -and $_.Trim() -ne '' }
    foreach ($line in $lines) {
        $parts = ($line -replace '\s+', ' ').Trim().Split(' ')
        if ($parts.Count -ge 2) {
            $serial = $parts[0]
            $state = $parts[1]
            if ($state -eq 'device') { return @{ Serial = $serial; State = $state } }
            if ($state -eq 'unauthorized') { return @{ Serial = $null; State = 'unauthorized' } }
        }
    }
    return @{ Serial = $null; State = $null }
}

# ── USB-first: wait for the device (works on any network, even phone on mobile data) ──
$useADB = $false
$serial = $null
if ($adbPath) {
    $state = 'none'
    if ($ADB) {
        Write-Host "Buscando dispositivo Android por USB..." -ForegroundColor Yellow
        $deadline = (Get-Date).AddSeconds(30)
        while ((Get-Date) -lt $deadline) {
            $res = Get-AdbDeviceSerial -Adb $adbPath
            if ($res.Serial) { $serial = $res.Serial; $state = 'device'; break }
            if ($res.State -eq 'unauthorized') {
                Write-Host "  El celular pide autorizacion: desbloquealo y acepta 'Permitir depuracion USB' en la pantalla" -ForegroundColor Yellow
            }
            Start-Sleep -Seconds 2
        }
        if (-not $serial) {
            Write-Host "No se encontro el celular por USB." -ForegroundColor Red
            Write-Host "1. Conecta el celular por cable USB" -ForegroundColor Yellow
            Write-Host "2. Activa 'Depuracion USB' en Opciones de desarrollador" -ForegroundColor Yellow
            Write-Host "3. Acepta el permiso en la pantalla del celular" -ForegroundColor Yellow
            exit 1
        }
    } else {
        $res = Get-AdbDeviceSerial -Adb $adbPath
        $serial = $res.Serial
        if ($res.State -eq 'unauthorized') {
            Write-Host "El celular pide autorizacion: desbloquealo y acepta 'Permitir depuracion USB' en la pantalla" -ForegroundColor Yellow
        }
    }
}
$useADB = [bool]$serial

if ($useADB) {
    Write-Host "Dispositivo: $serial" -ForegroundColor Cyan
    Write-Host "Configurando ADB reverse ports..." -ForegroundColor Yellow
    & $adbPath -s $serial reverse tcp:8081 tcp:8081
    if ($LASTEXITCODE -ne 0) { Write-Host "  Error en puerto 8081" -ForegroundColor Red; exit 1 }
    & $adbPath -s $serial reverse tcp:3001 tcp:3001
    if ($LASTEXITCODE -ne 0) { Write-Host "  Error en puerto 3001" -ForegroundColor Red; exit 1 }
    & $adbPath -s $serial reverse tcp:5173 tcp:5173
    if ($LASTEXITCODE -ne 0) { Write-Host "  Error en puerto 5173" -ForegroundColor Red; exit 1 }
    $reverseList = & $adbPath -s $serial reverse --list 2>$null
    $ok8081 = $reverseList -match 'tcp:8081'
    $ok3001 = $reverseList -match 'tcp:3001'
    $ok5173 = $reverseList -match 'tcp:5173'
    if ($ok8081 -and $ok3001 -and $ok5173) {
        Write-Host "  Puertos 8081, 3001 y 5173 redirigidos por USB" -ForegroundColor Green
        Write-Host "  (No necesita WiFi ni red: usa el cable USB)" -ForegroundColor Green
    } else {
        Write-Host "  Advertencia: el reverse no se verifico, intentando igual..." -ForegroundColor Yellow
    }
    Write-Host ""
    $ip = "127.0.0.1"
    $mode = "ADB REVERSE (USB)"
} else {
    # ── Fallback: LAN (solo si no hay celular conectado) ──
    # Detección robusta (BUG-10): ignora adaptadores virtuales (VM/VPN/WSL) y
    # prefiere la NIC de la ruta por defecto; cubre 10/8, 172.16/12 y 192.168/16.
    $defRoute = Get-NetRoute -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue | Sort-Object RouteMetric | Select-Object -First 1
    $candidates = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object {
        $_.IPAddress -notmatch '^(127\.|169\.254\.)' -and
        $_.InterfaceAlias -notmatch 'vEthernet|VirtualBox|VMware|WSL|VPN|Loopback|Teredo|Bluetooth|Cloudflare|WARP|WireGuard|ZeroTier|Tailscale|Hamachi|OpenVPN' -and
        $_.PrefixOrigin -match '^(Dhcp|Manual)$'
    }
    $preferred = $candidates | Where-Object { $_.InterfaceIndex -eq $defRoute.InterfaceIndex } | Select-Object -First 1
    if (-not $preferred) {
        $preferred = $candidates | Where-Object { $_.IPAddress -match '^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)' } | Select-Object -First 1
    }
    if (-not $preferred) { $preferred = $candidates | Select-Object -First 1 }
    if ($preferred -and ($preferred.IPAddress -match '192\.168\.4[2-3]\.')) { $ip = $preferred.IPAddress; $mode = "USB TETHERING" }
    elseif ($preferred) { $ip = $preferred.IPAddress; $mode = "LAN" }
    else { $ip = "127.0.0.1"; $mode = "LOCALHOST" }
    $ip = $ip.Trim()
    if ($preferred) { Write-Host "Interfaz: $($preferred.InterfaceAlias) ($($preferred.IPAddress))" -ForegroundColor Gray }
    Write-Host "No se detecto celular por USB. Usando modo $mode con IP $ip" -ForegroundColor DarkYellow
    Write-Host "  Para que funcione en cualquier red, conecta el celular por USB y usa: .\start.ps1 -ADB" -ForegroundColor DarkYellow
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

if (Test-Path "expo-qr.png") {
    Copy-Item "expo-qr.png" "$rootDir\expo-qr.png" -Force
    $desktop = [Environment]::GetFolderPath("Desktop")
    Copy-Item "expo-qr.png" "$desktop\expo-qr.png" -Force
    Pop-Location
    Invoke-Item "$rootDir\expo-qr.png"
    Write-Host "  QR: $desktop\expo-qr.png" -ForegroundColor Green
} else {
    Pop-Location
    Write-Host "  No se pudo generar la imagen del QR (probablemente falte algun modulo). Puedes escanear el que aparece mas abajo en consola." -ForegroundColor Yellow
}
Write-Host ""

# 🌐 Set API URL for mobile (environment override for Metro bundler) 🌐
if ($NgrokUrl) {
    $env:EXPO_PUBLIC_API_URL = $NgrokUrl
    $env:EXPO_PUBLIC_WS_URL = $NgrokUrl.Replace("http://", "ws://").Replace("https://", "wss://") + "/socket.io"
    $env:EXPO_PUBLIC_WEB_URL = $NgrokUrl.Replace("3001", "5173")
} elseif ($useADB) {
    $env:EXPO_PUBLIC_API_URL = "http://localhost:3001"
    $env:EXPO_PUBLIC_WS_URL = "ws://localhost:3001/socket.io"
    $env:EXPO_PUBLIC_WEB_URL = "http://localhost:5173"
} else {
    $env:EXPO_PUBLIC_API_URL = "http://${ip}:3001"
    $env:EXPO_PUBLIC_WS_URL = "ws://${ip}:3001/socket.io"
    $env:EXPO_PUBLIC_WEB_URL = "http://${ip}:5173"
}

# ── Start Expo ──
Write-Host "Iniciando Expo..." -ForegroundColor Yellow
Write-Host "  API:  $env:EXPO_PUBLIC_API_URL" -ForegroundColor Gray
if ($Fast) {
    Write-Host "  MODO RAPIDO: bundle minificado (para demos - sin Fast Refresh)" -ForegroundColor Magenta
}
Write-Host "  'a'=Android | 'i'=iOS | 'w'=web | Ctrl+C=detener" -ForegroundColor Gray
Write-Host ""

$expoArgs = @("expo", "start", "--clear")
if ($Fast) { $expoArgs += "--no-dev"; $expoArgs += "--minify" }
if ($Tunnel) { $expoArgs += "--tunnel" }
if ($useADB) { $expoArgs += "--localhost" }
if (-not $useADB -and -not $Tunnel) { $expoArgs += "--lan" }
& "npx" $expoArgs
