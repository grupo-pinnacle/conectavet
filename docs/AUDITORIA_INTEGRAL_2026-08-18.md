# AUDITORÍA INTEGRAL — VETCONNECT (Full Stack + UX/UI + Producto + Arquitectura)

**Fecha:** 2026-08-18
**Autor:** Tech Lead (análisis asistido por skills: `systematic-debugging`, `error-handling`, `api-design`, `frontend-design`)
**Alcance:** backend, web, mobile, DB/Prisma, tiempo real, seguridad, testing, DevOps, documentación, producto.
**Regla `.env`:** Se respetó de forma absoluta. **No se abrió, leyó ni inspeccionó ningún archivo `.env`.** Todos los hallazgos provienen de código, configuración no sensible, arquitectura y documentación.

---

## 1. Resumen Ejecutivo

VetConnect es un proyecto **sorprendentemente maduro para su tamaño**: autenticación con `tokenVersion` revocable, transiciones de estado atómicas que evitan carreras (TOCTOU), validación Zod en bordes, capa de tiempo real con dedup idempotente, fuerte cobertura de tests del backend (~173 casos incluyendo authz negativa, concurrencia y chat WS), y una documentación extensa (14 ADRs, READMEs, guías de deploy).

Sin embargo, **no está listo para producción tal como está**, por razones que van más allá de "faltan features":

- **Hay un bug de despliegue crítico (P0):** el schema Prisma usa camelCase sin `@map`, pero las migraciones crean columnas snake_case → endpoints core (`/verify-email`, `/availability`, lectura de consultas/mensajes) lanzan "column does not exist" en un deploy limpio.
- **Varias features "terminadas" en docs/no están cableadas en el cliente** (cola de espera auto-asignada, presencia online/offline, deep links), lo que genera una brecha entre lo documentado y lo usable.
- **El cliente (web+mobile) no tiene ni un solo test automatizado (P0).** Toda la superficie de UI/chat/llamadas está sin verificar.
- **Cliffs de escalabilidad reales:** `listVets` hace full-table-scan + carga todas las reviews a memoria; falta índice en `Consultation.petId`; el adapter de Redis para WS es opcional (multi-instancia rompe el tiempo real).
- **Gaps de autorización y privacidad:** cualquier VET puede leer la mascota/PII de cualquier dueño por id; el token de refresh se devuelve en el body (XSS → robo de sesión); imágenes médicas en S3/local pueden quedar expuestas.

La causa raíz recurrente no es falta de talento sino **falta de una cadena de verificación extremo-a-extremo y de contratos cliente↔servidor validados** (tests de cliente, CI que ejecute la app, y un paso de `prisma migrate status` en el pipeline).

**Score global justificado: 66 / 100.** Fundaciones de seguridad y backend sólidas, pero frenado por un desync de deploy P0, features inertes, ceguera de tests en cliente, cliffs de escalabilidad y documentación que sobrevende completitud.

---

## 2. Scores por Categoría (0–100)

| Categoría | Score | Nota corta |
|---|---:|---|
| Arquitectura | 70 | Tangle de imports cross-module; doble sistema de estado en web. |
| Backend | 74 (código 72 / seg 80 / db 58 / rt 62) | Buen núcleo, desync P0 y authz/perf gaps. |
| Frontend (web) | 74 | Competente; chat duplicado y flujos muertos. |
| Mobile | 68 | Buena base offline; rating roto, socket leak, deep links muertos. |
| Base de Datos | 58 | Desync migración/schema (P0) + query cliffs. |
| Seguridad | 80 | Sin auth-bypass/inyección; refresh-en-body y PII amplio. |
| Performance | 60 | `listVets` O(N·reviews), msg sin paginar, sin code-split. |
| Escalabilidad | 58 | Índices faltantes, Redis opcional, scan completo. |
| UX | 68 | Acciones muertas, copy contradictorio, badges engañosos. |
| UI | 72 | Lenguaje de diseño consistente y pulido. |
| Accesibilidad | 64 | Modales sin dialog/Escape; foco invisible; bajo contraste. |
| Testing | 62 | Backend maduro; **cliente = 0 tests (P0)**. |
| DevOps | 63 | CI existe; sin staging/rollback, media efímera, sin mobile CI. |
| DX | 68 | Scripts y configs duplicados; `start.ps1` parcheado. |
| Documentación | 68 | Muy completa pero desactualizada/contradictoria. |
| Código | 71 | DRY/consistencia OK; magic strings, `as any`, código muerto. |
| Producto | 62 | Propuesta clara; features inertes y auth engañoso. |
| Innovación | 60 | Offline queue, LiveKit; deep links y presencia sin cablear. |

---

## 3. Hallazgos P0 / P1 (detallados)

Formato: **Problema · Ubicación · Por qué importa · Severidad · Cómo reproducir · Solución · Alternativa superior · Impacto.**

