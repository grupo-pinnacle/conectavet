# AGENTS.md — Reglas de desarrollo para el agente (app ConectaVet en T3)

> Manual de operación para un agente de IA (o humano) que construya la app sobre **T3 Stack** con el diseño de **Figma**. Cumple esto en cada paso.

---

## 1. Stack y convenciones (NO negociables)

- **T3 Stack:** Next.js (App Router) + TypeScript + Tailwind + **tRPC** + **Prisma** + **NextAuth** + **Zod**.
- **Monorepo:** `apps/web` (Next), `apps/mobile` (Expo), `packages/db` (Prisma), `packages/api` (tipos tRPC). Tooling: **pnpm workspaces**.
- **Realtime:** **Supabase Realtime** (canal `consultation:{id}`), no Socket.io.
- **Media:** **Cloudinary** con URL firmada, no `/uploads` local.
- **Una sola fuente de tipos:** los tipos salen de Prisma → tRPC (`@trpc/server` inference). Nunca redefinas tipos de entidad a mano en web/mobile.
- **ESM** (`import/export`). `camelCase` vars/funciones, `PascalCase` tipos/clases, `kebab-case` archivos.
- **Errores:** siempre respuesta con forma `{ success: false, message }` en la capa tRPC (`TRPCError` con `code` adecuado: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `BAD_REQUEST`).

## 2. Estructura de carpetas (web)

```
apps/web/src/
├── app/
│   ├── (auth)/         # login, register  (públicas)
│   ├── (app)/          # dashboard protegido (dueño)
│   ├── (vet)/          # vet-dashboard protegido
│   └── api/trpc/       # handler de tRPC
├── components/         # UI (mapeados 1:1 desde Figma)
├── server/
│   ├── api/routers/    # authRouter, userRouter, petRouter, ...
│   ├── auth/           # NextAuth config + authorizedProcedure
│   └── services/       # lógica de negocio (cola, dedup, recetas)
├── styles/tokens.css   # design tokens de Figma
└── lib/                # utils
```

## 3. Flujo de trabajo del agente

1. **Antes de codear UI:** lee `SPEC.md` y el link de Figma. Extrae tokens y componentes de Figma primero (§5 abajo).
2. **Backend primero:** define/ajusta el router tRPC + el servicio; type-check con `npm run typecheck` (tsc) antes de tocar UI.
3. **UI después:** crea el componente en `components/` usando los tokens; conéctalo al router vía `@trpc/react-query`.
4. **No inventes datos:** usa los nombres de campo del `ANALISIS.md` §3 y del schema Prisma. No hardcodees `role:"VET"` en registro (ADR-009).
5. **Permisos:** usa `authorizedProcedure(Role.VET, Role.ADMIN)` donde corresponda; nunca confíes solo en el cliente.

## 4. Cómo traducir Figma → código

- **Estrategia de diseño (del humano):**
  - **Web:** sigue **1:1** los frames web del Figma (es el diseño fuente).
  - **Mobile:** NO es un calco del Figma. Es un diseño **original** construido reusando los **tokens del website** (colores, tipografías, espaciado, radios). Mismo sistema visual, layout propio para mobile.
- **Tokens:** la paleta de marca está en [`design-tokens.md`](./design-tokens.md) (medida de los PNG: `brand #1C60F0` azul eléctrico, `ink #080808`, `bg #FFFFFF`, `accent-warm #C28E52` solo media). Tipografía/radios son inferencias a validar. Expórtalos a `apps/web/src/styles/tokens.css` (CSS custom props) + `tailwind.config`; **mobile reusa los mismos valores** en `apps/mobile/src/theme` (no los redefine). Un token = una variable, sin valores mágicos.
- **Componentes web:** cada componente de Figma = un componente React en `components/`. Nombra igual que el frame (ej. `MessageBubble`, `StarRatingInput`, `VetCard`).
- **Variantes/estados:** usa `props` + Tailwind, no ramas de archivo.
- **Imágenes/iconos:** usa `next/image`; iconos como componentes (lucide-react), no SVG embebido suelto.
- **El diseño es el del cliente (Figma)**, no el estilo teal/verde del proyecto original.

## 5. Comandos clave

```bash
# Scaffold (una sola vez)
npx create-t3-app@latest apps/web --next-app --tailwind --trpc --prisma --next-auth --app-router --eslint --src-dir

# DB
cd packages/db && npx prisma generate && npx prisma db push

# Web
cd apps/web && npm run dev && npm run build && npm run typecheck && npm test

# Mobile
cd apps/mobile && npm start
```

## 6. Guardarraíles (OBLIGATORIO)

- **NUNCA** leer, editar ni commitear `.env` / secretos. Solo `.env.example`.
- **NUNCA** commitear sin que el humano lo pida.
- **NUNCA** purgar historial git ni forzar push sin confirmación por escrito.
- No inventes URLs ni credenciales; usa lo del repo.
- Antes de instalar paquetes de riesgo, avisa al humano.

## 7. Criterios de "hecho"

- `npm run typecheck` y `npm test` en verde en web y mobile.
- Cada router tRPC nuevo tiene al menos un test de permiso por rol.
- Pantalla de Figma implementada usa los tokens reales (no hardcode).
- Flujo dueño→vet (crear consulta → chat → receta → cerrar → calificar) funciona de punta a punta.

## 8. Qué conservar del proyecto original

Del [`ANALISIS.md`](./ANALISIS.md): la **lógica de negocio** (estados de consulta WAITING→ACTIVE→COMPLETED, revocación por `tokenVersion`, cola con auto-asignación, soft delete, dedup por `clientMsgId`, rate-limit, rating 1–10, favoritos). El **diseño visual** se reemplaza por Figma.
