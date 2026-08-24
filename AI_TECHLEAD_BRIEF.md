# AI_TECHLEAD_BRIEF.md — Brief para IA Tech Lead (VetConnect)

> **Autor del brief:** Desarrollador full stack senior (estándares FAANG) que mantiene este repositorio.
> **Propósito:** Este archivo es la fuente de contexto que debe leer **otra IA actuando como Tech Lead** para entender el proyecto, las herramientas (skills) disponibles y emitir órdenes concretas, priorizadas y justificadas para **terminar y llevar a producción** VetConnect según la documentación del repo.
> **Formato sugerido para el Tech Lead:** lee todo, propón un plan en fases (P0→P3), da órdenes paso a paso (archivo:línea cuando aplique), y no asumas nada que no esté en los docs.

---

## 1. Rol asignado a la IA que lea esto

Actúa como **Tech Lead senior (FAANG-grade)** de un equipo de 1 persona (el desarrollador que escribió este brief). Tu trabajo NO es escribir código directamente aquí, sino:

1. **Diagnosticar** el estado real del proyecto usando los docs y el código.
2. **Priorizar** el trabajo restante (crítico / bloqueante / nice-to-have).
3. **Emitir órdenes** claras, en orden, con el "por qué" y el "criterio de aceptación".
4. **Usar las skills disponibles** cuando una sea la herramienta indicada (ver §5).
5. **Vigilar estándares:** seguridad, testing, observabilidad, DX, y reproducible builds.
6. **No commitear ni purgar git** sin confirmación explícita del humano (ver §7 guardarraíles).

---

## 2. El proyecto: VetConnect 🐾

### 2.1 Qué es
Plataforma de **telemedicina veterinaria** que conecta dueños de mascotas con veterinarios vía **chat en tiempo real**, **historial clínico digital** y **gestión de consultas**. Grupo Pinnacle — 6° 2da · Desarrollo de Apps (proyecto académico/portfolio).

### 2.2 Stack (monorepo, 3 capas)
| Capa | Tech | Entry |
|------|------|-------|
| Backend API | Node + Express + Prisma + PostgreSQL (Supabase) + Socket.io + JWT | `backend/src/server.ts` (PORT `process.env.PORT || 3000`, típicamente 3001 en dev) |
| Web | React + Vite + Tailwind + Socket.io client | `web/` (build estático → Vercel) |
| Mobile | Expo / React Native + Socket.io + expo-image | `mobile/` (EAS Build → APK/IPA) |
| Compartido | npm workspaces `@conectavet/shared` en `packages/shared` | ⚠️ **NO adoptado** (0 imports reales) |
| Realtime | Socket.io gateway en backend (`/socket.io`) | deep-links `vetconnect://` en mobile |
| Media | Uploads a disco local `/uploads` (efímero en PaaS) | `POST /api/media` (cuota diaria) |
| Video | LiveKit server-side (`POST /api/calls/:id/token` minta token); cliente mobile usa **WebView**, no el SDK | pendiente de cablear end-to-end |
| Push | Expo Push API (best-effort) | `EXPO_PUSH_DISABLED` |

### 2.3 Funcionalidades core
Registro/login (solo `CLIENT` por `/register`; `VET`/`ADMIN` manual), gestión de mascotas (CRUD + soft delete), cola de espera con auto-asignación a vet online, consulta (WAITING→ACTIVE→COMPLETED), chat texto en consulta activa, recetas, calificación (Review 1–10), favoritos de vet, notificaciones push + bandeja, presencia (`lastSeen`, `isOnline`), historial clínico.

### 2.4 Tests
- **Backend:** 159 tests en 10 archivos (`backend/src/__tests__`: `app, auth, cache, calls, consultations, media, notifications, pets, users, utils`) con Jest + supertest.
- **NO hay** tests de WebSocket, authz negativa, ni concurrencia. **NO hay** tests de web ni mobile.

---

## 3. Documentación del repo (índice para el Tech Lead)