### P0-01 — Desync schema↔migración rompe el deploy
- **Problema:** `isEmailVerified`, `lastSeen`, `Consultation.deletedAt`, `Message.deletedAt` se definen en camelCase **sin `@map`**, pero las migraciones crean `is_email_verified`, `last_seen`, `deleted_at`. Prisma no convierte nombres; el cliente generado espera camelCase y la BD tiene snake_case.
- **Ubicación:** `prisma/schema.prisma:42,47,110,132` vs `prisma/migrations/20260814000000:2`, `20260815000000:3`, `20260816000000:2,6`.
- **Por qué importa:** `verifyEmail`, `updateAvailability`, `getConsultationById`, `getMessages`, `getConsultationHistory`, `getPetVetCard` lanzan "column does not exist" en un deploy limpio. Es una caída de producción garantizada.
- **Severidad:** P0.
- **Reproducir:** `prisma migrate deploy` en BD vacía → llamar `POST /verify-email` o `GET /consultations/:id` → 500.
- **Solución:** Elegir una convención. Más simple: agregar `@map("is_email_verified")`, `@map("last_seen")`, `@map("deleted_at")` a los 4 campos y regenerar. O renombrar columnas en migración nueva a camelCase y quitar `@map`.
- **Alternativa superior:** Estandarizar snake_case `@map` en **todas** las columnas multi-palabra (hoy inconsistente: `emailVerifyToken` tiene `@map`, las otras no) y agregar un gate CI `prisma migrate status` / shadow-diff para fallar el build ante drift.
- **Impacto:** Desbloquea ~6 endpoints core; elimina una caída de producción.

### P0-02 — El cliente (web + mobile) no tiene tests automatizados
- **Problema:** `web/package.json` y `mobile/package.json` no tienen script `test`; no hay `*.test.*`/`*.spec.*` en cliente; no Playwright/Cypress/Vitest.
- **Ubicación:** `web/package.json`, `mobile/package.json`, repo completo (grep → 0 archivos de test de cliente).
- **Por qué importa:** Toda la UI (flujos de auth, dashboards, chat, llamadas WebView, cola offline mobile) se QA manualmente. Regresiones críticas (dedup optimista, redirect 401, toggle disponibilidad) pasan desapercibidas.
- **Severidad:** P0 (para cualquier launch).
- **Reproducir:** `cd web && npm test` → "missing script"; `cd mobile && npm test` → ídem.
- **Solución:** Vitest + React Testing Library para `web` (auth, ProtectedRoute, send-message, rating); Jest + RTL para `mobile` (authStore, dedup de `useConsultations`, cola); 1 E2E Playwright (registro→consulta→chat→rate) para ambos clientes; jobs `web-test`/`mobile-test` en CI.
- **Alternativa superior:** Espejar el harness del backend (schema aislado + supertest) en el cliente.
- **Impacto:** Reduce el riesgo mayor (ceguera de regresiones en cliente).

### P1-03 — Registro de veterinarios probablemente roto (rol hardcodeado)
- **Problema:** `auth.service.ts` hardcodea `role: 'CLIENT'` y `registerSchema` no acepta `role`, pero `auth.test.ts` afirma que el auto-registro VET funciona. Hay una contradicción: o el test está mal, o el backend ignora el rol y crea CLIENT aunque el usuario elija VET.
- **Ubicación:** `backend/src/modules/auth/auth.service.ts` (registro), `registerSchema`; `web/src/pages/RegisterPage.tsx:90-91` (envía `role:"VET"`); `auth.test.ts`.
- **Por qué importa:** Si los veterinarios no pueden darse de alta (o se crean como dueños), **el producto no arranca**: no hay quien atienda consultas.
- **Severidad:** P1 (verificar urgente).
- **Reproducir:** Registrarse como VET en web/mobile → inspeccionar rol real en BD / comportamiento del dashboard.
- **Solución:** Definir intención explícita (¿auto-registro VET habilitado o solo por invitación?) y alinear `registerSchema` + servicio + test + copy de UI.
- **Alternativa superior:** Flujo de onboarding de vet con aprobación (request-access) en vez de auto-registro abierto.
- **Impacto:** Define si el producto es usable por su usuario clave (el vet).
- **DUDA PARA EL DUEÑO:** ¿El vet debe poder auto-registrarse hoy, o requiere aprobación/admin? Esto cambia la solución.

### P1-04 — Escala de rating mobile rota (UI 1–10 vs backend 1–5)
- **Problema:** `RatingStars` renderiza 1–10 pero el schema valida `rating` 1–5. Al enviar 8–10 → 400 del backend; al mostrar reviews guardadas (1–5) en el componente 1–10 se ven "medias".
- **Ubicación:** `mobile/src/components/RatingStars.tsx:16`; `mobile/src/types/index.ts:249-253`; `app/(app)/history/index.tsx`.
- **Por qué importa:** La feature "calificar vet" se rechaza en silencio y muestra información incorrecta.
- **Severidad:** P1.
- **Reproducir:** Consulta completada → "Calificar" → tap 8ª estrella → Submit → 400/error; o ver cualquier review → solo se llena la mitad de estrellas.
- **Solución:** `RatingStars` con `max` derivado de `rateConsultationSchema` (1–5) y validar cliente antes de enviar.
- **Alternativa superior:** Una sola fuente de verdad (el schema) importada por el componente.
- **Impacto:** Envío y visualización correctos; elimina una clase de 400s.

