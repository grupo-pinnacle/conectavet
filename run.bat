@echo off
title VetConnect - Iniciando...
cd /d "%~dp0"

echo ========================================
echo  VetConnect - RUN ALL
echo ========================================
echo.

:: Detect LAN IP via PowerShell
for /f "delims=" %%i in ('powershell -Command "ipconfig | Select-String 'IPv4.*10\.' | ForEach-Object { $_ -replace '.*:\s*', '' } | Select-Object -First 1"') do set IP=%%i
if "%IP%"=="" (
    for /f "delims=" %%i in ('powershell -Command "ipconfig | Select-String 'IPv4.*192\.' | ForEach-Object { $_ -replace '.*:\s*', '' } | Select-Object -First 1"') do set IP=%%i
)
echo       IP detectada: %IP%

:: Configure mobile/.env with LAN IP so the physical device reaches the backend
echo       Configurando mobile/.env (API en %IP%)...
powershell -Command "$f='mobile\.env'; $c=Get-Content $f; $c=$c -replace '^EXPO_PUBLIC_API_URL=.*','EXPO_PUBLIC_API_URL=http://%IP%:3001'; $c=$c -replace '^EXPO_PUBLIC_WS_URL=.*','EXPO_PUBLIC_WS_URL=ws://%IP%:3001'; Set-Content $f $c"

:: Free ports 8081 (Expo) and 8082 (Expo fallback) — without killing other Node processes
echo [1/5] Liberando puertos 8081 y 8082...
for %%p in (8081 8082) do (
    powershell -Command "$procId = netstat -ano | Select-String ':%%p ' | ForEach-Object { $_ -replace '.*\s+(\d+)$', '$1' } | Select-Object -First 1; if ($procId) { Stop-Process -Id $procId -Force; Write-Output '  Puerto %%p liberado' }" >nul 2>&1
)
timeout /t 2 /nobreak >nul

:: Start Backend
echo [2/5] Iniciando Backend (puerto 3001)...
start "Backend 3001" /min cmd /c "cd /d backend && npx tsx src\server.ts"
timeout /t 8 /nobreak >nul

:: Verify Backend
:check_backend
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% neq 0 (
    echo       Esperando backend...
    timeout /t 3 /nobreak >nul
    goto check_backend
)
echo       Backend OK!

:: Start Expo
echo [3/5] Iniciando Expo Mobile (puerto 8081)...
start "Expo 8081" cmd /k "cd /d mobile && npx expo start --clear"
echo       Esperando Expo...
timeout /t 45 /nobreak >nul

:: Generate QR
echo [4/5] Generando QR...
cd /d "%temp%"
if not exist qrgen mkdir qrgen
cd qrgen
copy nul package.json >nul 2>&1
echo {"name":"qrgen","private":true} > package.json
call npm install qrcode --legacy-peer-deps >nul 2>&1
set URL=exp://%IP%:8081
node -e "const QR=require('qrcode'); QR.toFile('expo-qr.png','%URL%',{width:400},e=>{if(e){process.exit(1)}else{console.log('OK')}})" >nul 2>&1
copy /y expo-qr.png "%temp%\expo-qr.png" >nul 2>&1

:: Open QR
echo [5/5] Abriendo QR...
start "" "%temp%\expo-qr.png"

cd /d "%~dp0"

echo.
echo ========================================
echo  TODO LISTO!
echo ========================================
echo.
echo  Backend : http://localhost:3001
echo  Expo    : http://localhost:8081
echo  Celular : exp://%IP%:8081
echo.
echo  1. Conecta el celular a la MISMA red
echo  2. Escanea el QR con Expo Go
echo  3. Espera ~30s mientras compila
echo.
echo  Cerrar: Ctrl+C en cada ventana
echo ========================================
pause