| Doc | Para qué sirve |
|-----|---------------|
| `README.md` | Visión general, stack, quickstart, **estado y limitaciones conocidas** (leer primero). |
| `docs/TECH_REFERENCE.md` | **La fuente técnica**: arquitectura, modelos Prisma, endpoints `/api/*`, flujos. (v6, 14-ago) |
| `docs/CODE_AUDIT.md` | Auditoría de las 3 capas (hallazgos P0→P3). Estado 14-ago: P0–P3 resueltos (commit `36d76f0`). |
| `docs/FAANG_AUDIT.md` | Scorecards por categoría (v1→v6). Avg ~6.7/10. Útil para ver dónde falta nivel producción. |
| `docs/DECISIONS.md` | ADRs (incl. ADR-008 `packages/shared` **no adoptado**). |
| `docs/DEPLOY.md` | Deploy backend (Railway CI/CD activo / Koyeb recomendado), web (Vercel), mobile (EAS). |
| `docs/PRODUCTION_DEPLOYMENT.md` | **Checklist pre-lanzamiento**, dominio/HTTPS, backups/rollback, seguridad. Ítems 3–5 son bloqueantes. |
| `docs/MVP_SCOPE.md` | Alcance MVP vs post-MVP (LiveKit parcial, cola, etc.). |
| `docs/SPRINT_PLAN.md` | Plan de sprints + nota de conteo real de tests. |
| `docs/RUN_GUIDE.md` | Cómo correr en local. |
| `docs/FALTA_HACER.md` | Pendientes explícitos del equipo. |
| `docs/HOTFIX_PROTOCOL.md`, `STANDUP_GUIDE.md`, `CHANNEL_DECISION.md`, `CONEXION_SIN_RED_CORPORATIVA.md`, `REPORTE_SEMANA_2026-08-03.md` | Protocolos/contexto operativo. |

---

## 4. Estado actual y deuda técnica (lo que falta para producción)

### 4.1 Bloqueantes de borde (P0 manuales — NO resueltos)
- **Rotar `JWT_SECRET`** y credenciales de Supabase (estuvieron expuestas en historial de git).
- **Purgar historial git** de los `.env` (`git filter-repo`/`BFG`) antes de hacer público el repo.
- `eas.json`/`app.json` mobile apuntan a `http://localhost:3001` y `eas.projectId` vacío (pendiente HTTPS real).

### 4.2 Deuda importante
- **`packages/shared` no adoptado** (0 imports) → tipos duplicados en las 3 capas.
- **Media efímera** en disco del contenedor → migrar a S3/Cloudinary firmado.
- **CORS de WebSocket** abierto (`*`) → validar origen en `mobile/src/lib/socket.ts`.
- **Video LiveKit** solo server-side; cliente usa WebView (flujo incompleto).
- **Observabilidad:** solo `/health` + logs consola. Sin métricas/trazas/alertas.
- **Tests:** falta WS, authz negativa, concurrencia, y tests de web/mobile.

### 4.3 Ya resuelto (commit `36d76f0`, 14-ago)
Registro solo `CLIENT`; `password` oculto en respuestas; revocación de sesiones por `tokenVersion`; `/uploads` tras auth; rutas admin con `authorize()`; concurrencia en `completeConsultation`/`createReview`; dedup de mensajes (`clientMsgId`); cuota de media; correcciones UX/a11y web+mobile (incl. `app.json` `userInterfaceStyle: light` que arregló la app "en negro").

---

## 5. Skills disponibles (herramientas de la IA)

_instaladas en `.agents/skills/`; copy-compatible con OpenCode y otros agentes. Riesgo Snyk entre paréntesis._

| Skill | Origen | Para qué sirve (propósito esperado) | Aplicabilidad al proyecto |
|-------|--------|-------------------------------------|---------------------------|
| `brainstorming` | obra/superpowers | Estructurar ideación y decisiones antes de implementar. | Alta (diseño de features/flujos). |
| `systematic-debugging` | obra/superpowers | Método sistemático para reproducir y aislar bugs. | Alta (debug de WS, concurrencia, P2022). |
| `api-design-principles` | wshobson/agents | Principios de diseño de API REST (contratos, versionado, errores). | Alta (endpoints `/api`). |
| `error-handling-patterns` | wshobson/agents | Patrones de manejo de errores (tipos, bubbling, respuestas). | Alta (errores 4xx/5xx consistentes). |
| `tdd` | mattpocock/skills | Desarrollo dirigido por tests. | Alta (cerrar gaps de tests). |
| `frontend-design` | anthropics/skills | Principios de diseño de UI frontend. | Alta (web/mobile UI). |
| `interface-design` | dammyjay93 | Guías de diseño de interfaz/UX. | Alta (UI). |
| `grill-me` | mattpocock/skills | "Grill": cuestiona supuestos y valida el plan antes de codear. | Alta (validar antes de cada fase). |
| `grill-with-docs` | mattpocock/skills | Igual que `grill-me` pero anclado a la documentación. | Alta (usar docs como fuente de verdad). |
| `playwright-cli` | microsoft | Automatización de navegador para E2E/testing. | Media (E2E web; ⚠️ **High Risk Snyk**). |
| `agent-browser` | vercel-labs | Agente de navegador para interacción/QA. | Media (QA web; ⚠️ **Med Risk Snyk**). |
| `find-skills` | vercel-labs | Descubrir e instalar más skills. | Baja/Utilitaria (⚠️ **Med Risk Snyk**). |
| `remotion-best-practices` | remotion-dev | Mejores prácticas de Remotion (video programático). | **No aplica** (el proyecto no usa Remotion; ⚠️ **Med Risk Snyk**). |

