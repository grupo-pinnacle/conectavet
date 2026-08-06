# VetConnect 🐾

> **Plataforma de telemedicina veterinaria** — Conexión inmediata entre dueños de mascotas y veterinarios mediante chat en tiempo real, historial clínico digital y gestión de consultas.
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
| **Auth** | JWT + refresh tokens | - |
| **Frontend web** | React + Vite + TailwindCSS | React 19, Vite 8 |
| **Mobile** | React Native + Expo | SDK 54 |
| **Chat** | Socket.io | - |
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
                     │ HTTP REST + WebSocket (Socket.io)
┌────────────────────▼────────────────────────────────────┐
│                   Backend API                            │
│        Express · TypeScript · Prisma · JWT                │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │   Auth   │ │   Pets   │ │  Users   │ │ Consult  │   │
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
│  users · pets · consultations · messages                 │
└─────────────────────────────────────────────────────────┘
         ▲
         │ HTTP REST
┌────────┴────────────┐
│   Frontend Web       │
│ (React + Vite + T.) │
└─────────────────────┘
```

**Patrón:** Monolito modular — cada funcionalidad vive en su propia carpeta `src/modules/<name>/` con sus propios archivos de rutas, controladores y servicios, pero comparten un mismo servidor Express.

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
│   │   │   ├── auth/         # Registro, login, JWT, refresh, logout (revoca sesiones)
│   │   │   ├── users/        # Perfil, disponibilidad online/offline
│   │   │   ├── pets/         # CRUD mascotas + vet card
│   │   │   ├── consultations/# Consultas + cola + Chat (Socket.io)
│   │   │   ├── media/        # Upload de imágenes (multer)
│   │   │   └── notifications/# Push (Expo) + bandeja in-app
│   │   ├── shared/
│   │   │   ├── middlewares/  # Auth, roles, errores
│   │   │   └── types/        # Tipos compartidos
│   │   └── server.ts         # Entry point
│   └── package.json
├── mobile/                   # App Android (Expo) — para clientes
├── web/                      # Frontend web (React + Vite) — para médicos y clientes
├── packages/shared/          # Tipos compartidos (JwtPayload, User, Pet, ...)
├── docs/                     # Documentación del proyecto
│   ├── SPRINT_PLAN.md        # Planificación de sprints
│   ├── MVP_SCOPE.md          # Definición del alcance MVP
│   ├── TECH_REFERENCE.md     # Referencia técnica completa
│   └── ...                   # Ver sección Documentación
└── README.md
```

---

## Requisitos previos

| Herramienta | Versión | Instalación |
|-------------|---------|-------------|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |
| npm | ≥ 9 | incluido con Node.js |
| Git | ≥ 2.0 | [git-scm.com](https://git-scm.com) |
| Expo Go | última | App en Play Store (solo mobile) |

No es necesario instalar PostgreSQL local — la base de datos corre en **Supabase** (cloud).

---

## Setup local

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/grupo-pinnacle/conectavet.git
cd conectavet

# Backend (siempre primero)
cd backend
npm install
npm run dev                # http://localhost:3001

# Web (otra terminal, opcional)
cd web
npm install
npm run dev                # http://localhost:5173

# Mobile (otra terminal)
cd mobile
npm install
npx expo start             # Escanear QR con Expo Go en el celu
```

### 2. Variables de entorno

**Backend (`backend/.env`):**
```env
DATABASE_URL="postgresql://user:pass@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host:5432/postgres"
JWT_SECRET="tu-clave-secreta-aqui"
PORT=3001
CORS_ORIGIN="http://localhost:5173,http://localhost:8081"
```

**Mobile (`mobile/.env`):**
```env
EXPO_PUBLIC_API_URL=http://192.168.1.x:3001   # IP de tu compu
```

### 3. Verificar instalación

```bash
curl http://localhost:3001/health
# → {"status":"ok","database":"connected","environment":"development"}
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
| S4 | 25-27 Jun | Conectar frontends a auth | ⚠️ Parcial |
| S5 | 29 Jun - 1 Jul | Roles + Mascotas | ✅ |
| S6 | 2-4 Jul | Conexión mobile + chat inicio | ✅ |
| S7 | 6-8 Jul | Chat de texto + historial básico | ✅ |
| S8 | 9-11 Jul | Pulir flujo completo + testing | ✅ |
| **S9** | **13-15 Jul** | **Bugs + Preparar presentación** | ✅ (backend cerrado 11-Ago) |
| **S10** | **16-18 Jul** | **Freeze — solo bugs críticos** | ✅ MVP entregado 20-jul |
| **🎯 MVP** | **20 Jul** | **Entrega** | ✅ |
| **S11** | **3-5 Ago** | **Cola de espera + online/offline** | ✅ |
| **S12** | **6-8 Ago** | **Imágenes en chat + notificaciones push** | ✅ |
| **S13** | **10-12 Ago** | **Estabilización** | ✅ backend / ⏳ resto del equipo |
| S14 | 13-15 Ago | Testing 2GB RAM | ⏳ |
| S15-S20 | 17 Ago - 5 Sep | Prueba web, E2E, deploy, docs, presentación | ⏳ |

---

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [`docs/MVP_SCOPE.md`](docs/MVP_SCOPE.md) | **Alcance del MVP** — qué entra y qué no |
| [`docs/TECH_REFERENCE.md`](docs/TECH_REFERENCE.md) | **Referencia técnica completa** — leer primero |
| [`docs/SPRINT_PLAN.md`](docs/SPRINT_PLAN.md) | Planificación completa de sprints |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Architecture Decision Records (11 ADR) |
| [`docs/FAANG_AUDIT.md`](docs/FAANG_AUDIT.md) | Auditoría técnica y scores |
| [`docs/STANDUP_GUIDE.md`](docs/STANDUP_GUIDE.md) | Reglas de daily standup |
| [`docs/HOTFIX_PROTOCOL.md`](docs/HOTFIX_PROTOCOL.md) | Protocolo de bugs durante vacaciones |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Deploy a Railway |
| [`docs/CHANNEL_DECISION.md`](docs/CHANNEL_DECISION.md) | Estrategia web + mobile por rol |
| [`docs/RUN_GUIDE.md`](docs/RUN_GUIDE.md) | Guía para correr el proyecto local |
| [`backend/readme.md`](backend/readme.md) | Documentación técnica del backend + API |

---

## Equipo

| Integrante | Rol | Responsabilidad |
|------------|-----|-----------------|
| **Tobias Vera** | Backend Developer | API REST, Prisma, Supabase, JWT, Socket.io, deploy Railway |
| **Juan Mendoza** | Mobile Developer | React Native, Expo, chat, consultas |
| **Damian Orellana** | Web Developer | React, Vite, TailwindCSS, dashboard médico |
| **Ezequiel Charca** | QA / Designer | Testing, Figma, documentación de bugs |
| **Lara Bouso** | Project Manager | Scrumban, reviews, comunicación con profesores |

---

## Licencia

Proyecto académico — Grupo Pinnacle · 6° 2da · 2025
