# VetConnect API

> **Backend de telemedicina veterinaria** — API REST monolítica modular con autenticación JWT, roles (CLIENT/VET/ADMIN), CRUD de mascotas, chat de texto en tiempo real y consultas.
>
> Node.js · TypeScript · Express 5 · Prisma 6 · PostgreSQL (Supabase) · JWT · Socket.io

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Tests](https://img.shields.io/badge/tests-119%2F119-passing)
![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Tabla de contenidos

- [Stack](#stack)
- [Prerequisitos](#prerequisitos)
- [Setup rápido](#setup-rápido)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Base de datos (Supabase)](#base-de-datos-supabase)
- [API Reference](#api-reference)
  - [Health](#health)
  - [Auth](#auth)
  - [Users](#users)
  - [Pets](#pets)
  - [Errores](#códigos-de-error)
- [Autenticación](#autenticación)
- [Roles y permisos](#roles-y-permisos)
- [Tests](#tests)
- [Deploy](#deploy)
- [Monitoreo](#monitoreo-y-observabilidad)
- [Variables de entorno](#variables-de-entorno)
- [Contribuir](#contribuir)

---

## Stack

| Componente | Tecnología | Propósito |
|-----------|-----------|-----------|
| Runtime | Node.js 20 (LTS) | Entorno de ejecución |
| Lenguaje | TypeScript 5.x | Tipado estático |
| Framework | Express 5.x | Servidor HTTP |
| ORM | Prisma 6.x | Abstracción de base de datos |
| DB | PostgreSQL 15 (Supabase) | Almacenamiento |
| Auth | JWT + bcrypt | Autenticación y hash de contraseñas |
| Testing | Jest + ts-jest + supertest | Tests unitarios e integración |
| Logging | JSON estructurado (logger propio) | Observabilidad |
| Dev server | tsx watch | Hot reload en desarrollo |
| Compilador | tsc | Build de producción |
| Contenedor | Docker (multi-stage) | Build reproducible |
| CI/CD | GitHub Actions | Tests automáticos + deploy |

---

## Prerequisitos

| Herramienta | Versión (mín) | Cómo verificar |
|---|---|---|
| Node.js | 18.x | `node --version` |
| npm | 9.x | `npm --version` |
| Git | Cualquier reciente | `git --version` |
| Supabase | — | Cuenta en [supabase.com](https://supabase.com) |

> ⚠ El proyecto usa Supabase como base de datos. No necesitás PostgreSQL local.

---

## Setup rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar DATABASE_URL, DIRECT_URL y JWT_SECRET en .env

# 3. Sincronizar schema con Supabase
npx prisma db push

# 4. Generar cliente Prisma
npx prisma generate

# 5. Iniciar servidor (desarrollo con hot-reload)
npm run dev

# 6. Verificar
curl http://localhost:3000/health
```

---

## Estructura del proyecto

```
backend/
├── prisma/
│   ├── schema.prisma           # Definición de modelos
│   └── migrations/             # Migraciones SQL versionadas
├── src/
│   ├── modules/
│   │   ├── auth/               # Registro, login, JWT, refresh token, logout
│   │   │   ├── index.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.service.ts
│   │   ├── users/              # Gestión de usuarios
│   │   │   ├── index.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── users.controller.ts
│   │   │   └── users.service.ts
│   │   ├── pets/               # CRUD de mascotas + soft delete + restore
│   │   │   ├── index.ts
│   │   │   ├── pets.routes.ts
│   │   │   ├── pets.controller.ts
│   │   │   └── pets.service.ts
│   │   ├── consultations/      # Consultas + Chat (Socket.io)
│   │   │   ├── index.ts
│   │   │   ├── consultations.routes.ts
│   │   │   ├── consultations.controller.ts
│   │   │   ├── consultations.service.ts
│   │   │   └── chat.gateway.ts
│   ├── shared/
│   │   ├── cache.ts                 # node-cache para vets disponibles
│   │   ├── logger.ts                # Logger JSON estructurado
│   │   ├── prisma.ts                # Singleton de PrismaClient
│   │   ├── index.ts                 # Barrel export
│   │   ├── middlewares/
│   │   │   └── auth.middleware.ts   # authenticate + authorize
│   │   ├── types/
│   │   │   └── index.ts             # JwtPayload, ApiResponse (re-export @conectavet/shared)
│   │   ├── utils/
│   │   │   └── index.ts             # parsePagination, excludePassword, asyncHandler
│   │   └── errors/
│   │       └── index.ts             # AppError, NotFoundError, ForbiddenError, ConflictError
│   ├── __tests__/
│   │   ├── auth.test.ts             # 23 tests (service + JWT + HTTP controllers + refresh + logout revoca)
│   │   ├── consultations.test.ts    # 30 tests (CRUD consultas + chat + cola + mensajes solo ACTIVE + permisos)
│   │   ├── pets.test.ts             # 21 tests (CRUD mascotas + soft delete + ownership + birthDate + restore)
│   │   ├── users.test.ts            #  9 tests (me, admin-only, vets, auto-asignación)
│   │   ├── media.test.ts            #  4 tests (upload imagen, errores, 401)
│   │   ├── notifications.test.ts    # 10 tests (token push, bandeja, triggers)
│   │   ├── utils.test.ts            # 15 tests (pagination, excludePassword, asyncHandler, errors)
│   │   ├── cache.test.ts            #  4 tests (set/get, clear, pattern clear)
│   │   ├── app.test.ts              #  3 tests (health, 404, login validation)
│   │   └── setup-env.ts             # Configura schema de testing de Supabase
│   └── server.ts               # Entry point + graceful shutdown + Socket.io setup
├── dist/                       # Compilado (npm run build)
├── jest-global-setup.js        # Crea schema test_ dinámico en Supabase
├── jest-global-teardown.js     # Dropea schema test_ al finalizar
├── .env                        # Variables de entorno (no versionado)
├── .env.example                # Template de variables de entorno
├── jest.config.js              # Configuración de Jest + coverage thresholds
├── tsconfig.json               # Configuración de TypeScript
├── Dockerfile                  # Multi-stage build (alpine)
├── .dockerignore
└── package.json
```

---

## Base de datos (Supabase)

La base de datos corre en **Supabase** (PostgreSQL cloud). No se necesita instalar PostgreSQL localmente.

### Modelos actuales

```prisma
enum Role { CLIENT, VET, ADMIN }
enum ConsultationStatus { WAITING, ACTIVE, COMPLETED, CANCELLED }

model User {
  id              String          @id @default(cuid())
  email           String          @unique
  password        String          // hash, nunca se expone en respuestas
  firstName       String?
  lastName        String?
  phone           String?
  role            Role
  isOnline        Boolean         @default(false)
  tokenVersion    Int             @default(1)  // revocación de sesiones (logout)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  pets                  Pet[]
  consultationsAsClient Consultation[] @relation("ClientConsultations")
  consultationsAsVet    Consultation[] @relation("VetConsultations")
  messages              Message[]
  prescriptions         Prescription[]
  pushTokens            PushToken[]
  notifications         Notification[]
  attachments           Attachment[]
  @@map("users")
}

model Pet {
  id                String         @id @default(cuid())
  name              String
  species           String
  breed             String?
  age               Int?
  weight            Float?
  weightKg          Float?
  sex               Sex?
  birthDate         DateTime?
  color             String?
  microchip         String?
  allergies         String[]
  chronicConditions String[]
  photoUrl          String?
  isDeceased        Boolean        @default(false)
  deathDate         DateTime?
  ownerId           String
  owner             User           @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  deletedAt         DateTime?
  consultations     Consultation[]
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  @@map("pets")
}

model Consultation {
  id            String             @id @default(cuid())
  clientId      String
  client        User               @relation("ClientConsultations", fields: [clientId], references: [id])
  vetId         String?
  vet           User?              @relation("VetConsultations", fields: [vetId], references: [id])
  petId         String
  pet           Pet                @relation(fields: [petId], references: [id])
  status        ConsultationStatus @default(WAITING)
  notes         String?
  startedAt     DateTime?
  endedAt       DateTime?
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt
  messages      Message[]
  prescriptions Prescription[]
  @@map("consultations")
}

model Message {
  id             String       @id @default(cuid())
  consultationId String
  consultation   Consultation @relation(fields: [consultationId], references: [id])
  senderId       String
  sender         User         @relation(fields: [senderId], references: [id])
  content        String
  attachmentUrl  String?      // /uploads/<archivo> (imagen adjunta, S12)
  createdAt      DateTime     @default(now())
  @@index([consultationId, createdAt])
  @@map("messages")
}

model Attachment {
  id         String   @id @default(cuid())
  uploaderId String
  uploader   User     @relation(fields: [uploaderId], references: [id])
  url        String   // /uploads/<archivo>
  mimeType   String
  size       Int
  createdAt  DateTime @default(now())
  @@map("attachments")
}

model PushToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  token     String   @unique // ExpoPushToken
  platform  String   // android | ios | web
  createdAt DateTime @default(now())
  @@map("push_tokens")
}

model Notification {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  type      String    // consultation_new | consultation_assigned | consultation_completed | message | prescription_new
  title     String
  body      String
  data      Json?
  readAt    DateTime?
  createdAt DateTime  @default(now())
  @@index([userId, createdAt])
  @@map("notifications")
}

model Prescription {
  id             String       @id @default(cuid())
  consultationId String
  consultation   Consultation @relation(fields: [consultationId], references: [id])
  vetId          String
  vet            User         @relation(fields: [vetId], references: [id])
  content        String
  createdAt      DateTime     @default(now())
  @@map("prescriptions")
}
```

> Ver `prisma/schema.prisma` para el detalle completo (índices, enum `Sex`, etc.).

### Comandos útiles

```bash
# Sincronizar schema con Supabase (desarrollo)
npx prisma db push

# Ver datos en UI web
npx prisma studio

# Crear migration versionada
npx prisma migrate dev --name descripcion

# Aplicar migrations en producción
npx prisma migrate deploy
```

---

## API Reference

### Health

#### `GET /health`

Verifica que el servidor está operativo.

**Response** `200`
```json
{
  "status": "ok",
  "timestamp": "2026-06-29T17:24:16.856Z",
  "environment": "development"
}
```

---

### Auth

#### `POST /api/auth/register`

Crea un nuevo usuario.

**Request body**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "123456"
}
```

| Campo | Tipo | Requerido | Valores |
|-------|------|-----------|---------|
| `email` | string | Sí | Email válido |
| `password` | string | Sí | Mínimo 6 caracteres |
| `role` | string | No | ⚠️ Se ignora — el backend siempre crea usuarios `CLIENT` (seguridad S13) |

**Response** `201`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "cmqzhma650000w3zk1jkoomim",
      "email": "usuario@ejemplo.com",
      "role": "CLIENT",
      "isOnline": false,
      "createdAt": "2026-06-29T17:24:20.093Z",
      "updatedAt": "2026-06-29T17:24:20.093Z"
    }
  }
}
```

**Errors**

| Código | Motivo |
|--------|--------|
| `400` | Email o password faltante / password < 6 caracteres |
| `409` | El email ya está registrado |

---

#### `POST /api/auth/login`

Inicia sesión y devuelve un JWT.

**Request body**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "123456"
}
```

**Response** `200`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "cmqzhma650000w3zk1jkoomim",
      "email": "usuario@ejemplo.com",
      "role": "CLIENT",
      "isOnline": false,
      "createdAt": "2026-06-29T17:24:20.093Z"
    }
  }
}
```

**Errors**

| Código | Motivo |
|--------|--------|
| `400` | Email o password faltante |
| `401` | Credenciales inválidas |

---

### Users

Todas las rutas de users requieren **autenticación** (header `Authorization: Bearer <token>`).

#### `GET /api/users/me`

Devuelve el perfil del usuario autenticado.

**Headers**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response** `200`
```json
{
  "success": true,
  "data": {
    "id": "cmqzhma650000w3zk1jkoomim",
    "email": "usuario@ejemplo.com",
    "role": "CLIENT",
    "isOnline": false,
    "createdAt": "2026-06-29T17:24:20.093Z"
  }
}
```

---

#### `GET /api/users/vets`

Devuelve la lista de veterinarios registrados.

**Response** `200`
```json
{
  "success": true,
  "data": [
    {
      "id": "cmqzhmc290001w3zkcck1ys3s",
      "email": "vet@ejemplo.com",
      "role": "VET",
      "isOnline": false,
      "createdAt": "2026-06-29T17:24:22.546Z"
    }
  ]
}
```

---

#### `GET /api/users/admin-only`

Ruta de prueba: solo accesible por usuarios con rol `ADMIN`.

**Response** `200` (ADMIN)
```json
{
  "success": true,
  "data": {
    "message": "Acceso permitido solo para administradores",
    "user": { "userId": "...", "email": "...", "role": "ADMIN" }
  }
}
```

**Response** `403` (CLIENT o VET)
```json
{
  "success": false,
  "message": "No tenés permiso para acceder a este recurso"
}
```

---

### Pets

Todas las rutas de pets requieren **autenticación**.

#### `GET /api/pets`

Lista todas las mascotas del usuario autenticado.

**Response** `200`
```json
{
  "success": true,
  "data": [
    {
      "id": "cmqzho6tf0001w3h4hnttqx07",
      "name": "Firulais",
      "species": "Perro",
      "breed": "Labrador",
      "age": 3,
      "weight": 25.5,
      "ownerId": "cmqzhma650000w3zk1jkoomim",
      "createdAt": "2026-06-29T17:25:49.059Z",
      "updatedAt": "2026-06-29T17:25:49.059Z"
    }
  ]
}
```

---

#### `POST /api/pets`

Crea una nueva mascota para el usuario autenticado.

**Request body**
```json
{
  "name": "Firulais",
  "species": "Perro",
  "breed": "Labrador",
  "age": 3,
  "weight": 25.5
}
```

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `name` | string | Sí |
| `species` | string | Sí |
| `breed` | string? | No |
| `age` | int? | No |
| `weight` | float? | No |

**Response** `201`
```json
{
  "success": true,
  "data": {
    "id": "cmqzho6tf0001w3h4hnttqx07",
    "name": "Firulais",
    "species": "Perro",
    "breed": "Labrador",
    "age": 3,
    "weight": 25.5,
    "ownerId": "cmqzhma650000w3zk1jkoomim"
  }
}
```

---

#### `GET /api/pets/:id`

Obtiene el detalle de una mascota por ID.

**Response** `200`
```json
{
  "success": true,
  "data": {
    "id": "cmqzho6tf0001w3h4hnttqx07",
    "name": "Firulais",
    "species": "Perro",
    "breed": "Labrador",
    "age": 3,
    "weight": 25.5,
    "ownerId": "cmqzhma650000w3zk1jkoomim",
    "owner": { "id": "...", "email": "...", "role": "CLIENT" }
  }
}
```

**Response** `404`
```json
{
  "success": false,
  "message": "Mascota no encontrada"
}
```

---

#### `PUT /api/pets/:id`

Actualiza los datos de una mascota.

**Request body** (todos opcionales)
```json
{
  "name": "Firulais 2",
  "species": "Perro",
  "breed": "Golden",
  "age": 4,
  "weight": 26.0
}
```

**Response** `200` → mismo formato que GET /api/pets/:id

---

#### `DELETE /api/pets/:id`

Elimina una mascota.

**Response** `200`
```json
{
  "success": true,
  "message": "Mascota eliminada"
}
```

---

## Códigos de error

| Código | Significado |
|--------|-------------|
| `400` | Bad Request — payload inválido o campos faltantes |
| `401` | Unauthorized — token faltante, expirado o inválido |
| `403` | Forbidden — el rol no tiene permiso |
| `404` | Not Found — recurso inexistente |
| `409` | Conflict — email duplicado |
| `500` | Internal Server Error — error inesperado |

**Estructura de respuesta de error:**
```json
{
  "success": false,
  "message": "Descripción legible del error"
}
```

---

## Autenticación

### Cómo funciona

1. El cliente se registra en `POST /api/auth/register`
2. Inicia sesión en `POST /api/auth/login` → recibe un **JWT** (válido por 7 días)
3. En cada request a rutas protegidas, envía el token en el header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Payload del JWT

```json
{
  "userId": "cmqzhma650000w3zk1jkoomim",
  "email": "usuario@ejemplo.com",
  "role": "CLIENT",
  "tokenVersion": 1,
  "iat": 1782753867,
  "exp": 1783358667
}
```

### Refresh

El access token dura **7 días**. Se incluye un `refreshToken` (válido por **30 días**) en la respuesta de login.
Usar `POST /api/auth/refresh` con body `{ "refreshToken": "..." }` para obtener un nuevo par token + refresh sin que el usuario tenga que loguearse de nuevo.

### Logout (revocación de sesiones)

`POST /api/auth/logout` incrementa el `tokenVersion` del usuario en la BD: cualquier access/refresh JWT emitido antes queda **revocado** (401 en el middleware `authenticate` y en `/auth/refresh`). Un login nuevo emite JWTs con el version actualizado.

---

## Roles y permisos

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `CLIENT` | Dueño de mascota | CRUD propias mascotas, historial clínico |
| `VET` | Veterinario | Dashboard médico, consultas, notas |
| `ADMIN` | Administrador | Todo: paneles, configuración, reportes |

### Middleware

```typescript
// Verifica que el token sea válido
authenticate

// Verifica que el rol esté entre los permitidos
authorize(Role.ADMIN)
authorize(Role.VET, Role.ADMIN)
```

**Ejemplo de uso:**
```typescript
router.get('/admin-only', authenticate, authorize(Role.ADMIN), handler);
```

---

## Tests

```bash
npm test
```

Actualmente **119 tests** en 9 archivos:

```
PASS src/__tests__/auth.test.ts          — 23 tests (service + JWT + HTTP controllers + refresh + logout revoca sesiones)
PASS src/__tests__/consultations.test.ts — 30 tests (CRUD consultas + chat + cola de espera + mensajes solo ACTIVE + permisos)
PASS src/__tests__/pets.test.ts          — 21 tests (CRUD mascotas + soft delete + ownership + birthDate validada + restore)
PASS src/__tests__/users.test.ts         —  9 tests (me, admin-only, vets, auto-asignación al ponerse online)
PASS src/__tests__/media.test.ts         —  4 tests (upload imagen, 400 sin archivo/tipo inválido, 401)
PASS src/__tests__/notifications.test.ts — 10 tests (token push, bandeja, notificaciones al asignar/mensaje/leída)
PASS src/__tests__/utils.test.ts         — 15 tests (parsePagination, excludePassword, asyncHandler, AppError)
PASS src/__tests__/cache.test.ts         —  4 tests (set/get, clear, pattern clear)
PASS src/__tests__/app.test.ts           —  3 tests (health, 404, login validation)
```

---

## Deploy

### Railway (producción) — vía CI/CD

El deploy a Railway es automático mediante GitHub Actions al hacer push a `main`:

```
push a main → tests (119 tests, unit + integration) + tsc → build → deploy a Railway → smoke test /health
```

### Docker (cualquier proveedor)

```bash
docker build -t conectavet-api .
docker run -p 3000:3000 --env-file .env conectavet-api
```

Ver [`docs/DEPLOY.md`](../docs/DEPLOY.md) para instrucciones detalladas.

---

## Variables de entorno

| Variable | Descripción | Obligatorio |
|----------|-------------|-------------|
| `DATABASE_URL` | Pooler de Supabase (port 6543, con `?pgbouncer=true`) | Sí |
| `DIRECT_URL` | Conexión directa Supabase (port 5432) para migrations | Sí |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT | Sí |
| `REFRESH_TOKENS` | Habilita endpoint refresh (default: `true`) | No |
| `PORT` | Puerto del servidor (default: 3000) | No |
| `NODE_ENV` | `development`, `production` | No |
| `CORS_ORIGIN` | Origen permitido para CORS (default: `http://localhost:5173`) | No |
| `LOG_LEVEL` | `debug`, `info`, `warn`, `error` (default: `debug` en dev, `info` en prod) | No |

Template completo en [`.env.example`](.env.example).

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor con hot-reload (tsx watch) |
| `npm run build` | Compilar TypeScript a JavaScript |
| `npm start` | Migrar BD + correr versión compilada (dist/) |
| `npm run migrate` | Ejecutar migraciones pendientes |
| `npm test` | Ejecutar tests con Jest |
| `npx prisma db push` | Sincronizar schema con BD (desarrollo) |
| `npx prisma migrate dev` | Crear migration versionada |
| `npx prisma studio` | UI web para ver datos |
| `npx prisma generate` | Regenerar cliente Prisma |
| `npx tsc --noEmit` | Type check sin compilar |

---

## Monitoreo y observabilidad

### Health check

```
GET /api/health
```

Endpoint público que verifica conectividad con Supabase. Retorna `200` si todo está bien.

### Logging

- Logger estructurado en JSON (`src/shared/logger.ts`) con timestamp, nivel y metadata
- `logger.info`, `logger.warn`, `logger.error` según severidad
- Nivel configurable via `LOG_LEVEL` env var
- Los errores esperados retornan respuestas JSON con `success: false`

### Métricas (futuro)

- [ ] Sentry para error tracking
- [ ] Métricas de endpoint (latencia, tasa de error)
- [ ] Health check avanzado (BD + chat + servicios externos)

---

## Contribuir

### Branches

```
main          → producción
develop       → integración
feature/*     → features nuevas
fix/*         → bugs
```

### Workflow

1. Crear branch desde `develop`: `git checkout -b feature/mi-feature`
2. Codear, testear, type-check: `npm test && npx tsc --noEmit`
3. Push y PR a `develop`
4. Code review → merge → deploy a staging
5. QA → merge a `main` → deploy a producción

### Estándares

- **ESM**: usar `import/export`, no `require`
- **Nombres**: `camelCase` para variables/funciones, `PascalCase` para clases/types, `kebab-case` para archivos
- **Errores**: siempre responder con `{ success: false, message }`
- **Tests**: todo endpoint nuevo debe tener tests

---

#### `GET /api/consultations/vets`

Lista los veterinarios disponibles en línea.

**Response** `200`
```json
{
  "success": true,
  "data": [
    {
      "id": "cmqzhmc290001w3zkcck1ys3s",
      "email": "vet@ejemplo.com",
      "isOnline": true
    }
  ]
}
```

---

## API — Consultations + Chat

### `POST /api/consultations`
Crea una consulta (CLIENT). Body: `{ petId }`.

### `GET /api/consultations/mine`
Lista consultas del usuario autenticado.

### `GET /api/consultations/vets`
Lista veterinarios online disponibles.

### `PATCH /api/consultations/:id/assign`
VET toma una consulta (cambia a ACTIVE).

### `PATCH /api/consultations/:id/complete`
VET cierra consulta. Body opcional: `{ notes }`.

### `GET /api/consultations/:id/messages`
Historial de mensajes de una consulta.

### `POST /api/consultations/:id/messages`
Envía un mensaje (participante de la consulta). Body: `{ content?, attachmentUrl? }` — al menos uno; `attachmentUrl` debe empezar con `/uploads/`.

### `POST /api/consultations/:id/prescriptions` · `GET /api/consultations/:id/prescriptions`
VET crea receta / participante la lista.

### WebSocket (Socket.io)
Conectar con `{ auth: { token } }`. Eventos:
- `join:consultation` → `consultationId`
- `message:send` → `{ consultationId, content?, attachmentUrl? }`
- `message:new` → mensaje broadcast a la sala
- `consultation:updated` → estado de la consulta
- `prescription:new` → receta creada

---

## API — Media + Notificaciones (S12)

### `POST /api/media`
Sube una imagen (auth). Multipart `file` (jpeg/png/webp/gif, máx 5 MB).

**Response** `201`
```json
{ "status": "success", "data": { "id": "...", "url": "/uploads/1715....jpg", "mimeType": "image/jpeg", "size": 48213 } }
```

### `GET /uploads/:file`
Sirve los archivos estáticos subidos.

### `POST /api/notifications/token`
Registra un ExpoPushToken. Body: `{ token, platform: "android" | "ios" | "web" }` (upsert por token).

### `DELETE /api/notifications/token`
Desregistra el token. Body: `{ token }`.

### `GET /api/notifications`
Lista la bandeja in-app. **Response** `200` → `{ items: Notification[], unreadCount: number }`.

### `PATCH /api/notifications/:id/read`
Marca una notificación como leída. **404** si no existe o no es del usuario.

> El envío real a Expo (`sendExpoPush`) es best-effort; se desactiva con `EXPO_PUSH_DISABLED=true` (tests).

---

## Roadmap

- [x] Auth (register, login, JWT, roles, refresh token)
- [x] CRUD mascotas (soft delete + restore)
- [x] Consultations + Chat de texto (Socket.io)
- [x] Cola de espera y asignación automática (S11)
- [x] Imágenes en el chat (S12)
- [x] Notificaciones push (S12)
- [ ] Videollamadas con LiveKit (post-MVP)
- [ ] Historial clínico y resumen automático
- [ ] Asistente IA con Claude
- [ ] Sistema de honorarios
- [ ] Deploy producción
