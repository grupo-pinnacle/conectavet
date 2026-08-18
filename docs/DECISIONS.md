# Decisiones de Arquitectura — VetConnect

## ADR-001: Monolito modular vs Microservicios

**Contexto:** Necesitábamos decidir entre un monolito o microservicios para el backend.

**Decisión:** Monolito modular (cada feature en su propia carpeta con controller/service/routes).

**Consecuencias:** + Simplicidad de deploy (un solo proceso), - Escalabilidad limitada. Correcto para MVP.

---

## ADR-002: Prisma vs TypeORM / Drizzle

**Contexto:** Elección de ORM para PostgreSQL.

**Decisión:** Prisma 6 por schema-first, migrations automáticas, tipado fuerte, DX superior.

**Consecuencias:** + Velocidad de desarrollo, - Performance en queries complejas (mitigado con raw queries cuando sea necesario).

---

## ADR-003: Supabase como base de datos

**Contexto:** Elegir entre PostgreSQL local, Supabase, o Railway.

**Decisión:** Supabase (PostgreSQL hosted + pooler).

**Consecuencias:** + No requiere infraestructura propia, - Datos sensibles en cloud. Mitigado con .env en .gitignore y credenciales rotadas.

---

## ADR-004: Autenticación JWT con refresh token

**Contexto:** Diseño del sistema de autenticación.

**Decisión:** JWT con expiración de 7 días para access token + refresh token con expiración de 30 días. Endpoint `POST /api/auth/refresh` para renovar el par sin requerir login.

**Consecuencias:** + Mejora experiencia de usuario (no pierde sesión cada 7 días), + Seguridad (access token de corta duración), - Mayor superficie de ataque (2 tokens circulando). Refresh token se valida por JWT únicamente (sin blacklist en BD). Post-MVP se puede agregar rotación forzada con tabla de refresh tokens.

---

## ADR-005: Soft delete en lugar de borrado físico

**Contexto:** Manejo de eliminación de registros.

**Decisión:** Soft delete con campo `deletedAt` + endpoint `POST /:id/restore`.

**Consecuencias:** + Recuperación de datos, + Auditoría, - Queries deben filtrar `deletedAt: null`. Implementado exclusivamente en Pet como piloto. Si se valida, se extenderá a otros modelos post-MVP.

---

## ADR-006: Singleton de PrismaClient

**Contexto:** Múltiples instancias de PrismaClient causaban conexiones excesivas.

**Decisión:** Instancia única en `shared/prisma.ts` usando globalThis para hot-reload.

**Consecuencias:** + Conexiones controladas, - Acoplamiento al singleton. Estándar recomendado por Prisma.

---

## ADR-007: Validación con Zod

**Contexto:** Validación de request bodies.

**Decisión:** Zod para schemas de validación en los controllers.

**Consecuencias:** + Tipado fuerte, + Mensajes de error claros, - Dependencia externa. Mejor que validación manual.

---

## ADR-008: npm workspaces para tipos compartidos

**Contexto:** Coordinación de dependencias entre backend, web y mobile. Los tipos `User`, `Pet`, `JwtPayload`, `ApiResponse` estaban duplicados en backend y web.

**Decisión:** npm workspaces con paquete `@conectavet/shared` en `packages/shared/`. El root `package.json` define los workspaces. Ambos proyectos importan desde el mismo paquete.

**Consecuencias:** + Tipos unificados (cambio en un solo lugar), + Eliminación de duplicación, - Dependencia de estructura de monorepo. Los workspaces están configurados pero el equipo debe recordar `npm install` desde la raíz, no desde los subdirectorios.

> [!WARNING]
> **ADR-008 no adoptado en la práctica:** aunque el paquete existe, **web y mobile no lo importan** (0 imports reales de `@conectavet/shared`). Los tipos `ApiResponse`, `JwtPayload`, `User`, `Pet` se siguen redefiniendo localmente en cada capa. La "eliminación de duplicación" aún no ocurrió. Pendiente aplicar: reexportar desde `packages/shared` y reemplazar los tipos locales (`backend/src/lib/types/index.ts` ya re-exporta de shared, pero web/mobile no lo consumen).

---

## ADR-009: Chat de texto con Socket.io + PostgreSQL

**Contexto:** El MVP original incluía LiveKit para videollamadas. Se reemplazó por chat de texto para reducir riesgo técnico (ver `MVP_SCOPE.md`). Necesitábamos decidir la tecnología de comunicación en tiempo real.

**Decisión:** Socket.io para mensajería en tiempo real + tabla `Message` en PostgreSQL vía Prisma para persistencia.

| Aspecto | Decisión |
|---------|----------|
| Transporte | WebSocket con Socket.io (fallback a polling HTTP si WebSocket no está disponible) |
| Persistencia | Tabla `Message` en PostgreSQL (misma BD que el resto) |
| Sala por consulta | Cada consulta es una sala Socket.io identificada por `consultationId` |
| API REST adicional | `GET /api/consultations/:id/messages` (historial al reconectar) |
| Sin caché | Para MVP. Post-MVP se evaluará Redis para histórico de chats recientes |

