# AUDITORÍA INTEGRAL — VetConnect (Full Stack + UX/UI + Producto + Arquitectura)

> **Fecha:** 14-ago-2026 · **Autor:** equipo multi-persona simulado (Staff Full Stack, Backend, Frontend, Mobile, Architect, DevOps/SRE, Security, DB, QA, UX/UI, Product, Performance, Accessibility) actúando bajo estándares FAANG.
> **Base:** repo completo (`backend/`, `web/`, `mobile/`, `packages/shared/`, `prisma/`, `docs/`), commit `36d76f0` (P0→P3 resueltos).
> **Regla `.env`:** ningún `.env` fue abierto ni inspeccionado. Solo `.env.example` y configuración no sensible.

## Metodología y skills aplicadas

- **`systematic-debugging`** (obra/superpowers): para cada bug se exige *root cause* antes de solución; se documenta hipótesis y se prefiere test que reproduce.
- **`grill-with-docs`** (mattpocock): la documentación es fuente de verdad; donde doc y código difieren, se marca (ver §Docs-vs-Código) y se propone ADR.
- **`api-design-principles`** (wshobson): recursos,nombres plurales, semántica HTTP, versionado, paginación, formato de error consistente, rate limit.
- **`error-handling-patterns`** (wshobson): envelope de error uniforme, fail-fast, sin fugas de PII.
- **`tdd`** (mattpocock): se identifican las áreas críticas sin cobertura y se exige test que falle primero.
- **`frontend-design`** (anthropics): estados (loading/empty/error), jerarquía, accesibilidad, responsive.

---

## 1. Resumen ejecutivo

VetConnect es un MVP **sorprendentemente maduro para un proyecto académico**: arquitectura modular limpia, auth con JWT + `tokenVersion` (revocación real), gateway Socket.io con autorización por consulta y dedup durable, `/uploads` protegido, rate limiting, helmet, y 159 tests de backend. Tras la ronda P0→P3 (commit `36d76f0`) los críticos de código están cerrados.

**Pero no es apto para producción real hoy** por tres razones duras:
1. **Seguridad de borde (P0 manual):** secretos expuestos en historial de git → deben rotarse y purgarse.
2. **Configuración mobile rota para prod:** `mobile/src/lib/env.ts:48` fija `http://localhost:3001` para la plataforma `web`, y `mobile/eas.json` apunta el WS a `/ws/queue` mientras el servidor escucha en `/socket.io` → en un build real el socket **no conecta**.
3. **Falta observabilidad, media persistente y tests de tiempo real/authz/concurrencia.**

## 2. Score global

**Global: 67 / 100** — *“Sólido para MVP/portfolio; requiere trabajo dirigido antes de usuarios reales.”*

| Dimensión | Score | Nota corta |
|-----------|------:|-----------|
| Arquitectura | 72 | Modular, clara, pero `packages/shared` no adoptado |
| Backend | 75 | Express/Prisma limpio, auth sólida |
| Frontend (Web) | 68 | React+Vite correcto, falta optimistic UI y a11y profunda |
| Mobile | 66 | Expo bien estructurado; config rota y offline débil |
| Database | 70 | Schema razonable; faltan índices compuestos y pool tuning |
| Seguridad | 68 | Fuerte en código; P0 manual (secretos/git) pendiente |
| Performance | 65 | Sin N+1 graves pero sin caché de lectura ni paginación cursor |
| Escalabilidad | 60 | Estado en memoria del gateway; media efímera; pool Supabase |
| UX | 70 | Flujos claros; fricción en onboarding y feedback |
| UI | 68 | Consistente; detalles de contraste/espaciado |
| Accesibilidad | 62 | Mejoró con P3; falta foco, alt, contraste, semántica |
| Testing | 58 | 159 backend; **0** WS / authz negativa / concurrencia / web / mobile |
| DevOps / SRE | 55 | Sin CI confirmado, sin métricas, media efímera |
| DX | 70 | Scripts claros, `db push` documentado, monorepo ok |
| Documentación | 72 | Recién corregida; pequeñas inconsistencias restantes |
| Código | 74 | SOLID/DRY mayormente; algunos magic strings |
| Producto | 72 | Resuelve el problema core; oportunidades de valor |
| Innovación | 60 | Conservador; margen para diferenciarse sin “IA por moda” |

---

## 3. Estado actual (lo que SÍ está resuelto)