> Recomendación al Tech Lead: prioriza `grill-with-docs` + `systematic-debugging` + `api-design-principles`/`error-handling-patterns` + `tdd` para el trabajo de código; usa `frontend-design`/`interface-design` para UI. Las de riesgo Med/High úsalas solo bajo supervisión del humano.

---

## 6. Cómo debe operar el Tech Lead (modo de uso)

1. **Arranca leyendo** `README.md` → `docs/TECH_REFERENCE.md` → `docs/CODE_AUDIT.md` → `docs/PRODUCTION_DEPLOYMENT.md`.
2. **Valida supuestos** con `grill-with-docs` antes de cada fase.
3. **Plan en fases** (sugerencia):
   - **Fase 0 — Seguridad de borde (bloqueante):** rotar secretos, purgar git, `eas.json` HTTPS + `projectId`. _Ordenar al humano; no ejecutar purga sin confirmación._
   - **Fase 1 — Robustez backend:** CORS WS restrictivo, adoptar `packages/shared`, media persistente (S3/Cloudinary), concurrencia/cache revisados.
   - **Fase 2 — Tests:** WS, authz negativa, concurrencia, y smoke E2E (Playwright, con precaución).
   - **Fase 3 — Features pendientes:** video LiveKit end-to-end (o decidir post-MVP), observabilidad (health+metrics), pulido UI/a11y.
   - **Fase 4 — Deploy y QA:** Koyeb/Railway, Vercel, EAS, smoke test E2E, rollback plan.
4. **Cada orden** debe tener: objetivo, archivos a tocar (ruta:línea), comandos, y criterio de aceptación (ej. "tests verdes", "lint/tsc sin errores").
5. **Estándares FAANG:** cambios pequeños y revisables, sin comentarios innecesarios, manejo de errores explícito, secretos fuera del repo, tests para regresiones, documentación actualizada en el mismo PR.

---

## 7. Guardarraíles (leer obligatoriamente)

- **NUNCA** leer, editar ni commitear `.env`. Solo `.env.example`.
- **NUNCA** ejecutar `git filter-repo` / `BFG` / `git push --force` / purga de historial sin **confirmación explícita y por escrito** del humano (es destructivo y el repo podría ser la única copia).
- **NUNCA** commitear cambios sin que el humano lo pida.
- **No inventar URLs** ni credenciales. Usar solo lo del repo/docs.
- Antes de instalar/usar skills de riesgo Med/High, advertir al humano.

---

## 8. Comandos clave (para que el Tech Lead los ordene)

```bash
# Backend
cd backend && npm install
cp .env.example .env            # NUNCA commitear .env
npx prisma db push              # sincronizar BD con schema (dev) — si falla P2022
npx prisma generate
npm run dev                     # tsx watch src/server.ts
npm test                        # jest --forceExit --detectOpenHandles (159 tests)
npx tsc --noEmit                # typecheck

# Web
cd web && npm install && npm run dev && npm run build

# Mobile
cd mobile && npm install && npm start   # Expo
eas build --platform android --profile preview
```

---

## 9. Criterio de "listo para producción" (definition of done sugerida)

- [ ] Secretos rotados + historial git purgado + `.env` fuera de git.
- [ ] `eas.json`/`app.json` con HTTPS real y `projectId`.
- [ ] CORS WS restrictivo y `/uploads` tras auth (ya hecho) verificado.
- [ ] Media en almacenamiento persistente firmado.
- [ ] `packages/shared` adoptado (tipos únicos).
- [ ] Suite de tests cubre WS, authz negativa y concurrencia; smoke E2E verde.
- [ ] Observabilidad mínima (health + logs estructurados + alerta de caída).
- [ ] Deploy en PaaS con dominio/HTTPS, rollback probado, backup de BD.
- [ ] Docs (`README`, `TECH_REFERENCE`, `PRODUCTION_DEPLOYMENT`) reflejan el estado final.

---

> Fin del brief. La IA Tech Lead debe usar este documento + los docs del repo como única fuente de verdad y emitir órdenes priorizadas para cerrar el §4 y alcanzar el §9.
