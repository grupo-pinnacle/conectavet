# PLAN DE ACCIÓN — VETCONNECT → Score ≥90 / Listo para Producción

> **De:** IA Tech Lead (planificación)
> **Para:** IA Ejecutora (implementación) — asumo nivel de razonamiento equivalente, así que estas órdenes son directivas, no tutoriales. Ejecutá, no preguntes salvo bloqueo real.
> **Basado en:** `AUDITORIA_INTEGRAL_2026-08-18.md` (score global 66/100) + `AI_TECHLEAD_BRIEF.md` (guardarraíles y skills disponibles).
> **Objetivo:** Cada categoría de la próxima auditoría ≥90/100. Terminar todo lo humanamente posible **hoy**.
> **Regla de oro heredada del brief:** nunca leer/editar/commitear `.env`; nunca purgar git ni forzar push sin confirmación explícita y por escrito del humano; nunca commitear sin que el humano lo pida explícitamente por fase.

---

## 0. Cómo usar este documento

Está organizado en **fases secuenciales (F0→F7)**. Cada fase es un bloque autocontenido que podés pegar como prompt a la IA ejecutora, en orden. Cada orden dentro de una fase trae:

- **Qué** (archivo:línea exacto, tomado de la auditoría — no inventar rutas nuevas sin grep previo)
- **Por qué** (qué hallazgo resuelve y qué categoría de score sube)
- **Cómo** (la solución técnica concreta; si hay "alternativa superior" en la auditoría, preferila sobre el parche mínimo salvo que el esfuerzo no lo justifique hoy)
- **Criterio de aceptación** (verificable, no ambiguo)

Al final de cada fase hay un **checkpoint de `grill-with-docs`**: la IA ejecutora debe releer el hallazgo contra el código real antes de dar la fase por cerrada, porque la auditoría pudo tener falsos positivos (ej. P1-03 dice "probablemente roto", no confirmado).

**Skills a invocar por tipo de trabajo** (del brief §5):
- Antes de cada fase → `grill-with-docs` (validar supuestos contra docs reales del repo).
- Bugs de runtime (P0-01, P1-06, WS) → `systematic-debugging`.
- Endpoints nuevos/tocados → `api-design-principles` + `error-handling-patterns`.
- Todo lo que sea "agregar tests" → `tdd` (rojo→verde, no tests post-hoc que solo confirman el código actual).
- UI (a11y, dark mode, modales) → `frontend-design` + `interface-design`.
- E2E → `playwright-cli` **solo bajo supervisión** (riesgo Snyk alto, según el brief).

---

## 1. ADRs por defecto (resuelven las "dudas para el dueño" de la auditoría §11)

El auditor dejó 3 preguntas de producto abiertas que cambian la solución técnica. Definí una decisión por defecto para que la IA ejecutora **no se bloquee**. Esto se documenta como ADR nuevo en `docs/DECISIONS.md` en la Fase 1.

### ADR-009 — Registro de veterinarios: auto-registro CON verificación admin post-hoc (no bloqueante)
**Decisión por defecto:** El auto-registro como VET queda **habilitado** (no se cierra el flujo), pero el usuario registrado como VET entra en estado `PENDING_VERIFICATION` y no aparece en `listVets`/cola de auto-asignación hasta que un ADMIN lo apruebe. Esto resuelve P1-03 sin trabar el onboarding (relevante para demo/portfolio) y sin exponer dueños a vets no verificados.
- Requiere: campo `vetStatus` (`PENDING`|`APPROVED`|`REJECTED`) en `User` o tabla relacionada; endpoint `PATCH /api/admin/vets/:id/approve`; filtro en `listVets`/asignación por `vetStatus='APPROVED'`.
- Si el humano prefiere "solo por invitación" estricto, es un cambio de una línea (quitar el auto-registro del rol VET en `registerSchema`) — dejarlo señalado en el PR para decisión rápida del humano, pero **no bloquear la fase por esto**.

### ADR-010 — Lectura de mascota/PII por VET: acotada a participación en consulta
**Decisión por defecto:** Un VET solo puede leer una mascota/PII completa del dueño si tiene o tuvo una `Consultation` con esa mascota (`WHERE vetId = current AND petId = target`), o si la mascota está en su lista de "gestionadas" (`getManagedPets`). Fuera de esa relación, los endpoints de listado (`listVets`, directorio) devuelven mascota **sin** `email`/`phone` del dueño. Esto resuelve P1-07/P2-20 con el criterio menos sorprendente para un producto de salud (mínima divulgación).