### P1-05 — Acción "Historial clínico" muerta en web
- **Problema:** El quick-action del Home del dueño navega a `history`, pero `DashboardPage.renderSection` no tiene caso `history` → cae en `default` (HomeSection). No pasa nada.
- **Ubicación:** `web/src/components/dashboard/HomeSection.tsx:71`; `web/src/pages/DashboardPage.tsx:80-90`.
- **Por qué importa:** Una entrada primaria y visible al historial clínico no funciona → el usuario concluye que la app está rota.
- **Severidad:** P1.
- **Reproducir:** Login dueño → Home → "Historial clínico" → nada.
- **Solución:** Agregar caso `history` (render `HistorySection`) o promover historial a tab/route de primer nivel.
- **Alternativa superior:** Historia como tab/route propia y siempre alcanzable.
- **Impacto:** Restaura un camino central del dueño.

### P1-06 — `getManagedPets` DISTINCT ON probablemente rompe en runtime
- **Problema:** `distinct: ['petId']` con `orderBy: { updatedAt: 'desc' }` traduce a `SELECT DISTINCT ON ("petId")` que exige que el ORDER BY inicial sea `petId` → Postgres lanza error.
- **Ubicación:** `backend/src/modules/pets/pets.service.ts:114-122` (`GET /pets/managed`).
- **Por qué importa:** La pantalla "mis pacientes" del vet erroriza.
- **Severidad:** P1.
- **Reproducir:** Como VET, llamar endpoint de mascotas gestionadas → 500.
- **Solución:** `orderBy: [{ petId: 'desc' }, { updatedAt: 'desc' }]` o `groupBy`/subquery de `petId`.
- **Alternativa superior:** `prisma.pet.findMany({ where: { consultations: { some: { vetId } } } })` paginado.
- **Impacto:** Desbloquea feature de vet.

### P1-07 — Lectura de mascota/PII abierta a cualquier VET (gap de authz)
- **Problema:** `getPetById`/`getPetVetCard` permiten a cualquier VET leer cualquier mascota por id, incluyendo `email`/`phone` del dueño. No hay requisito de participación.
- **Ubicación:** `backend/src/modules/pets/pets.controller.ts:78-112`; `pets.service.ts:17-22,124-162`; `users.service.ts` (listas de vets devuelven email/phone a todos).
- **Por qué importa:** Un vet que nunca atendió a un dueño puede ver su mascota e indagar PII → riesgo de privacidad/compliance (LGPD/GDPR-like).
- **Severidad:** P1/P2.
- **Reproducir:** Como VET, `GET /api/pets/<cualquier-id>` → 200 con mascota + owner.
- **Solución:** Requerir participación (vet tuvo/ tiene consulta con esa mascota) o restringir a mascotas propias/gestionadas; redactar `email`/`phone` en listas.
- **Alternativa superior:** Autorización a nivel de campo + mínima divulgación; PII completa solo dentro de una relación de consulta verificada.
- **Impacto:** Reduce exposición innecesaria de PII.
- **DUDA:** ¿Es intencional que cualquier vet lea cualquier mascota, o debe acotarse a sus consultas?

### P1-08 — Cola de espera auto-asignada / presencia online-offline no cableada en cliente
- **Problema:** El backend tiene `updateAvailability` y `assignNextPendingVet` (auto-asigna al conectarse un vet online), pero **cero llamadores** en `web/src` y **ninguna referencia** `availability|isOnline` en `mobile/src`. La feature está muerta desde el usuario.
- **Ubicación:** `web/src/services/endpoints.ts:20` (definida, sin llamadores); `mobile/src` (ausente); `backend/src/modules/users/users.routes.ts:25`, `consultations.service.ts:199-229`.
- **Por qué importa:** Una consulta WAITING creada por un dueño **nunca se auto-asigna**; los tests en verde enmascaran una feature inerte. Docs la marcan "Hecha".
- **Severidad:** P1.
- **Reproducir:** grep llamadores de `updateAvailability` en web → ninguno; como vet no hay toggle; consulta WAITING nunca se asigna.
- **Solución:** Cablear el toggle en `VetHomeSection`/`VetDashboardPage` (web) y mobile; tests de cliente; corregir docs.
- **Alternativa superior:** Presencia dirigida por sockets (ver P2-09).
- **Impacto:** La funcionalidad core de match dueño↔vet pasa a funcionar end-to-end.

---

## 4. Hallazgos P2 / P3 (resumen)

