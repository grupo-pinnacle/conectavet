# DEPLOY — ConectaVet

Runbook paso a paso para deployar el stack en producción.

## Arquitectura

| Componente | Proveedor | URL patrón |
|------------|-----------|------------|
| **Web** (Next.js) | Vercel | `https://conectavet.com` |
| **Mobile** (Expo) | EAS Build + App Store / Play Store | `https://apps.apple.com/...` y `https://play.google.com/...` |
| **Database** | Supabase Postgres | `postgresql://...pooler.supabase.com:6543/postgres` |
| **Realtime** | Supabase Realtime | `wss://[ref].supabase.co/realtime/v1` |
| **Media** | Cloudinary | `https://res.cloudinary.com/[cloud_name]/...` |
| **CI** | GitHub Actions | `.github/workflows/{ci,deploy}.yml` |

---

## 1. Setup inicial (una sola vez)

### 1.1. Crear proyecto en Supabase

1. Ir a https://supabase.com/dashboard → **New project**.
2. Nombre: `conectavet-prod`. Database password: guardar en 1Password.
3. Region: `South America (São Paulo)` (más cercano a Argentina).
4. **Settings → Database → Connection string**:
   - **Connection pooling** (puerto 6543) → `DATABASE_URL`
   - **Direct** (puerto 5432) → `DIRECT_URL`

### 1.2. Crear cuenta en Vercel

1. Ir a https://vercel.com/signup → signup con GitHub (grupo-pinnacle).
2. **Add New Project** → importar `grupo-pinnacle/conectavet`.
3. **Root Directory**: `apps/web`.
4. **Framework**: Next.js (autodetecta).
5. **Build Command** (override): `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @conectavet/web build`.
6. **Install Command** (override): dejar vacío (lo maneja `vercel.json`).
7. **Output Directory**: `.next`.

### 1.3. Crear cuenta en Cloudinary

1. https://cloudinary.com/console.
2. Copiar `Cloud name`, `API Key`, `API Secret`.

### 1.4. Crear cuenta en Expo (EAS)

1. https://expo.dev/signup.
2. `npm install -g eas-cli` y `eas login`.
3. Dentro de `apps/mobile`: `eas init` (crea el proyecto Expo).

---

## 2. Variables de entorno

### 2.1. Vercel (Production + Preview)

Settings → Environment Variables. Marcar las que apliquen a cada environment.

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | ✅ | Pooler Supabase (puerto 6543) |
| `DIRECT_URL` | ✅ | Conexión directa Supabase (puerto 5432) — para migraciones |
| `NEXTAUTH_URL` | ✅ | `https://conectavet.com` (production), `https://*.vercel.app` (preview) |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `MOBILE_JWT_SECRET` | ✅ | `openssl rand -base64 32` (distinto de NEXTAUTH_SECRET) |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloud name de Cloudinary |
| `CLOUDINARY_API_KEY` | ✅ | API key de Cloudinary |
| `CLOUDINARY_API_SECRET` | ✅ | API secret de Cloudinary |
| `NEXT_PUBLIC_SUPABASE_URL` | ⚠️ | Para Supabase Realtime (cuando se implemente) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⚠️ | Para Supabase Realtime |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ | Server-side only, para Realtime admin |

### 2.2. GitHub Secrets (para CI/CD)

Settings → Secrets and variables → Actions → New repository secret.

| Secret | Descripción |
|--------|-------------|
| `VERCEL_TOKEN` | https://vercel.com/account/tokens → "Create Token" |
| `DATABASE_URL` | Igual que Vercel — usado por el job de migraciones |
| `DIRECT_URL` | Igual que Vercel |

### 2.3. Expo EAS Secrets (mobile)

```bash
cd apps/mobile
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://conectavet.com"
```

---

## 3. Deploy de base de datos (Supabase)

### 3.1. Aplicar schema inicial

Una vez que el repo esté pusheado con las migraciones:

**Opción A — desde local con Supabase DATABASE_URL**:
```bash
export DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
pnpm db:migrate:deploy
```