### ADR-011 — Redis para WebSocket: obligatorio en producción, opcional en dev/test
**Decisión por defecto:** `REDIS_URL` pasa a ser **requerido** cuando `NODE_ENV=production` (fail-fast al boot si falta), y sigue opcional en dev/test para no romper el flujo local del brief (`docs/RUN_GUIDE.md`). Resuelve P2-05 sin imponer una dependencia nueva en desarrollo local.

Estos 3 ADRs se agregan a `docs/DECISIONS.md` en F1-1 antes de tocar código, para que quede trazable **por qué** se decidió así y no aparezca como una sorpresa en la próxima auditoría.

---

## FASE 0 — Guardarraíles y setup (5 min, bloqueante para todo lo demás)

**Objetivo:** confirmar que la IA ejecutora tiene el entorno y los límites claros antes de tocar una línea.

1. Releer `AI_TECHLEAD_BRIEF.md` §7 (guardarraíles) y confirmarlos en voz alta al humano antes de empezar: no `.env`, no purga git, no commit sin pedido explícito.
2. `cd backend && npm install && cp .env.example .env` (si no existe ya) — **nunca abrir ni loggear el contenido de `.env`**.
3. `npx prisma generate && npm run dev` en paralelo con `npm test` para confirmar baseline: anotar cuántos tests pasan **antes** de tocar nada (la auditoría dice ~173, el brief dice 159 — reconciliar el número real corriendo `npx jest --listTests | wc -l` es parte de F6).
4. Crear rama de trabajo `git checkout -b fix/audit-2026-08-18` (crear rama sí está permitido; commitear a `main` o purgar historial no).

**Criterio de aceptación:** app corre en local, tests base corren (verdes o con la lista de fallos actual documentada), rama de trabajo creada.

---

## FASE 1 — P0 bloqueantes de deploy y de riesgo (HOY, antes que nada más)

Esto es lo único que garantiza que la app **arranca** en un deploy limpio y que hay red de seguridad para todo lo que sigue. Categorías que sube: **Base de Datos (58→↑), Backend/DB (74→↑), Testing (62→↑ arranque)**.

### F1-1 — Documentar los 3 ADRs
Agregar ADR-009, ADR-010, ADR-011 (texto de la sección 1 de este plan) a `docs/DECISIONS.md`, siguiendo el formato de los ADRs existentes (ADR-008 como referencia de estilo).
**Aceptación:** 3 ADRs nuevos, numerados correlativos, con contexto/decisión/consecuencias.

### F1-2 — P0-01: Fix desync schema↔migración (CRÍTICO, esto rompe el deploy)
- **Qué:** `prisma/schema.prisma:42` (`isEmailVerified`), `:47` (`lastSeen`), `:110` (`Consultation.deletedAt`), `:132` (`Message.deletedAt`) están en camelCase sin `@map`, pero las migraciones (`20260814000000`, `20260815000000`, `20260816000000`) ya crearon columnas snake_case.
- **Cómo (usar la alternativa superior de la auditoría, no el parche mínimo):**
  1. Grep **todos** los campos multi-palabra del schema para confirmar cuáles tienen `@map` y cuáles no (`emailVerifyToken` sí tiene, según la auditoría — usar ese como plantilla).
  2. Agregar `@map("is_email_verified")`, `@map("last_seen")`, `@map("deleted_at")` a los 4 campos afectados, y a cualquier otro campo multi-palabra que el grep encuentre sin mapear.
  3. `npx prisma format && npx prisma validate`.
  4. `npx prisma migrate dev --name fix_column_mapping_camelcase` en la BD de dev — **si esto genera una migración destructiva** (DROP/rename de columna con datos), pausar y confirmar con el humano antes de aplicar, porque puede haber datos de dev/seed que no importan pero el patrón debe respetarse igual.
  5. Usar `systematic-debugging`: reproducir el bug primero (`prisma migrate deploy` en BD vacía → `POST /verify-email` → confirmar 500) y **después** confirmar que el fix lo resuelve, no al revés.