Commit `36d76f0` (14-ago) cerró P0→P3 de `CODE_AUDIT.md`:
- Registro solo `CLIENT` (rol fijo, ignora input).
- `password` excluido de respuestas (`getUserById`).
- Revocación de sesiones por `tokenVersion` (logout + validación en socket).
- `/uploads/*` tras auth + participación en consulta (`app.ts:129`).
- Rutas admin con `authorize()` (no solo `authenticate`).
- `completeConsultation` atómico (`updateMany` status+rating) y `createReview` → 409 si duplicado.
- Dedup de mensajes: `Message.clientMsgId` único + verificación durable en gateway (`chat.gateway.ts:155`).
- Cuota diaria de media (429) y validación de tipo/tamaño.
- UX/a11y web+mobile (input accesible, `/call` protegido, `app.json` `userInterfaceStyle: light`, singleton socket, `expo-image`).

**No reitero esos como bugs; se auditan las deudas restantes.**

---

## 4. Hallazgos (formato: Problema · Ubicación · Por qué importa · Severidad · Reproducir · Solución · Alternativa superior · Impacto)

### 4.1 Seguridad

**S-01 — Secretos en historial de git (rotación + purge pendiente).**
- *Ubicación:* `backend/.env`, `web/.env`, `mobile/.env` (fuera de git hoy, pero sus valores estuvieron commiteados).
- *Por qué importa:* un actor con el historial puede acceder a BD y firmar JWT.
- *Severidad:* **P0 (crítico, manual).**
- *Reproducir:* `git log --all -- .env` muestra commits previos.
- *Solución:* rotar `JWT_SECRET` y credenciales Supabase; `git filter-repo`/BFG para purgar; luego re-clonar.
- *Alternativa superior:* Secret Manager (Vault/SSM) + rotación automática; never-in-repo.
- *Impacto:* elimina la vía de compromiso total.

**S-02 — CORS de WebSocket no valida wildcard como `app.ts`.**
- *Ubicación:* `backend/src/modules/consultations/chat.gateway.ts:31-34` (usa `corsOrigins` con `credentials:true` sin el chequeo `!includes('*')` que sí hace `app.ts:49`).
- *Por qué importa:* si alguien pone `CORS_ORIGIN=*` el HTTP lo bloquea pero el socket permitiría credenciales cross-origin.
- *Severidad:* **P2.**
- *Solución:* reusar la misma lógica de `allowCredentials` del app.
- *Alternativa superior:* origins explícitos por entorno; fallar si `*` + credentials.
- *Impacto:* cierra un agujero de configuración.

**S-03 — `/api/users/admin-only` expone el payload del JWT.**
- *Ubicación:* `backend/src/modules/users/users.routes.ts` (ADMIN only).
- *Por qué importa:* endpoint de debug que filtra PII del token; innecesario en prod.
- *Severidad:* **P3** (ya está bajo ADMIN, pero es superficie innecesaria).
- *Solución:* eliminar o mover a `/debug` desactivable por flag.
- *Impacto:* reduce superficie.

**S-04 — Forgot-password puede permitir enumeración/abuse.**
- *Ubicación:* `auth.routes.ts` → `forgot-password`.
- *Por qué importa:* si responde distinto para email existente, enumera cuentas; si envía email en cada llamada, es abusable (spam/notification fatigue).
- *Severidad:* **P2** (verificar comportamiento actual; el registro ya es genérico 409).
- *Solución:* respuesta siempre genérica + rate limit estricto + throttling de envío.
- *Impacto:* anti-enumeración y anti-abuse.

### 4.2 Backend / API

**A-01 — Sin versionado de API (`/api/v1`).**
- *Ubicación:* `backend/src/app.ts:120-126`.
- *Por qué importa:* cualquier cambio breaking rompe web/mobile en prod sin poder coexistir.
- *Severidad:* **P2.**
- *Solución:* prefijo `/api/v1` ahora; deprecación gradual.
- *Alternativa superior:* versionado en header `Accept` para clientes avanzados.
- *Impacto:* permite evolución segura.

**A-02 — Envelope de error inconsistente en algunos controladores.**
- *Ubicación:* `shared/errors` (`AppError` → `{success:false,message}`) vs respuestas de éxito que no siguen `{success:true,data}`.
- *Por qué importa:* el frontend debe inferir éxito por status, no por envelope uniforme.
- *Severidad:* **P2.**
- *Solución:* middleware que normalice éxito y error al mismo shape (`ApiResponse<T>` de `packages/shared`).
- *Impacto:* cliente más robusto y menos bugs de parsing.

**A-03 — Paginación por `take` sin cursor en listas grandes.**
- *Ubicación:* `consultations.service.ts:270,296,366`, `notifications.service.ts:23`, `pets.service.ts:10`.
- *Por qué importa:* con 10k+ consultas, `take` sin cursor re-lee desde el inicio y es O(n) en offset.
- *Severidad:* **P2** (escalabilidad).
- *Solución:* cursor basado en `id`/`createdAt` (`WHERE (createdAt,id) < (last)`).
- *Alternativa superior:* keyset pagination + índice compuesto.
- *Impacto:* listas O(1) en cualquier tamaño.

