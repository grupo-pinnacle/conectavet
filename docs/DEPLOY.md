# Deploy — VetConnect

> ⚠️ **ANTES DE DEPLOYAR — bloqueantes de la auditoría 5-Ago (CODE_AUDIT.md):**
> 1. **`.env` commiteados con credenciales reales** (`backend/.env`, `web/.env`, `mobile/.env` están en git). Rotar `DATABASE_URL`/`DIRECT_URL`/`JWT_SECRET` en Supabase, quitar los archivos del repo (`git rm --cached`) y purgar el historial (`git filter-repo` o `BFG`). Sin esto **no deployar**.
> 2. **Migraciones desalineadas**: `prisma migrate deploy` (ejecutado por `npm start`) fallaría en prod porque `2_cleanup_mvp` dropeó `isOnline` y la init no crea `messages`/`prescriptions`/`CANCELLED`. Correr `npx prisma migrate dev` y commitear la migración nueva **antes** de deployar.
> 3. **EAS build**: `eas.json` (preview/production) apunta a `http://localhost:3001` y `app.json` tiene `eas.projectId` vacío → un APK release no llega al backend y Android 9+ bloquea cleartext HTTP. Configurar URLs HTTPS reales y el projectId.

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
| `EXPO_PUSH_DISABLED` | `true` desactiva el envío real de push (útil para tests/dev) |

> ⚠️ **Imágenes del chat (S12):** `POST /api/media` guarda en `backend/uploads/`, que en Koyeb/Render es **disco efímero** (se pierde en cada redeploy). Para producción persistente migrar a Cloudinary/S3 (la columna `photoUrl` de mascotas ya usa Cloudinary) o montar un volumen persistente. En dev local funciona sin cambios.

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

> ⚠️ **Estado actual (auditoría 5-Ago):** las migraciones no están alineadas con `schema.prisma` (`isOnline`, `vetId` nullable, tablas `messages`/`prescriptions`, enum `CANCELLED`). Antes de cualquier deploy de producción:
> 1. Correr `npx prisma migrate dev --name alinear-schema-11` en dev
> 2. Verificar que el SQL generado re-agrega `isOnline` y hace `vetId` nullable
> 3. Commitear la migración y recién ahí deployar

Para desarrollo:

```bash
npx prisma migrate dev --name descripcion
```

> En desarrollo también se puede sincronizar directo con `npx prisma db push` (no versiona, pero es lo que venía usando el equipo).

---

## Notas de seguridad

- **BLOQUEANTE (auditoría 5-Ago):** los 3 `.env` están trackeados en git. Verificá y limpiá:
  ```bash
  git ls-files | findstr .env        # backend/.env, web/.env, mobile/.env — deben salir de git
  git rm --cached backend/.env web/.env mobile/.env
  ```
- Rotar las credenciales de Supabase **ya** porque estuvieron expuestas en el repo (público en GitHub)
- Cambiar el `JWT_SECRET` placeholder `change-me-to-a-random-secret` **antes** de cualquier deploy (hoy cualquiera forja JWTs)
- Crear `.env.example` en cada capa (no existe ninguno) y usarlo como template en los READMEs
- Generar un `JWT_SECRET` nuevo para producción (`openssl rand -hex 32`)
- Las variables de entorno se configuran en el dashboard del proveedor, nunca en archivos
- Revisar antes de cada release: secretos, migraciones alineadas, config de mobile/cada capa (`eas.json` HTTPS + projectId)
