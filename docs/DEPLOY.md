# Railway Deploy — Backend VetConnect

## Prerequisitos

- Repo en GitHub con push a `main`
- Cuenta en [railway.app](https://railway.app)

## Pasos

1. Ir a https://railway.app → New Project → Deploy from repo
2. Elegir el repo `grupo-pinnacle/conectavet`
3. Root Directory: `backend`
4. Railway detecta Node.js y ejecuta automáticamente:
   ```
   npm ci → npx prisma generate → npx tsc → node dist/server.js
   ```
5. Configurar variables de entorno (ver `.env.example`):
   - `DATABASE_URL` — Pooler de Supabase (puerto 6543)
   - `DIRECT_URL` — Conexión directa Supabase (puerto 5432)
   - `JWT_SECRET` — Clave secreta para JWT (generar una nueva)
   - `NODE_ENV=production`
   - `CORS_ORIGIN=https://[frontend-domain]` (opcional)

6. Railway asigna una URL tipo: `https://conectavet-api.up.railway.app`
7. Probar: `curl https://conectavet-api.up.railway.app/health`

## Notas de seguridad

- **NO** pegar credenciales reales en este archivo ni en ningún documento del repo
- Usar el `.env.example` como template
- Generar un `JWT_SECRET` nuevo para producción (ej: `openssl rand -hex 32`)
- Rotar las credenciales de Supabase si alguna vez se expusieron en el repo