- **Gate CI nuevo (alternativa superior de la auditoría):** agregar step en `ci.yml` que corra `npx prisma migrate status` (o un shadow-diff) y falle el build si hay drift schema↔migraciones. Esto previene que este bug vuelva a pasar desapercibido.
- **Aceptación:** `prisma migrate deploy` en BD vacía + llamar `/verify-email`, `/availability`, `GET /consultations/:id`, `GET /consultations/:id/messages`, `getConsultationHistory`, `getPetVetCard` → todos 200/comportamiento esperado, cero "column does not exist". CI falla si se reintroduce drift.

### F1-3 — P0-02: Arrancar tests de cliente (el gap más grande de todo el proyecto)
Esto es grande, así que en F1 solo el **scaffolding + primeros tests críticos**; la suite completa es F5.
- **Web:** instalar Vitest + React Testing Library. Primer test real (no trivial): `ProtectedRoute` (redirect si no hay sesión) + flujo de login. Agregar script `"test": "vitest run"` a `web/package.json`.
- **Mobile:** instalar Jest + RTL (o `jest-expo`). Primer test real: `authStore` (login/logout/token refresh) — es el componente que más rompe silenciosamente según la auditoría.
- **CI:** agregar jobs `web-test` y `mobile-test` a `ci.yml` (aunque al principio cubran poco, deben existir y correr en cada PR desde hoy — así no vuelve a pasar que "los tests en verde enmascaran una feature inerte", como dice P1-08).
- **Usar `tdd`:** para cada test nuevo, escribir el test primero contra el comportamiento esperado, confirmar que falla si el bug existe, y solo entonces tocar el código si hace falta.
- **Aceptación:** `cd web && npm test` y `cd mobile && npm test` corren (ya no "missing script"); al menos 2 tests reales por cliente pasan en CI; los jobs aparecen en el pipeline.

### F1-4 — Checkpoint `grill-with-docs`
Antes de pasar a Fase 2: releer P0-01 y P0-02 contra el código ya tocado. Confirmar con el humano si la migración de F1-2 fue destructiva o limpia.

---

## FASE 2 — P1 (producto usable) + quick wins de seguridad/CI del roadmap "7 días"

Categorías que sube: **Producto (62→↑), Mobile (68→↑), Frontend (74→↑), Seguridad (80→↑), DevOps (63→↑)**.

### F2-1 — P1-03: Registro de veterinarios (implementar ADR-009)
- **Qué:** `backend/src/modules/auth/auth.service.ts` (hardcodea `role: 'CLIENT'`), `registerSchema`, `web/src/pages/RegisterPage.tsx:90-91` (envía `role:"VET"` que hoy se ignora), `auth.test.ts` (afirma algo que no es cierto — corregir el test para que refleje el comportamiento real y el nuevo flujo).
- **Cómo:** implementar ADR-009 — aceptar `role` en registro, crear VET con `vetStatus: PENDING`, endpoint admin de aprobación, filtrar `listVets`/asignación por `APPROVED`. Actualizar copy en `RegisterPage.tsx` para explicar el estado pendiente.
- **Aceptación:** registrarse como VET → usuario creado con rol VET real y `vetStatus=PENDING`; no aparece en cola/directorio hasta aprobación; `PATCH /api/admin/vets/:id/approve` lo activa; test actualizado y verde reflejando el flujo real (no el que estaba mal documentado).

### F2-2 — P1-04: Rating mobile 1–10 vs 1–5
- **Qué:** `mobile/src/components/RatingStars.tsx:16`, `mobile/src/types/index.ts:249-253`, `app/(app)/history/index.tsx`.
- **Cómo (alternativa superior de la auditoría):** `RatingStars` recibe `max` derivado del schema (`rateConsultationSchema`), una sola fuente de verdad — no hardcodear 5 en el componente también, importar el límite del schema compartido.
- **Aceptación:** calificar con 5 estrellas máximo disponibles; reviews guardadas (1-5) se muestran llenas correctamente, no "a medias"; enviar rating nunca dispara 400.

### F2-3 — P1-05: Acción "Historial clínico" muerta en web
- **Qué:** `web/src/components/dashboard/HomeSection.tsx:71` navega a `history`; `web/src/pages/DashboardPage.tsx:80-90` `renderSection` no tiene case `history`.
- **Cómo (alternativa superior):** promover Historial a tab/route de primer nivel en vez de un case más del switch, para que sea "siempre alcanzable" como dice la auditoría, no solo parcheado.
- **Aceptación:** desde Home, click en "Historial clínico" navega y renderiza `HistorySection` real, con URL propia (deep-linkeable).

