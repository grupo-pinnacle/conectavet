# Análisis de ConectaVet (VetConnect) 🐾

> **Fuente:** revisión completa del repositorio (`backend/`, `web/`, `mobile/`, `packages/`, `docs/`).
> **Propósito:** inventario de funcionalidades y características para **replicar el producto con un diseño propio** y/o **migrarlo a T3 Stack**.
> **Fecha del análisis:** 27-ago-2026.

---

## 1. Qué es

Plataforma de **telemedicina veterinaria** que conecta **dueños de mascotas** con **veterinarios** vía:
- chat en tiempo real,
- historial clínico digital de la mascota,
- gestión de consultas (cola de espera, asignación, cierre).

Es un **monorepo de 3 capas**: API (Express), web (React+Vite) y móvil (Expo). Proyecto académico/portfolio del "Grupo Pinnacle".

---

## 2. Stack actual

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js ≥ 18 |
| Lenguaje | TypeScript 5.x |
| Backend API | Express 5 + Prisma 6 + PostgreSQL (Supabase) + Socket.io + JWT |
| Auth | JWT + refresh tokens (bcrypt) |
| Web | React 19 + Vite 8 + TailwindCSS + Socket.io client |
| Mobile | React Native + Expo SDK 54 + Socket.io + expo-image |
| Realtime | Socket.io gateway (`/socket.io`); deep-links `vetconnect://` en mobile |
| Media | Uploads a disco local `/uploads` (efímero en PaaS) |
| Video | LiveKit server-side (`POST /api/calls/:id/token`); cliente mobile usa WebView (incompleto) |
| Push | Expo Push API (best-effort) |
| CI/CD | GitHub Actions → tests + tsc → deploy Railway (backend) / Vercel (web) / EAS (móvil) |

---

## 3. Modelo de datos (lo que el sistema guarda)

| Entidad | Campos clave | Para qué sirve |
|---------|--------------|----------------|
| **User** | email, password (hash), firstName, lastName, phone, bio, specialty, role (`CLIENT`/`VET`/`ADMIN`), vetStatus (`PENDING`/`APPROVED`), isOnline, tokenVersion (revocación de sesión), isEmailVerified, emailVerifyToken, emailVerifyExpires, passwordResetToken, passwordResetExpires, lastSeen | Cuentas y auth |
| **Pet** | name, species, breed, age, weight, weightKg, sex, birthDate, color, microchip, allergies[], chronicConditions[], photoUrl, isDeceased, deathDate, ownerId, deletedAt (soft delete) | Ficha clínica de la mascota |
| **Consultation** | clientId, vetId, petId, status (`WAITING`/`PENDING`/`ACTIVE`/`COMPLETED`/`CANCELLED`), notes, startedAt, endedAt, deletedAt | Una consulta médica |
| **Message** | consultationId, senderId, content, attachmentUrl, clientMsgId (dedup) | Mensajes del chat |
| **Prescription** | consultationId, vetId, content, medication, dosage, frequency, durationDays, indications | Recetas |
| **Attachment** | uploaderId, url, mimeType, size | Imágenes subidas |
| **Notification** | userId, type, title, body, data (JSON), readAt | Bandeja in-app + push |
| **Review** | rating (1–10), comment, consultationId, clientId, vetId | Calificación del vet |
| **FavoriteVet** | clientId, vetId | Vets favoritos del dueño |
| **PushToken** | userId, token, platform | Tokens Expo para push |

**Enums:** `Role { CLIENT, VET, ADMIN }`, `Sex { MALE, FEMALE }`, `ConsultationStatus { WAITING, PENDING, ACTIVE, COMPLETED, CANCELLED }`, `VetStatus { PENDING, APPROVED }`.

---

## 4. Funcionalidades por módulo (backend = API + WebSocket)

### 4.1 Auth (`/api/auth`)
- `POST /register` — hoy solo crea `CLIENT` (rol VET se ignora por seguridad; ver ADR-009).
- `POST /login` → access token (7 días) + refresh token (30 días).
- `POST /refresh`, `POST /logout` (revoca TODAS las sesiones subiendo `tokenVersion`).
- `POST /forgot-password` (rate-limited anti-abuse), `POST /reset-password`.
- `GET /verify-email`.
- Middleware `authenticate` + `authorize(Role...)`.

### 4.2 Users (`/api/users`)
- `GET /me`, `PATCH /me` (editar perfil).
- `PATCH /me/availability` — vet online/offline (dispara auto-asignación de cola).
- `GET /vets` (lista), `GET /vets/:id` (ficha).
- Favoritos: `POST /vets/:id/favorite`, `DELETE /vets/:id/favorite`, `GET /favorites`.
- `GET /admin-only`, `POST /admin/users` (admin crea usuario), `PATCH /vets/:id/vet-status` (aprobar vet).

### 4.3 Pets (`/api/pets`)
- CRUD completo + **soft delete** (`DELETE`) y restore.
- `GET /pets/managed` — mascotas que un vet ya atendió (acotado por privacidad, ADR-010).

