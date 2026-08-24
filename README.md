# VetConnect 🐾

> **Plataforma de telemedicina veterinaria** — Conexión inmediata entre dueños de mascotas y veterinarios mediante chat en tiempo real, historial clínico digital y gestión de consultas.
>
> **Grupo Pinnacle** — 6° 2da · Desarrollo de Apps · Camila Lambertucci & Walter Perez

> [!IMPORTANT]
> **Estado actual (24-ago-2026):** el proyecto pasó por auditorías P0→P3 que corrigieron seguridad (role fijo en registro, exposición de `password`, revocación de sesiones por `tokenVersion`, concurrencia en `completeConsultation`/review, dedup de mensajes, cuota de media) y UX/UI/a11y. Falta todavía: **rotar secretos y purgar historial git** (bloqueante de producción), endpoints de video (LiveKit server-side listo, cliente vía WebView), tests de WebSocket/authz/concurrencia, y observabilidad. Ver [`docs/CODE_AUDIT.md`](docs/CODE_AUDIT.md).
>
> **Rama `PMV-complete-success`:** versión optimizada del proyecto con tiempo real global, carga instantánea de datos e imágenes del chat aceleradas. Detalle completo en [Novedades](#novedades--pmv-complete-success-24-ago-2026).

---

## Tabla de contenidos

- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Estructura del monorepo](#estructura-del-monorepo)
- [Requisitos previos](#requisitos-previos)
- [Setup local](#setup-local)
- [Novedades — PMV complete success](#novedades--pmv-complete-success-24-ago-2026)
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
| **Deploy backend** | PaaS (Railway/Koyeb/Render — ver [`docs/DEPLOY.md`](docs/DEPLOY.md)) | - |
| **Deploy web** | Vercel | - |
| **Deploy mobile** | EAS Build (APK/IPA) | - |
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

> **Importante:** este proyecto **no versiona archivos `.env` con secretos**. Cada carpeta incluye un `.env.example` (plantilla sin valores sensibles). Copialo a `.env` y completá tus propios valores. **Nunca uses en producción credenciales de ejemplo ni las de otra persona, y no commitees tus `.env`.**

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/grupo-pinnacle/conectavet.git
cd conectavet

# Backend (siempre primero)
cd backend
npm install                # ver backend/requirements.txt
npm run dev                # http://localhost:3001

# Web (otra terminal, opcional)
cd web
npm install
npm run dev                # http://localhost:5173

# Mobile (otra terminal)
cd mobile
npm install                # ver mobile/requirements.txt
npm start                  # usa start.ps1: configura IP/ADB y abre Expo
```

> **¿Olvidaste qué instalar?** Cada carpeta tiene un checklist: `backend/requirements.txt` y `mobile/requirements.txt`. El comando es siempre el mismo: `npm install` (instala todo lo listado automáticamente).

### 2. Variables de entorno (usá tu propia copia)

Cada carpeta tiene un `.env.example` con la plantilla de variables necesarias. Para arrancar:

```bash
cp backend/.env.example backend/.env
cp web/.env.example web/.env
cp mobile/.env.example mobile/.env
```

Completá los valores con **tus propias credenciales** (base de datos, secretos de sesión, URLs de API). Los `.env` ya están en `.gitignore`, así que no se suben al repo. Antes de cualquier deploy, generá secrets propios; si alguna credencial llegó a exponerse, rotala de inmediato en el proveedor.

### 3. Verificar instalación

```bash
curl http://localhost:3001/health
# → {"status":"ok","database":"connected","environment":"development"}
```

> [!NOTE]
> **Sincronizar la base de datos con el esquema (paso frecuente):** el desarrollo usa `prisma db push` (no versiona la estructura, pero deja la BD idéntica al `schema.prisma`). Si agregás columnas al schema y el backend falla con `P2022: column does not exist`, corré:
> ```bash
> cd backend && npx prisma db push
> ```
> Para producción se usan migraciones versionadas: `npx prisma migrate dev --name <cambio>` (genera la migración) y `npm start` aplica `prisma migrate deploy`.

---

## Novedades — PMV complete success (24-ago-2026)

Esta rama reúne la puesta a punto completa del proyecto: configuración de entorno, correcciones de base de datos y una capa de **optimización web/mobile** (de ahí el nombre).

### ⚡ Optimizaciones de rendimiento

| Área | Cambio | Archivos |
|------|--------|----------|
| Web | Refetch automático al volver al tab + `staleTime` reducido a 15s | `web/src/main.tsx` |
| Mobile | Refetch instantáneo al volver del background (`AppState` → `focusManager`) | `mobile/app/_layout.tsx` |
| Mobile | `keepPreviousData` en el directorio de vets: al filtrar no vuelve a "cargando" | `mobile/src/hooks/useVets.ts` |
| BD | Índice compuesto `User(role, isOnline)` para el directorio de veterinarios | `backend/prisma/schema.prisma` |

### 🔄 Tiempo real continuo (todo el proyecto)

Antes solo el chat era en vivo; las listas dependían de *polling* cada 5–15s. Ahora:

- **Backend** emite `pet:updated` (create/update/delete/restore) a la sala del dueño, sumándose a los eventos existentes (`consultation:new/updated`, `message:new`, `prescription:new`, `notification:new`, `vet:availability`).
- **Web**: nuevo hook global `useRealtimeSync` — mantiene el socket conectado toda la sesión e invalida las queries de React Query ante cada evento. `PetsSection` y `DirectorySection` se refrescan solas vía el pub/sub existente (`services/realtime.ts`).
- **Mobile**: `src/lib/realtime.ts` conectado desde `_layout.tsx` mientras hay sesión; todas las pantallas reaccionan al instante.
- El *polling* queda únicamente como red de seguridad si el socket se cae.

### 🖼️ Imágenes del chat (web)

| Antes | Ahora |
|-------|-------|
| Espacio vacío mientras cargaba | Skeleton animado del mismo tamaño + fade-in (`AuthImage`) |
| Misma imagen descargada N veces en paralelo | Single-flight: una sola descarga por imagen |
| Caché de blobs sin límite (fuga de memoria) | Caché LRU con tope de 150 blobs |
| 1–2 queries SQL por imagen en `/uploads` | Caché de autorización (2 min) con `node-cache` |
| Sin caché HTTP | `Cache-Control: private, max-age=86400, immutable` (archivos inmutables) |

### 🔧 Correcciones y setup incluidos

- **Prisma schema alineado con la BD**: campos mapeados a columnas snake_case existentes (`isEmailVerified` → `is_email_verified`, `lastSeen` → `last_seen`) y agregado el enum `VetStatus` (`PENDING`/`APPROVED`) con su columna `vet_status`. Sin pérdida de datos.
- **CORS**: soporte para acceder a la web por IP de red local (además de `localhost`), configurable en `backend/.env`.
- **Mobile solo Windows**: eliminado `start.sh`; `npm start` ejecuta `start.ps1` (detección USB/ADB, `adb reverse`, QR automático). Modo USB: `npm start -- -ADB`.
- **Declaración de tipos** para el middleware `compression` (`backend/src/types/compression.d.ts`).
- **`.env` generados y verificados** para backend/web/mobile (JWT aleatorio de 256 bits; los secretos nunca se commitean).

### ✅ Verificación

- `tsc --noEmit` OK en backend, web y mobile.
- ESLint limpio en todos los archivos modificados.
- Conexión a Supabase probada (`prisma migrate status` / `db push`: esquema sincronizado).

---

## Sprint plan

> **Calendario:** 2 sprints por semana (lun-mié / jue-sáb) desde el 15 de junio.
> **MVP:** 20 de julio.
> **Plan completo:** [`docs/SPRINT_PLAN.md`](docs/SPRINT_PLAN.md)

| Sprint | Fechas | Tema | Estado |
|--------|--------|------|--------|
| S1 | 15-17 Jun | Setup monorepo + proyectos | ✅ |
| S2 | 18-20 Jun | Modelos BD + navegación + wireframes | ✅ (cubierto por Tobias/Thiago) |
| S3 | 22-24 Jun | Auth backend (JWT, roles) | ✅ (frontends cubiertos por Tobias) |
| S4 | 25-27 Jun | Conectar frontends a auth | ✅ (cubierto por Tobias) |
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

## Estado y limitaciones conocidas

- **Seguridad de borde (P0 pendiente):** rotar `JWT_SECRET` y credenciales de BD, y purgar el historial de git de los `.env`. Hasta entonces no es apto para producción real.
- **Video (LiveKit):** el backend expone `POST /api/calls/:id/token` (mint de token LiveKit), pero el cliente mobile lanza una **WebView** de deep-link (`vetconnect://`) en lugar de usar el SDK de LiveKit. El flujo de videollamada no está completamente cableado en los frontends.
- **Tests:** 159 tests de backend (10 archivos en `backend/src/__tests__`). **No hay tests de WebSocket/authz negativa/concurrencia ni tests de mobile/web.** Ver [`docs/CODE_AUDIT.md`](docs/CODE_AUDIT.md).
- **Monorepo `packages/shared`:** existe pero **no es importado** por web ni mobile (0 imports). Los tipos se redefinen localmente. ADR-008 pendiente de adoptar.
- **Media:** `/uploads` se sirve desde disco del contenedor (efímero en PaaS). Para producción, mover a S3/Cloudinary con URL firmada.
- **Observabilidad:** solo `GET /health` + logs por consola. Sin métricas/trazas/alertas.

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