**A-04 — Broadcast de push a todos los vets sin límite.**
- *Ubicación:* `notifications.service.ts:115` (`prisma.user.findMany` para rol VET) + `:101` tokens.
- *Por qué importa:* notificar a *todos* los vets en cada consulta nueva no escala y es ruido.
- *Severidad:* **P2.**
- *Solución:* notificar solo a vets *online* (tabla de presencia) y/o por especialidad mascota.
- *Impacto:* menor costo y mejor SNR para vets.

**A-05 — `assign` concurrente: verificar manejo de `updateMany` count=0.**
- *Ubicación:* `consultations.service.ts:205-226` (`updateMany` con `where:{status:'WAITING'}`).
- *Por qué importa:* dos vets reclamando a la vez — si no se chequea `count===0` se responde 200 al perdedor.
- *Severidad:* **P1** (race condition real bajo carga).
- *Solución:* devolver 409 si `updateMany` afectó 0 filas (ya tomada).
- *Alternativa superior:* `SELECT … FOR UPDATE` / transacción con check atómico.
- *Impacto:* una sola asignación ganadora siempre.

### 4.3 Base de datos

**D-01 — Índices compuestos faltantes en `Message`.**
- *Ubicación:* `prisma/schema.prisma` (`Message`: `consultationId`, `createdAt`, `clientMsgId` único).
- *Por qué importa:* el historial (`WHERE consultationId ORDER BY createdAt`) y la búsqueda de dedup necesitan índice `(consultationId, createdAt)` y `(consultationId, clientMsgId)`.
- *Severidad:* **P2.**
- *Solución:* añadir `@@index([consultationId, createdAt])`; el único de `clientMsgId` ya existe.
- *Impacto:* historial y dedup O(log n).

**D-02 — Pool de Supabase con `connection_limit=1`.**
- *Ubicación:* `backend/.env.example` / `DATABASE_URL` (pooler 6543).
- *Por qué importa:* 1 conexión serializa queries; bajo concurrencia se encolan.
- *Severidad:* **P1** (escalabilidad inmediata a ~100 usuarios).
- *Solución:* subir `connection_limit` y usar `DIRECT_URL` para migraciones; considerar PgBouncer en transacción mode para queries.
- *Impacto:*吞吐 multiplicado.

**D-03 — `User.lastSeen` podría escribir en cada request.**
- *Ubicación:* presencia (`lastSeen`); verificar dónde se actualiza.
- *Por qué importa:* update por request = amplificación de writes.
- *Severidad:* **P3.**
- *Solución:* actualizar lastSeen con throttle (ej. cada 60s) o solo en eventos de negocio.
- *Impacto:* menos write load.

**D-04 — Sin borrado suave en `Consultation`/`Message`.**
- *Ubicación:* schema.
- *Por qué importa:* auditoría médica legalmente sensible; borrar físicamente pierde trazabilidad.
- *Severidad:* **P2** (producto/legal).
- *Solución:* `deletedAt` en Consultation/Message o archivo inmutable.
- *Impacto:* cumplimiento y recuperación.

### 4.4 Tiempo real (Socket.io)

**R-01 — Estado del gateway en memoria no compartido entre instancias.**
- *Ubicación:* `chat.gateway.ts:11,14` (`rateLimitMap`, `MSG_DEDUP` en `Map` por proceso).
- *Por qué importa:* con >1 instancia (escalado horizontal), rate limit y dedup en memoria se saltan; el dedup *durable* (DB) salva mensajes pero no el rate limit.
- *Severidad:* **P1** (escalabilidad).
- *Solución:* Redis para rate limit + adapter Redis (ya hay código opcional en `:39`). Instalar `@socket.io/redis-adapter` + `ioredis`.
- *Alternativa superior:* usar el adapter siempre en prod y un rate-limiter distribuido (Redis token bucket).
- *Impacto:* comportamiento idéntico en N instancias.

**R-02 — Path del WS en `eas.json` no coincide con el servidor.**
- *Ubicación:* `mobile/eas.json:15,26,35` → `ws://…/ws/queue`; servidor en `/socket.io` (`chat.gateway.ts:30`).
- *Por qué importa:* en build de producción el socket **nunca conecta** → cero chat en vivo en dispositivos reales.
- *Severidad:* **P0 para mobile en prod.**
- *Solución:* usar `EXPO_PUBLIC_WS_URL=wss://api…/socket.io` (mismo path que el server).
- *Impacto:* chat en vivo funcional en release.

