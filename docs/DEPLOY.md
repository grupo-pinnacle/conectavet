# Deploy — VetConnect

## Stack de producción

| Servicio | Proveedor | Costo | Estado |
|----------|-----------|-------|--------|
| **Backend (API)** | Koyeb | Gratis (always-on 1GB RAM) | ✅ Recomendado |
| **Frontend Web** | Vercel | Gratis | ✅ Listo |
| **Base de datos** | Supabase | Gratis (500MB) | ✅ Ya en uso |
| **Mobile (APK/IPA)** | EAS Build | Gratis (30 builds/mes) | ✅ Listo |
| **Dominio** | — | — | Usar subdominio gratis |

---

## Backend — Opción 1: Koyeb (recomendado, gratis)

### Por qué Koyeb

- **Always-on**: No se duerme (Render sí lo hace a los 15 min)
- **1GB RAM gratis** — más que suficiente para un MVP
- PostgreSQL gratis incluido (no lo necesitás, ya tenés Supabase)
- Auto-deploy desde GitHub
- HTTPS automático
- Dominio: `tuapp.koyeb.app`

### Setup

1. Crear cuenta en [koyeb.com](https://koyeb.com) (GitHub login)
2. Ir a **Create App** → **GitHub** → seleccionar repo
3. Configurar:
   - **Builder**: Docker
   - **Dockerfile path**: `backend/Dockerfile`
   - **Port**: 3000
4. Agregar variables de entorno:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Pooler de Supabase (puerto 6543, con `?pgbouncer=true`) |
| `DIRECT_URL` | Conexión directa Supabase (puerto 5432) |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | URL de Vercel (ej. `https://vetconnect.vercel.app`) |
| `LOG_LEVEL` | `info` |

5. Ir a **App Settings** → **Domains** → copiar la URL de Koyeb
6. **(importante)** Ir a Supabase → Project Settings → API → en **Settings > API > Config > User Authorization** → agregar `https://tudominio.koyeb.app` a los redirect URLs permitidos

---

## Backend — Opción 2: Render (gratis, se duerme)

Alternativa si no funciona Koyeb. Render da 512MB RAM gratis pero duerme el servicio a los 15 min sin tráfico. Al recibir un request tarda ~30s en despertar. Para un MVP con poco uso es aceptable.

[render.com](https://render.com) — mismo setup que Koyeb pero con Web Service + PostgreSQL.

---

## Frontend Web — Vercel (gratis)

### Setup

1. Ir a [vercel.com](https://vercel.com) e iniciar sesión con GitHub
2. **Add New → Project** → importar repo
3. Configurar:
   - **Root Directory**: `web`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Deploy — Vercel detecta Vite automáticamente

### Dominio personalizado (opcional)

Si tenés un dominio (ej. `conectavet.com`), agregalo en Vercel → Project → Domains y seguí las instrucciones DNS.

---

## Mobile — EAS Build (gratis, 30 builds/mes)

### Prerequisitos

```bash
cd mobile
npm install -g eas-cli
eas login
```

### Build APK (Android)

```bash
eas build --platform android --profile preview
```

### Build IPA (iOS)

```bash
eas build --platform ios --profile preview
```

Requiere cuenta de Apple Developer ($99/año) para distribución.

---

## Iconos de la app

Los SVG fuente están en:
- `web/public/favicon.svg` (48x48) — favicon
- `web/public/logo-icon.svg` (512x512) — icono PWA y mobile

Para generar los PNG necesarios para mobile (`mobile/assets/`), usá:

```bash
npx svg-to-png web/public/logo-icon.svg mobile/assets/icon.png --width 1024
npx svg-to-png web/public/logo-icon.svg mobile/assets/adaptive-icon.png --width 1024
npx svg-to-png web/public/logo-icon.svg mobile/assets/splash.png --width 1284
```

O convertí manualmente en [svgtopng.com](https://svgtopng.com).

---

## Migraciones de base de datos

En producción las migraciones se ejecutan automáticamente al iniciar el servidor (`npm start` ejecuta `prisma migrate deploy` antes de arrancar).

Para desarrollo:

```bash
npx prisma migrate dev --name descripcion
```

---

## Notas de seguridad

- **NO** pegar credenciales reales en archivos del repo
- Usar `.env.example` como template (contiene placeholders, no credenciales reales)
- Generar un `JWT_SECRET` nuevo para producción
- Rotar las credenciales de Supabase si alguna vez se expusieron en el repo
- Las variables de entorno se configuran en el dashboard del proveedor, no en archivos
