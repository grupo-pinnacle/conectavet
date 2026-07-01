# VetConnect — Referencia Técnica Completa

> Documento definitivo del proyecto. Explica cada archivo, cada carpeta, y cómo funciona todo.
> **Última actualización:** 30 de junio, 2026

---

## Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Backend (`backend/`)](#2-backend)
3. [Frontend Web (`web/`)](#3-frontend-web)
4. [Mobile (`mobile/`)](#4-mobile)
5. [Documentación (`docs/`)](#5-documentación)
6. [Root (`README.md`, `package.json`)](#6-root)
7. [Mapa de dependencias entre archivos](#7-mapa-de-dependencias)
8. [Flujo de datos: registro → consulta](#8-flujo-de-datos)
9. [Cómo agregar un endpoint nuevo](#9-cómo-agregar-un-endpoint-nuevo)
10. [Preguntas frecuentes técnicas](#10-preguntas-frecuentes-técnicas)

---

## 1. Arquitectura general

```
┌─────────────────────────────────────────────────────────┐
│                    Cliente Mobile                        │
│              (React Native / Expo)                       │
│              mobile/ — PROYECTO PENDIENTE                │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP REST (JSON)
                     │ WebSocket (LiveKit — futuro)
┌────────────────────▼────────────────────────────────────┐
│                   Backend API                            │
│        Express 5 · TypeScript · Prisma 6 · JWT           │
│        backend/src/server.ts (entry point)               │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │   Auth   │ │  Users   │ │   Pets   │ │  Future   │   │
│  │ Module   │ │ Module   │ │ Module   │ │ Modules   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Shared Middlewares                    │   │
│  │  authenticate · authorize · error handler         │   │
│  │  rate-limit · helmet · CORS · graceful shutdown   │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │ Prisma ORM
                     │ PostgreSQL via Supabase (cloud)
┌────────────────────▼────────────────────────────────────┐
│              PostgreSQL (Supabase)                       │
│  Tablas: users · pets · consultations · messages         │
│  Hosteado en cloud. Pooler (6543) + Direct (5432)       │
└─────────────────────────────────────────────────────────┘

Frontend Web (React + Vite + Tailwind)
web/ → se conecta al backend via HTTP (Axios)
       proxy en dev: Vite → localhost:3000
       en prod: apunta a Railway URL
```

### Stack completo

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | Node.js | ≥ 18 |
| Lenguaje | TypeScript | 5.x |
| Backend framework | Express | 5.x |
| ORM | Prisma | 6.x |
| Base de datos | PostgreSQL via Supabase | 15 |
| Autenticación | JWT + bcrypt | — |
| Validación | Zod | 4.x |
| Testing | Jest + ts-jest + supertest | — |
| Logging | JSON estructurado (logger propio) | — |
| Frontend web | React + Vite + TailwindCSS | React 19, Vite 8 |
| Mobile | React Native + Expo | — (no iniciado) |
| Videollamada | LiveKit | — (futuro) |
| IA | Claude API (Anthropic) | — (futuro) |
| Deploy backend | Railway + Docker + GitHub Actions CI/CD | — |
| Deploy web | Vercel | — |

---

## 2. Backend (`backend/`)

### Estructura completa

```
backend/
├── prisma/
│   ├── schema.prisma          # Modelos de datos (única fuente de verdad)
│   ├── migration_lock.toml    # Control de versión de Prisma
│   └── migrations/
│       └── 20260622165754_init/
│           └── migration.sql  # SQL generado por Prisma
│
├── src/
│   ├── server.ts              # Entry point. Crea la app Express.
│   │                            Configura: helmet, CORS, rate-limit,
│   │                            JSON parser, logging, health check,
│   │                            rutas, error handler, graceful shutdown.
│   │
│   ├── modules/               # Cada feature en su carpeta
│   │   ├── auth/              # Registro, login, JWT
│   │   │   ├── index.ts       # Barrel export
│   │   │   ├── auth.routes.ts # Definición de rutas HTTP
│   │   │   ├── auth.controller.ts  # Handlers de request/response
│   │   │   └── auth.service.ts     # Lógica de negocio
│   │   │
│   │   ├── users/             # Perfil de usuario
│   │   │   ├── index.ts       # Barrel export
│   │   │   ├── users.routes.ts
│   │   │   ├── users.controller.ts
│   │   │   └── users.service.ts
│   │   │
│   │   ├── pets/              # CRUD de mascotas
│   │   │   ├── index.ts       # Barrel export
│   │   │   ├── pets.routes.ts
│   │   │   ├── pets.controller.ts
│   │   │   └── pets.service.ts
│   │   │
│   │   ├── consultations/     # Consultas + Chat (Socket.io) ✅
│   │
│   ├── shared/
│   │   ├── index.ts           # Barrel export de shared
│   │   ├── prisma.ts          # Singleton de PrismaClient
│   │   ├── middlewares/
│   │   │   └── auth.middleware.ts  # authenticate() + authorize(roles)
│   │   ├── types/
│   │   │   └── index.ts       # JwtPayload, ApiResponse, etc.
│   │   └── utils/
│   │       └── index.ts       # Helpers: catchAsync, AppError, etc.
│   │
│   └── __tests__/
│       └── auth.test.ts       # 11 tests de auth con Jest
│
├── .env                       # Variables de entorno (no versionado)
├── .env.example               # Template de variables
├── .gitignore
├── package.json               # Dependencias y scripts
├── tsconfig.json              # Config TypeScript
├── jest.config.js             # Config Jest
├── prisma.config.ts           # Config Prisma CLI (auto-generado)
├── DECISIONS.md               # Decisiones de backend
└── readme.md                  # Documentación técnica + API Reference
```

### Archivo por archivo

#### `prisma/schema.prisma`
Define los 4 modelos actuales:

| Modelo | Propósito | Campos clave |
|--------|-----------|-------------|
| `User` | Usuarios (CLIENT, VET, ADMIN) | email, password (hash), role, isOnline |
| `Pet` | Mascotas de los clientes | name, species, breed, age, weight, ownerId, deletedAt (soft delete, piloto en Pet) |
| `Consultation` | Consultas veterinarias | clientId, vetId, petId, status (WAITING/ACTIVE/COMPLETED), notas |
| `Message` | Mensajes del chat | consultationId, senderId, content |

Índices: `ownerId`, `species`, `clientId`, `vetId`, `status`, `petId`.

#### `src/server.ts`
Entry point del servidor. Inicializa, en este orden:
1. Carga `dotenv` (variables de entorno)
2. Valida que `JWT_SECRET` exista (crash si falta)
3. Configura **helmet** (headers de seguridad)
4. Configura **CORS** (por defecto `localhost:5173`)
5. Configura **rate-limit global** (100 req/15min) + **específico de login** (10 req/15min)
6. Configura **JSON parser** con límite de 10kb
7. Agrega **request logging** (método + path + timestamp)
8. Define `GET /health` — verifica conexión a BD con `SELECT 1`
9. Monta rutas: `/api/auth`, `/api/users`, `/api/pets`
10. **Error handler** 404 para rutas no encontradas
11. **Error handler global** (oculta detalles en producción)
12. **Graceful shutdown** — captura SIGTERM/SIGINT, desconecta Prisma

#### `src/modules/auth/`
3 endpoints:

| Método | Ruta | Auth | Body | Respuesta |
|--------|------|------|------|-----------|
| POST | `/api/auth/register` | No | `{ email, password, role }` | 201 + usuario (sin password) |
| POST | `/api/auth/login` | No | `{ email, password }` | 200 + `{ token, refreshToken, user }` |
| POST | `/api/auth/refresh` | No | `{ refreshToken }` | 200 + `{ token, refreshToken, user }` |
| POST | `/api/auth/logout` | Sí | — | 200 + limpia isOnline + caché |

- `auth.routes.ts` — Define las rutas (register, login, refresh, logout) y las conecta a los controllers
- `auth.controller.ts` — Valida con Zod, llama al service, maneja respuestas y errores
- `auth.service.ts` — Lógica: hash de password (bcrypt), crear usuario en BD, generar JWT + refresh token, logout (isOnline=false + cache clear), errores custom (`AuthError`)
- `index.ts` — Re-exporta todo para imports limpios

#### `src/modules/users/`
3 endpoints:

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| GET | `/api/users/me` | Sí | Cualquiera | Perfil del usuario autenticado |
| GET | `/api/users/vets` | Sí | Cualquiera | Lista de veterinarios |
| GET | `/api/users/admin-only` | Sí | ADMIN | Ruta de prueba de roles |

#### `src/modules/pets/`
5 endpoints:

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/pets` | Sí | Lista mascotas del usuario autenticado |
| POST | `/api/pets` | Sí | Crea mascota (ownerId = usuario autenticado) |
| GET | `/api/pets/:id` | Sí | Detalle de mascota (con ownership check) |
| PUT | `/api/pets/:id` | Sí | Editar mascota (con ownership check) |
| DELETE | `/api/pets/:id` | Sí | Soft delete (setea deletedAt, no borra físicamente) |

**Ownership check:** Cada petición sobre `:id` verifica que `pet.ownerId === req.user.userId`. Si no coincide, responde `403`.

#### `src/shared/prisma.ts`
```typescript
import { PrismaClient } from '@prisma/client';
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```
Patrón singleton estándar de Prisma. Usa `globalThis` para evitar múltiples instancias en hot-reload (tsx watch).

#### `src/shared/middlewares/auth.middleware.ts`
Dos middlewares:
- **`authenticate`** — Extrae token del header `Authorization: Bearer <token>`, verifica con `jwt.verify()`, adjunta `req.user = { userId, email, role }`
- **`authorize(...roles)`** — Factory que devuelve middleware. Verifica que `req.user.role` esté incluido en los roles permitidos. Si no, `403`.

#### `src/__tests__/`
7 archivos con **89 tests totales**:

| Archivo | Tests | Cobertura |
|---------|-------|-----------|
| `auth.test.ts` | 21 | Service: register, login, JWT sign/verify. HTTP: register (201/409/400), login (200/401), refresh (200/401/400), logout (200) |
| `consultations.test.ts` | 15 | HTTP: create (201/400/401), assign VET (200/409/403), complete (200/403), mine con paginación, messages (200/403), detalle (200/403) |
| `pets.test.ts` | 18 | HTTP: create (201/400/401), list (200/401), getById (200/404/403), update (200/403/400), delete+restore (200/404) |
| `users.test.ts` | 7 | HTTP: GET /me (200/401), admin-only (200/403/403), vets pagination (200) |
| `utils.test.ts` | 12 | Unit: parsePagination edge cases, excludePassword, asyncHandler, AppError classes |
| `cache.test.ts` | 4 | Unit: set/get, missing key, clear all, clear by pattern |
| `app.test.ts` | 3 | HTTP: /health (200), 404, login validation (400) |

#### `src/__tests__/consultations.test.ts`
15 tests de integración HTTP con supertest. Cubren el flujo completo de consultas. Ver tabla en sección `src/__tests__/` arriba.

**⚠️ Los tests escriben a la BD real de Supabase pero en schema test_ aislado.** El globalSetup crea un schema único por ejecución (`test_{timestamp}`) y el globalTeardown lo elimina.

#### `DECISIONS.md`
Decisiones de backend. **Nota: el archivo `backend/DECISIONS.md` fue eliminado por duplicación.** Ver `docs/DECISIONS.md` para los ADR oficiales (ADR-001 al ADR-009).

#### `readme.md`
Documentación técnica extensa: setup, API reference, scripts, tests, deploy, monitoreo, convenciones, roadmap.

---

## 3. Frontend Web (`web/`)

### Estructura

```
web/
├── public/
│   └── favicon.svg            # Ícono del sitio (referenciado en index.html)
│
├── src/
│   ├── main.tsx               # Entry point de React
│   ├── index.css              # Estilos globales mínimos
│   ├── App.tsx                # Router principal (AuthProvider + BrowserRouter)
│   │
│   ├── components/
│   │   ├── Button.tsx         # Botón reutilizable (variant, disabled, loading)
│   │   ├── Input.tsx          # Input reutilizable (label, error, type)
│   │   └── ProtectedRoute.tsx # Envuelve rutas, redirige a /login si no hay sesión
│   │
│   ├── context/
│   │   └── AuthContext.tsx    # Estado global de auth: login, register, logout, user, token
│   │
│   ├── hooks/
│   │   └── useAuth.ts        # Hook para consumir AuthContext (con error si se usa fuera del provider)
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx      # Formulario login → llama a AuthContext.login()
│   │   ├── RegisterPage.tsx   # Formulario registro con selector de rol (CLIENT/VET)
│   │   └── DashboardPage.tsx  # Home según rol: CLIENT → "Bienvenido", VET → "Panel"
│   │
│   ├── services/
│   │   └── api.ts             # Cliente Axios con baseURL, interceptor de token
│   │
│   ├── types/
│   │   └── index.ts           # User, AuthResponse, Pet, ApiError
│   │
│   └── constants/
│       ├── api.ts             # URLs de API y configuración
│       └── colors.ts          # Paleta de colores Tailwind
│
├── .env.example               # Template de variables de entorno
├── index.html                 # HTML entry point
├── vite.config.ts             # Vite config (proxy a backend, plugins)
├── tailwind.config.js         # Config TailwindCSS
├── postcss.config.js          # Config PostCSS
├── eslint.config.js           # ESLint flat config
├── tsconfig.json              # TypeScript config (refers to app + node)
├── tsconfig.app.json          # TS config para la app
├── tsconfig.node.json         # TS config para node (vite, eslint)
└── package.json               # Dependencias y scripts
```

### Archivo por archivo

#### `src/App.tsx`
Configura el router con 3 rutas:
- `/login` → LoginPage
- `/register` → RegisterPage
- `/dashboard` → ProtectedRoute → DashboardPage
- `/` → redirige a `/login`

Todo envuelto en `AuthProvider` para que el estado de sesión esté disponible globalmente.

#### `src/context/AuthContext.tsx`
Provider que maneja:
- `login(email, password)` → POST `/api/auth/login` → guarda token en localStorage → setea user
- `register(email, password, role)` → POST `/api/auth/register` → auto-login
- `logout()` → limpia localStorage → redirige a /login
- Al montar: lee token de localStorage → GET `/api/users/me` para restaurar sesión

#### `src/services/api.ts`
Cliente Axios con:
- `baseURL`: en desarrollo usa proxy de Vite (`/api`), en producción usa la URL de Railway
- Interceptor de request: agrega `Authorization: Bearer <token>` si existe
- Interceptor de response: rechaza la promise si `response.data.success === false`

#### `src/components/ProtectedRoute.tsx`
Si hay token en localStorage, renderiza los children. Si no, redirige a `/login`.

#### `vite.config.ts`
Configura proxy: rutas `/api` → `http://localhost:3000` (evita CORS en desarrollo).

---

## 4. Mobile (`mobile/`)

### Estado actual
**VACÍO.** Solo existía un `.gitkeep` (eliminado). No hay proyecto Expo, no hay `package.json`.

### Código de referencia
En `docs/helpers/mobile/` hay archivos de ejemplo que Juan debe copiar cuando cree el proyecto:
- `App.tsx` — Router con navegación
- `context/AuthContext.tsx` — Login, register, AsyncStorage
- `screens/LoginScreen.tsx` — Formulario login
- `screens/RegisterScreen.tsx` — Formulario registro con selector de rol
- `screens/HomeScreen.tsx` — Pantalla post-login con info del usuario

### Pasos para iniciar
```bash
cd mobile
npx create-expo-app . --template blank-typescript
npm install axios @react-navigation/native @react-navigation/native-stack @react-native-async-storage/async-storage
# Copiar archivos de docs/helpers/mobile/ a src/
```

---

## 5. Documentación (`docs/`)

### Archivos actuales

| Archivo | Propósito | ¿Necesario siempre? |
|---------|-----------|---------------------|
| `SPRINT_PLAN.md` | **Plan maestro** con timeline, sprints, tareas por persona. El documento que se actualiza cada sprint. | ✅ Sí |
| `DECISIONS.md` | **8 ADR** (Architecture Decision Records). Por qué elegimos cada tecnología. | ✅ Sí |
| `DEPLOY.md` | **Instrucciones de deploy** a Railway. | ✅ Sí |
| `FAANG_AUDIT.md` | **Auditoría técnica** con scores y pendientes. Útil para saber qué mejorar. | ✅ Sí |
| `SPRINT5_CHECKLIST.md` | **Checklist día a día del sprint actual.** Se descarta al terminar el sprint. | ⚠️ Temporal (hasta 1 Jul) |
| `STANDUP_GUIDE.md` | **Reglas de daily standup.** Proceso del equipo. | ✅ Sí |
| `HOTFIX_PROTOCOL.md` | **Protocolo de bugs post-MVP** durante vacaciones. | ✅ Sí (hasta vacaciones) |
| `helpers/mobile/` | **Código de referencia** para la app mobile (5 archivos). | ⚠️ Temporal (hasta que Juan cree el proyecto) |

### Archivos eliminados (esta limpieza)

| Archivo | Razón |
|---------|-------|
| `SPRINT3_GUIDE.md` | Sprint 3 terminado. Su contenido útil (endpoints, instrucciones) está en `backend/readme.md` |
| `TOBIAS_STATUS.md` | Era el seguimiento personal de Tobias. Tenía numeración de sprints distinta a la oficial. Ahora hay tabla de corrección en `SPRINT_PLAN.md` |
| `helpers/web/` | Código duplicado del que ya está en `web/src/`. Los helpers eran versiones anteriores de Tobias; el código real está en `web/src/` |

---

## 6. Root (`README.md`, `package.json`)

### `README.md`
Documento de entrada al repo. Incluye:
- Stack tecnológico
- Diagrama ASCII de arquitectura
- Setup local (backend + web + mobile)
- Sprint plan resumido
- Equipo y roles

### `package.json` (raíz)
```json
{ "dependencies": { "@supabase/supabase-js": "^2.108.2" } }
```
Contiene solo Supabase JS SDK (para scripts de administración si hicieran falta). No es un workspace de npm — cada subproyecto (`backend/`, `web/`) tiene su propio `package.json`.

---

## 7. Mapa de dependencias entre archivos

### Backend
```
server.ts
  ├── auth.routes.ts → auth.controller.ts → auth.service.ts → shared/prisma.ts
  ├── users.routes.ts → users.controller.ts → users.service.ts → shared/prisma.ts
  ├── pets.routes.ts → pets.controller.ts → pets.service.ts → shared/prisma.ts
  └── shared/prisma.ts → @prisma/client → schema.prisma → Supabase DB

auth.middleware.ts
  ├── jwt.verify() + req.user
  └── usado por todos los routers que requieren autenticación
```

### Frontend Web
```
main.tsx → App.tsx
  ├── AuthContext.tsx → api.ts → backend (HTTP)
  ├── ProtectedRoute.tsx
  ├── LoginPage.tsx → useAuth() → AuthContext
  ├── RegisterPage.tsx → useAuth() → AuthContext
  └── DashboardPage.tsx → useAuth() → AuthContext
```

---

## 8. Flujo de datos: registro → consulta

```
CLIENTE                     BACKEND                        BASE DE DATOS
   │                           │                               │
   ├─ POST /api/auth/register ─┤                               │
   │   { email, pass, role }   │                               │
   │                           ├─ hash(password)               │
   │                           ├─ INSERT user ────────────────►│
   │                           │                               │
   │◄─ 201 { id, email, role } │                               │
   │                           │                               │
   ├─ POST /api/auth/login ────┤                               │
   │   { email, password }     │                               │
   │                           ├─ SELECT user WHERE email ────►│
   │                           ├─ bcrypt.compare(password)     │
   │                           ├─ jwt.sign({userId, role})     │
   │◄─ 200 { token, user }     │                               │
   │                           │                               │
   ├─ POST /api/pets ──────────┤  (con Authorization: Bearer)  │
   │   { name, species, ... }  │                               │
   │                           ├─ authenticate → extrae token  │
   │                           ├─ INSERT pet (ownerId=userId)  │
   │                           │          ────────────────────►│
   │◄─ 201 { pet data }        │                               │
```

---

## 9. Cómo agregar un endpoint nuevo

### Backend
```typescript
// 1. Crear el service (lógica de negocio)
// src/modules/x/x.service.ts
export async function listX() {
  return prisma.x.findMany();
}

// 2. Crear el controller (request/response)
// src/modules/x/x.controller.ts
export async function listXController(req: Request, res: Response) {
  const data = await listX();
  res.json({ success: true, data });
}

// 3. Crear las rutas
// src/modules/x/x.routes.ts
router.get('/', authenticate, listXController);

// 4. Barrel export
// src/modules/x/index.ts
export { router as xRoutes };

// 5. Montar en server.ts
app.use('/api/x', xRoutes);
```

### Frontend Web
```typescript
// 1. Llamada a la API en services/api.ts
export async function getX() {
  const res = await api.get('/api/x');
  return res.data.data;
}

// 2. Componente/página que consume
import { getX } from '../services/api';
const data = await getX();
```

---

## 10. Preguntas frecuentes técnicas

**¿Por qué npm workspaces?**
Decisión ADR-008 en `docs/DECISIONS.md`. Se implementaron workspaces con `@conectavet/shared` en `packages/shared/` para tipos compartidos (User, Pet, JwtPayload, ApiResponse). Esto elimina duplicación de tipos entre backend y web. Requiere `npm install` desde la raíz del monorepo, no desde subdirectorios.

**¿Por qué JWT con refresh token?**
Decisión ADR-004. Access token dura 7 días, refresh token 30 días. Se implementó `POST /api/auth/refresh` para renovar sin login. La rotación de tokens es completa (nuevo par en cada refresh). Post-MVP se agregará blacklist con tabla en BD.

**¿Por qué tests contra Supabase y no contra BD local?**
Es una deuda técnica identificada en la FAANG audit (score 6/10 en Testing). La solución (Docker Compose + BD de testing aislada) está priorizada para S6.

**¿Por qué Express 5 y Prisma 6 si son versiones nuevas?**
Tobias eligió las versiones más recientes por mejor DX y tipado. Hay un riesgo bajo de bugs no descubiertos. Se pincharon versiones en `package.json` para evitar roturas por updates automáticos.

**¿El rate limit de 10 req/15min para login es suficiente?**
Sí, para un MVP. En producción se ajustaría. Previene brute force básico.

**¿Cómo se manejan los errores?**
Los errores esperados devuelven `{ success: false, message }` con código HTTP apropiado. Los errores inesperados son capturados por el error handler global en `server.ts`, que en producción oculta el stack trace.