**R-03 — Entrega en tiempo real no garantizada si el destinatario está desconectado.**
- *Ubicación:* `chat.gateway.ts:179` (`io.to(room).emit`).
- *Por qué importa:* si el vet está offline, no recibe el push en tiempo real (sí al reabrir, porque el cliente recarga historial).
- *Severidad:* **P2** (depende de que el cliente recargue historial al abrir).
- *Solución:* al conectar, el cliente hace `GET /messages` (ya existe) y además el server puede re-emitir no-leídos.
- *Impacto:* cercanía a “entrega garantizada”.

### 4.5 Frontend Web

**F-01 — Sin actualización optimista al enviar mensaje.**
- *Ubicación:* `web/src` (chat send).
- *Por qué importa:* el mensaje aparece tras ida/vuelta del server → latencia percibida alta en redes móviles.
- *Severidad:* **P2** (UX).
- *Solución:* insertar mensaje localmente con estado `pending` y reconciliar con `ack`/echo.
- *Alternativa superior:* optimistic UI + rollback en error.
- *Impacto:* sensación de instantáneo.

**F-02 — Estados vacíos/error incompletos.**
- *Ubicación:* listas (consultas, mascotas, vets, notificaciones).
- *Por qué importa:* pantallas en blanco confunden al usuario.
- *Severidad:* **P2.**
- *Solución:* empty states con CTA, error states con retry, skeletons de carga.
- *Impacto:* menos frustración.

**F-03 — Accesibilidad superficial.**
- *Ubicación:* `web/src` (tras P3 hay `Input` con aria, pero falta foco visible global, `alt` en imágenes, contraste, landmarks).
- *Por qué importa:* exclusión de usuarios con discapacidad; malas prácticas WCAG.
- *Severidad:* **P2.**
- *Solución:* audit con axe, `role`/`aria`, focus rings, `prefers-reduced-motion`.
- *Impacto:* cumplimiento y UX.

**F-04 — Sin code-splitting más allá de calls.**
- *Ubicación:* `web/vite.config.ts` / rutas.
- *Por qué importa:* bundle grande = carga lenta en 2G/3G.
- *Severidad:* **P3.**
- *Solución:* `React.lazy` en dashboard, historial, vet profile.
- *Impacto:* TTI menor.

### 4.6 Mobile

**M-01 — `env.ts` fija `localhost:3001` para plataforma web.**
- *Ubicación:* `mobile/src/lib/env.ts:48` (`Platform.OS === 'web' ? 'http://localhost:3001'`).
- *Por qué importa:* Expo Web apuntaría a localhost aunque el backend esté en otro host.
- *Severidad:* **P2.**
- *Solución:* leer de `EXPO_PUBLIC_API_URL` siempre; `localhost` solo como fallback de dev.
- *Impacto:* Expo Web funcional.

**M-02 — Sin cola de reintentos offline para mensajes.**
- *Ubicación:* `mobile/src` (sendMessage).
- *Por qué importa:* en red inestable, si el `ack` falla el mensaje se pierde (no se encola).
- *Severidad:* **P1** (mobile, red móvil).
- *Solución:* cola persistente (AsyncStorage) que reintenta con el mismo `clientMsgId` (el dedup del server evita duplicados).
- *Alternativa superior:* offline-first con sync al reconectar.
- *Impacto:* cero mensajes perdidos.

**M-03 — Subida de imágenes sin resize.**
- *Ubicación:* `mobile/src` (upload de foto mascota / chat).
- *Por qué importa:* en 2GB RAM, imagen de 12MP → OOM/crash.
- *Severidad:* **P2.**
- *Solución:* `expo-image-manipulator` para reducir a ≤1080p y comprimir antes de subir.
- *Impacto:* estable en gama baja.

**M-04 — Deep link `vetconnect://` para llamadas sin fallback.**
- *Ubicación:* CallScreen / deep link handler.
- *Por qué importa:* si no hay app registrada, la WebView falla y el usuario se queda sin video.
- *Severidad:* **P2.**
- *Solución:* verificar disponibilidad y ofrecer “abrir en navegador” como fallback.
- *Impacto:* graceful degradation.

### 4.7 Producto / UX

**P-01 — Fricción de onboarding (mascota obligatoria antes de consultar).**
- *Por qué importa:* un dueño en urgencia debe crear mascota primero → abandono.
- *Severidad:* **P2.**
- *Solución:* permitir consulta “genérica” y crear la mascota durante la consulta.
- *Impacto:* reduce time-to-first-value.