### F2-4 — P1-06: `getManagedPets` DISTINCT ON roto
- **Qué:** `backend/src/modules/pets/pets.service.ts:114-122`, `distinct:['petId']` con `orderBy:{updatedAt:'desc'}`.
- **Cómo (alternativa superior de la auditoría, preferible al parche):** reemplazar por `prisma.pet.findMany({ where: { consultations: { some: { vetId } } } }, paginado)` en vez del parche de doble `orderBy`.
- **Aceptación:** `GET /pets/managed` como VET devuelve 200 con lista correcta y paginada, no 500.

### F2-5 — P1-07: Authz de mascota/PII (implementar ADR-010)
- **Qué:** `backend/src/modules/pets/pets.controller.ts:78-112`, `pets.service.ts:17-22,124-162`, `users.service.ts` (listas exponen email/phone a todos). Mismo fix cubre **P2-20**.
- **Cómo:** aplicar ADR-010 — requerir relación de consulta (actual o histórica) o pertenencia a "gestionadas" para devolver PII completa; en listados (`listVets`, directorio) redactar `email`/`phone`.
- **Aceptación:** VET sin consulta con una mascota → `GET /api/pets/:id` no devuelve `email`/`phone` del dueño (403 o payload redactado, a decidir por consistencia con el resto de la API); VET con consulta activa/histórica → ve todo; test de authz negativa nuevo cubre este caso (alimenta F5).

### F2-6 — P1-08: Cola auto-asignada / presencia — cablear en cliente
- **Qué:** `web/src/services/endpoints.ts:20` (`updateAvailability` definido, 0 llamadores), 0 referencias a `availability|isOnline` en `mobile/src`, `backend/src/modules/users/users.routes.ts:25`, `consultations.service.ts:199-229`.
- **Cómo:** agregar toggle de disponibilidad en `VetHomeSection`/`VetDashboardPage` (web) y pantalla equivalente en mobile, que llamen a `updateAvailability`. Esto es el fix mínimo viable hoy; la versión "presencia dirigida por sockets" (P2-03, más robusta) es F3.
- **Aceptación:** vet togglea "disponible" → consulta WAITING existente se auto-asigna sin intervención manual; test de cliente que cubre el toggle (alimenta F5); docs corregidos si decían "Hecho" sin estarlo.

### F2-7 — Quick wins de seguridad y CI del roadmap "7 días"
Cada uno es bajo esfuerzo, hacerlos todos en este bloque:
- `/metrics` sin auth → `app.ts:141-149`: envolver con `authorize(ADMIN)` + rate-limit (resuelve P2-13).
- JWT sin algoritmo pinneado → `auth.middleware.ts:36`: agregar `algorithms:['HS256']` + issuer/audience (resuelve P2-57).
- Enumeración de cuentas en registro → `auth.controller.ts:38-43`: respuesta uniforme 201/202 sin filtrar si el email ya existe (resuelve P2-17).
- `railway.json` ausente → commitear con service/projectId (resuelve P2-43).
- `eas.projectId` vacío → `mobile/app.json:58`: setear valor real; agregar job mobile de CI (typecheck+lint+build) (resuelve P2-45). **Si no hay projectId real disponible, señalar al humano — no inventar uno.**

**Aceptación de F2-7:** cada ítem tiene su test o verificación manual documentada; ningún endpoint sensible responde sin auth; CI tiene job mobile.

### F2-8 — Checkpoint `grill-with-docs`
Releer P1-03/07/08 contra el código tocado; confirmar que los ADRs 009/010 quedaron reflejados fielmente en la implementación, no solo en el documento.

---

## FASE 3 — P2 de alto impacto (confiabilidad, escalabilidad, seguridad media)

Categorías que sube: **Performance (60→↑), Escalabilidad (58→↑), Seguridad (80→↑), Backend/rt (62→↑)**.