| # | Problema | Ubicación | Sev | Solución |
|---|---|---|---|---|
| P2-01 | Rate-limit y dedup durables solo en el evento socket muerto, no en el path REST real (`POST /messages`) → 500 en retry; outbox mobile se traba | `consultations.controller.ts:287-316` vs `chat.gateway.ts` | P2 | Unificar send en 1 servicio con rate-limit + `(consultationId, clientMsgId)` dedup; en P2002 devolver el existente |
| P2-02 | Mobile no refetch de mensajes en reconnect → mensaje entregado desaparece de la UI | `mobile/src/hooks/useConsultations.ts:134-139` | P2 | En `onReconnect` también `invalidateQueries` de mensajes (+ flushOutbox) |
| P2-03 | Presencia `isOnline` es toggle manual, no por socket → vet queda "online" al cerrar pestaña | `chat.gateway.ts:125-235`; `users.controller.ts:103-139` | P2 | `isOnline=true` en connect, `false` tras gracia en disconnect + heartbeat |
| P2-04 | No force-disconnect en logout/revocación de token → socket sigue autorizado hasta reconnect | `chat.gateway.ts:101-123`; `auth.service.ts:54-57` | P2 | Mapa userId→socketIds; `socket.disconnect(true)` en logout/revoke (+ canal Redis) |
| P2-05 | Redis adapter opcional → multi-instancia rompe entrega WS en silencio | `chat.gateway.ts:79-99` | P2 | Hacer Redis obligatorio en prod + documentar sticky sessions |
| P2-06 | `listVets` escanea toda la tabla + carga todas las reviews a memoria (no pagina en DB) | `users.service.ts:93-170` | P2 | Paginación DB + `groupBy _avg`; índice `(role,isOnline,createdAt)`; denormalizar `ratingAvg` |
| P2-07 | `GET /consultations/:id` devuelve todos los mensajes sin paginar | `consultations.service.ts:48-54` | P2 | Quitar mensajes del snapshot o paginar con cursor |
| P2-08 | `totalPages` inconsistente en `listVets` con `minRating` | `users.service.ts:104-167` | P2 | Empujar filtro/sort a DB o devolver `total` post-filtro |
| P2-09 | `getVetById` carga todas las reviews para promediar + slice 10 | `users.service.ts:172-200` | P2 | `groupBy _avg` + endpoint de reviews paginado |
| P2-10 | Falta índice en `Consultation.petId` | `schema.prisma:96-120` | P2 | `@@index([petId])` |
| P2-11 | `getConsultationById` filtra por `deletedAt` pero no `messages` → mensaje borrado reaparece | `consultations.service.ts:48-54` | P2 | Agregar `where: { deletedAt: null }` al include messages |
| P2-12 | Pool de Prisma sin `connection_limit`/`$connect`/`$disconnect` en shutdown | `shared/prisma.ts:7-9`; `server.ts` | P2 | `connection_limit=10&pool_timeout=20` en `DATABASE_URL`; `$connect`/`$disconnect` |
| P2-13 | `/metrics` sin auth expone internos (uptime, errores, memoria) | `app.ts:141-149` | P2 | `authorize(ADMIN)` + rate-limit, o puerto de gestión |
| P2-14 | `AuthError` no extiende `AppError` → 500 latente | `shared/errors/index.ts`; `auth.service.ts` | P2 | `class AuthError extends AppError` |
| P2-15 | Cookie `sameSite:'lax'` probablemente rota cross-origin (SPA :5173 ↔ API :3000) | `auth-cookies.ts:8-13` | P2 | `sameSite:'none';secure` si cross-origin, o Bearer + documentar same-origin |
| P2-16 | Refresh token en body + sin detección de reuso → robo de sesión vía XSS | `auth.service.ts:40-48,132-159`; `auth.controller.ts:80` | P2 | No devolver refresh en body; store server-side + reuse detection |
| P2-17 | Enumeración de cuentas vía status 409 en registro | `auth.controller.ts:38-43` | P2 | Respuesta uniforme 201/202 sin importar existencia |
| P2-18 | S3 devuelve URLs públicas sin ACL/expiry → PII de imágenes expuesta | `storage.ts:15-42`; `app.ts:151-182` | P2 | Bucket privado + presigned URLs cortas + `Content-Disposition` |
| P2-19 | Seed crea password débil conocida y la loguea | `prisma/seed.js:6,60` | P2 | Gatear a `NODE_ENV!=='production'` + passwords aleatorios + no log |
| P2-20 | PII de vet (email/phone) expuesta a todos en listas | `users.service.ts:123-200` | P2 | Redactar en listas; PII solo en relación de consulta |
| P2-21 | Dark mode mobile permanentemente deshabilitado | `app.json:9`; `ThemeProvider.tsx:21-22` | P2 | `userInterfaceStyle:"automatic"` o toggle persistido |
| P2-22 | Deep links configurados pero nunca manejados | `app.json:8`; `src/lib/deepLink.ts` (0 usos) | P2 | Manejar `vetconnect://call/:id` y `chat/:id` + usar desde web |
| P2-23 | WebSocket nunca se desconecta al salir del chat (fuga de batería) | `useConsultations.ts:149-162`; `socket.ts:70` | P2 | Desconectar en unmount chat / `AppState` background |
| P2-24 | Uploads mobile: timeout fijo 30s, sin progreso, sin resize/tamaño | `services/index.ts:115-121`; `api.ts:19` | P2 | Timeout por upload 120s, `onUploadProgress`, resize, guarda tamaño |
| P2-25 | Imágenes médicas cacheadas en disco sin cifrar en mobile | `components/AuthImage.tsx:59` | P2 | `cachePolicy="memory"` o cifrar/limpiar en logout |
| P2-26 | UX offline engañosa + outbox solo flush en chat montado | `services/index.ts:66-85`; `useConsultations.ts:138` | P2 | Estado "Enviado sin conexión" + flush global en resume + badge |
| P2-27 | Chat web duplicado ~1000 LOC (MessagesSection vs VetMessagesSection) | `MessagesSection.tsx` (549) vs `VetMessagesSection.tsx` (1022) | P2 | Extraer `ChatPane` parametrizado |
| P2-28 | Doble sistema de estado web (RQ + chatStore + realtime) con partes muertas | `chatStore.ts:26,128`; `realtime.ts` | P2 | Unificar en RQ + invalidación por socket; borrar caches muertos |
| P2-29 | Modales sin `role="dialog"`/Escape/focus-trap | `VetMessagesSection.tsx:871-919`; `DirectorySection.tsx:330`; etc. | P2 | Primitivo `Modal` accesible (o Radix/Headless) |
| P2-30 | Focus-visible probablemente invisible (falta `outline-style`) | `web/src/index.css:16-18`; `Button.tsx:45` | P2 | `outline-style:solid` o `ring-2 ring-teal-600` |
| P2-31 | Texto bajo contraste (`slate-400/300`) | varios `web/src` | P2 | `slate-500+` para texto; reservar 400 para decorativo |
| P2-32 | Botones auth engañosos (Google/Apple/forgot sin acción) | `LoginPage.tsx:99-107,142-158` | P2 | Deshabilitar con tooltip o implementar |
| P2-33 | `tailwindcss-animate` usado pero no instalado → animaciones no corren | `tailwind.config.js:99` (`plugins:[]`) | P3 | Instalar plugin o usar keyframes custom existentes |
| P2-34 | Sin code-splitting de rutas web | `App.tsx:4-9` | P3 | `React.lazy` + `Suspense` por ruta |
| P2-35 | Fetches por sección no cacheados (spinners repetidos) | `PetsSection.tsx:45`; `DirectorySection.tsx:87`; etc. | P3 | Envolver en `useQuery` con `staleTime` |
| P2-36 | Auth caliente: 1 query DB por request (`tokenVersion`) | `auth.middleware.ts:41-44` | P2 | Cache `tokenVersion` ~30-60s (Redis/NodeCache) o access corto + revoke list |
| P2-37 | `/uploads` validación de filename incompleta (`..` pasa regex) | `app.ts:153-176` | P2 | `path.resolve` + `startsWith(UPLOADS_DIR+sep)`; rechazar `..` |
| P2-38 | `clientMsgId` único global, no compuesto `(consultationId, clientMsgId)` | `schema.prisma:130` | P3 | `@@unique([consultationId, clientMsgId])` |
| P2-39 | `getConsultationHistory` cursor devuelve `total`/`totalPages` erróneos | `consultations.service.ts:315-322` | P3 | Devolver `total` estable u omitir en cursor |
| P2-40 | CI: job `backend-unit` mal nombrado; `collectCoverageFrom` ausente → cobertura engañosa | `jest.config.js`; `ci.yml:26` | P2 | Agregar `collectCoverageFrom`; renombrar jobs |
| P2-41 | Integración depende de Postgres externo sin service container en CI | `ci.yml:48-51` | P2 | Postgres efímero en CI + rollback por transacción |
| P2-42 | Scan de seguridad no bloqueante (`continue-on-error` + `|| true`) | `ci.yml:71-93` | P2 | Hacer `npm audit`/gitleaks bloqueantes en `main` |
| P2-43 | Sin `railway.json` para el deploy | `ci.yml:104-108` | P1 | Commitear `railway.json` con service/projectId |
| P2-44 | Deploy web fuera de CI; sin `vercel.json` → SPA deep-links 404 | `ci.yml` (solo build); `DEPLOY.md` | P2 | Agregar `vercel.json` con rewrites → `index.html` |
| P2-45 | Mobile sin CI; `eas.projectId` vacío → builds fallan | `mobile/app.json:58`; `ci.yml` | P1 | Set `extra.eas.projectId` + job mobile (typecheck+lint+build) |
| P2-46 | Media en disco efímero (se pierde en redeploy) | `media.service.ts` (local) | P2 | `STORAGE_PROVIDER=s3` + volumen persistente |
| P2-47 | Sin staging / deploy directo a prod desde `main` / sin rollback auto | `ci.yml:95-108` | P2 | Staging + aprobación + migraciones retrocompatibles + monitor |
| P2-48 | Sin HEALTHCHECK de contenedor / observabilidad mínima | `Dockerfile`; `app.ts` | P3 | `HEALTHCHECK` + metrics export + alerting |
| P2-49 | `setupChatSocket(server)` no await | `server.ts:12` | P3 | `await` o manejar la promesa |
| P2-50 | `assignNextPendingVet` ignora soft-delete | `consultations.service.ts:199-202` | P3 | Agregar `deletedAt: null` |
| P2-51 | Columnas redundantes (`weight` vs `weightKg`, `age` vs `birthDate`) | `schema.prisma:72-85` | P3 | Una fuente de verdad; derivar `age` de `birthDate` |
| P2-52 | `sex: data.sex as any` / `pet: any` / `(socket as any).user` | `pets.service.ts:48,87`; `chat.gateway.ts` | P3 | Tipos Prisma/`AuthenticatedSocket` |
| P2-53 | Call token aceptado por query params (fuga de token) | `web/src/pages/CallPage.tsx:22-27` | P2 | `postMessage`-only o handle firmado de un solo uso |
| P2-54 | `packages/shared` documentado como adoptado pero 0 imports | `DECISIONS.md` ADR-008; grep → 0 | P3 | Marcar como no adoptado o implementar |
| P2-55 | `connection_limit` 1 vs 10 contradictorio en docs | `PRODUCTION_DEPLOYMENT.md:40` vs `.env.example:10` | P3 | Unificar (10) |
| P2-56 | Vet dashboard tabs documentados (Ofertas/Cola/Activas) no existen en código | `TECH_REFERENCE.md:220` vs `VetMessagesSection` | P2 | Corregir docs o implementar tabs |
| P2-57 | JWT `verify` sin `algorithms:['HS256']` | `auth.middleware.ts:36`; etc. | P3 | Pinnear algoritmo + issuer/audience |
| P2-58 | Sin validación de formato de `req.params.id` → 500 en UUID malformado | controllers | P2 | Middleware Zod UUID/cuid |
| P2-59 | `getConsultationsByUser` para VET incluye cola global WAITING pesada | `consultations.service.ts:259-262` | P3 | Confirmar intención; aliviar con F15 |
| P2-60 | Cold start mobile bloquea en `GET /auth/me` (30s timeout offline) | `authStore.ts:41-52` | P3 | Render shell inmediato; validar token en background |

