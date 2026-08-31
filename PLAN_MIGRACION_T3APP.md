# PLAN DE MIGRACIÓN — ConectaVet → T3 Stack

> **Objetivo:** reescribir ConectaVet sobre **T3 Stack** (Next.js App Router + tRPC + Prisma + NextAuth + Tailwind + Zod), conservando la lógica de negocio del [`ANALISIS.md`](./ANALISIS.md) y aplicando el diseño propio (Figma, ver [`SPEC.md`](./SPEC.md) / [`AGENTS.md`](./AGENTS.md)).
> **Supersede:** este plan reemplaza a `PLAN_ACCION_VETCONNECT.md` para la dirección de migración. Los fixes de Express/schema de aquel plan ya no aplican en un rebuild limpio.
> **Estado:** borrador de ejecución. Decisiones marcadas con ❓ requieren confirmación del humano.

---

## 0. Por qué T3 Stack

- **Un solo lenguaje/fuente de verdad**: tipos compartidos de la DB (Prisma) hasta el componente (tRPC inference). Elimina la deuda de `packages/shared` no adoptado.
- **Auth lista para roles** con NextAuth (Auth.js) + callback de sesión para `role`.
- **Deploy serverless** en Vercel (web) sin mantener un proceso Express.
- **DX**: `create-t3-app` deja tsc + ESLint + estructura lista.

**Trade-off a resolver:** tRPC no trae WebSocket out-of-the-box y Vercel no corre servidores de larga duración. El chat en tiempo real se resuelve con **Supabase Realtime** (ya usan Supabase Postgres) → sin servidor Socket.io aparte. ❓ Alternativa: Socket.io en un custom server (pierde deploy serverless) o Pusher/Ably.

---

## 1. Arquitectura objetivo

```
conectavet/                      (monorepo)
├── apps/
│   ├── web/                     # Next.js (T3) — dueño + vet + admin (App Router)
│   └── mobile/                  # Expo — consume tRPC + Supabase Realtime
├── packages/
│   ├── db/                      # Prisma client + schema (única fuente de tipos)
│   └── api/                     # tRPC client + tipos compartidos (web + mobile)
└── supabase/                    # Realtime channels + (opcional) políticas RLS
```

- **DB:** PostgreSQL en Supabase (se reusa el schema del `ANALISIS.md` §3).
- **API:** tRPC en lugar de REST Express.
- **Auth:** NextAuth `Credentials` provider + tabla `User` existente (bcrypt). `tokenVersion` se mantiene para revocación global (invalidar sesiones en logout).
- **Realtime:** Supabase Realtime (`channel: consultation:{id}`) para `message:new`, `consultation:updated`, `prescription:new`. Presencia online/offline vía Supabase Presence o campo `isOnline` en User.
- **Media:** subir a **S3/Cloudinary con URL firmada** (resuelve la deuda de `/uploads` efímero). ❓ Proveedor a confirmar.
- **Video:** migrar LiveKit a un **token route** en tRPC/route handler; el cliente (web y mobile) usa el SDK de LiveKit directo (no WebView).
- **Push:** Expo Push vía un route handler/edge function (se reusa la lógica).

---

## 2. Mapeo endpoints actuales → routers tRPC

| Módulo actual | Router tRPC | Procedimientos |
|---------------|-------------|----------------|
| `auth` | `authRouter` | `register` (mutación), `logout` (invalida `tokenVersion`), `forgotPassword`, `resetPassword`, `verifyEmail`. Login/sesión lo maneja NextAuth. |
| `users` | `userRouter` | `me`, `updateMe`, `setAvailability` (vet), `listVets`, `getVet`, `listFavorites`, `addFavorite`, `removeFavorite`, `adminCreateUser`, `approveVet` (admin). |
| `pets` | `petRouter` | `list`, `byId`, `create`, `update`, `remove` (soft), `restore`, `managed` (vet). |
| `consultations` | `consultationRouter` | `create`, `mine`, `history`, `availableVets`, `byId`, `assign` (vet), `decline` (vet), `complete` (vet), `messages`, `sendMessage`, `prescriptions`, `createPrescription` (vet), `rate`. |
| `media` | `mediaRouter` | `upload` (devuelve URL firmada). |
| `notifications` | `notificationRouter` | `registerToken`, `unregisterToken`, `list` (con `unreadCount`), `markRead`. |
| `calls` | `callRouter` | `token` (minta LiveKit). |

**Protección:** `publicProcedure`, `protectedProcedure` (logueado), `authorizedProcedure(...roles)` para vet/admin. El `role` viaja en la sesión de NextAuth y se inyecta en `ctx`.

**Realtime (Supabase):** en vez de eventos Socket.io, publicar/broadcast en canales `consultation:{id}`:
- `message:send` → insert en `messages` + broadcast `message:new`.
- `complete`/`assign` → broadcast `consultation:updated`.
- `createPrescription` → broadcast `prescription:new`.
- Dedup por `clientMsgId` y rate-limit se mantienen en la capa de servicio.

---

## 3. Fases de ejecución