### F3-1 — Unificar envío de mensajes + eliminar 500-on-retry (P2-01)
- **Qué:** `consultations.controller.ts:287-316` vs `chat.gateway.ts` — rate-limit y dedup solo viven en el evento socket muerto, no en el path REST real.
- **Cómo:** un solo servicio de envío con rate-limit + dedup compuesto `(consultationId, clientMsgId)` (ver también P2-38 abajo); en colisión P2002 devolver el mensaje existente en vez de 500.
- **Aceptación:** reintentar el mismo `clientMsgId` vía REST no produce 500 ni duplicado; test de idempotencia.

### F3-2 — Reconnect refetch + flush global mobile (P2-02, P2-26)
- **Qué:** `mobile/src/hooks/useConsultations.ts:134-139,138`; `services/index.ts:66-85`.
- **Cómo:** en `onReconnect`, invalidar queries de mensajes + `flushOutbox`; agregar estado visible "Enviado sin conexión" + flush global al volver a foreground (`AppState`), no solo con el chat montado.
- **Aceptación:** mensaje enviado offline aparece con estado correcto y se sincroniza al reconectar sin desaparecer de la UI.

### F3-3 — Presencia por socket + heartbeat + force-disconnect (P2-03, P2-04) — mejora sobre F2-6
- **Qué:** `chat.gateway.ts:101-123,125-235`; `users.controller.ts:103-139`; `auth.service.ts:54-57`.
- **Cómo:** `isOnline=true` en connect, `false` tras período de gracia en disconnect + heartbeat; mapa `userId→socketIds` para `socket.disconnect(true)` en logout/revocación de token.
- **Aceptación:** cerrar pestaña → vet pasa a offline tras el período de gracia (no queda "online" indefinidamente); logout invalida el socket inmediatamente.

### F3-4 — Redis obligatorio en prod (implementar ADR-011)
- **Qué:** `chat.gateway.ts:79-99`.
- **Cómo:** fail-fast al boot si `NODE_ENV=production` y falta `REDIS_URL`; documentar sticky sessions en `docs/DEPLOY.md`.
- **Aceptación:** boot en modo producción sin `REDIS_URL` → falla explícitamente con mensaje claro, no falla en silencio en runtime.

### F3-5 — `listVets` re-arquitectura + índices (P2-06, P2-08, P2-09, P2-10)
- **Qué:** `backend/src/modules/users/users.service.ts:93-170,104-167,172-200`; `prisma/schema.prisma:96-120`.
- **Cómo:** paginación real en DB (no post-fetch), `groupBy _avg` para ratings en vez de cargar todas las reviews, `@@index([role,isOnline,createdAt])` y `@@index([petId])` en `Consultation`, denormalizar `ratingAvg` si el volumen lo justifica.
- **Aceptación:** `listVets` con 10k+ vets simulados no hace full scan (verificar con `EXPLAIN ANALYZE`); `totalPages` consistente con `minRating` aplicado.

### F3-6 — Paginación de mensajes + soft-delete correcto (P2-07, P2-11)
- **Qué:** `consultations.service.ts:48-54`.
- **Cómo:** paginar mensajes con cursor en vez de devolver todo el historial en el snapshot; agregar `where:{deletedAt:null}` también al include de `messages`.
- **Aceptación:** consulta con miles de mensajes no trae todo de una; mensaje borrado no reaparece.

### F3-7 — Seguridad de sesión: refresh token + S3 + uploads (P2-16, P2-18, P2-37, P2-53)
- **Refresh en body → XSS (P2-16):** `auth.service.ts:40-48,132-159`, `auth.controller.ts:80` — no devolver refresh en body; store server-side + detección de reuso.
- **S3 URLs públicas (P2-18):** `storage.ts:15-42`, `app.ts:151-182` — bucket privado + presigned URLs cortas + `Content-Disposition`. **Resolver primero si `STORAGE_PROVIDER=s3` está realmente en uso hoy (dudas §11.3) — si no, documentar como "aplica cuando se active S3" y no bloquear la fase.**
- **Path traversal en `/uploads` (P2-37):** `app.ts:153-176` — `path.resolve` + `startsWith(UPLOADS_DIR+sep)`, rechazar `..`.
- **Call token en query params (P2-53):** `web/src/pages/CallPage.tsx:22-27` — `postMessage`-only o handle firmado de un solo uso.
- **Aceptación:** ningún token sensible viaja en body de respuesta ni en query string; intento de `../../etc/passwd` en `/uploads` es rechazado con 4xx, no 500 ni acceso.