**P-02 — Sin búsqueda/filtro de veterinarios por nombre o especialidad.**
- *Ubicación:* `users/vets` (filtra por `species` solo).
- *Por qué importa:* dueños no saben con quién hablan.
- *Severidad:* **P3.**
- *Solución:* búsqueda por nombre/especialidad + badges de perfil.
- *Impacto:* melhor matching.

**P-03 — Notificaciones no contextuales.**
- *Por qué importa:* un push genérico no explica la acción.
- *Severidad:* **P3.**
- *Solución:* deep link al hilo correcto + preview del mensaje.
- *Impacto:* menos aperturas inútiles.

**P-04 — Solo modo síncrono (chat en vivo).**
- *Por qué importa:* el vet no siempre está online; dueño espera respuesta inmediata.
- *Severidad:* **P3** (evolutivo).
- *Solución:* modo asíncrono “dejá tu consulta, te respondemos” + SLA visible.
- *Impacto:* más consultas completadas.

### 4.8 Performance

**PF-01 — Sin caché de lectura en listas calientes (vets online, historial).**
- *Por qué importa:* polling cada 10s recalcula lo mismo.
- *Severidad:* **P2.**
- *Solución:* `node-cache` ya existe para vets; extender a consultas activas y usar ETag/`Cache-Control`.
- *Impacto:* menos DB load.

**PF-02 — Imágenes pesadas sin lazy loading.**
- *Por qué importa:* scroll de historial con fotos grandes = jank.
- *Severidad:* **P3.**
- *Solución:* `loading="lazy"` en web, `expo-image` (ya usado) con placeholder en mobile.
- *Impacto:* scroll fluido.

### 4.9 Escalabilidad (10 → 100k)

- **10-100:** ok (1 instancia, Supabase free). Riesgo: pool `connection_limit=1` (D-02).
- **1k-10k:** requiere Redis adapter (R-01), pool ajustado (D-02), paginación cursor (A-03), media en S3 (O-03).
- **100k:** requiere cola de jobs para notificaciones, sharding de presencia, CDN firmado para media, read replicas.
- *Sobreingeniería a evitar hoy:* Kubernetes, service mesh, event sourcing. No necesario para el alcance actual.

### 4.10 Testing

**T-01 — 0 tests de WebSocket.**
- *Severidad:* **P1.**
- *Solución:* `socket.io-client` + supertest; cubrir join/authz/dedup/reconnect.
- *Alternativa superior:* test de contrato del evento `message:new`.

**T-02 — 0 tests de autorización negativa.**
- *Severidad:* **P1.**
- *Solución:* matrices CLIENT/VET/ADMIN × endpoints protegidos.
- *Impacto:* evita regresiones de BOLA/IDOR.

**T-03 — 0 tests de concurrencia.**
- *Severidad:* **P1.**
- *Solución:* dos requests simultáneos a `assign` y a `message:send` (dedup).
- *Impacto:* blinda las races P1.

**T-04 — 0 tests web/mobile.**
- *Severidad:* **P?.**
- *Solución:* Vitest + RTL para web; mínimo smoke E2E con Playwright (con precaución, High Risk).
- *Impacto:* confianza en UI.

### 4.11 DevOps / SRE

**O-01 — Media en disco efímero.**
- *Ubicación:* `backend/uploads` (Koyeb/Render efímero).
- *Severidad:* **P1** para prod.
- *Solución:* S3/Cloudinary con URL firmada; `photoUrl` ya usa Cloudinary para mascotas.
- *Impacto:* durabilidad.

**O-02 — Sin métricas/trazas.**
- *Por qué importa:* caídas silenciosas; no sabés dónde duele.
- *Severidad:* **P2.**
- *Solución:* `/health` ya existe; añadir Prometheus/OpenTelemetry + alerta de caída.
- *Impacto:* MTTR menor.

**O-03 — CI no verificado en repo.**
- *Por qué importa:* `DEPLOY.md` menciona GitHub Actions; si no existe, los despliegues no están protegidos por tests.
- *Severidad:* **P2 (verificar existencia).**
- *Solución:* workflow que corra `tsc --noEmit` + `npm test` + build web en cada PR.
- *Impacto:* puerta de calidad.

### 4.12 Documentación vs Código (skill `grill-with-docs`)

- **Resuelto en esta pasada:** `TECH_REFERENCE` (159/10 tests, endpoints, modelos), `README` (estado, provider Koyeb), `MVP_SCOPE` (LiveKit parcial), `SPRINT_PLAN` (conteo), `FAANG_AUDIT` (v6), `CODE_AUDIT` (P3-15 corregido).
- **Pendiente menor:** `docs/FALTA_HACER.md:175` y `RUN_GUIDE.md` citan `localhost:3001` (correcto para dev, pero deberían remarcar que en prod es HTTPS). `mobile/eas.json` sigue con `localhost` (ver R-02/M).
- **ADR sugerido:** `ADR-010 — Adopción de packages/shared` (cerrar la duplicación de tipos; hoy 0 imports reales).