---

## 5. Priorización (P0–P3)

- **P0 (crítico, ahora):** P0-01 desync schema/migración; P0-02 tests de cliente = 0.
- **P1 (alto, próximo sprint):** P1-03 registro vet; P1-04 rating mobile; P1-05 historial muerto; P1-06 DISTINCT ON; P1-07 authz mascota/PII; P1-08 cola auto-asignada; + P2-43 `railway.json`; P2-45 `eas.projectId`/mobile CI.
- **P2 (medio, importante):** unificar send + fix 500 (P2-01), reconnect refetch (P2-02), presencia (P2-03), force-disconnect (P2-04), Redis obligatorio (P2-05), `listVets` (P2-06), paginación mensajes (P2-07), índice `petId` (P2-10), authz/PII (P2-07/20), refresh-en-body (P2-16), S3 ACL (P2-18), dark mode (P2-21), deep links (P2-22), socket lifecycle (P2-23), uploads (P2-24), a11y web (P2-29/30/31), consolidar chat (P2-27/28), staging/rollback (P2-47), media S3 (P2-46), CI gates (P2-40/42).
- **P3 (futuro, evolución):** magic strings, `as any`, code-splitting, coverage, documentación, ADRs desactualizados, healthy detalles.

---

## 6. TOP 20 Mejoras de Mayor Impacto

