#!/usr/bin/env bash
set -euo pipefail

PORT=8081
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# ── Parse flags ──
TUNNEL=false
ADB_FLAG=false
FAST=false
for arg in "$@"; do
  case "$arg" in
    --tunnel|-t) TUNNEL=true ;;
    --adb|-a)    ADB_FLAG=true ;;
    --fast|-f)   FAST=true ;;
  esac
done

# ── Free port 8081 ──
EXISTING_PID=$(lsof -ti :"$PORT" 2>/dev/null || true)
if [ -n "$EXISTING_PID" ]; then
  kill -9 "$EXISTING_PID" 2>/dev/null || true
  sleep 1
fi

# ── Locate ADB ──
ADB_PATH=""
if command -v adb &>/dev/null; then
  ADB_PATH="adb"
elif [ -f "$HOME/Android/sdk/platform-tools/adb" ]; then
  ADB_PATH="$HOME/Android/sdk/platform-tools/adb"
fi

get_adb_device() {
  if [ -z "$ADB_PATH" ]; then
    echo ""
    return
  fi
  local lines
  lines=$($ADB_PATH devices 2>/dev/null | grep -E $'\t|  ' | grep -v "^List" || true)
  while IFS= read -r line; do
    local serial state
    serial=$(echo "$line" | awk '{print $1}')
    state=$(echo "$line" | awk '{print $2}')
    if [ "$state" = "device" ]; then
      echo "$serial"
      return
    fi
    if [ "$state" = "unauthorized" ]; then
      echo "unauthorized"
      return
    fi
  done <<< "$lines"
  echo ""
}

# ── USB-first: wait for device ──
USE_ADB=false
SERIAL=""
if [ -n "$ADB_PATH" ]; then
  if [ "$ADB_FLAG" = true ]; then
    echo -e "\033[1;33mBuscando dispositivo Android por USB...\033[0m"
    DEADLINE=$((SECONDS + 30))
    while [ $SECONDS -lt $DEADLINE ]; do
      RES=$(get_adb_device)
      if [ -n "$RES" ] && [ "$RES" != "unauthorized" ]; then
        SERIAL="$RES"
        break
      fi
      if [ "$RES" = "unauthorized" ]; then
        echo -e "\033[1;33m  El celular pide autorizacion: desbloquealo y acepta 'Permitir depuracion USB'\033[0m"
      fi
      sleep 2
    done
    if [ -z "$SERIAL" ]; then
      echo -e "\033[1;31mNo se encontro el celular por USB.\033[0m"
      echo "1. Conecta el celular por cable USB"
      echo "2. Activa 'Depuracion USB' en Opciones de desarrollador"
      echo "3. Acepta el permiso en la pantalla del celular"
      exit 1
    fi
  else
    RES=$(get_adb_device)
    if [ -n "$RES" ] && [ "$RES" != "unauthorized" ]; then
      SERIAL="$RES"
    fi
    if [ "$RES" = "unauthorized" ]; then
      echo -e "\033[1;33mEl celular pide autorizacion: acepta 'Permitir depuracion USB'\033[0m"
    fi
  fi
fi
[ -n "$SERIAL" ] && USE_ADB=true

# ── IP detection & ADB reverse ──
if [ "$USE_ADB" = true ]; then
  echo -e "\033[1;36mDispositivo: $SERIAL\033[0m"
  echo -e "\033[1;33mConfigurando ADB reverse ports...\033[0m"
  $ADB_PATH -s "$SERIAL" reverse tcp:8081 tcp:8081
  $ADB_PATH -s "$SERIAL" reverse tcp:3001 tcp:3001
  REVERSE_LIST=$($ADB_PATH -s "$SERIAL" reverse --list 2>/dev/null || true)
  if echo "$REVERSE_LIST" | grep -q "tcp:8081" && echo "$REVERSE_LIST" | grep -q "tcp:3001"; then
    echo -e "\033[1;32m  Puertos 8081 y 3001 redirigidos por USB\033[0m"
    echo -e "\033[1;32m  (No necesita WiFi ni red: usa el cable USB)\033[0m"
  else
    echo -e "\033[1;33m  Advertencia: reverse no verificado, intentando igual...\033[0m"
  fi
  echo ""
  IP="127.0.0.1"
  MODE="ADB REVERSE (USB)"