### 4.13 Calidad de código

- **C-01:** `packages/shared` no adoptado → tipos duplicados (`ApiResponse`, `JwtPayload`). **P2** (DRY).
- **C-02:** magic strings de roles (`'VET'`, `'ADMIN'`, `'CLIENT'`) repetidos; usar `enum` Prisma (ya existe `Role`) en vez de strings.
- **C-03:** `chat.gateway.ts` mezcla auth + lógica de negocio; extraer `ChatService` (SRP).

---

## 5. TOP 20 mejoras con mayor impacto

Orden por **impacto / esfuerzo / riesgo**:

1. **Rotar secretos + purgar git** (S-01) — impacto crítico, esfuerzo medio, riesgo bajo. *P0*.
2. **WS path `/socket.io` en `eas.json`** (R-02) — impacto crítico mobile, esfuerzo mínimo. *P0*.
3. **Cola offline de mensajes + `clientMsgId`** (M-02) — impacto alto mobile, esfuerzo medio. *P1*.
4. **Redis adapter + rate-limit distribuido** (R-01) — impacto alto escalabilidad, esfuerzo bajo-medio. *P1*.
5. **Pool Supabase `connection_limit`** (D-02) — impacto alto, esfuerzo bajo. *P1*.
6. **`assign` 409 en count=0** (A-05) — race real, esfuerzo bajo. *P1*.
7. **Tests WS + authz negativa + concurrencia** (T-01/02/03) — impacto alto, esfuerzo medio. *P1*.
8. **Media a S3/Cloudinary firmado** (O-01) — impacto alto prod, esfuerzo medio. *P1*.
9. **Paginación cursor** (A-03) — impacto medio-alto, esfuerzo bajo. *P2*.
10. **Índices compuestos Message** (D-01) — impacto medio, esfuerzo bajo. *P2*.
11. **Envelope de error uniforme** (A-02) — impacto medio, esfuerzo bajo. *P2*.
12. **Optimistic UI chat web** (F-01) — impacto medio UX, esfuerzo medio. *P2*.
13. **Accesibilidad WCAG (axe)** (F-03) — impacto medio, esfuerzo medio. *P2*.
14. **`env.ts` no fije localhost** (M-01) — impacto medio, esfuerzo bajo. *P2*.
15. **Resize de imágenes mobile** (M-03) — impacto medio, esfuerzo bajo. *P2*.
16. **Notificar solo vets online** (A-04) — impacto medio, esfuerzo bajo. *P2*.
17. **Caché de lectura (ETag/node-cache)** (PF-01) — impacto medio, esfuerzo bajo. *P2*.
18. **Onboarding sin mascota previa** (P-01) — impacto medio producto, esfuerzo medio. *P2*.
19. **Adoptar `packages/shared`** (C-01) — impacto medio mantenibilidad, esfuerzo medio. *P2*.
20. **CI que corra tsc+test+build** (O-03) — impacto alto, esfuerzo bajo. *P2*.

---

## 6. Roadmap (como Tech Lead)

### 7 días
- S-01 (rotar+purgar), R-02 (`eas.json` WS path), M-01 (`env.ts`), A-05 (assign 409), D-02 (pool), O-03 (CI mínimo). Cierra los P0/P1 querompen prod.

### 30 días
- R-01 (Redis adapter), M-02 (cola offline), T-01/02/03 (tests críticos), O-01 (media S3), A-03 (cursor), D-01 (índices), A-02 (envelope), A-04 (vets online).

### 90 días
- F-01 (optimistic UI), F-03 (a11y WCAG), M-03 (resize), PF-01 (caché), C-01 (shared), P-01 (onboarding), observabilidad (O-02), modo asíncrono (P-04), búsqueda de vets (P-02).

### Qué NO tocar (sobreingeniería)
- Kubernetes / service mesh.
- Event sourcing / CQRS.
- Reescribir a GraphQL.
- Microservicios.
- IA generativa “por moda” (solo si resuelve un problema real, ej. triage de síntomas, con humano en el loop).

---

## 7. Preguntas abiertas (no asumí respuestas)

1. **¿VetConnect debe soportar usuarios reales pronto o es académico/portfolio?** (cambia la severidad de P0/P1).
2. **¿El video LiveKit debe completarse end-to-end o queda post-MVP?** (hoy backend mintea token pero el cliente usa WebView).
3. **¿Existe el workflow de CI en GitHub Actions o solo está documentado?** (O-03) — no lo verifiqué para no asumir.
4. **¿El `forgot-password` actual ya es respuesta genérica?** (S-04) — requiere leer el controller; lo marqué P2 a confirmar.

