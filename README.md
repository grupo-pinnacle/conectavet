# ConectaVet 🐾

> Telemedicina veterinaria — T3 Stack (Next.js + tRPC + Prisma + NextAuth + Tailwind + Expo).

Aplicación de consultas veterinarias por videollamada: chat en tiempo real, historial clínico, recetas digitales y gestión de mascotas.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend web | Next.js 15 (App Router) + tRPC 11 + NextAuth 5 + Tailwind 4 |
| Frontend mobile | Expo Router + NativeWind + TanStack Query |
| Backend | tRPC sobre Next.js (route handler) + Prisma ORM |
| DB | PostgreSQL (Supabase) |
| Realtime | Supabase Realtime (reemplaza Socket.io) |
| Media | Cloudinary (signed upload URLs) |
| Monorepo | pnpm workspaces |

## Estructura

```
conecta-vet/
├── apps/
│   ├── web/                  # Next.js + tRPC server + UI
│   └── mobile/               # Expo Router + NativeWind
├── packages/
│   └── db/                   # Prisma schema + cliente singleton
├── Prototipado/              # PNGs de referencia (diseño Figma)
├── ANALISIS.md               # Inventario del proyecto anterior
├── PLAN_MIGRACION_T3APP.md   # Plan de migración Express → T3
├── SPEC.md                   # Spec funcional y técnica
├── AGENTS.md                 # Reglas para AI agents en este repo
├── design-tokens.md          # Sistema de diseño (VALIDATED)
├── pnpm-workspace.yaml
└── package.json
```

## Setup

Requisitos: Node.js ≥ 20, pnpm ≥ 11, PostgreSQL (o Supabase).

```bash
# 1. Instalar dependencias
pnpm install

# 2. Variables de entorno
cp apps/web/.env.example apps/web/.env
cp packages/db/.env.example packages/db/.env
# Editar con credenciales reales (Supabase, NextAuth, Cloudinary)

# 3. Generar Prisma client + migrar schema
pnpm db:generate
pnpm db:push            # en dev; usa `migrate dev` para producción

# 4. Dev
pnpm dev                # levanta el web (Next.js) en :3000
cd apps/mobile && pnpm start   # Expo (web/iOS/Android)
```

## Scripts

| Comando | Qué hace |
|---------|----------|
| `pnpm dev` | Inicia `apps/web` en modo dev |
| `pnpm build` | Build de producción del web |
| `pnpm typecheck` | `tsc --noEmit` en todos los paquetes |
| `pnpm db:generate` | Genera el Prisma client |
| `pnpm db:push` | Aplica el schema a la DB (dev) |
| `pnpm db:studio` | Abre Prisma Studio |

## Documentación

- **`SPEC.md`** — qué hace la app, modelo de datos, API tRPC, design system.
- **`AGENTS.md`** — convenciones de código, estructura de carpetas, guardrails.
- **`ANALISIS.md`** — inventario del proyecto Express anterior (referencia).
- **`PLAN_MIGRACION_T3APP.md`** — fases de migración y mapeo de endpoints.
- **`design-tokens.md`** — paleta, tipografía, espaciado, radios, sombras (validados contra el Figma exportado en `Prototipado/`).

## Estado actual

✅ Backend tRPC compilando (5 routers: auth, user, pet, consultation, notification, media).
✅ Web: landing, auth, dashboard cliente/vet, gestión de mascotas, consultas, chat.
✅ Mobile: login, register, home, mascotas, consultas, chat, panel vet.
✅ Design tokens del Figma aplicados en ambos.

🚧 Pendiente: Supabase Realtime (reemplaza WebSocket), tests, deploy, package `@conectavet/api` para tipos compartidos web↔mobile.