### 4.4 Consultations + Chat (`/api/consultations`)
- `POST /` crear consulta (dueño, con `petId`).
- `GET /mine`, `GET /my-history`, `GET /vets` (vets online), `GET /:id`.
- `PATCH /:id/assign` (vet toma), `PATCH /:id/decline`, `PATCH /:id/complete` (con `notes`).
- Mensajes: `GET /:id/messages`, `POST /:id/messages` (texto y/o `attachmentUrl`).
- Recetas: `POST /:id/prescriptions`, `GET /:id/prescriptions` (solo vet crea).
- Rating: `POST /:id/rating` (Review 1–10).

### 4.5 Calls (`/api/calls`)
- `POST /:id/token` — minta token **LiveKit** para videollamada (server-side listo; cliente móvil hoy abre WebView de deep-link → flujo incompleto).

### 4.6 Media (`/api/media`)
- `POST /` sube imagen (multer, jpeg/png/webp/gif, máx 5 MB, cuota diaria).
- `GET /uploads/:file` sirve archivos.

### 4.7 Notifications (`/api/notifications`)
- `POST /token` / `DELETE /token` (ExpoPushToken upsert), `GET /` (bandeja + `unreadCount`), `PATCH /:id/read`.
- Push best-effort vía Expo (`EXPO_PUSH_DISABLED=true` en tests).

### 4.8 WebSocket (Socket.io, `/socket.io`)
- Auth JWT en handshake (valida `tokenVersion` → logout revoca conexiones).
- Eventos: `join:consultation`, `leave:consultation`, `message:send` → `message:new` (broadcast), `consultation:updated`, `prescription:new`.
- Rate-limit + **dedup durable** por `clientMsgId` (anti-duplicado).
- Adapter Redis opcional para multi-instancia.

---

## 5. Funcionalidades de UI

### 5.1 Web (React+Vite) — dueño + vet + admin
- Landing, Login, Register, Splash.
- Dashboard dueño (`/dashboard`): Home, Directorio de vets, Consultas, Historial, Mensajes, Mascotas, Perfil.
- Componentes clave: `StarRatingInput` (calificación), `MessageBubble` (chat), `ImageViewer` (adjuntos), secciones de dashboard en `web/src/components/dashboard/`.
- Dashboard vet (`/vet-dashboard`): Pacientes, Home vet, Mensajes vet, Ficha de paciente (`VetPatientProfile`).
- `CallPage` (`/call`) — sala de videollamada.

### 5.2 Móvil (Expo) — dueño
- Tabs: Inicio / Mascotas / Consultas / Veterinarios / Chat.
- Pantallas: chat por consulta, llamada, historial, perfil/edición, detalle y alta de mascota.
- Tema propio (`src/theme`), store de auth (`authStore`), hook de push, outbox offline, deep links (`vetconnect://`).

---

## 6. Características transversales (conservar al replicar)

- **3 roles** (`CLIENT`/`VET`/`ADMIN`) con middleware de autorización.
- **Revocación de sesión global** vía `tokenVersion` (logout cierra todas las pestañas/dispositivos).
- **Cola de espera con auto-asignación**: vet online recibe consultas `WAITING`.
- **Soft delete** en mascotas y consultas.
- **Dedup de mensajes** (`clientMsgId`) + **rate-limit** anti-flood.
- **Presencia** online/offline (`isOnline`, `lastSeen`).
- **Recetas** estructuradas (medicamento/dosis/frecuencia/duración/indicaciones).
- **Calificación 1–10** + favoritos de vet.
- **Notificaciones push + in-app**.
- **Verificación de email + recuperación de password** con rate-limit.
- **WebSockets con auth + Redis adapter opcional**.
- **~159 tests de backend** (Jest+supertest): auth, consultas, pets, users, media, notifications, cache, utils, app, chat.ws, concurrencia, e2e-flow.
- Logger JSON estructurado, `GET /health`, Docker multistage.

---

## 7. Deuda / limitaciones conocidas

- **Video LiveKit** solo server-side; cliente usa WebView (flujo incompleto).
- **`packages/shared`** existe pero no se usa (0 imports) → tipos duplicados en las 3 capas.
- **Media efímera** en disco del contenedor → migrar a S3/Cloudinary firmado en prod.
- **CORS de WS** abierto (`*`) en dev.
- **Observabilidad mínima** (solo `/health` + logs).
- **Sin tests de web/móvil**, ni authz negativa/concurrencia en front.
- Registro de VET: ADR-009 propone auto-registro con verificación admin post-hoc (`vetStatus=PENDING`).

---

## 8. Para replicarlo con diseño propio

Separar el **qué hace** (funcionalidad) del **cómo se ve** (UI):

1. **Datos** → las 11 tablas del §3.
2. **API** → los ~30 endpoints + WebSocket del §4.
3. **Flujo clave** → registro/login → crear mascota → iniciar consulta → entrar a cola → vet toma → chat en vivo → receta → cerrar → calificar.
4. **Diseño propio** → reemplazás libremente landing, paleta (hoy teal/verde), dashboards, tabs móviles y componentes. La **lógica de negocio** (estados de consulta, roles, dedup, revocación) es lo que vale la pena conservar.

> Ver [`PLAN_MIGRACION_T3APP.md`](./PLAN_MIGRACION_T3APP.md) para la estrategia de migración a T3 Stack, [`SPEC.md`](./SPEC.md) para la especificación de la futura app y [`AGENTS.md`](./AGENTS.md) para las reglas de desarrollo del agente.