Ordenadas por **impacto / esfuerzo / riesgo / valor usuario**.

| # | Mejora | Impacto | Esfuerzo | Riesgo | Valor |
|---|---|---|---|---|---|
| 1 | Fix desync schema↔migración (`@map` + gate CI) | Crítico | Bajo | Bajo | Despliegue no roto |
| 2 | Tests cliente (Vitest web + Jest mobile + Playwright E2E) | Crítico | Medio | Bajo | Sin regresiones silenciosas |
| 3 | Verificar/alinear registro de vet (rol) + copy UI | Alto | Bajo | Bajo | Producto usable por vet |
| 4 | Fix rating scale mobile (1–5) | Alto | Bajo | Bajo | Calificación funciona |
| 5 | Reparar acción "Historial clínico" web | Alto | Bajo | Bajo | Camino core del dueño |
| 6 | Unificar send (rate-limit + dedup) en REST; eliminar 500-on-retry | Alto | Medio | Bajo | Confiabilidad chat + outbox |
| 7 | Cablear cola auto-asignada / presencia online-offline en cliente | Alto | Medio | Bajo | Match dueño↔vet funciona |
| 8 | Authz: acotar lectura de mascota/PII a participación + redactar listas | Alto | Medio | Bajo | Privacidad/compliance |
| 9 | Refresh token: no en body + reuse detection | Alto | Medio | Medio | Sesión no robable por XSS |
| 10 | Re-arch `listVets` (paginación DB + groupBy ratings + índice) | Alto | Medio | Bajo | Escala a 10k–100k vets |
| 11 | Fix `getManagedPets` DISTINCT ON | Alto | Bajo | Bajo | Pantalla vet no erroriza |
| 12 | Mobile refetch en reconnect (+ flush global) | Alto | Bajo | Bajo | Sin mensajes perdidos |
| 13 | Presencia dirigida por sockets + heartbeat | Medio | Bajo | Bajo | Disponibilidad vet precisa |
| 14 | Force-disconnect en logout/revoke | Medio | Bajo | Bajo | Revocación inmediata |
| 15 | Redis obligatorio en prod + sticky sessions | Alto | Bajo | Medio | Escala horizontal WS |
| 16 | Media a S3 privado + presigned; staging + rollback | Alto | Medio | Medio | Durabilidad y recuperación |
| 17 | A11y web (modales dialog, focus ring, contraste) | Medio | Medio | Bajo | WCAG AA, inclusión |
| 18 | Consolidar chat duplicado + unificar estado en RQ | Medio | Medio | Bajo | Mantenibilidad |
| 19 | Dark mode mobile + escalado a11y | Medio | Bajo | Bajo | Batería/accesibilidad |
| 20 | Reconciliar documentación (counts, Koyeb vs Railway, eas, tabs) | Medio | Bajo | Bajo | Expectativas reales |

---

## 7. Roadmap (Tech Lead)

### 7 días
- P0-01: agregar `@map` a los 4 campos + `prisma validate` + `migrate status` local.
- P1-04 / P1-05: rating mobile 1–5 y acción historial web (parches pequeños, alto valor).
- P1-03: verificar registro vet (debug + test); decidir auto-registro vs aprobación.
- P0-02 (arranque): scaffolding Vitest web + 1 test de `ProtectedRoute`/login; CI job `web-test`.
- Seguridad rápida: `/metrics` tras `authorize(ADMIN)`; pinnear `algorithms:['HS256']`; respuesta uniforme en registro (enumeración).
- P2-43 / P2-45: commitear `railway.json` y setear `eas.projectId`.

