# VetConnect 🐾

> **Plataforma de telemedicina veterinaria** — Conexión inmediata entre dueños de mascotas y veterinarios mediante videollamada, historial clínico digital y asistencia IA.
>
> **Grupo Pinnacle** — 6° 2da · Desarrollo de Apps · Camila Lambertucci & Walter Perez

---

## Tabla de contenidos

- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Estructura del monorepo](#estructura-del-monorepo)
- [Requisitos previos](#requisitos-previos)
- [Setup local](#setup-local)
- [Sprint plan](#sprint-plan)
- [Documentación](#documentación)
- [Equipo](#equipo)

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Runtime** | Node.js | ≥ 18 |
| **Lenguaje** | TypeScript | 5.x |
| **Backend** | Express | 5.x |
| **ORM** | Prisma | 6.x |
| **Base de datos** | PostgreSQL via Supabase | - |
| **Auth** | JWT + bcrypt | - |
| **Frontend web** | React + Vite + TailwindCSS | - |
| **Mobile** | React Native + Expo | - |
| **Videollamada** | LiveKit | - |
| **Asistente IA** | Claude API (Anthropic) | - |
| **Deploy backend** | Railway | - |
| **Deploy web** | Vercel | - |
| **Metodología** | Scrumban (Trello/Notion) | - |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Cliente Mobile                        │
│              (React Native / Expo)                       │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP REST + WebSocket (LiveKit)
┌────────────────────▼────────────────────────────────────┐
│                   Backend API                            │
│        Express · TypeScript · Prisma · JWT                │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │   Auth   │ │   Pets   │ │   Queue  │ │   IA     │   │
│  │ Module   │ │ Module   │ │ Module   │ │ Module   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Consult  │ │ LiveKit  │ │ Billing  │ │  Users   │   │
│  │ Module   │ │ Module   │ │ Module   │ │ Module   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │ Prisma ORM
┌────────────────────▼────────────────────────────────────┐
│              PostgreSQL (Supabase)                       │
│  users · pets · consultations · medical_records          │
└─────────────────────────────────────────────────────────┘
```

**Patrón:** Monolito modular — cada funcionalidad vive en su propia carpeta `src/modules/<name>/` con sus propios archivos de rutas, controladores y servicios, pero comparten un mismo servidor Express, lo que simplifica el deploy manteniendo separación lógica.

---

## Estructura del monorepo

```
conectavet/
├── backend/                  # API REST (Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma     # Modelos de datos
│   │   └── migrations/       # Migraciones SQL
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/         # Registro, login, JWT
│   │   │   ├── users/        # Perfil, roles
│   │   │   ├── pets/         # CRUD mascotas
│   │   │   ├── consultations/# Videollamadas, historial
│   │   │   ├── queue/        # Cola de espera
│   │   │   ├── medical-records/   # Historial clínico
│   │   │   └── ai-assistant/      # Integración Claude
│   │   ├── shared/
│   │   │   ├── middlewares/  # Auth, roles, errores
│   │   │   └── types/        # Tipos compartidos
│   │   └── server.ts         # Entry point
│   ├── dist/                 # Compilado TypeScript
│   └── package.json
├── mobile/                   # App Android (Expo)
├── web/                      # Frontend web (React + Vite)
├── docs/                     # Documentación del proyecto
│   ├── SPRINT3_GUIDE.md      # Guía activa del sprint
│   ├── TOBIAS_STATUS.md      # Estado individual backend
│   └── SPRINT_PLAN.md        # Planificación de sprints
└── README.md
```

---

## Requisitos previos

| Herramienta | Versión | Instalación |
|-------------|---------|-------------|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |
| npm | ≥ 9 | incluido con Node.js |
| Git | ≥ 2.0 | [git-scm.com](https://git-scm.com) |
| Expo CLI | ≥ 50 | `npm install -g expo-cli` (solo mobile) |

No es necesario instalar PostgreSQL local — la base de datos corre en **Supabase** (cloud).

---

## Setup local

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/grupo-pinnacle/conectavet.git
cd conectavet

# Backend
cd backend
npm install
cp .env.example .env    # Editar .env con credenciales reales
npm run dev              # http://localhost:3000

# Web (otra terminal)
cd web
npm install
npm run dev              # http://localhost:5173

# Mobile (otra terminal)
cd mobile
npm install
npx expo start           # Escanear QR con Expo Go
```

### 2. Variables de entorno (backend)

```env
# Conexión a Supabase (pooler para queries)
DATABASE_URL="postgresql://user:pass@host:6543/postgres?pgbouncer=true"

# Conexión directa (para migrations)
DIRECT_URL="postgresql://user:pass@host:5432/postgres"

# Secreto para firmar JWT
JWT_SECRET="tu-clave-secreta-aqui"

# Puerto del servidor (opcional, default 3000)
PORT=3000
```

### 3. Base de datos

```bash
cd backend
npx prisma db push       # Sincroniza schema con Supabase
npx prisma generate      # Genera cliente Prisma
npm run dev               # Inicia servidor
```

### 4. Verificar instalación

```bash
curl http://localhost:3000/health
# → {"status":"ok","timestamp":"...","environment":"development"}
```

---

## Sprint plan

> **Calendario:** 2 sprints por semana (lun-mié / jue-sáb) desde el 15 de junio.
> **MVP:** 20 de julio.
> **Plan completo:** [`docs/SPRINT_PLAN.md`](docs/SPRINT_PLAN.md)

| Sprint | Fechas | Tema | Estado |
|--------|--------|------|--------|
| S1 | 15-17 Jun | Setup monorepo + proyectos | ✅ |
| S2 | 18-20 Jun | Modelos BD + navegación + wireframes | ⚠️ Parcial |
| S3 | 22-24 Jun | Auth backend (JWT, roles) | ✅ |
| S4 | 25-27 Jun | Conectar frontends a auth | ❌ Pendiente |
| **→ S5** | **29 Jun - 1 Jul** | **Middleware roles + CRUD mascotas** | **🔄 Activo** |
| S6 | 2-4 Jul | LiveKit + pantallas mascota | ⏳ |
| S7-S10 | 6-18 Jul | Cola, historial, IA, honorarios | ⏳ |
| **🎯 MVP** | **20 Jul** | **Entrega** | ⏳ |
| S11-S20 | 3 Sep - 5 Sep | Testing, deploy, documentación | ⏳ |

---

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [`docs/SPRINT_PLAN.md`](docs/SPRINT_PLAN.md) | Planificación completa de sprints |
| [`docs/SPRINT3_GUIDE.md`](docs/SPRINT3_GUIDE.md) | Guía activa del sprint actual para el equipo |
| [`docs/TOBIAS_STATUS.md`](docs/TOBIAS_STATUS.md) | Estado y checklist del backend |
| [`backend/DECISIONS.md`](backend/DECISIONS.md) | Decisiones técnicas del stack |
| [`backend/readme.md`](backend/readme.md) | Documentación técnica del backend + API |
| `web/README.md` | Documentación del frontend web |
| `mobile/README.md` | Documentación de la app mobile |

---

## Convención de ramas

```
main                  # Producción — nunca se toca directamente
│
├── develop           # Integración — se mergea todo acá
│   │
│   ├── feature/auth-backend      # Features nuevas
│   ├── feature/pets-crud
│   ├── fix/login-error           # Fixes
│   └── ...
│
└── docs/sprint-guide             # Documentación
```

**Flujo de trabajo:**
1. Crear rama desde `develop`: `feature/<nombre>`
2. Desarrollar y pushear
3. Abrir Pull Request a `develop`
4. Al menos un integrante revisa antes de mergear
5. `main` se actualiza desde `develop` al cierre de cada sprint

---

## Equipo

| Integrante | Rol | Responsabilidad |
|------------|-----|-----------------|
| **Tobias Vera** | Backend Developer | API REST, Prisma, Supabase, JWT, deploy Railway |
| **Juan Mendoza** | Mobile Developer | React Native, Expo, LiveKit SDK |
| **Damian Orellana** | Web Developer | React, Vite, TailwindCSS, Vercel |
| **Ezequiel Charca** | QA / Designer | Testing, Figma, documentación de bugs |
| **Lara Bouso** | Project Manager | Scrumban, reviews, comunicación con profesores |

---

## Licencia

Proyecto académico — Grupo Pinnacle · 6° 2da · 2025
