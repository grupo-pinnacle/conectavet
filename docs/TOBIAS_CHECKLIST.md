# Checklist Personal Tobias — DevOps & Backend Lead

> **Tu misión:** Que el backend vuele, que el deploy esté listo, que el equipo no se trabe.
> **Deadline final:** 17 de julio (freeze). Después solo bugs críticos.
> **TL;DR:** Db push → Railway → CI/CD → Pairing Juan. Después, despejá.

---

## 🔴 Alta Prioridad (S6: 2-4 Jul)

### 1. `npx prisma db push` — Aplicar la migración a Supabase

```bash
cd backend
npx prisma db push
```

Esto aplica los cambios del schema (Message model, vetId optional) a Supabase.
Si `db push` falla, usá `npx prisma migrate dev --name add_messages`.

**Coordinación con Damián:** Decile que después de esto la API de consultations está viva y puede conectar el frontend.

### 2. Test de humo — backend completo

```bash
cd backend
npm run dev
```

Probar con curl/Postman:
```bash
# Auth
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"123456","name":"Test","role":"CLIENT"}'
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"123456"}'

# Pets
curl http://localhost:3000/api/pets -H "Authorization: Bearer <TOKEN>"

# Consultations
curl http://localhost:3000/api/consultations/mine -H "Authorization: Bearer <TOKEN>"

# Health
curl http://localhost:3000/api/health
```

Si todo responde, avisale al equipo en la daily.

### 3. Railway deploy

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Enlazar proyecto
railway link

# Deploy
railway up
```

**Necesitás:**
- Cuenta Railway creada
- Variables de entorno configuradas en Railway:
  - `JWT_SECRET` (copiá de tu `.env`)
  - `DATABASE_URL` y `DIRECT_URL` (de Supabase)
  - `CORS_ORIGIN` = `https://conectavet-web.up.railway.app` (cuando deployen la web)
- Base de datos apuntando a Supabase (ya funciona de local)

**Verificación:** `curl https://conectavet-api.up.railway.app/api/health` → 200.

---

## 🟡 Media Prioridad (S7: 6-8 Jul)

### 4. CI/CD — GitHub Actions

Ya creé `.github/workflows/ci.yml` con:
- Backend: `npm ci` → `tsc --noEmit` → `npm test`
- Web: `npm ci` → `npm run build`

Habilitar en GitHub:
1. Ir a Settings → Secrets → Actions
2. Agregar `DATABASE_URL` y `DIRECT_URL` (las de Supabase)
3. Hacer un push a `develop` → debería correr el workflow

### 5. Pairing con Juan — Mobile Expo

**S6 entero.** Sentate con Juan y ayudale a crear el proyecto mobile.
El código de ayuda está en `docs/helpers/mobile/`.

Si Juan se traba en algo, resolvele el problema en el momento. No lo dejes esperando.

### 6. Enviar URLs de Railway al equipo

Cuando deployes, avisá:
- `@everyone` — API: `https://conectavet-api.up.railway.app`
- `@Damián` — Web: `https://conectavet-web.up.railway.app`
- `@Juan` — Mobile API URL: `https://conectavet-api.up.railway.app`

---

## 🟢 Baja Prioridad (S8: 9-11 Jul)

### 7. Secrets management — `.env.example`

Crear `.env.example` en `/backend`:

```env
JWT_SECRET=your-secret-here
DATABASE_URL=postgresql://user:pass@host:5432/db
DIRECT_URL=postgresql://user:pass@host:5432/db
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

### 8. Docker (opcional)

Útil para Ezequiel si no quiere instalar Node:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

Solo si sobra tiempo. No es blocker del MVP.

### 9. Health endpoint

Si querés un health endpoint más robusto que `/api/health`, agregale:
```typescript
// backend/src/modules/health/health.routes.ts
router.get('/', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`; // verifica DB connection
  res.json({ status: 'ok', timestamp: new Date() });
});
```

Ya existe un health endpoint básico, solo mejoralo si querés.

---

## 🛑 Lo que NO tenés que hacer

| No hacer | Por qué |
|---------|---------|
| LiveKit / WebRTC | Sacado del MVP |
| IA / recomendaciones | Sacado del MVP |
| Queue / cola de espera | Sacado del MVP |
| Fees / pagos | Sacado del MVP |
| Refresh tokens | Decisión ADR-004: JWT 7 días sin refresh |
| Toquetear código de Damián | Es su responsabilidad, vos solo backend |
| Toquetear código de Juan | Vos hacés pairing, no escribís su código |
| Hacer tests de otros | Ezequiel es QA, vos solo backend tests |

---

## Checklist rápido

- [ ] `npx prisma db push` ejecutado ✅
- [ ] Test de humo: todos los endpoints responden ✅
- [ ] Railway deploy funcionando ✅
- [ ] GitHub Actions CI verde ✅
- [ ] Pairing con Juan (S6 entero) ✅
- [ ] URLs compartidas con el equipo ✅
- [ ] `.env.example` creado ✅
- [ ] Sprint freeze 17 de julio — no más features ✅
- [ ] Estar disponible para hotfixes 20-31 jul (ver `HOTFIX_PROTOCOL.md`) ✅