### 30 días
- P0-02 completo: suites web+mobile + 1 E2E Playwright (registro→consulta→chat→rate) en CI (bloqueante).
- P1-08 + P2-03/04/05: cola auto-asignada cableada, presencia por socket, force-disconnect, Redis obligatorio en prod.
- P2-01/02/06/07/10/11: unificar send, reconnect refetch, `listVets` re-arch, paginar mensajes, índice `petId`, fix DISTINCT ON.
- P2-08/16/18/20: authz mascota/PII, refresh-en-body, S3 ACL, redactar PII en listas.
- P2-21/22/23/24/25: dark mode, deep links, socket lifecycle, uploads, cache cifrado mobile.
- P2-29/30/31/34: a11y web (modales, focus, contraste, code-split).
- P2-46/47: media a S3 + staging + rollback manual documentado.

### 90 días
- Cobertura de cliente amplia; E2E multi-dispositivo; CI con Postgres efímero y gates de cobertura reales.
- Observabilidad: `HEALTHCHECK`, export de métricas, alerting sobre `/health`+`/metrics`.
- Escalabilidad: pool tuning, índices restantes, denormalización `ratingAvg`, presencia por adapter.
- Consolidación: chat único parametrizado, eliminar caches muertos, unificar error model.
- Producto/Innovación: typing indicators + read receipts, historial clínico inteligente (resúmenes), notificaciones contextuales, deep-link web↔mobile para llamadas.
- Docs reconciliadas automáticamente (counts desde `jest --listTests`;声明 canonical deploy = Railway).

### Qué NO tocar (sobreingeniería)
- Split a microservicios / GraphQL / event-sourcing ahora.
- Kubernetes / malla de servicios en esta escala.
- i18n completo (salvo mercado objetivo multi-país confirmado).
- Features de "IA" sin caso de valor validado.
- Reescritura a monorepo compartido (`packages/shared`) — hoy 0 imports; no aporta.
- Abstracciones DDD excesivas sobre módulos ya cohesionados.

---

## 8. Visión de Producto (Dueño / Vet / Admin)

**Dueño de mascota:** el flujo "pedir ayuda" es claro (crear consulta → esperar vet → chatear). Riesgos: historial clínico inalcanzable (P1-05), calificación rota (P1-04), deep links de "abrir en app" muertos (P2-22). Mejora: un solo tap desde el home a historial; rating visible y confiable; handoff web→mobile para llamadas.

**Veterinario:** la gestión es potente en backend pero **inertada en cliente** (cola auto-asignada, presencia, toggle online). Hoy un vet depende de que el dueño lo elija, no de una cola. Mejora: presencia real + cola + bandeja de "ofertas" en la app.

**Admin:** no hay UI web dedicada (se redirige al dashboard vet). Falta visibilidad de usuarios, consultas y moderación. Mejora: consola mínima (usuarios, métricas `/metrics`, moderación).

---

## 9. Innovación (oportunidades no obvias)

- **Presencia dirigida por sockets** en vez de flag manual → disponibilidad vet precisa y routing de ofertas correcto.
- **Historial clínico inteligente:** resúmenes por consulta, detección de patrones (vacunas, peso), alertas proactivas al dueño.
- **Notificaciones contextuales:** "tu vet está en línea", "resultado de consulta listo", "recordatorio de vacuna" — basadas en eventos, no polling.
- **Offline-first real:** outbox con estado visible + flush global en resume + refetch por `lastSeenMessageId` (mobile).
- **Deep-link web↔mobile para llamadas:** "Abrir en la app" desde la web lanza la videollamada en el teléfono (hoy roto).
- **Herramientas para vet:** plantillas de diagnóstico, recetas frecuentes, acceso rápido a historial del paciente.
- **Prevención de errores:** validación en cliente que espeja el schema (rating 1–5, ids), reduciendo 400s.

---

## 10. Auditoría Como Producto Real (¿qué fallaría primero?)

1. **Deploy roto por desync schema/migración (P0-01)** — la app no arranca en prod limpio.
2. **Vets no pueden registrarse (P1-03)** — no hay quien atienda → producto vacío.
3. **Calificación rechazada / historial inalcanzable (P1-04/05)** — frustración inmediata del dueño.
4. **Regresiones de cliente indetectables (P0-02)** — un cambio rompe chat/auth y nadie se entera hasta prod.
5. **`listVets` colapsa a 10k+ vets (P2-06)** — directorio lento/memoria.
6. **Media en disco efímero se pierde (P2-46)** — imágenes clínicas desaparecen en redeploy.
7. **Cola auto-asignada inerte (P1-08)** — dueños esperan vet que nunca llega.
8. **WS multi-instancia silencioso (P2-05)** — mensajes perdidos entre nodos.
9. **Fuga de PII / sesión (P2-07/16/18)** — riesgo legal/reputacional.
10. **Documentación que sobrevende** → expectativas incorrectas de completeness.

---

## 11. Dudas / Preguntas Pendientes (no inventadas)