### F3-8 — Cookie cross-origin + connection pool + shutdown (P2-15, P2-12)
- **Qué:** `auth-cookies.ts:8-13`; `shared/prisma.ts:7-9`, `server.ts`.
- **Cómo:** confirmar si prod es same-site o cross-origin (dudas §11.4); si cross-origin, `sameSite:'none';secure`, si no, documentar como same-origin explícitamente. `connection_limit=10&pool_timeout=20` en `DATABASE_URL` (reconciliar con P2-55: hoy hay 1 vs 10 contradictorio entre `PRODUCTION_DEPLOYMENT.md:40` y `.env.example:10` — unificar en 10); `$connect`/`$disconnect` explícitos en boot/shutdown.
- **Aceptación:** login funciona correctamente en la topología real de prod (cross-origin o same-origin, según se confirme); shutdown limpio sin conexiones colgadas.

### F3-9 — Checkpoint `grill-with-docs` + `systematic-debugging`
Para cada fix de concurrencia/WS de esta fase, reproducir el bug original antes de dar por resuelto (no confiar en que "se ve bien").

---

## FASE 4 — Media persistente, CI/CD gates, staging (DevOps → ≥90)

Categorías que sube: **DevOps (63→↑)**.

### F4-1 — Media a S3/Cloudinary persistente (P2-46)
- **Qué:** `media.service.ts` (hoy disco local, efímero en PaaS).
- **Cómo:** `STORAGE_PROVIDER=s3` + volumen persistente o bucket real; combinar con el hardening de F3-7 (bucket privado, presigned URLs).
- **Aceptación:** redeploy no borra media subida; imagen clínica accesible solo vía presigned URL de corta duración.

### F4-2 — CI gates reales (P2-40, P2-41, P2-42)
- **Qué:** `jest.config.js`, `ci.yml:26,48-51,71-93`.
- **Cómo:** `collectCoverageFrom` en jest config (cobertura real, no engañosa); renombrar job `backend-unit` correctamente; Postgres efímero como service container en CI (no depender de Postgres externo); hacer `npm audit`/gitleaks **bloqueantes** en `main` (quitar `continue-on-error`/`|| true`).
- **Aceptación:** PR con vulnerabilidad conocida o secreto expuesto falla el CI, no solo lo reporta.

### F4-3 — Deploy web + staging + rollback (P2-44, P2-47)
- **Qué:** `ci.yml` (deploy web fuera de CI, sin `vercel.json`); `ci.yml:95-108` (deploy directo a `main`→prod sin staging).
- **Cómo:** `vercel.json` con rewrites → `index.html` (fix SPA deep-links 404); entorno de staging + aprobación manual antes de prod; migraciones retrocompatibles; plan de rollback documentado y **probado** (no solo escrito) en `docs/PRODUCTION_DEPLOYMENT.md` / `docs/HOTFIX_PROTOCOL.md`.
- **Aceptación:** deep-link directo a una ruta de la SPA en prod no da 404; un deploy simulado a staging requiere aprobación antes de promoverse; rollback ejecutado una vez en staging como prueba.

### F4-4 — Observabilidad mínima (P2-48)
- **Qué:** `Dockerfile`, `app.ts`.
- **Cómo:** `HEALTHCHECK` de contenedor; exportar métricas (ya protegidas por F2-7); alerta básica sobre caída de `/health`.
- **Aceptación:** contenedor reporta salud vía `HEALTHCHECK`; hay al menos un canal de alerta configurado (aunque sea simple, ej. webhook a Slack/email) si `/health` falla N veces seguidas.

---

## FASE 5 — Cobertura de tests completa (cierra P0-02 definitivamente)

Categorías que sube: **Testing (62→≥90)**.

### F5-1 — Suite web completa
Vitest + RTL cubriendo como mínimo: auth (login/logout/refresh), `ProtectedRoute`, envío de mensaje + dedup optimista, redirect en 401, toggle de disponibilidad (F2-6), acción historial clínico (F2-3), rating (si aplica en web).

### F5-2 — Suite mobile completa
Jest + RTL/jest-expo cubriendo: `authStore`, dedup en `useConsultations`, cola offline/outbox (F3-2), `RatingStars` con `max` correcto (F2-2).

