# 🚀 Guía de Despliegue en Producción — ConectaVet

Esta guía detalla los pasos para desplegar los tres componentes del ecosistema ConectaVet en plataformas de grado de producción (Cloud PaaS & Mobile App Stores).

---

## 1. Arquitectura de Despliegue

| Componente | Plataforma Recomendada | Tipo de Servicio | URL / Dominio Típico |
|---|---|---|---|
| **Backend API & Sockets** | Railway / Koyeb / Render | Web Service (Docker / Node 20) | `https://api.conectavet.com` |
| **Frontend Web** | Vercel / Cloudflare Pages | Single Page Application (Static SPA) | `https://app.conectavet.com` |
| **Base de Datos** | Supabase / Neon | Managed PostgreSQL + Connection Pooler | `postgres://...` |
| **Caché / Socket Adapter**| Upstash Redis / Redis Cloud | In-Memory Key-Value Store | `rediss://...` |
| **Media & Storage** | Amazon S3 / Cloudinary | Encrypted Object Storage Bucket | `https://s3.amazonaws.com/...` |
| **Videollamadas** | LiveKit Cloud | WebRTC Selective Forwarding Unit (SFU) | `wss://conectavet.livekit.cloud` |
| **Mobile App (Android/iOS)**| Expo Application Services (EAS)| AAB (Google Play) / IPA (App Store) | App Store & Google Play |

---

## 2. Despliegue del Backend (`backend/`)

### Variables de Entorno Requeridas (.env)
```env
PORT=3001
NODE_ENV=production
DATABASE_URL="postgresql://usuario:password@host:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://usuario:password@host:5432/postgres"
JWT_SECRET="clave-super-secreta-de-64-caracteres-generada-con-openssl"
JWT_REFRESH_SECRET="otra-clave-secreta-para-refresh-token"
REDIS_URL="rediss://default:token@redis-host:6379"
FRONTEND_URL="https://app.conectavet.com"
LIVEKIT_API_KEY="APxxxxxxxxx"
LIVEKIT_API_SECRET="secretxxxxxxxxxxxxxxxxxx"
LIVEKIT_HOST="https://conectavet.livekit.cloud"
```

### Comandos de Construcción y Ejecución
```bash
# Build
npm install
npx prisma generate
npx tsc -p tsconfig.json

# Start
npx prisma migrate deploy
node dist/server.js
```

---

## 3. Despliegue del Frontend Web (`web/`)

### Variables de Entorno en Vercel
```env
VITE_API_URL="https://api.conectavet.com"
VITE_SOCKET_URL="https://api.conectavet.com"
VITE_LIVEKIT_HOST="https://conectavet.livekit.cloud"
```

### Configuración de Build
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

---

## 4. Compilación y Publicación Móvil (`mobile/`)

```bash
# 1. Instalar CLI de EAS globalmente
npm install -g eas-cli

# 2. Iniciar sesión en Expo
eas login

# 3. Compilar APK / AAB para Android
eas build --platform android --profile production

# 4. Compilar IPA para iOS
eas build --platform ios --profile production
```