else
  # ── Fallback: LAN ──
  ALL_IPS=$(hostname -I 2>/dev/null || true)
  USB_IP=$(echo "$ALL_IPS" | tr ' ' '\n' | grep -E '^192\.168\.4[2-3]\.' | head -1 || true)
  LAN_IP10=$(echo "$ALL_IPS" | tr ' ' '\n' | grep -E '^10\.' | head -1 || true)
  LAN_IP192=$(echo "$ALL_IPS" | tr ' ' '\n' | grep -E '^192\.168\.' | head -1 || true)

  if [ -n "$USB_IP" ]; then IP="$USB_IP"; MODE="USB TETHERING"
  elif [ -n "$LAN_IP10" ]; then IP="$LAN_IP10"; MODE="LAN"
  elif [ -n "$LAN_IP192" ]; then IP="$LAN_IP192"; MODE="LAN"
  else IP="127.0.0.1"; MODE="LOCALHOST"
  fi
  echo -e "\033[1;33mNo se detecto celular por USB. Usando modo $MODE con IP $IP\033[0m"
  echo -e "\033[1;33m  Conecta el celular por USB y usa: ./start.sh --adb\033[0m"
  echo ""
fi

# ── Info ──
echo ""
echo -e "\033[1;36m========================================\033[0m"
echo -e "\033[1;36m  VetConnect Mobile\033[0m"
echo -e "\033[1;36m========================================\033[0m"
echo -e "\033[1;32m  Modo: $MODE\033[0m"
echo -e "\033[1;32m  IP:   $IP\033[0m"
echo -e "\033[1;36m========================================\033[0m"
echo ""

# ── Generate QR ──
echo -e "\033[0;90mGenerando QR imagen...\033[0m"
QR_DIR="/tmp/qrgen"
mkdir -p "$QR_DIR"
cd "$QR_DIR"
if [ ! -d "node_modules/qrcode" ]; then
  npm install qrcode --legacy-peer-deps 2>/dev/null || true
fi
EXP_URL="exp://${IP}:${PORT}"
node -e "const QR=require('qrcode'); QR.toFile('expo-qr.png','$EXP_URL',{width:500})" 2>/dev/null || true
cp -f "expo-qr.png" "$ROOT_DIR/expo-qr.png" 2>/dev/null || true
echo -e "\033[1;32m  QR: $ROOT_DIR/expo-qr.png\033[0m"
echo ""
cd "$ROOT_DIR"

# ── Set API URL ──
if [ "$USE_ADB" = true ]; then
  export EXPO_PUBLIC_API_URL="http://localhost:3001"
  export EXPO_PUBLIC_WS_URL="ws://localhost:3001/ws/queue"
else
  export EXPO_PUBLIC_API_URL="http://${IP}:3001"
  export EXPO_PUBLIC_WS_URL="ws://${IP}:3001/ws/queue"
fi

# ── Start Expo ──
echo -e "\033[1;33mIniciando Expo...\033[0m"
echo -e "\033[0;90m  API:  $EXPO_PUBLIC_API_URL\033[0m"
if [ "$FAST" = true ]; then
  echo -e "\033[1;35m  MODO RAPIDO: bundle minificado (sin Fast Refresh)\033[0m"
fi
echo -e "\033[0;90m  'a'=Android | 'i'=iOS | 'w'=web | Ctrl+C=detener\033[0m"
echo ""

EXPO_ARGS=("expo" "start" "--clear")
if [ "$FAST" = true ]; then EXPO_ARGS+=("--no-dev" "--minify"); fi
if [ "$TUNNEL" = true ]; then EXPO_ARGS+=("--tunnel"); fi
if [ "$USE_ADB" = true ]; then EXPO_ARGS+=("--localhost"); fi

npx "${EXPO_ARGS[@]}"
