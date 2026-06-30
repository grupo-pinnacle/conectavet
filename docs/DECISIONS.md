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

## ADR-004: Autenticación JWT sin refresh token

**Contexto:** Diseño del sistema de autenticación.

**Decisión:** JWT con expiración de 7 días, sin refresh token.

**Consecuencias:** + Simplicidad, - Sesión perdida al expirar. Aceptable para MVP. Refresh token se agregará post-MVP si es necesario.

---

## ADR-005: Soft delete en lugar de borrado físico

**Contexto:** Manejo de eliminación de registros.

**Decisión:** Soft delete con campo `deletedAt` + endpoint `POST /:id/restore`.

**Consecuencias:** + Recuperación de datos, + Auditoría, - Queries deben filtrar `deletedAt: null`. Implementado en Pet como piloto.

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

## ADR-008: npm workspaces no implementado

**Contexto:** Coordinación de dependencias entre backend, web y mobile.

**Decisión:** No usar npm workspaces. Cada subproyecto tiene su propio package.json.

**Consecuencias:** + Independencia de versiones, - Dependencias duplicadas. Se evaluará post-MVP si el monorepo crece.

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
