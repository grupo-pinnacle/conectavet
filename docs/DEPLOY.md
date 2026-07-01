# Deploy — Backend VetConnect

## Opción 1: Railway (recomendado)

### Prerequisitos

- Repo en GitHub con push a `main`
- Cuenta en [railway.app](https://railway.app)
- Token de Railway configurado como `RAILWAY_TOKEN` en GitHub Secrets

### CI/CD automático

El workflow en `.github/workflows/ci.yml` despliega automáticamente a Railway en cada push a `main`:

```
push a main → tests (backend + web) → deploy a Railway
```

### Deploy manual

```bash
railway up --service conectavet-api
```

### Variables de entorno en Railway

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Pooler de Supabase (puerto 6543, con `?pgbouncer=true`) |
| `DIRECT_URL` | Conexión directa Supabase (puerto 5432) |
| `JWT_SECRET` | Clave secreta para JWT (generar con `openssl rand -hex 32`) |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | URL del frontend (opcional) |
| `PORT` | Railway lo asigna automáticamente |
| `LOG_LEVEL` | `info` para producción, `debug` para desarrollo |

---

## Opción 2: Docker (cualquier proveedor)

### Build

```bash
cd backend
docker build -t conectavet-api .
```

### Run

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e DIRECT_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e NODE_ENV=production \
  conectavet-api
```

### Verificar

```bash
curl http://localhost:3000/health
```

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
- En Railway, las variables de entorno se configuran en el dashboard, no en archivos
