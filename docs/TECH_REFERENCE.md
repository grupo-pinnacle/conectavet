# VetConnect — Referencia Técnica Completa

> Documento definitivo del proyecto. Explica cada archivo, cada carpeta, y cómo funciona todo.
> **Última actualización:** 12 de julio, 2026

---

## Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Backend (`backend/`)](#2-backend)
3. [Frontend Web (`web/`)](#3-frontend-web)
4. [Mobile (`mobile/`)](#4-mobile)
5. [Documentación (`docs/`)](#5-documentación)
6. [Flujo de datos: registro → consulta](#6-flujo-de-datos)
7. [Cómo agregar un endpoint nuevo](#7-cómo-agregar-un-endpoint-nuevo)

---

## 1. Arquitectura general

```
┌─────────────────────────────────────────────────────────┐
│                    Cliente Mobile                        │
│              (React Native / Expo)                       │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP REST + WebSocket (Socket.io)
┌────────────────────▼────────────────────────────────────┐
│                   Backend API                            │
│        Express 5 · TypeScript · Prisma 6 · JWT           │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │   Auth   │ │  Users   │ │   Pets   │ │ Consult  │   │
│  │ Module   │ │ Module   │ │ Module   │ │ Module   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Shared Middlewares                    │   │
│  │  authenticate · authorize · error handler         │   │
│  │  rate-limit · helmet · CORS · graceful shutdown   │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │ Prisma ORM
┌────────────────────▼────────────────────────────────────┐
│              PostgreSQL (Supabase)                       │
│  Tablas: users · pets · consultations · messages         │
└─────────────────────────────────────────────────────────┘
         ▲
         │ HTTP REST
┌────────┴────────────┐
│   Frontend Web       │
│ (React + Vite + T.) │
└─────────────────────┘
```

### Stack completo

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | Node.js | ≥ 18 |
| Lenguaje | TypeScript | 5.x |
| Backend framework | Express | 5.x |
| ORM | Prisma | 6.x |
| Base de datos | PostgreSQL via Supabase | 15 |
| Autenticación | JWT + refresh tokens | — |
| Validación | Zod | 4.x |
| Testing | Jest + ts-jest + supertest | — |
| Chat | Socket.io | 4.x |
| Frontend web | React + Vite + TailwindCSS | React 19, Vite 8 |
| Mobile | React Native + Expo | SDK 51 |
| Deploy backend | Railway + Docker | — |
| Deploy web | Vercel | — |

---

## 2. Backend (`backend/`)

### Estructura

```
backend/
├── prisma/
│   ├── schema.prisma          # Modelos: User, Pet, Consultation, Message
│   └── migrations/
│       ├── 20260622165754_init/  # Migración inicial
│       └── 2_cleanup_mvp/       # Elimina isOnline, liveKitRoom, medical_records
├── src/
│   ├── server.ts              # Entry point
│   ├── modules/
│   │   ├── auth/              # Registro, login, JWT, refresh
│   │   ├── users/             # Perfil, listar vets
│   │   ├── pets/              # CRUD mascotas con soft delete
│   │   └── consultations/     # Consultas + Chat (Socket.io)
│   ├── shared/
│   │   ├── prisma.ts          # Singleton PrismaClient
│   │   ├── middlewares/
│   │   │   └── auth.middleware.ts  # authenticate() + authorize(roles)
│   │   └── types/index.ts     # JwtPayload, ApiResponse
│   └── __tests__/             # 89 tests (auth, pets, consultations, users)
├── .env.example
└── package.json
```

### Modelos (Prisma)

| Modelo | Campos clave |
|--------|-------------|
| `User` | id, email, password (hash), name, role (CLIENT/VET/ADMIN) |
| `Pet` | id, name, species, breed, age, weight, ownerId, photoUrl, deletedAt |
| `Consultation` | id, clientId, vetId, petId, status (WAITING/ACTIVE/COMPLETED), reason, notes, diagnosis, treatment |
| `Message` | id, consultationId, senderId, content, createdAt |

### Endpoints

| Recurso | Métodos | Auth |
|---------|---------|------|
| `/api/auth/register` | POST | No |
| `/api/auth/login` | POST | No |
| `/api/auth/refresh` | POST | No |
| `/api/auth/logout` | POST | Sí |
| `/api/users/me` | GET | Sí |
| `/api/users/vets` | GET | Sí |
| `/api/pets` | GET, POST | Sí |
| `/api/pets/:id` | GET, PUT, DELETE | Sí (ownership) |
| `/api/consultations` | GET, POST | Sí |
| `/api/consultations/:id/assign` | PATCH | VET/ADMIN |
| `/api/consultations/:id/complete` | PATCH | VET/ADMIN |

### Tests
89 tests en 7 archivos con Jest + supertest. Usan schema `test_` dinámico en Supabase.

---

## 3. Frontend Web (`web/`)

### Estructura

```
web/src/
├── components/
│   ├── ui/: Button, input, Card, Badge, Logo
│   ├── ProtectedRoute.tsx
│   └── dashboard/
│       ├── HomeSection.tsx, PetsSection.tsx, ConsultationsSection.tsx
│       ├── HistorySection.tsx, MessagesSection.tsx, ProfileSection.tsx
│       └── vet/
│           ├── VetHomeSection.tsx, PatientsSection.tsx
│           └── VetMessagesSection.tsx  (chat + cerrar consulta)
├── pages/
│   ├── LandingPage.tsx, LoginPage.tsx, RegisterPage.tsx
│   ├── DashboardPage.tsx      (cliente: 6 secciones)
│   └── VetDashboardPage.tsx   (vet: 3 secciones)
├── context/AuthContext.tsx
├── services/api.ts, endpoints.ts
├── types/index.ts
└── index.css
```

### Rutas

| Ruta | Página | Protegida |
|------|--------|-----------|
| `/` | LandingPage | No |
| `/login` | LoginPage | No |
| `/register` | RegisterPage | No |
| `/dashboard` | DashboardPage (cliente) | Sí (rol CLIENT) |
| `/vet-dashboard` | VetDashboardPage | Sí (rol VET/ADMIN) |

### Dashboard Vet (MVP)
Solo 3 secciones: Dashboard (home), Pacientes, Mensajes (con cerrar consulta).

### Dashboard Cliente (MVP)
6 secciones: Inicio, Mascotas, Consultas, Historial, Mensajes, Perfil.

---

## 4. Mobile (`mobile/`)

### Estructura

```
mobile/app/
├── _layout.tsx            # Root: providers + auth guard
├── (auth)/                # Login + Register
│   ├── login.tsx
│   └── register.tsx
└── (app)/                 # App con tabs
    ├── _layout.tsx        # Tabs: Inicio, Mascotas, Consultas, Chat, Perfil
    ├── index.tsx          # Home
    ├── pets/              # CRUD: list, detail, new
    ├── chat/              # Chat con veterinario
    ├── queue/             # Solicitar consulta
    └── history/           # Historial + valoración
```

### Estado
Funcional para MVP:
- Auth con secure storage (expo-secure-store)
- CRUD mascotas con foto (Cloudinary)
- Chat con veterinario (polling cada 3s)
- Solicitar consulta simple
- Historial con rating post-consulta

### Design System
Misma paleta teal que la web. Componentes UI compartidos en `src/components/ui/`.

---

## 5. Documentación (`docs/`)

| Archivo | Propósito |
|---------|-----------|
| `SPRINT_PLAN.md` | Plan maestro con timeline, sprints, tareas |
| `MVP_SCOPE.md` | Definición de alcance MVP |
| `TECH_REFERENCE.md` | **Este archivo** — referencia técnica completa |
| `DECISIONS.md` | 9 ADR (decisiones de arquitectura) |
| `FAANG_AUDIT.md` | Auditoría técnica (score actual: 7.9/10) |
| `RUN_GUIDE.md` | Guía para correr el proyecto local |
| `DEPLOY.md` | Instrucciones de deploy a Railway |
| `CHANNEL_DECISION.md` | Estrategia web + mobile por rol |
| `STANDUP_GUIDE.md` | Reglas de daily standup |
| `HOTFIX_PROTOCOL.md` | Protocolo de bugs post-MVP |

---

## 6. Flujo de datos: registro → consulta

```
CLIENTE (Mobile)           BACKEND                        MÉDICO (Web)
      │                        │                              │
      ├─ POST /auth/register ──┤                              │
      │   { email, pass }      │                              │
      │◄─ 201 { user, token }  │                              │
      │                        │                              │
      ├─ POST /pets ───────────┤                              │
      │   { name, species }    │                              │
      │◄─ 201 { pet }          │                              │
      │                        │                              │
      ├─ POST /consultations ──┤                              │
      │   { petId, reason }    │                              │
      │◄─ 201 { consultation } │                              │
      │                        │                              │
      │                        │  ── GET /consultations/mine ─┤
      │                        │  ◄── [{ consultation }] ────┤
      │                        │                              │
      ├── Socket.io chat ──────┤◄───── Socket.io chat ───────┤
      │   messages real-time   │                              │
      │                        │                              │
      │                        │  ── PATCH /consultations ───┤
      │                        │  /:id/complete { notes }     │
      │                        │                              │
      ├─ GET /consultations ───┤                              │
      │   /my-history          │                              │
      │◄── [historial] ────────┤                              │
```

---

## 7. Cómo agregar un endpoint nuevo

### Backend
```typescript
// 1. Service
export async function listX() { return prisma.x.findMany(); }
// 2. Controller
export async function listXController(req: Request, res: Response) {
  const data = await listX();
  res.json({ success: true, data });
}
// 3. Routes
router.get('/', authenticate, listXController);
// 4. Barrel export
export { router as xRoutes };
// 5. Montar en server.ts
app.use('/api/x', xRoutes);
```

### Frontend Web
```typescript
import api from './api';
export async function getX() {
  const res = await api.get('/api/x');
  return res.data.data;
}
```

### Mobile
```typescript
import api from '../lib/api';
export async function getX() {
  const res = await api.get('/api/x');
  return res.data;
}
```