---

---

## 8. Ejecución (Tech Lead) — estado al 18-ago-2026

Contexto corregido por el dueño (Tobías): **producción real con usuarios reales, entrega ~1 mes** → P0/P1 suben a críticos. **LiveKit debe quedar E2E nativo** (no WebView). **No hay dominio contratado aún** → se unificó placeholder `api.conectavet.com` (CI y mobile). Operado bajo `AI_TECHLEAD_BRIEF.md` (sin commit, sin `.env`, sin purge sin confirmación).

### Resuelto (código, verificado con `tsc --noEmit` + tests unit pasando)
- **0.2 / R-02 / M-01:** `eas.json` → `EXPO_PUBLIC_API_URL=https://api.conectavet.com`, `EXPO_PUBLIC_WS_URL=wss://api.conectavet.com/socket.io`; `env.ts` unifica `API_URL/WS_URL = MOBILE_*`.
- **0.3:** `env.ts` ya no fija `localhost` para web.
- **0.4 / O-03:** CI confirmada y real (`.github/workflows/ci.yml`): unit + integration(tsc+jest) + web build + security(gitleaks/audit) + deploy Railway + smoke.
- **R-01:** gateway Socket.io con Redis (rate-limit + dedup distribuido) si `REDIS_URL`; fallback in-memory. Adapter Redis cableado.
- **M-02:** cola offline (`src/lib/outbox.ts`) + reintento con `clientMsgId` al reconectar (dedup server evita duplicados).
- **A-05:** `assignVet` devuelve 409 si `updateMany` afecta 0 filas (race resuelta).
- **D-02:** `.env.example` con `connection_limit=10`, `REDIS_URL`, `STORAGE_PROVIDER`.
- **O-01:** abstracción de storage (`media/storage.ts`) → S3 opcional vía `STORAGE_PROVIDER=s3`; validación de `attachmentUrl` acepta `https://`.
- **S-02:** WS CORS espeja la política de `app.ts` (sin wildcard+credentials).
- **S-03:** `/users/admin-only` (expone JWT) solo se registra si `ENABLE_DEBUG_ENDPOINTS=true`.
- **S-04:** `forgot-password` ya respondía genérico; se agregó rate-limit estricto (5/15min por IP+email) anti-abuse.
- **D-04:** `deletedAt` en `Consultation` y `Message` + filtros `deletedAt:null` en lecturas (requiere aplicar migración).
- **A-04 / D-01:** ya estaban resueltos en código (notificación solo vets online; índice compuesto Message).
- **T-01/02/03:** tests escritos — `authz.test.ts` (matriz negativa), `concurrency.test.ts` (assign race + dedup), `chat.ws.test.ts` (entrega en vivo, dedup por socket, rate-limit). Corren en CI (requieren Postgres `DIRECT_URL`).
- **M-03 / M-04:** `lib/image.ts` (resize con `expo-image-manipulator`), `lib/deepLink.ts` (fallback a web).
- **LiveKit (producto final):** `CallScreen` nativo (`@livekit/react-native` + `livekit-client`, reemplaza WebView) + ruta `app/call/[id].tsx` + deps. Web ya usaba `livekit-client` nativo.

### Bloqueado / pendiente (requiere acción humana o decisión)
- **S-01 (P0 manual):** rotar `JWT_SECRET`/credenciales y purgar git → **Tobías** (no se tocó `.env`).
- **Dominio:** no contratado. Placeholder unificado `api.conectavet.com`; definir real antes de DNS/SSL.
- **Shell mobile (CRÍTICO para producto final):** `mobile/` **no tiene `app/` (rutas/screens) ni auth/chat UI** — el binario no es ejecutable hoy. El `CallScreen` quedó cableado en `app/call/[id].tsx` pero está huérfano hasta construir el shell (login, lista de consultas, chat). Es el mayor gap restante.
- **Migraciones:** `D-04` y cualquier cambio de schema requieren `prisma migrate dev` / `db push` contra la BD.
- **LiveKit mobile:** requiere `npx install-expo-modules` + prebuild nativo antes de compilar; no verificado en este entorno.

### Diferido (decisión Tech Lead: riesgo > beneficio ahora, sin retest posible)
- **A-03** paginación cursor: offset actual aceptable a la escala esperada; cambiar el contrato rompería web/mobile sin poder retestear.
- **R-03** re-emitir al unirse: el cliente ya hace `GET /messages` al conectar.
- **A-01** `/api/v1`, **C-01/C-02/C-03** (shared/Role enum/ChatService): refactors de mantenibilidad con riesgo de regresión sin E2E.
- **F-03** a11y profunda, **PF-01** caché, **O-02** métricas, **P-01..P-04** (onboarding/matching/async): seguimientos de producto/infra.