**Modelo Message en Prisma:**
```prisma
model Message {
  id             String       @id @default(cuid())
  consultationId String
  consultation   Consultation @relation(fields: [consultationId], references: [id])
  senderId       String
  sender         User         @relation(fields: [senderId], references: [id])
  content        String
  createdAt      DateTime     @default(now())

  @@index([consultationId, createdAt])
  @@map("messages")
}
```

**Consecuencias:** + Tiempo real sin infraestructura adicional (misma BD, mismo servidor), + Socket.io es maduro y bien documentado, + Historial persiste aunque el usuario se desconecte. - Sin caché, consultas anteriores requieren query a PostgreSQL. - Escalabilidad horizontal requiere sticky sessions o adaptador Redis (post-MVP).

---

## ADR-010: Imágenes del chat en disco local (multer) en vez de Cloudinary

**Contexto (Sprint 12):** El chat necesitaba adjuntar fotos. Las fotos de mascotas ya usan Cloudinary, pero hacer el upload directo desde el cliente a Cloudinary en el chat complicaba el flujo (preset unsigned, URL pública inmediata sin control de acceso).

**Decisión:** El backend recibe el archivo (`POST /api/media`, multer, 5 MB máx, jpeg/png/webp/gif), lo guarda en `backend/uploads/` y persiste solo `attachmentUrl` (`/uploads/<archivo>`) en `Message`.

**Consecuencias:** + Un solo punto de entrada con validación y auth, + URL relativa sirve igual en web y mobile vía proxy/estático. - El disco es **efímero** en Koyeb/Render (las imágenes se pierden al redeployear; para producción migrar a Cloudinary/S3 o volumen persistente, ver `DEPLOY.md`). - Sin CDN ni resize server-side.

---

## ADR-011: Notificaciones push vía API de Expo + bandeja in-app

**Contexto (Sprint 12):** Habilitar notificaciones push sin agregar FCM/APNs a mano ni infraestructura propia.

**Decisión:** `expo-notifications` en mobile genera el `ExpoPushToken`, que el usuario publica en `POST /api/notifications/token`. El backend guarda `PushToken` (único por token) y envía con `sendExpoPush` (fetch a `exp.host/--/api/v2/push/send`, timeout 5s, best-effort). Además se persiste una `Notification` por usuario (bandeja in-app: `GET /api/notifications`, `PATCH /:id/read`).

**Consecuencias:** + Cero infraestructura de push, + La bandeja in-app funciona aunque el push no llegue (app cerrada/sin permiso). - `sendExpoPush` es best-effort (si Expo responde 5xx, el usuario igual ve la bandeja), - En tests se desactiva con `EXPO_PUSH_DISABLED=true`.

---

## ADR-012: Auto-registro de veterinarios con aprobación (vetStatus)

**Contexto:** Hoy el registro público solo crea `CLIENT` y el alta de `VET` la hace un `ADMIN` por `POST /api/users/admin/users`. Para escalar sin cuello de botella en el dueño, los veterinarios deben poder registrarse solos.

**Decisión:** El registro público acepta `role: 'VET'` + `specialty`. Se crean con `vetStatus = PENDING` y NO pueden atender hasta ser aprobados. La aprobación se hace por `ADMIN` vía `PATCH /api/users/:id/vet-status` (o CLI). Los vets creados por admin mantienen `vetStatus = APPROVED` (default). El directorio (`listVets`, `getAvailableVets`) solo muestra `APPROVED`. El front muestra el estado "pendiente de aprobación".

**Consecuencias:** + Escala el onboarding de vets, + Sin vets no verificados atendiendo, - Requiere flujo de aprobación (admin/CLI) y migración de columna (`vetStatus` + enum). Default `APPROVED` para no romper vets existentes creados por admin.

---

## ADR-013: Lectura de mascota/PII acotada a la participación en la consulta

**Contexto:** `getPetById` permitía a CUALQUIER vet leer el detalle (y PII del dueño) de CUALQUIER mascota. Riesgo de enumeración/fuga de PII médica.

**Decisión:** Un `VET`` solo puede leer el detalle completo de una mascota si tiene o tuvo una consulta con ella (`consultation` con `vetId` + `petId`). `CLIENT` solo su propia mascota. `ADMIN` acceso total. En las listas de directorio (`listVets`, `getAvailableVets`) se omite `email` (PII) para evitar cosecha masiva; el detalle 1-a-1 (`getVetById`) mantiene contacto intencional.

**Consecuencias:** + Cierre de fuga de PII, + Alineado al principio de mínimo privilegio, - Pequeña consulta extra por lectura de mascota por vet (cacheable).

---

## ADR-014: Redis obligatorio en producción multi-instancia

**Contexto:** El adapter de Socket.io, el rate-limit y el dedup de mensajes usan in-memory y solo se vuelven distribuidos si `REDIS_URL` está presente. Con >1 instancia y sin Redis, los mensajes/estado se fragmentan.

**Decisión:** En `NODE_ENV=production` con `REDIS_URL` seteado se activa el adapter Redis (multi-instancia) + rate-limit/dedup distribuido. Si `REDIS_URL` falta en prod, el arranque emite WARNING y usa in-memory (NO apto para >1 instancia). El `healthcheck` no degrada por Redis caído (fallback in-memory), pero se loguea.

**Consecuencias:** + Horizontal scaling seguro cuando se configura, + Fallback graceful, - Requiere que el deploy de prod setee `REDIS_URL` para >1 instancia.
