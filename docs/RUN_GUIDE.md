# VetConnect — Guía para correr todo el proyecto

> **Backend** (Express + Prisma + Supabase) · **Web** (React + Vite) · **Mobile** (Expo + React Native)

---

## 📦 Requisitos

| Herramienta | Versión | Verificar |
|-------------|---------|-----------|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Expo Go | última | App en Play Store |
| ADB (solo USB) | — | `adb devices` |

---

## 🚀 1. Backend (siempre primero)

```bash
cd backend
npm install        # solo la primera vez
npm run dev        # http://localhost:3001
```

**Esperá a ver:**
```
Servidor iniciado en puerto 3001
```

**Si no arranca:**
- Verificá que `backend/.env` tenga las credenciales de Supabase (DATABASE_URL, DIRECT_URL)
- Verificá que `JWT_SECRET` no sea `change-me`

---

## 🌐 2. Web (opcional, para probar desde el navegador)

En otra terminal:
```bash
cd web
npm install
npm run dev        # http://localhost:5173
```

**Registrate como CLIENT o VET** y probá login + dashboard por rol.

---

## 📱 3. Mobile (en celular Android)

### 3.1 Configurar la IP

El celular necesita llegar al backend de tu compu. `localhost` no funciona desde el celu.

**Sacá tu IP:**
```bash
ipconfig | findstr IPv4
# Ejemplo: 10.20.40.134
```

**Actualizá `mobile/.env`:**
```
EXPO_PUBLIC_API_URL=http://{TU_IP}:3001
EXPO_PUBLIC_WS_URL=ws://{TU_IP}:3001/ws/queue
```

### 3.2 Instalar Expo Go

En el celular → Play Store → **Expo Go**

### 3.3 Conectar por USB (opcional, más rápido)

```bash
# 1. Activá en el celular:
#    Ajustes → Opciones de desarrollador → USB debugging → ON
#
# 2. Conectá el USB y aceptá el permiso en el celu
#
# 3. Instalá ADB (si no lo tenés):
winget install Google.PlatformTools
#
# 4. Verificá que se ve el celu:
adb devices
#    Debería mostrar: <id> device
#
# 5. En la terminal del mobile:
cd mobile
npx expo start
#    Apretá 'a' para abrir en Android
```

### 3.4 Conectar por QR (si USB no funciona)

```bash
cd mobile
npx expo start --tunnel
# Escaneá el QR con Expo Go en el celular
```

### 3.5 Verificar conexión

Cuando la app cargue en el celu:
1. **Registrate** (completá nombre, email, contraseña, seleccioná "Dueño de mascota")
2. **Iniciá sesión** con el mismo email y contraseña
3. Si ves el home → **todo funciona**

**Si no conecta:**
- El backend debe estar corriendo (`npm run dev` en backend)
- La IP en `mobile/.env` debe coincidir con la IP de tu compu
- El firewall de Windows puede bloquear el puerto 3001 → permitilo
- Probá con `npx expo start --tunnel` (usa internet, no necesita IP local)

---

## 🔄 Flujo completo de prueba

```
1. Backend: npm run dev                              → Terminal 1
2. Mobile:  npx expo start                           → Terminal 2
3. Celular: escanear QR con Expo Go
4.          Registrarse (Dueño de mascota)
5.          Iniciar sesión
6.          Agregar mascota → "Firulais" → Perro
7.          Ver mascota en la lista
```

---

## ⚠️ Problemas comunes

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Pantalla blanca en mobile | Expo Go no puede cargar el bundle | `npx expo start --clear` |
| "Network request failed" | Mobile no llega al backend | Verificar IP en `.env` y que backend esté corriendo |
| "Port 3001 already in use" | Otro proceso ocupando el puerto | `netstat -ano findstr 3001` y matar el PID |
| Error al registrarse | Backend caído o sin BD | Verificar `backend/.env` tenga credenciales reales |
| ADB no reconoce el celu | USB debugging desactivado o drivers | Revisar permisos USB en el celular |
| Expo no tiene opción 'a' | ADB no instalado | `winget install Google.PlatformTools` |
| CORS error en web | Backend no acepta el origen | Verificar `CORS_ORIGIN` en `backend/.env` |

---

## 🐳 Docker (alternativa al backend local)

```bash
cd backend
docker build -t conectavet-api .
docker run -p 3001:3001 --env-file .env conectavet-api
```

---

## 📁 Estructura del monorepo

```
conectavet/
├── backend/          → API REST (Express + Prisma + Supabase)
│   ├── src/
│   │   ├── modules/  → auth, pets, consultations, users, queue
│   │   ├── shared/   → prisma, middlewares, types, utils
│   │   └── server.ts → entry point
│   └── prisma/       → schema + migrations
├── web/              → Web app (React + Vite + Tailwind)
│   └── src/
│       ├── pages/    → Login, Register, Dashboard
│       ├── context/  → AuthContext
│       └── components/ → Button, Input, ProtectedRoute
└── mobile/           → Mobile app (Expo + React Native + Expo Router)
    ├── app/          → File-based routes (auth, app, call)
    ├── src/
    │   ├── stores/   → Zustand (auth, queue, call)
    │   ├── hooks/    → useAuth, usePets, useQueue, useLiveKit
    │   ├── lib/      → api.ts, secure-storage, ws.ts
    │   └── types/    → Zod schemas + TS types
    └── .env          → IP de la compu para el celu
```