---

## 9. Cierre de ejecución (18-ago, tanda 2 — sin secretos ni dominio)

Completado lo necesario para considerar el proyecto **desplegable en producción** (excluyendo rotación de secretos y dominio, que son acción humana):

- **Shell de mobile (el gap crítico):** construido reutilizando `authStore`, `useConsultations` y primitivos UI existentes.
  - `app/_layout.tsx` (Stack: index / chat/[id] / call/[id]).
  - `app/index.tsx`: gate de auth (hydrate → login/registro o home).
  - `components/AuthScreen.tsx` (login/registro con `authStore`).
  - `components/ConsultationsHome.tsx` (historial + crear consulta, con alta de mascota inline).
  - `components/ChatScreen.tsx` (chat sobre `useConsultationMessages`: socket, optimistic UI, outbox, botón de videollamada).
  - `app/call/[id].tsx` ya usaba el `CallScreen` nativo LiveKit.
  - **Requiere:** `npm install` + `npx install-expo-modules` + `eas build` (no verificado en este entorno; CI no typechequea mobile).
- **O-02 métricas:** `/metrics` en `app.ts` (uptime, totalRequests, serverErrors, memoryMb) + contador de errores 5xx.
- **D-04 migración:** `prisma/migrations/20260816000000_soft_delete/migration.sql` para que `prisma migrate deploy` aplique `deleted_at` en prod.
- **S-03:** documentada `ENABLE_DEBUG_ENDPOINTS=false` en `.env.example`.
- **F-03:** web ya tenía `*:focus-visible`; verificado.

### Estado de despliegue
- **Backend + Web:** desplegables. Compilan (`tsc` ✅), tienen migraciones, CI (unit+integration+web+security+deploy+smoke), health, rate-limits, soft-delete, storage S3-ready, Redis-ready y tests (authz/concurrencia/WS corren en CI con Postgres).
- **Mobile:** app funcional en código; falta el pipe de build nativo (EAS) y `install-expo-modules`. LiveKit mobile necesita prebuild nativo.
- **Acción humana obligatoria (fuera de alcance):** rotar secretos + purgar git (S-01) y contratar/definir dominio + DNS/SSL.

---

## 10. Ejecución (tanda 3 — cierre de lo diferido seguro)

- **A-03 (cursor pagination):** `getConsultationHistory` ahora soporta `cursor` keyset O(log n) y devuelve `nextCursor`. La ruta `GET /my-history?cursor=...` lo expone; el modo `page/limit` se conserva (web/mobile sin cambios). `getMessages` sigue offset (lista por conversación, volumen acotado).
- **P-02 / D-03:** verificados como **ya implementados** (búsqueda de vets por nombre en `listVets`; `lastSeen` solo se escribe al cambiar `isOnline`, no por request). No requieren cambios.
- Backend `tsc --noEmit` ✅ tras todos los cambios.

### Estado final
- **Backend + Web:** producción-ready (compila, migraciones, CI, health, rate-limits, soft-delete, S3/Redis-ready, métricas, cursor pagination, tests).
- **Mobile:** app completa en código (auth, consultas, chat, llamada LiveKit nativa); requiere `npm install` + `npx install-expo-modules` + `eas build` (no verificado aquí).
- **Humanos (fuera de alcance):** rotar secretos + purgar git (S-01) y dominio + DNS/SSL.
- **Deferidos a propósito (riesgo > beneficio sin E2E):** A-01 `/api/v1`, C-01 adoptar `packages/shared`, C-02 `Role` enum, C-03 extraer `ChatService`. Ninguno bloquea el deploy; se recomiendan solo con suite E2E.

---

## 11. Suite E2E de contrato (agregada)

- `backend/src/__tests__/e2e-flow.test.ts`: flujo real contra el backend completo
  (registro/login → mascota → consulta → asignación de vet → mensaje → historial
  + cursor). Corre en CI con Postgres real (mismo harness de integration). Protege
  el formato de la API ante refactors sin necesidad de tocar clientes.

### Decisión Tech Lead sobre refactors estructurales (A-01/C-01/C-02/C-03)
No ejecutados: no bloquean el deploy y añaden riesgo de breaking change / migración
de BD sin beneficio para la puesta en producción. La suite E2E ahora cubre la
protección de contrato que justificaba hacerlos. Se recomiendan solo con una
E2E de pantalla (web/mobile) y coordinación de clientes.

> Fin de la auditoría integral. Fuente de verdad: docs del repo + código verificado. Los `.env` no fueron inspeccionados.
