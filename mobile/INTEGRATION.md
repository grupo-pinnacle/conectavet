# VetConnect Mobile — Documento de Integración

> ⚠️ **AVISO (11 Ago 2026):** este documento describe el **diseño original** del MVP (cola `/api/queue/*`, videollamadas LiveKit, asistente IA, subida de fotos por Cloudinary, cookies httpOnly), que el **código actual ya no implementa** (ver `../docs/CODE_AUDIT.md` y `../docs/TECH_REFERENCE.md`). Los flujos reales actuales son: auth (login/register con refresh en body, **logout revoca sesiones** vía `tokenVersion`), pets, **cola de espera automática** (S11), chat con mensajes e **imágenes** (S12) y **notificaciones push** (S12). Las secciones de Queue/LiveKit/AI/Cloudinary se mantienen solo como referencia histórica. La reescritura completa queda a cargo de QA (pendiente #17 de `FAANG_AUDIT.md`).

> Este documento registra **qué elementos de las otras plataformas** (backend, web, shared-types, LiveKit, Cloudinary) se utilizan en la app móvil y **cómo interactúa la app con el backend**. Es la referencia obligatoria para cualquier dev que toque el código mobile.

---

## 📑 Índice

1. [Mapa de integración](#1-mapa-de-integración)
2. [Elementos compartidos con la web](#2-elementos-compartidos-con-la-web)
3. [Autenticación — desviación móvil respecto a la web](#3-autenticación--desviación-móvil-respecto-a-la-web)
4. [Endpoints REST consumidos](#4-endpoints-rest-consumidos)
5. [Protocolo WebSocket de la cola](#5-protocolo-websocket-de-la-cola)
6. [LiveKit — videollamadas](#6-livekit--videollamadas)
7. [Cloudinary — subida de fotos](#7-cloudinary--subida-de-fotos)
8. [Flujos end-to-end](#8-flujos-end-to-end)
9. [Reglas de seguridad respetadas](#9-reglas-de-seguridad-respetadas)
10. [Diferencias explícitas mobile vs web](#10-diferencias-explicitas-mobile-vs-web)

---

## 1. Mapa de integración

```
┌───────────────────────────────────────────────────────────────────────┐
│                       VetConnect Mobile (esta app)                    │
│                  React Native + Expo (Owner MVP)                      │
└────────────┬───────────────────────┬──────────────────────┬───────────┘
             │ HTTPS                 │ WebSocket             │ WebRTC
             │ (Axios)               │ (cola de espera)      │ (LiveKit)
             ▼                       ▼                       ▼
   ┌───────────────────┐   ┌────────────────────┐   ┌──────────────────┐
   │ apps/backend      │   │ apps/backend       │   │ LiveKit Cloud    │
   │ (Express+Prisma)  │   │ /ws/queue          │   │ (o self-hosted)  │
   │                   │   │                    │   │                  │
   │ /api/auth/*       │   │ ENTRY_STATE        │   │ Room:            │
   │ /api/pets/*       │   │ ENTRY_ASSIGNED     │   │  vetconnect-     │
   │ /api/queue/*      │   │ CONSULTATION_*     │   │  {entryId}       │
   │ /api/consultations│   │ QUEUE_UPDATED      │   │                  │
   │ /api/ai-assistant │   │                    │   │ TTL: 2h token    │
   └─────────┬─────────┘   └────────────────────┘   │ max: 2 part.     │
             │                                      │ emptyTO: 5min    │
             ▼                                      └──────────────────┘
   ┌───────────────────┐
   │ PostgreSQL        │
   │ (Railway)         │
   │                   │
   │ users, pets,      │
   │ queue_entries,    │
   │ conversations,    │
   │ messages,         │
   │ medical_records   │
   └───────────────────┘

   Elementos compartidos con la web:
   ─────────────────────────────────
   • packages/shared-types  → schemas Zod (réplica en src/types/index.ts)
   • Paleta de colores      → espejo en src/theme/index.ts
   • Convenciones de API    → { status, data, pagination? }
   • Protocolo WebSocket    → mismo set de eventos
   • LiveKit room naming    → vetconnect-{entryId}
```

---

## 2. Elementos compartidos con la web

### 2.1 `packages/shared-types` (Zod schemas + tipos)

En el monorepo, web y mobile importan los mismos schemas de `@vetconnect/shared-types`. En la app móvil empaquetada como APK, **no podemos depender del workspace** (Metro no siempre resuelve bien un sibling workspace y el bundle final debe ser autosuficiente), por eso **replicamos los schemas** en `src/types/index.ts`.

**Lo que se replica y por qué:**

| Schema / Tipo | Ubicación mobile | Ubicación monorepo | Razón de replicación |
|---------------|------------------|--------------------|--------------------|
| `userSchema`, `User`, `Role` | `src/types/index.ts` | `packages/shared-types/src/user.schema.ts` | Bundler isolation |
| `petSchema`, `Pet`, `Species`, `Sex` | `src/types/index.ts` | `packages/shared-types/src/pet.schema.ts` | Bundler isolation |
| `vetCardSchema`, `VetCard` | `src/types/index.ts` | `packages/shared-types/src/pet.schema.ts` | Bundler isolation |
| `queueEntrySchema`, `QueueEntry`, `QueueEntryStatus` | `src/types/index.ts` | `packages/shared-types/src/queue.schema.ts` | Bundler isolation |
| `conversationSchema`, `messageSchema`, `Message` | `src/types/index.ts` | `packages/shared-types/src/ai.schema.ts` | Bundler isolation |
| `wsMessageSchema` (eventos WebSocket) | `src/types/index.ts` | `packages/shared-types/src/ws.schema.ts` | Contract compartido con backend |
| `loginSchema`, `registerSchema`, `passwordSchema` | `src/types/index.ts` | `packages/shared-types/src/auth.schema.ts` | Mismas validaciones cliente/servidor |
| `createPetSchema`, `updatePetSchema` | `src/types/index.ts` | `packages/shared-types/src/pet.schema.ts` | Mismas validaciones cliente/servidor |
| `ApiError` (clase custom) | `src/types/index.ts` | `packages/shared-types/src/errors.ts` | Mismo formato de error |

> ⚠️ **Regla de sincronización:** cualquier cambio en un schema del monorepo DEBE propagarse a `src/types/index.ts`. El CI del monorepo tiene un check que compara ambos archivos (ver `apps/mobile/scripts/check-shared-types-sync.ts` en el monorepo).

### 2.2 Paleta de colores y tokens visuales

La paleta y tokens del mobile (`src/theme/index.ts`) son un espejo del `tailwind.config.js` de la web:

| Token | Mobile (`src/theme/index.ts`) | Web (`tailwind.config.js`) |
|-------|------------------------------|-----------------------------|
| `primary` | `#2563eb` | `colors.primary.DEFAULT: '#2563eb'` |
| `secondary` | `#10b981` | `colors.secondary.DEFAULT: '#10b981'` |
| `accent` | `#f59e0b` | `colors.accent.DEFAULT: '#f59e0b'` |
| `danger` | `#ef4444` | `colors.danger.DEFAULT: '#ef4444'` |
| `background` | `#f9fafb` | `colors.background` |
| `surface` | `#ffffff` | `colors.surface` |

Tipografía: el mobile usa la fuente del sistema (San Francisco en iOS, Roboto en Android) — la web usa `Inter`. El contraste visual es similar pero no idéntico. Se eligió fuente del sistema en mobile para reducir el tamaño del bundle (regla SP-09 §Diseño visual).

### 2.3 Convención de respuesta API

Tanto mobile como web respetan la convención unificada del Prompt Maestro §5:

```json
// Éxito
{ "status": "success", "data": {...} }
{ "status": "success", "data": [...], "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }

// Error
{ "status": "error", "code": "NOT_FOUND", "message": "Mascota no encontrada" }
{ "status": "error", "code": "BAD_REQUEST", "message": "Datos inválidos", "details": { "errors": [...] } }
```

El interceptor de Axios en `src/lib/api.ts` **desenvuelve automáticamente** el envelope y devuelve el `data` interno. Si la respuesta trae `pagination`, lo adjunta al array resultante como propiedad no enumerable para que los hooks puedan acceder a él sin cambiar la firma.

### 2.4 Protocolo WebSocket

Mobile y web hablan el mismo protocolo de eventos (ver §5 abajo). La única diferencia es la cadencia del heartbeat:
- **Web**: 15s para vet (que también es usuario web), 20s para owner.
- **Mobile**: 20s fijo (solo owners tienen app móvil en el MVP).

---

## 3. Autenticación — desviación móvil respecto a la web

### Cómo funciona en la web

La web usa **cookies httpOnly + Secure + SameSite=Strict** para el refresh token (definido en SP-01). El access token (15 min) se guarda en `localStorage` y se adjunta como `Authorization: Bearer`.

**Ventaja web**: el refresh token es inaccesible desde JavaScript → robo por XSS es muy difícil.

### Cómo funciona en mobile (desviación intencional)

Las cookies httpOnly **no funcionan bien en React Native**:
1. El cliente HTTP nativo no maneja cookies automáticamente como un browser.
2. No hay "origin" ni "SameSite" en una app nativa.
3. `expo-secure-store` es el equivalente criptográfico del Keychain/Keystore.

**Decisión de diseño (spec SP-09 §"Almacenamiento seguro de tokens"):**

1. El owner hace `POST /api/auth/login` (o `/register`) enviando `{ email, password, platform: 'mobile' }`.
2. El backend detecta `platform: 'mobile'` (también puede usarse el header `X-Platform: mobile`) y devuelve **ambos tokens en el body**:
   ```json
   {
     "status": "success",
     "data": {
       "user": {...},
       "accessToken": "eyJ...",
       "refreshToken": "eyJ..."
     }
   }
   ```
3. La app guarda:
   - `accessToken` en `expo-secure-store` (clave: `vetconnect.accessToken`).
   - `refreshToken` en `expo-secure-store` (clave: `vetconnect.refreshToken`).
   - `user` (sin password) en `expo-secure-store` para hidratar la UI en cold start.
4. En cada request HTTP, el interceptor de Axios (`src/lib/api.ts`) adjunta `Authorization: Bearer <accessToken>`.
5. Si el backend devuelve **401**, el interceptor automáticamente intenta `POST /api/auth/refresh` con el refresh token en el body. Si tiene éxito, persiste los nuevos tokens y **replay** el request original. Si falla, hace logout hard y redirige a `/login`.

### Implementación backend requerida (mobile-aware)

El backend del módulo `auth` debe aceptar:

| Endpoint | Comportamiento web | Comportamiento mobile |
|----------|-------------------|-----------------------|
| `POST /api/auth/login` | Setea cookie httpOnly con refresh token | Devuelve `refreshToken` en el body si `platform=mobile` |
| `POST /api/auth/register` | Igual que login | Igual que login |
| `POST /api/auth/refresh` | Lee refresh token de cookie | Lee refresh token del body (`{ refreshToken }`) |
| `POST /api/auth/logout` | Limpia cookie | Recibe `{ refreshToken }` en body y lo revoca en BD |

**Justificación de seguridad:**
- `expo-secure-store` guarda el valor en el Keychain (iOS) / Keystore (Android), cifrado a nivel sistema y protegido por el desbloqueo del dispositivo.
- El riesgo de robo por otra app es bajo (sandboxing del sistema operativo).
- El riesgo de robo por JavaScript es prácticamente nulo (no hay "DOM" expuesto en una app RN).

**Rotación de refresh token** (definida en SP-01 §"Refresh token rotativo"): el backend SIEMPRE rota el refresh token en cada `/auth/refresh`. Si detecta reúso de un token ya revocado, **revoca todos los tokens del usuario** y retorna 401. La app móvil trata esto como "sesión comprometida" → logout hard + toast.

---

## 4. Endpoints REST consumidos

La app móvil consume los siguientes endpoints del backend. Todos están prefijados con `/api`. La columna "Módulo SP" indica qué sub-prompt del sistema de prompts definió el endpoint.

### Auth (SP-01)

| Método | Path | Body / Query | Mobile-specific | Servicio mobile |
|--------|------|--------------|-----------------|-----------------|
| `POST` | `/auth/register` | `{ email, password, firstName, lastName, phone, platform: 'mobile' }` | ✅ `platform: 'mobile'` | `authService.register` |
| `POST` | `/auth/login` | `{ email, password, platform: 'mobile' }` | ✅ | `authService.login` |
| `POST` | `/auth/refresh` | `{ refreshToken, platform: 'mobile' }` | ✅ (web usa cookie) | `authService.refresh` (vía interceptor Axios) |
| `POST` | `/auth/logout` | `{ refreshToken, platform: 'mobile' }` | ✅ | `authService.logout` |
| `GET` | `/auth/me` | — | — | `authService.me` |

### Pets + VetCard (SP-02)

| Método | Path | Servicio mobile | Hook |
|--------|------|-----------------|------|
| `POST` | `/pets` | `petsService.create` | `usePets().create` |
| `GET` | `/pets?species=&isDeceased=` | `petsService.list` | `usePets().list` |
| `GET` | `/pets/:id` | `petsService.getById` | `usePet(id)` |
| `PATCH` | `/pets/:id` | `petsService.update` | `usePets().update` |
| `DELETE` | `/pets/:id` | `petsService.remove` | `usePets().remove` |
| `GET` | `/pets/:id/vetcard` | `petsService.vetCard` | `useVetCard(id)` |

### Queue (SP-03)

| Método | Path | Servicio mobile | Hook |
|--------|------|-----------------|------|
| `POST` | `/queue/join` | `queueService.join` | `useQueue().join` |
| `GET` | `/queue/my-entry` | `queueService.myEntry` | `useQueue().myEntryQuery` |
| `POST` | `/queue/my-entry/cancel` | `queueService.cancel` | `useQueue().cancel` |
| `POST` | `/queue/:id/confirm-connection` | `queueService.confirmConnection` | `useQueue().confirmConnection` (en call screen) |
| `POST` | `/queue/:id/finalize` | `queueService.finalize` | `useQueue().finalize` (en call screen) |

> Los endpoints `/queue/next`, `/queue/take-next`, `/queue/:id/reject`, `/queue/availability`, `/queue/metrics` son exclusivos de **VET/ADMIN** y por eso **no se consumen en mobile**.

### Consultations (SP-04)

| Método | Path | Servicio mobile | Hook |
|--------|------|-----------------|------|
| `POST` | `/consultations/:id/messages` | `consultationsService.sendMessage` (`{ content?, attachmentUrl? }`) | `useConsultationMessages(id).send` |
| `GET` | `/consultations/:id/messages` | `consultationsService.getMessages` | `useConsultationMessages(id).list` |
| `GET` | `/consultations/:id/prescriptions` | `consultationsService.getPrescriptions` | `useConsultationPrescriptions` |
| `GET` | `/consultations/my-history` | `consultationsService.myHistory` | `useConsultationHistory` |

### Media + Notificaciones (S12)

| Método | Path | Servicio mobile | Hook |
|--------|------|-----------------|------|
| `POST` | `/media` | `mediaService.upload` (multipart `/uploads`) | `pickAndSendImage` (chat) |
| `POST` | `/notifications/token` | `notificationsService.registerToken` | `usePushToken` (layout) |
| `GET` | `/notifications` | `notificationsService.list` | — |
| `PATCH` | `/notifications/:id/read` | `notificationsService.markRead` | — |

> Los endpoints de notas post-consulta (`PATCH /consultations/:id/notes`, `POST /consultations/:id/summary`) son exclusivos de VET — no se usan en mobile.

### Push notifications (S12)

1. `usePushToken` (en `app/(app)/_layout.tsx`): pide permiso (`expo-notifications`), obtiene `ExpoPushToken` y lo publica en `POST /api/notifications/token`.
2. El backend dispara `sendExpoPush` (API de Expo) en nuevos eventos: consulta asignada, mensaje nuevo, receta, consulta finalizada.
3. En dev/test el envío real se desactiva con `EXPO_PUSH_DISABLED=true`.

### AI Assistant (SP-06)

| Método | Path | Servicio mobile | Hook |
|--------|------|-----------------|------|
| `POST` | `/ai-assistant/conversations` | `chatService.createConversation` | `useConversations().create` |
| `GET` | `/ai-assistant/conversations` | `chatService.listConversations` | `useConversations().list` |
| `GET` | `/ai-assistant/conversations/:id/messages` | `chatService.getMessages` | `useMessages(id).list` |
| `POST` | `/ai-assistant/conversations/:id/messages` | `chatService.sendMessage` | `useMessages(id).send` |
| `PATCH` | `/ai-assistant/conversations/:id/archive` | `chatService.archive` | `useConversations().archive` |
| `POST` | `/ai-assistant/conversations/:id/escalate` | `chatService.escalate` | (no expuesto en UI, solo backend lo invoca) |

### Módulos NO consumidos en mobile

| Módulo | Razón |
|--------|-------|
| `users` (SP-01) | Solo ADMIN. La app móvil es solo para owners. |
| `medical-records` (SP-05) | Solo VET crea registros. El owner los ve a través del VetCard (que los resume). |
| `billing` (SP-07) | Solo ADMIN y VET. El owner no ve liquidaciones. |
| `pets/search` (SP-02) | Solo ADMIN. |
| WebSocket eventos a VET (`QUEUE_INITIAL`, `VET_ONLINE`, etc.) | La app móvil solo se suscribe como OWNER. |

---

## 5. Protocolo WebSocket de la cola

### Conexión

- URL: `${EXPO_PUBLIC_WS_URL}?token=${accessToken}` (definida en `src/lib/ws.ts`)
- Path backend: `/ws/queue` (mismo que web)
- Autenticación: query param `?token=<access_token>`. Backend valida con el mismo middleware JWT que REST.
- Heartbeat: cliente envía `{ "type": "ping" }` cada **20 segundos** (owners). Backend responde `{ "type": "pong" }`.
- Reconexión: backoff exponencial 1s → 2s → 4s → 8s → 16s → 30s (max). Implementado en `WebSocketClient.scheduleReconnect`.

### Eventos cliente → servidor

| Tipo | Body | Cuándo lo envía mobile |
|------|------|-----------------------|
| `ping` | — | Cada 20s mientras el WebSocket esté abierto |

> El evento `vet_availability` solo lo envía la web (rol VET). Mobile nunca lo envía.

### Eventos servidor → cliente (consumidos por mobile)

Implementación: `src/hooks/useWebSocket.ts` → `onMessage` handler.

| Tipo | Body | Acción mobile |
|------|------|---------------|
| `pong` | — | (no-op, solo confirma conexión) |
| `ENTRY_STATE` | `entry: QueueEntry \| null` | `queueStore.setMyEntry(entry)` — hidrata estado al reconectar |
| `ENTRY_ASSIGNED` | `entry, livekitToken, livekitRoomName` | `queueStore.setMyEntry({...entry, livekitToken})` → la UI muestra botón "Iniciar videollamada" |
| `CONSULTATION_STARTED` | `entry` | `queueStore.setMyEntry(entry)` — la call screen puede confirmar conexión |
| `CONSULTATION_FINALIZED` | `entry` | `queueStore.setMyEntry(entry)` — el botón de call se deshabilita, navegación a history |
| `ENTRY_REQUEUED` | `entry` | `queueStore.setMyEntry(entry)` — UI vuelve a estado "En espera" con posición preservada |
| `QUEUE_UPDATED` | — | (no-op en mobile — los owners recalculan posición vía polling cada 30s) |
| `VET_ONLINE`, `VET_OFFLINE`, `VET_AVAILABILITY_CHANGED` | — | (no-op en mobile — son broadcasts a vets) |

### Timeouts y reconexión (reglas del Prompt Maestro §7)

| Cliente | Ping cada | Timeout backend | Acción backend en timeout | Reacción mobile |
|---------|-----------|------------------|---------------------------|-----------------|
| Owner en WAITING | 20s | 60s | Cancela entry con reason `USER_DISCONNECT` | Al reconectar, `ENTRY_STATE` viene con `null` → UI muestra formulario de join |
| Owner en IN_CONSULTATION | 20s | 60s | Finaliza consulta con `USER_DISCONNECT` | Al reconectar, `ENTRY_STATE` muestra entry `COMPLETED` → navegación a history |
| Vet | 15s | 45s | Marca offline, reencola entry | (no aplica en mobile) |

### Job de limpieza (backend)

Cada 5 min el backend cancela entries con `joinedAt > 30 min` y reason `TIMEOUT`. La app móvil ve estos como entries `CANCELLED` al refrescar.

---

## 6. LiveKit — videollamadas

### Arquitectura

```
┌─────────────────┐         crear room         ┌─────────────────┐
│  apps/backend   │ ─────────────────────────▶ │   LiveKit       │
│  (queue.service)│   takeNextEntry            │   Server        │
│                 │ ◀───────────────────────── │                 │
│                 │   livekitToken (vet+owner) │                 │
└────────┬────────┘                            └────────┬────────┘
         │                                              │
         │ ENTRY_ASSIGNED WS event (con livekitToken)   │
         ▼                                              │ WebRTC
┌─────────────────┐    room.connect(token)             │
│  VetConnect     │ ──────────────────────────────────▶│
│  Mobile (owner) │                                   │
│                 │ ◀─────────────────────────────────│
│  useLiveKit     │   video track remoto (vet)         │
└─────────────────┘
```

### Room naming (SP-04)

El backend crea el room con nombre **`vetconnect-{entryId}`** al asignar un entry a un vet (status `ASSIGNED`). Mobile nunca crea rooms — solo se conecta a rooms existentes.

### Tokens (SP-04)

El backend genera dos JWT de LiveKit (uno por participante):
- `identity: "owner-{ownerId}"`, `ttl: 2h`, `canPublish: true`, `canSubscribe: true`.
- `identity: "vet-{vetId}"`, mismo grants + `roomAdmin: true`.

El token del owner llega a mobile vía el evento WebSocket `ENTRY_ASSIGNED` (campo `livekitToken`). La call screen lo pasa a `useLiveKitCall({ roomName, token, entryId })`.

### Configuración del room (regla SP-04)

| Setting | Valor | Razón |
|---------|-------|-------|
| `emptyTimeout` | 5 min | Si ambos participants salen, el room se cierra automáticamente |
| `maxParticipants` | 2 | Solo owner + vet. Nadie más puede unirse. |
| `ttl` token | 2 horas | Cubre el caso máximo de consulta larga |
| Room name | `vetconnect-{entryId}` | Determinístico, permite auditoría sin exponer PII |

### Hooks mobile utilizados

| Hook | Ubicación | Responsabilidad |
|------|-----------|-----------------|
| `useLiveKitCall` | `src/hooks/useLiveKit.ts` | Conectar al room, exponer tracks, heartbeat a `/consultations/:id/ping` cada 30s |
| `useCallStore` (Zustand) | `src/stores/callStore.ts` | Estado UI: mic/camera enabled, remote muted, connection state, duration |

### Permisos mobile

La call screen pide permisos de cámara y micrófono al montar (vía `expo-camera.requestCameraPermissionsAsync` + `expo-av.requestPermissionsAsync`). Si el usuario los niega, muestra Alert con CTA a Configuración.

### Heartbeat de videollamada (SP-04)

Mientras la call screen está montada y LiveKit está conectado, mobile hace `POST /api/consultations/:entryId/ping` cada **30 segundos**. Si el backend no recibe ping en 90s, asume desconexión y finaliza la consulta con `USER_DISCONNECT`.

### Cierre del room

- **Mobile**: al tap "Colgar" → `POST /api/queue/:id/finalize` → navigate a `/history`. El backend cierra el room de LiveKit.
- **Backend** (SP-04): `closeLivekitRoom(roomName)` al finalizar. Si LiveKit webhook reporta `room_finished`, cleanup.

### Webhook de LiveKit (no consumido en mobile)

El backend tiene un endpoint `POST /api/consultations/livekit-webhook` que recibe eventos de LiveKit (`room_participant_joined`, `room_participant_left`, `room_finished`). **Mobile no consume este webhook** — es entre LiveKit y el backend.

---

## 7. Cloudinary — subida de fotos

### Decisiones

- **Free tier** de Cloudinary (suficiente para MVP académico).
- **Upload directo desde mobile** (no pasa por el backend) — Cloudinary provee *unsigned upload presets* que permiten subir sin exponer el API secret.
- El backend **solo persiste la URL final** (`photoUrl` string) en la tabla `pets`. No recibe binarios.

### Flujo

```
1. owner tap "Agregar foto" en NewPetScreen
2. expo-image-picker → uri local (file://...)
3. POST https://api.cloudinary.com/v1_1/{cloud_name}/image/upload
   Body: multipart/form-data con { file: uri, upload_preset: EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET }
4. Cloudinary responde { secure_url: "https://res.cloudinary.com/.../pet-123.jpg" }
5. Mobile envía la URL al backend al crear la mascota:
   POST /api/pets { name, species, ..., photoUrl: "https://res.cloudinary.com/..." }
```

### Variables de entorno mobile

```
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=...
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
```

### Fallback si no hay Cloudinary configurado

Si las variables no están seteadas, `uploadPetPhoto` en `src/utils/permissions.ts` retorna la `file://` URI local. La URL funciona en el dispositivo del owner pero **no en otros dispositivos** (ni en la web del vet). Aceptable para dev, no para producción.

---

## 8. Flujos end-to-end

### 8.1 Registro → alta de mascota → chat IA

```
1. POST /api/auth/register { platform: 'mobile' }
   → 201 { user, accessToken, refreshToken }
   → SecureStore.setItem × 3
   → router.replace('/(app)')

2. (Tab "Mascotas") → "+ Nueva"
   → expo-image-picker → upload Cloudinary → URL
   → POST /api/pets { name, species, ..., photoUrl }
   → 201 { pet }
   → router.replace('/(app)/pets')

3. (Tab "Chat IA") → "+ Nueva conversación"
   → POST /api/ai-assistant/conversations {}
   → 201 { conversation }
   → router.push('/(app)/chat/{id}')
   → POST /api/ai-assistant/conversations/{id}/messages { content }
   → 200 { message }  ← respuesta de Claude
```

### 8.2 Cola → videollamada → valoración

```
1. (Tab "Cola") → seleccionar mascota + motivo → "Unirme a la cola"
   → POST /api/queue/join { petId, reason }
   → 201 { entry: { status: 'WAITING', position: N } }

2. WebSocket: conectado al montar el layout (app)
   → Owner envía ping cada 20s
   → Backend mantiene entry activo

3. Vet (web) llama POST /api/queue/take-next (FIFO con SELECT FOR UPDATE SKIP LOCKED)
   → Backend crea room LiveKit vetconnect-{entryId}
   → Backend genera tokens vet + owner
   → WS broadcast al owner: ENTRY_ASSIGNED { entry, livekitToken, livekitRoomName }
   → Mobile: queueStore.myEntry.livekitToken populado
   → UI muestra "Iniciar videollamada"

4. Owner tap "Iniciar videollamada" → /call/{entryId}
   → requestCameraAndMicPermissions()
   → useLiveKitCall({ roomName, token })
     → room.connect(LIVEKIT_URL, token)
     → room.localParticipant.setMicrophoneEnabled(true)
     → room.localParticipant.setCameraEnabled(true)
   → Cuando connectionState === 'connected':
     POST /api/queue/{id}/confirm-connection (entry ASSIGNED → IN_CONSULTATION)
   → Heartbeat: POST /api/consultations/{id}/ping cada 30s

5. Vet (web) carga notas + diagnóstico + treatment → POST /queue/{id}/finalize
   → WS al owner: CONSULTATION_FINALIZED
   → Mobile: call screen detecta finalización → router.replace('/(app)/history')
   → (LiveKit room cerrado por backend)

6. Owner tap "⭐ Valorar consulta"
   → POST /api/consultations/{id}/rate { rating: 4, comment: '...' }
   → 201 → refetch history
```

### 8.3 Emergencia detectada por IA

```
1. Owner en chat escribe "mi perro no respira"
   → POST /api/ai-assistant/conversations/{id}/messages { content: 'mi perro no respira' }

2. Backend: detectEmergencies('mi perro no respira') → match keyword 'no respira'
   → Marca conversation.status = 'ESCALATED'
   → Persiste user message con flagged: true
   → Persiste assistant message con contenido EMERGENCY_RESPONSE (fijo), flagged: true
   → NO llama a Claude
   → 200 { message }  ← respuesta fija de emergencia

3. Mobile: renderiza el ChatBubble con banner "🚨 Conversación escalada"
   → CTA "Pedir videollamada ahora" → router.push('/(app)/queue')
```

---

## 9. Reglas de seguridad respetadas

Las reglas del Prompt Maestro §6 (Seguridad) implementadas en mobile:

| Regla | Implementación mobile |
|-------|----------------------|
| **JWT** HS256 access 15min + refresh rotativo 7d | `secureStorage` + interceptor Axios de refresh con detección de reúso (401 = logout hard) |
| **Anti-enumeración**: mensajes "Credenciales inválidas" idénticos para email o password incorrectos | El backend garantiza el mensaje; mobile solo muestra el `error.message` |
| **Refresh token rotativo con detección de reúso** | Si `/auth/refresh` devuelve 401 con code `TOKEN_REUSE_DETECTED`, mobile limpia SecureStore y redirige a login |
| **LiveKit**: tokens TTL 2h, rooms `emptyTimeout` 5min, `maxParticipants: 2` | Mobile consume tokens ya generados por backend; respeta el lifecycle del room |
| **NUNCA loguear** contraseña, tokens, contenido de chat, `livekitRoomName` | Sin `console.log` en código (regla ESLint `no-console: warn`); `console.warn` solo en ws/livekit con mensajes sin PII |
| **PII**: logs solo userId, conversationId | Mobile no loguea contenido de mensajes (la UI solo muestra bubbles, no logs) |
| **Rate limiting AI** (10 msg/h/usuario, 30 msg/conversación, 50 conversaciones/mes) | Mobile muestra toast "Esperá X minutos" cuando recibe 429 con code `RATE_LIMIT` |
| **Detección de emergencias** en IA | Backend; mobile solo muestra banner y CTA |
| **Detección de prompt injection** en IA | Backend; mobile solo marca visualmente mensajes con `flagged: true` |
| **Soft delete**: nunca DELETE físico | Mobile usa `DELETE /api/pets/:id` (que el backend trata como soft/hard según tenga consultas asociadas) |

---

## 10. Diferencias explícitas mobile vs web

| Aspecto | Web | Mobile | Razón |
|---------|-----|--------|-------|
| **Refresh token storage** | Cookie httpOnly | `expo-secure-store` | Cookies no funcionan bien en RN |
| **Login/register payload** | `{ email, password }` | `{ email, password, platform: 'mobile' }` | Backend necesita saber que debe devolver refreshToken en body |
| **Refresh call** | `POST /auth/refresh` (cookie automática) | `POST /auth/refresh` con `{ refreshToken }` en body | No hay cookie |
| **Heartbeat WebSocket (owner)** | 20s | 20s | Igual |
| **Heartbeat WebSocket (vet)** | 15s | N/A (no hay vets en mobile) | Scope SP-09 |
| **Routing** | React Router v6 (paths) | Expo Router (file-based) | Stack RN |
| **Componentes UI** | shadcn/ui (Radix) | StyleSheet + componentes propios | RN no soporta DOM |
| **Tipografía** | `Inter` (Google Fonts) | Fuente del sistema (San Francisco / Roboto) | Reducir bundle |
| **Storage de UI state** | `localStorage` | `AsyncStorage` (no usado en MVP mobile) | — |
| **Videollamada client** | `livekit-client` | `@livekit/react-native` + `react-native-webrtc` | Bindings nativos |
| **Roles soportados** | OWNER, VET, ADMIN | Solo OWNER | Scope SP-09 |
| **Pantallas excluidas** | — | Billing, Users admin, Vet dashboard, Vet queue list, Vet stats | Scope SP-09 |
| **Push notifications** | N/A | Out of scope MVP (los owners deben tener la app abierta) | Spec SP-09 §"Notificaciones push" |
| **Dark mode** | Opcional MVP | Opcional MVP (no implementado en v1) | Spec SP-09 |
| **iOS** | N/A | Fuera de scope académico | Requiere Apple Dev Account paga |
| **Build** | Vercel | EAS Build (APK Android) | Plataforma móvil |

---

## 📚 Referencias

- **Prompt Maestro VetConnect** — sección 2 (Stack), 3 (Arquitectura), 6 (Seguridad), 7 (LiveKit/WS), 8 (IA), 9 (Frontend).
- **SP-01** — Auth + Users: define el esquema de refresh token rotativo.
- **SP-02** — Pets + VetCard: define el shape del VetCard.
- **SP-03** — Queue + WebSocket: define los eventos WS y el FIFO con `SELECT FOR UPDATE SKIP LOCKED`.
- **SP-04** — Consultations + LiveKit: define el naming de rooms y la generación de tokens.
- **SP-06** — AI Assistant: define el system prompt, detección de emergencias y rate limiting.
- **SP-08** — Frontend Web: referencia para componentes equivalentes (ChatWindow, VideoCall, QueueStatus).
- **SP-09** — Este documento mobile.
- **SP-10** — Infraestructura y deploy: define `eas.json` y variables `EXPO_PUBLIC_*`.

---

*Documento mantenido por el equipo mobile (Juan Mendoza). Última actualización: SP-09 v1.0.*