**Opción B — desde GitHub Actions** (recomendado, automático en cada deploy):
El workflow `.github/workflows/deploy.yml` corre `pnpm db:migrate:deploy` después de cada deploy a Vercel.

### 3.2. Generar migración inicial (la primera vez)

Si el repo no tiene migraciones (`packages/db/prisma/migrations/`), generá la inicial:

```bash
# 1. Conectar a DB de dev local o Supabase staging
export DATABASE_URL="..."
pnpm --filter @conectavet/db db:migrate --name init
# Esto genera: packages/db/prisma/migrations/<timestamp>_init/migration.sql
# Commitear ese archivo.
```

⚠️ **Nunca usar `db push` en producción** — `db push` no genera historial y puede romper en deploys futuros.

---

## 4. Deploy del Web (Vercel)

### 4.1. Deploy automático

Push a `better` → GitHub Actions → `deploy-web` → Vercel → URL de producción.

### 4.2. Deploy manual

```bash
# Login
vercel login

# Deploy a preview
vercel --yes

# Deploy a production
vercel --prod --yes
```

### 4.3. Verificar deploy

- Visitar `https://conectavet.com`
- Probar `/api/health` → debe devolver `{"ok":true,"checks":{"database":{"ok":true,...}}}`
- Login + crear mascota + crear consulta (smoke test)

---

## 5. Deploy del Mobile (Expo EAS)

### 5.1. Build

```bash
cd apps/mobile

# Login (una vez)
eas login

# Preview build (internal distribution)
eas build --profile preview --platform ios
eas build --profile preview --platform android

# Production build
eas build --profile production --platform ios
eas build --profile production --platform android
```

### 5.2. Submit a las stores

```bash
# iOS (requiere App Store Connect setup)
eas submit --platform ios

# Android (requiere Google Play Console service account)
eas submit --platform android
```

### 5.3. OTA updates (alternativa rápida para fixes JS)

```bash
# Publicar update JS-only (sin rebuild nativo)
eas update --branch production --message "Fix bug X"
```

---

## 6. Monitoring y logs

| Señal | Dónde mirar |
|-------|-------------|
| Errors runtime | Vercel → Logs (filtrar por `/api/*` o por `level=error`) |
| DB queries lentas | Supabase → Logs → postgres |
| 5xx rate | Vercel → Analytics |
| Mobile crashes | Expo → Errors (visible en dashboard) |
| Health check | `https://conectavet.com/api/health` (uptime robot externo) |

---

## 7. Rollback

### 7.1. Web

Vercel → Deployments → click en deployment anterior → "Promote to Production".

### 7.2. Database

```bash
# Marcar migración como "rolled back" sin ejecutarla al revés
# (Prisma no soporta rollback automático; hay que escribir la migración reversa a mano)
pnpm --filter @conectavet/db db:migrate --name rollback_xyz
# Editar el SQL generado para hacer el inverse
```

### 7.3. Mobile

OTA: `eas update --branch production --message "Reverting to v1.2.3"`.
Native: publicar nuevo build con la versión anterior.

---

## 8. Pre-deploy checklist

Antes de merge a `better`:

- [ ] `pnpm typecheck` verde en local
- [ ] `pnpm build` verde en local
- [ ] Migraciones nuevas commiteadas (`packages/db/prisma/migrations/`)
- [ ] Variables de entorno nuevas documentadas en `.env.example`
- [ ] No hay secrets en el código (verificar con `git grep -E "(api[_-]?key|secret|password|token)"`)
- [ ] `pnpm db:migrate:status` muestra que las migraciones están sincronizadas
- [ ] Cambios en `AGENTS.md` o `SPEC.md` actualizados
- [ ] PR aprobado por al menos 1 reviewer (configurar branch protection)

## 9. Comandos útiles

```bash
# Ver logs en vivo
vercel logs --follow

# Inspeccionar build artifacts
vercel inspect <deployment-url>

# Conectar a la DB de producción
psql "$(vercel env pull production | grep DATABASE_URL)"

# Crear admin user en Supabase
# (ir a Supabase → Authentication → Users → Add user con email/password)

# Sincronizar schema con Prisma Studio
pnpm db:studio  # abre en http://localhost:5555
```