1. **Registro vet:** ¿auto-registro habilitado hoy o requiere aprobación/admin? (Define P1-03.)
2. **Lectura de mascota por cualquier vet (P1-07):** ¿intencional o debe acotarse a consultas del vet?
3. **S3 (`STORAGE_PROVIDER=s3`):** ¿el bucket es privado / usa presigned URLs? ¿O las URLs públicas son expuestas? (Define P2-18.)
4. **Mismo origen en prod:** ¿frontend y backend son same-site? Si cross-origin, la cookie `sameSite:'lax'` no autentica (P2-15).
5. **Instancias en prod:** ¿corre >1 instancia de backend y está `REDIS_URL` seteado? Si no, el WS se rompe entre nodos (P2-05).
6. **Verificación de email:** ¿debe ser obligatoria antes del login? Hoy `login` no chequea `isEmailVerified` (P2-10 en security).
7. **IDs de entidad:** ¿UUID o cuid? Afecta la validación de `req.params.id` (P2-58).

---

## 12. Conclusión

VetConnect tiene los cimientos de un producto serio (seguridad consciente, concurrencia bien resuelta, tests de backend robustos). El salto a "producción confiable" no requiere reescribir nada, sino **cerrar la brecha entre lo que el código hace, lo que el cliente usa y lo que los docs prometen**: arreglar el desync de deploy, cablear las features ya construidas en el backend, ponerle tests al cliente, y acotar authz/PII. Con el TOP 20 abordado en los plazos propuestos, VetConnect pasa de 66 a un perfil sólido (≥80) sin introducir complejidad innecesaria.

---

## 13. Actualización de estado (2026-08-24)

Esta auditoría es un **snapshot de 2026-08-18**. El repositorio avanzó sustancialmente desde entonces (commit `51d9f4b` *"estable con web"*), por lo que varios hallazgos ya están resueltos **en código** y el score real hoy es superior al 66/100 original. Por eso las cifras de este documento deben tomarse como línea base histórica, no como Estado Actual.

**Ya resuelto en `HEAD` (verificado contra el código real, no por los docs):**
- **P0-01 (desync schema↔migración):** `isEmailVerified`, `lastSeen`, `Consultation.deletedAt`, `Message.deletedAt` ya llevan `@map` snake_case; `prisma validate` OK.
- **P1-03 / ADR-012:** auto-registro de VET con `vetStatus` (`PENDING`/`APPROVED`), endpoint de aprobación `PATCH /api/users/:id/vet-status`, y `listVets`/`getAvailableVets` filtran por `APPROVED`.
- **P1-07 / ADR-013:** un VET solo lee el detalle de una mascota si tiene/hubo consulta; el directorio (`listVets`, `getAvailableVets`) ya no expone `email`.
- **P2-13:** `/metrics` ahora requiere `authenticate` + `authorize(ADMIN)`.
- **P2-57:** `jwt.verify` pinnea `algorithms: ['HS256']` en los 3 puntos (middleware, refresh, socket).
- **P2-01 (unificar send):** `sendConsultationMessage` único para REST + Socket con rate-limit y dedup por `clientMsgId` (sin 500 en retry).
- **P1-04:** rating 1–10 coherente (backend `max(10)`, UI `RatingStars` 1–10; el schema mobile `max(5)` quedó desactualizado y debe alinearse a 10).
- **P1-06:** `getManagedPets` usa `findMany` con relación + paginación (sin `distinct` roto).
- **ADR-011/014:** Redis obligatorio en prod multi-instancia, con fallback in-memory documentado.

**Pendiente real (no resuelto en código):**
- **P0-02 / F1-3, F5:** sigue sin tests automatizados de cliente (web/mobile). Es el gap más grande y el que más sube el score de Testing.
- **F2-2 (móvil):** `mobile/src/types/index.ts` `rateConsultationSchema` dice `max(5)` → debe pasar a `max(10)` para emparejar backend/UI.
- **F2-3 / F2-6:** historial clínico en web y toggle de disponibilidad en cliente siguen por cablear.
- **F3 / F4 / F6:** re-arquitectura de `listVets`, paginación de mensajes, media persistente firmada (S3/Coolify volume), CI gates bloqueantes, a11y, dark mode mobile, deep links.
- **Decisión de infra (ADR-015, grupo 2026-08-24):** backend en **Coolify sobre VPS autohospedada** (gratis self-host), web en **Vercel**, mobile TBD. Reemplaza la referencia contradictoria Koyeb/Railway.

**Dudas que siguen abiertas (para el dueño):**
1. ¿`STORAGE_PROVIDER=s3` en uso real? ¿bucket privado + presigned URLs? (P2-18)
2. ¿Prod es same-site o cross-origin? Afecta `sameSite` de cookies (P2-15).
3. ¿>1 instancia de backend en prod + `REDIS_URL` seteado? (P2-05)
4. ¿Verificación de email obligatoria antes del login? Hoy `login` no la chequea (P2-10).
5. Dominio real de producción + HTTPS (es del humano).
6. Proveedor de VPS para Coolify, y si la BD (Supabase) y Redis se mantienen managados o se mueven a la VPS.

**Recomendación:** correr una **re-auditoría fresca** (las skills `systematic-debugging` + `error-handling-patterns` + `api-design-principles` sobre el `HEAD` actual) para obtener el score real antes de la próxima fase. El `PLAN_ACCION_VETCONNECT.md` derivado de esta auditoría ya está en ejecución.