### F0 — Scaffold (clean)
- `npx create-t3-app@latest apps/web --next-app --tailwind --trpc --prisma --next-auth --app-router --eslint --src-dir`.
- Crear `packages/db` (Prisma) y `packages/api` (tipos tRPC). Workspace npm/pnpm.
- Conectar Supabase: `DATABASE_URL` + `DIRECT_URL`. `prisma db push` con el schema del `ANALISIS.md` §3.
- **Aceptación:** `npm run dev` levanta Next; `GET /api/trpc/...` responde; Prisma Studio muestra las tablas.

### F1 — Datos + Auth
- Migrar schema Prisma (incluir `tokenVersion`, `vetStatus`, `clientMsgId` único).
- NextAuth Credentials: login contra `User`, sesión con `userId/role/tokenVersion`; `authorizedProcedure` por rol.
- `register` mutación (solo `CLIENT`; ADR-009 para VET = `vetStatus=PENDING`).
- **Aceptación:** registrar/login dueño y vet; `protectedProcedure` devuelve 401 sin sesión; rol correcto en `ctx`.

### F2 — Dominio (pets, users, consultations)
- Implementar `petRouter`, `userRouter`, `consultationRouter` con la misma lógica de negocio (cola, soft delete, complete con notas, rating 1–10, favoritos).
- **Aceptación:** test de cada router (tsc + Vitest) cubriendo permisos por rol.

### F3 — Realtime (chat)
- Canal Supabase Realtime `consultation:{id}`; hooks `useConsultationRoom` (web) y equivalente mobile.
- Mantener dedup/rate-limit en servicio.
- **Aceptación:** dos clientes en la misma consulta ven `message:new` en <1s; recarga no duplica.

### F4 — Media, notificaciones, video, push
- `mediaRouter` con URL firmada (S3/Cloudinary).
- `notificationRouter` + Expo push (route handler).
- `callRouter.token` (LiveKit) + cliente SDK en web/mobile (sin WebView).
- **Aceptación:** adjuntar imagen en chat; recibir push al asignar consulta; unirse a videollamada.

### F5 — UI web desde Figma
- Traducir el diseño de Figma a componentes (ver `AGENTS.md` y `SPEC.md`). Dueño + vet + admin.
- **Aceptación:** las pantallas del `SPEC.md` §Pantallas existen y usan los design tokens de Figma.

### F6 — Mobile (Expo)
- Consumir `packages/api` (tRPC) + Supabase Realtime + Expo Push.
- **Aceptación:** flujo completo dueño en dispositivo.

### F7 — Deploy + tests + observabilidad
- Vercel (web), EAS (mobile), Supabase (DB/Realtime). CI: tsc + tests + build.
- Observabilidad mínima: health + logs estructurados + alerta de caída.
- **Aceptación:** smoke E2E verde; rollback probado.

---

## 4. Qué se descarta del proyecto actual

- El `backend/` Express completo (lo reemplaza tRPC dentro de Next.js).
- `socket.io` gateway propio (lo reemplaza Supabase Realtime).
- Servir `/uploads` desde disco (lo reemplaza storage firmado).
- WebView de LiveKit (lo reemplaza SDK nativo).
- `packages/shared` manual (lo reemplaza `packages/api` inferido por tRPC).

---

## 5. Decisiones (CERRADAS ✅ — confirmadas por el humano)

1. **Transporte realtime = Supabase Realtime.** Se usa el canal `consultation:{id}` sobre la misma BD Supabase. Reemplaza a Socket.io (sin servidor aparte, deploy serverless en Vercel). Presencia online/offline vía Supabase Presence o campo `isOnline`.
2. **Storage de media = Cloudinary** (con URL firmada / upload preset restringido). Resuelve la deuda de `/uploads` efímero. `mediaRouter.upload` devuelve la URL firmada; el cliente sube directo a Cloudinary.
3. **Registro de VET = auto-registro + `vetStatus=PENDING`** (ADR-009). El usuario puede registrarse como VET; queda `PENDING` y no aparece en `listVets`/cola hasta que un ADMIN lo apruebe (`PATCH /vets/:id/vet-status`).
4. **Monorepo tooling = pnpm workspaces** (sin Turborepo por ahora; se suma después si hace falta cacheo de tasks).
5. **Mobile en el mismo monorepo:** `apps/mobile` (Expo) comparte `packages/db` y `packages/api`.

### Implicancias de estas decisiones

- **Sin `socket.io`** en el nuevo stack → `chat.gateway.ts` y `message-throttle.ts` (Redis adapter) quedan obsoletos; su lógica (dedup por `clientMsgId`, rate-limit, participación, estado `ACTIVE`) se mueve a un servicio invocado desde el router tRPC y se broadcast vía Supabase Realtime.
- **Cloudinary** requiere `CLOUDINARY_* ` en `.env.example` y un helper de firma (route handler de Next).
- **NextAuth Credentials** debe respetar `vetStatus` en el listado/asignación (filtrar `APPROVED`).
- **pnpm**: `package.json` raíz con `workspaces` + `pnpm-workspace.yaml`; scripts unificados (`dev`, `build`, `test`, `typecheck`).