### F5-3 — Backend: cerrar gaps específicos que la auditoría marca como ausentes
El brief dice "NO hay tests de WebSocket, authz negativa, ni concurrencia" — la auditoría dice que sí hay tests de concurrencia y WS (~173 casos). **Resolver esta discrepancia primero** con `npx jest --listTests` y `grep` de nombres de test antes de escribir tests redundantes. Priorizar los gaps reales:
- Authz negativa para F2-5 (VET sin relación de consulta no accede a PII).
- Concurrencia en el nuevo endpoint unificado de F3-1.
- WS: reconexión, force-disconnect (F3-3).

### F5-4 — 1 E2E Playwright (bajo supervisión, riesgo Snyk alto según el brief)
Flujo: registro → consulta → chat → rate, corriendo contra web y, si el tiempo alcanza, un smoke equivalente en mobile (Detox o Playwright si aplica). **Advertir al humano antes de instalar/usar `playwright-cli`**, por la nota de riesgo del brief §5.

**Aceptación de F5:** `npm test` en `web/`, `mobile/`, `backend/` todos verdes en CI; cobertura reportada (no solo "corre"); 1 E2E verde de punta a punta.

---

## FASE 6 — Deuda de código, a11y, UX, documentación (cierra el resto del TOP 20 y P3)

Categorías que sube: **Código (71→↑), UI/UX (72/68→↑), Accesibilidad (64→↑), Documentación (68→↑), Arquitectura (70→↑), Innovación (60→↑)**.

### F6-1 — Accesibilidad web (P2-29, P2-30, P2-31)
Modales con `role="dialog"` + Escape + focus-trap (primitivo propio o Radix/Headless UI); `outline-style:solid` o `ring-2` visible en focus; subir contraste de texto (`slate-500+`, reservar `400` para decorativo). Recorrer todos los modales listados (`VetMessagesSection.tsx:871-919`, `DirectorySection.tsx:330`, etc.) y confirmar el patrón se aplica de forma consistente, no solo en el primero.

### F6-2 — Consolidación de código muerto/duplicado (P2-27, P2-28, P2-51, P2-52, P2-54)
- Chat web duplicado (~1000 LOC) → extraer `ChatPane` parametrizado (`MessagesSection.tsx` vs `VetMessagesSection.tsx`).
- Doble estado (RQ + `chatStore` + `realtime.ts`) → unificar en React Query + invalidación por socket; borrar caches muertos.
- Columnas redundantes (`weight`/`weightKg`, `age`/`birthDate`) → una fuente de verdad, derivar en runtime.
- `as any` en `pets.service.ts:48,87`, `chat.gateway.ts` → tipos reales (Prisma types, `AuthenticatedSocket`).
- `packages/shared` documentado como adoptado pero 0 imports → **decisión explícita**: dado que el brief y la auditoría coinciden en "no aporta hoy", marcarlo formalmente como no adoptado en ADR-008 (ya existe) y en `TECH_REFERENCE.md`, en vez de dejarlo ambiguo.

### F6-3 — UX/UI restante (P2-32, P2-33, P2-34, P2-35, P2-56, dark mode P2-21, deep links P2-22)
- Botones de auth que no hacen nada (Google/Apple/forgot) → deshabilitar con tooltip explicativo o implementar.
- `tailwindcss-animate` referenciado pero no instalado → instalar o reemplazar por keyframes existentes.
- Code-splitting de rutas web (`React.lazy`+`Suspense`).
- Cachear fetches por sección con `useQuery`+`staleTime`.
- Tabs de vet dashboard documentados (Ofertas/Cola/Activas) que no existen en código → implementarlos (mejor, dado que F2-6/F3-3 ya cablean la lógica de base) o corregir la documentación, decidir según tiempo disponible.
- Dark mode mobile (`app.json:9`, `ThemeProvider.tsx:21-22`) → `userInterfaceStyle:"automatic"` o toggle persistido.
- Deep links (`app.json:8`, `deepLink.ts` con 0 usos) → manejar `vetconnect://call/:id` y `chat/:id`, usarlos desde la web para el handoff "abrir en la app".

### F6-4 — Mobile: batería, uploads, cache (P2-23, P2-24, P2-25)
Desconectar socket al salir del chat / en background (`AppState`); timeout de upload 120s + `onUploadProgress` + resize; imágenes médicas cacheadas sin cifrar → `cachePolicy="memory"` o cifrado + limpieza en logout.

