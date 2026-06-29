# VetConnect API

> **Backend de telemedicina veterinaria** — API REST monolítica modular con autenticación JWT, roles (CLIENT/VET/ADMIN), CRUD de mascotas, videollamadas LiveKit, cola de espera y asistencia IA.
>
> Node.js · TypeScript · Express 5 · Prisma 6 · PostgreSQL (Supabase) · JWT · LiveKit

---

## Tabla de contenidos

- [Stack](#stack)
- [Setup rápido](#setup-rápido)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Base de datos (Supabase)](#base-de-datos-supabase)
- [API Reference](#api-reference)
  - [Health](#health)
  - [Auth](#auth)
  - [Users](#users)
  - [Pets](#pets)
- [Autenticación](#autenticación)
- [Roles y permisos](#roles-y-permisos)
- [Tests](#tests)
- [Deploy](#deploy)
- [Variables de entorno](#variables-de-entorno)

---

## Stack

| Componente | Tecnología | Propósito |
|-----------|-----------|-----------|
| Runtime | Node.js ≥ 18 | Entorno de ejecución |
| Lenguaje | TypeScript 5.x | Tipado estático |
| Framework | Express 5.x | Servidor HTTP |
| ORM | Prisma 6.x | Abstracción de base de datos |
| DB | PostgreSQL 15 (Supabase) | Almacenamiento |
| Auth | JWT + bcrypt | Autenticación y hash de contraseñas |
| Testing | Jest + ts-jest | Tests unitarios |
| Dev server | tsx watch | Hot reload en desarrollo |
| Compilador | tsc | Build de producción |

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
│   │   ├── auth/               # Registro, login, JWT
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.service.ts
│   │   ├── users/              # Gestión de usuarios
│   │   │   ├── users.routes.ts
│   │   │   ├── users.controller.ts
│   │   │   └── users.service.ts
│   │   ├── pets/               # CRUD de mascotas
│   │   │   ├── pets.routes.ts
│   │   │   ├── pets.controller.ts
│   │   │   └── pets.service.ts
│   │   ├── consultations/      # Videollamadas (próximamente)
│   │   ├── queue/              # Cola de espera (próximamente)
│   │   ├── medical-records/    # Historial clínico (próximamente)
│   │   └── ai-assistant/       # IA Claude (próximamente)
│   ├── shared/
│   │   ├── middlewares/
│   │   │   └── auth.middleware.ts   # authenticate + authorize
│   │   ├── types/
│   │   │   └── index.ts             # JwtPayload, ApiResponse
│   │   └── utils/                   # Utilidades (próximamente)
│   ├── __tests__/
│   │   └── auth.test.ts        # Tests de autenticación
│   └── server.ts               # Entry point
├── dist/                       # Compilado (npm run build)
├── .env                        # Variables de entorno (no versionado)
├── .env.example                # Template de variables de entorno
├── jest.config.js              # Configuración de Jest
├── tsconfig.json               # Configuración de TypeScript
├── prisma.config.ts            # Configuración de Prisma CLI
└── package.json
```

---

## Base de datos (Supabase)

La base de datos corre en **Supabase** (PostgreSQL cloud). No se necesita instalar PostgreSQL localmente.

### Modelos actuales

```prisma
enum Role { CLIENT, VET, ADMIN }
enum ConsultationStatus { WAITING, ACTIVE, COMPLETED }

model User {
  id                    String         @id @default(cuid())
  email                 String         @unique
  password              String
  role                  Role
  isOnline              Boolean        @default(false)
  pets                  Pet[]
  consultationsAsClient Consultation[] @relation("ClientConsultations")
  consultationsAsVet    Consultation[] @relation("VetConsultations")
  @@map("users")
}

model Pet {
  id            String         @id @default(cuid())
  name          String
  species       String
  breed         String?
  age           Int?
  weight        Float?
  ownerId       String
  owner         User           @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  consultations Consultation[]
  @@map("pets")
}

model Consultation {
  id            String             @id @default(cuid())
  clientId      String
  client        User               @relation("ClientConsultations", fields: [clientId], references: [id])
  vetId         String
  vet           User               @relation("VetConsultations", fields: [vetId], references: [id])
  petId         String
  pet           Pet                @relation(fields: [petId], references: [id])
  status        ConsultationStatus @default(WAITING)
  notes         String?
  liveKitRoom   String?
  startedAt     DateTime?
  endedAt       DateTime?
  medicalRecord MedicalRecord?
  @@map("consultations")
}

model MedicalRecord {
  id             String       @id @default(cuid())
  petId          String
  consultationId String       @unique
  consultation   Consultation @relation(fields: [consultationId], references: [id])
  diagnosis      String?
  treatment      String?
  notes          String?
  @@map("medical_records")
}
```

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
  "password": "123456",
  "role": "CLIENT"
}
```

| Campo | Tipo | Requerido | Valores |
|-------|------|-----------|---------|
| `email` | string | Sí | Email válido |
| `password` | string | Sí | Mínimo 6 caracteres |
| `role` | string | Sí | `CLIENT`, `VET` o `ADMIN` |

**Response** `201`
```json
{
  "success": true,
  "data": {
    "id": "cmqzhma650000w3zk1jkoomim",
    "email": "usuario@ejemplo.com",
    "role": "CLIENT",
    "isOnline": false,
    "createdAt": "2026-06-29T17:24:20.093Z",
    "updatedAt": "2026-06-29T17:24:20.093Z"
  }
}
```

**Errors**

| Código | Motivo |
|--------|--------|
| `400` | Email, password o rol faltante / password < 6 caracteres / rol inválido |
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
    "token": "eyJhbGciOiJIUzI1NiIs...",
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
  "iat": 1782753867,
  "exp": 1783358667
}
```

### Refresh

El token dura **7 días**. No hay refresh token implementado. Al expirar, el cliente debe loguearse nuevamente.

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

Actualmente **9 tests** unitarios de autenticación:

```
PASS src/__tests__/auth.test.ts
  Auth Service
    Register
      ✓ debe crear un usuario CLIENT
      ✓ debe rechazar email duplicado
      ✓ debe crear usuarios VET y ADMIN
    JWT
      ✓ debe generar token con userId, email y role
      ✓ debe rechazar token inválido
      ✓ debe rechazar token con firma incorrecta
    Roles
      ✓ ADMIN debe tener rol ADMIN
      ✓ CLIENT no tiene permisos de ADMIN
      ✓ VET no tiene permisos de ADMIN
```

---

## Deploy

### Railway (producción)

```bash
# 1. Compilar
npm run build

# 2. El resultado queda en dist/
# 3. Conectar repo a Railway:
#    - Root directory: backend
#    - Start command: node dist/server.js
#    - Variables de entorno:
#      - DATABASE_URL
#      - DIRECT_URL
#      - JWT_SECRET
#      - PORT (Railway lo asigna automáticamente)
#      - NODE_ENV=production
```

Railway ejecuta automáticamente:
1. `npm ci`
2. `npx prisma generate`
3. `npx tsc`
4. `node dist/server.js`

---

## Variables de entorno

| Variable | Descripción | Obligatorio |
|----------|-------------|-------------|
| `DATABASE_URL` | Pooler de Supabase (port 6543) para queries | Sí |
| `DIRECT_URL` | Conexión directa Supabase (port 5432) para migrations | Sí |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT | Sí |
| `PORT` | Puerto del servidor (default: 3000) | No |
| `NODE_ENV` | `development`, `production` | No |

Template completo en [`.env.example`](.env.example).

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor con hot-reload (tsx watch) |
| `npm run build` | Compilar TypeScript a JavaScript |
| `npm start` | Correr versión compilada (dist/) |
| `npm test` | Ejecutar tests con Jest |
| `npx prisma db push` | Sincronizar schema con BD |
| `npx prisma studio` | UI web para ver datos |
| `npx prisma generate` | Regenerar cliente Prisma |
| `npx tsc --noEmit` | Type check sin compilar |

---

## Roadmap

- [x] Auth (register, login, JWT, roles)
- [x] CRUD mascotas
- [ ] Cola de espera y asignación automática
- [ ] Videollamadas con LiveKit
- [ ] Historial clínico y resumen automático
- [ ] Asistente IA con Claude
- [ ] Sistema de honorarios
- [ ] Notificaciones push
- [ ] Deploy producción
