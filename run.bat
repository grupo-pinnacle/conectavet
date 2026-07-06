@echo off
title VetConnect - Iniciando...
cd /d "%~dp0"

echo ========================================
echo  VetConnect - RUN ALL
echo ========================================
echo.

:: Kill old node processes
echo [1/5] Cerrando procesos anteriores...
taskkill /f /im node.exe >nul 2>&1
timeout /t 3 /nobreak >nul

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
set URL=exp://10.20.40.134:8081
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
echo  Celular : exp://10.20.40.134:8081
echo.
echo  1. Conecta el celular a la MISMA red
echo  2. Escanea el QR con Expo Go
echo  3. Espera ~30s mientras compila
echo.
echo  Cerrar: Ctrl+C en cada ventana
echo ========================================
pause