### F6-5 — Reconciliación de documentación (P2-55, P2-56, F20 de la tabla TOP 20)
Contar tests reales vía `jest --listTests` y actualizar todos los docs con el número correcto (no 159 ni 173 de memoria); decidir y declarar **un** deploy canónico (Koyeb vs Railway — el brief dice "Railway CI/CD activo / Koyeb recomendado", contradictorio) en `docs/DEPLOY.md`; unificar `connection_limit` (F3-8); corregir cualquier feature marcada "Hecha" que no lo estaba (P1-08, tabs de vet).

**Aceptación de F6:** `npx tsc --noEmit` sin errores en las 3 capas; lint limpio; ningún `as any` nuevo introducido; docs actualizados en el mismo PR que el código que describen (regla del brief §6.5).

---

## FASE 7 — Cierre: re-auditoría interna antes de la oficial

### F7-1 — Auto-checklist contra la Definition of Done del brief (§9)
Recorrer cada ítem de `AI_TECHLEAD_BRIEF.md` §9 y marcar explícitamente hecho/no hecho con evidencia (no autoevaluación vaga):
- [ ] Secretos rotados + `.env` fuera de git — **esto sigue siendo del humano, no de la IA ejecutora** (guardarraíles §7). Señalar como pendiente si no se hizo.
- [ ] `eas.json`/`app.json` con HTTPS real y `projectId` (F2-7).
- [ ] CORS WS restrictivo y `/uploads` tras auth verificado (F3-7).
- [ ] Media persistente firmada (F4-1).
- [ ] `packages/shared` — decisión formalizada, no necesariamente adoptado (F6-2).
- [ ] Tests WS/authz negativa/concurrencia + E2E verde (F5).
- [ ] Observabilidad mínima (F4-4).
- [ ] Deploy con dominio/HTTPS, rollback probado, backup de BD (F4-3 + humano para dominio real).
- [ ] Docs reflejan estado final (F6-5).

### F7-2 — Simular la auditoría con las mismas skills que la usó el auditor original
Antes de pedir la re-auditoría real, correr una pasada propia con `systematic-debugging` + `error-handling-patterns` + `api-design-principles` + `frontend-design` sobre los 20 ítems del TOP 20 original y confirmar que cada uno tiene evidencia de estar resuelto (test verde, endpoint probado manualmente, screenshot de a11y, etc.), no solo "código escrito".

### F7-3 — Reporte final para el humano
Documento corto (no otra auditoría de 300 líneas): qué se hizo, qué quedó pendiente y por qué (ej. dominio real de producción, rotación de secretos — cosas que son del humano por diseño), y los 3 ADRs nuevos para que el humano confirme o corrija las decisiones por defecto (F1-1).

---

## Mapa rápido: Fase → Categorías de score que mueve

| Fase | Categorías impactadas |
|---|---|
| F1 (P0) | Base de Datos, Backend, Testing (arranque) |
| F2 (P1 + quick wins) | Producto, Mobile, Frontend, Seguridad, DevOps |
| F3 (P2 alto impacto) | Performance, Escalabilidad, Seguridad, Backend/rt |
| F4 (DevOps/CI/CD) | DevOps |
| F5 (Tests completos) | Testing |
| F6 (Deuda/UX/a11y/docs) | Código, UI, UX, Accesibilidad, Documentación, Arquitectura, Innovación |
| F7 (Cierre) | Verificación cruzada de todo lo anterior |

## Lo que NO se toca hoy (sobreingeniería, según la propia auditoría §7 "Qué NO tocar")
Microservicios/GraphQL/event-sourcing, Kubernetes, i18n completo, features de IA sin caso validado, reescritura forzada de `packages/shared`, abstracciones DDD sobre módulos ya cohesionados. Si la IA ejecutora se encuentra tentada a hacer algo de esta lista "ya que está", debe frenar y consultar al humano — no es gratis en tiempo hoy.

## Lo que NO puede resolver la IA ejecutora (es del humano, marcarlo así y seguir)
- Rotar `JWT_SECRET`/credenciales Supabase reales.
- Purgar historial de git (`git filter-repo`/BFG) — requiere confirmación explícita y por escrito.
- Dominio real + HTTPS de producción.
- Decisión final si los ADRs 009/010/011 se quedan como están o el humano prefiere otra política.
