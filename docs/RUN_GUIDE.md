# VetConnect — Guía para correr todo el proyecto

> **Backend** (Express + Prisma + Supabase) · **Web** (React + Vite) · **Mobile** (Expo + React Native)

---

## 📦 Requisitos

| Herramienta | Versión | Verificar |
|-------------|---------|-----------|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Expo Go | última | App en Play Store |

---

## 🚀 1. Backend (siempre primero)

```bash
cd backend
npm install
npm run dev
```

**Esperá a ver:**
```
Servidor iniciado en puerto 3001
```

**Verificá que funciona:**
```
http://localhost:3001/health
→ {"status":"ok","database":"connected",...}
```

**Si no arranca:**
- `backend/.env` debe tener credenciales reales de Supabase
- `JWT_SECRET` debe tener un valor (no `change-me`)
- El puerto 3001 debe estar libre: `netstat -ano | findstr 3001`

---

## 🌐 2. Web (opcional, navegador)

En otra terminal:
```bash
cd web
npm install
npm run dev        # http://localhost:5173
```

Registrate como CLIENT o VET y probá login + dashboard por rol.

---

## 📱 3. Mobile (Expo) — la app se ve en el celular

La app mobile NO abre en el navegador de la PC. Se renderiza en el celular a través de **Expo Go**.

### 3.1 Preparar el celu

1. Instalá **Expo Go** de Play Store en tu celular
2. Conectá el celu a la **misma red WiFi** que la compu

### 3.2 Configurar la IP

El celu necesita llegar al backend de la compu. `localhost` no funciona desde el celu.

**Sacá tu IP local:**
```bash
ipconfig | findstr IPv4
# Ej: 192.168.1.100  (o 10.20.40.x)
```

**Actualizá `mobile/.env` con tu IP:**
```
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001
EXPO_PUBLIC_WS_URL=ws://192.168.1.100:3001/ws/queue
```

### 3.3 Iniciar Expo

```bash
cd mobile
npm install
npx expo start
```

**Cuando arranque** vas a ver:
```
Starting project at ...
env: load .env
env: export EXPO_PUBLIC_API_URL EXPO_PUBLIC_WS_URL EXPO_PUBLIC_LIVEKIT_URL
Starting Metro Bundler
...
```

Si pregunta `Use port 8082 instead?` → tipeá **Y + Enter**

Después de ~20-30 segundos aparece un **código QR**. Escanealo con **Expo Go** en tu celu.

### 3.4 Si el QR no aparece o no conecta

**Opción Tunnel** (usa internet, no necesita WiFi local):
```bash
npx expo start --tunnel
```

**Limpiar caché de Metro:**
```bash
npx expo start --clear
```

### 3.5 Verificar conexión

Cuando la app cargue en el celu:
1. **Registrate** (completá nombre, email, contraseña, seleccioná rol)
2. **Iniciá sesión** con el mismo email y contraseña
3. Si ves el home → **todo funciona**

**Si no conecta:**
- El backend debe estar corriendo (`npm run dev` en backend)
- La IP en `mobile/.env` debe coincidir con la IP de la compu (`ipconfig`)
- El firewall de Windows puede bloquear el puerto 3001 → permitilo en firewall advanced
- Probá con `npx expo start --tunnel` (usa internet, no necesita IP local)

---

## 🔄 Flujo completo (3 terminales)

```
┌─ Terminal 1 ──────────────────────────────┐
│ cd backend && npm run dev                  │
│ → Backend en http://localhost:3001         │
└────────────────────────────────────────────┘

┌─ Terminal 2 ──────────────────────────────┐
│ cd mobile && npx expo start               │
│ → Escaneá el QR desde Expo Go en tu celu  │
└────────────────────────────────────────────┘

┌─ Terminal 3 (opcional) ───────────────────┐
│ cd web && npm run dev                      │
│ → Web en http://localhost:5173             │
└────────────────────────────────────────────┘
```

---

## ⚠️ Problemas comunes

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Pantalla blanca en mobile | Expo Go no puede cargar el bundle | `npx expo start --clear` |
| "Network request failed" | Mobile no llega al backend | Verificar IP en `.env` y que backend esté corriendo |
| "Port 3001 already in use" | Otro proceso ocupando el puerto | `netstat -ano \| findstr 3001` y matar el PID |
| Error al registrarse | Backend caído o sin BD | Verificar `backend/.env` tenga credenciales reales |
| Expo no muestra QR | Metro/Expo atascado | `npx expo start --clear --tunnel` |
| CORS error en web | Backend no acepta el origen | Verificar `CORS_ORIGIN` en `backend/.env` (debe incluir `http://localhost:5173` y `http://localhost:8081`) |
| El QR no se ve en la terminal | Puerto 8081 ocupado por otro proceso | Matar el proceso o aceptar usar puerto 8082 |

---

## 📁 Puertos usados

| Servicio | Puerto | URL |
|----------|--------|-----|
| Backend (Express) | 3001 | http://localhost:3001 |
| Frontend Web (Vite) | 5173 | http://localhost:5173 |
| Mobile (Expo/Metro) | 8081 | http://localhost:8081 |
| Health Check | 3001 | http://localhost:3001/health |
