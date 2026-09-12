# 📐 SYSTEM & TECHNICAL SPECIFICATION (SPEC)
## Proyecto: ConectaVet (VetConnect) — Especificación Técnica y Arquitectónica Integral
**Document ID:** `SPEC-CONECTAVET-2026-V2`  
**Autor:** Senior / Staff Systems Architect & Tech Lead (FAANG Tier Standards)  
**Organización:** Grupo Pinnacle / ConectaVet Team  
**Fecha de Emisión:** Septiembre 2026  
**Estado:** `APPROVED (ACTIVE SYSTEM SPEC)`  
**Clasificación:** Tier-1 Engineering RFC & Implementation Specification  

---

## 1. Visión General & Objetivos del Sistema

Esta especificación técnica define de manera exhaustiva la arquitectura, contratos de datos, protocolos de tiempo real, seguridad y modelos de falla para la plataforma **ConectaVet (VetConnect) v2.0**. 

### 1.1 Objetivos de Ingeniería
- **Latencia Ultra Baja:** Entrega de mensajería en tiempo real con latencia P95 $< 80\text{ ms}$ e inicio de videollamadas WebRTC P95 $< 1500\text{ ms}$.
- **Concurrencia & Desacoplamiento:** Soporte de clustering horizontal sin estado en la capa de cómputo Node.js mediante adaptadores distribuidos Redis.
- **Idempotencia Garantizada:** Tolerancia a reintentos en redes móviles inestables con deduplicación criptográfica de mensajes.
- **Blindaje Legal & Sanitario:** Trazabilidad inmutable de historias clínicas y cumplimiento del 100% de la **Ley N° 25.326** y resoluciones de **SENASA**.

---

## 2. Topología del Sistema & Arquitectura de Componentes

El backend se estructura bajo el patrón **Modular Monolith (Domain-Driven Design)**, desplegado en un runtime único de **Node.js 20 LTS** con **Express 5**, desacoplado de la persistencia mediante **PostgreSQL** y **Redis**.

```mermaid
flowchart TB
    subgraph Clients["Perímetro de Clientes (Frontend)"]
        Mobile["📱 Mobile App (React Native / Expo 54)<br/>• Socket.io Client & Zustand Store<br/>• LiveKit Video WebView Bridge<br/>• SecureStore para Tokens"]
        WebPro["💻 Web Pro Portal (React 19 / Vite)<br/>• TanStack React Query v5<br/>• LiveKit Components React<br/>• Tailwind CSS v3 Craft Tokens"]
        WebAdmin["🛡️ Web Admin Portal<br/>• Sala de Espera SENASA<br/>• AuditLog Explorer"]
    end

    subgraph Edge["Capa de Borde & Gateway"]
        Traefik["🌐 Traefik Reverse Proxy (Coolify Managed)<br/>• Terminación TLS 1.3 / Let's Encrypt<br/>• Enrutamiento WSS / HTTPS<br/>• Cabeceras de Seguridad (Helmet)"]
    end

    subgraph BackendCluster["Cluster Backend (Node.js 20 / Express 5)"]
        subgraph Modules["Módulos de Dominio (Modular Monolith)"]
            AuthMod["🔑 auth/ (IAM y tokenVersion)"]
            UserMod["👤 users/ (Perfiles y SENASA)"]
            PetMod["🐾 pets/ (Ficha Clínica Digital)"]
            ConsultMod["🩺 consultations/ (Triage y State Machine)"]
            CallMod["🎥 calls/ (LiveKit Token Grants)"]
            MediaMod["📦 media/ (Magic Bytes Inspector)"]
            AuditMod["📜 audit/ (Immutable AuditLog)"]
        end
        SocketGateway["⚡ Clustered Socket.io Gateway<br/>• Room Multiplexing<br/>• Deduplication Engine"]
    end

    subgraph PersistenceServices["Capa de Persistencia & Media Cloud"]
        Postgres[("🐘 PostgreSQL (Supabase / Prisma 6)<br/>• Composite Indexed Relational Store<br/>• Soft-Deletes y PII Scrubbing")]
        RedisStore[("🔴 Redis In-Memory Store<br/>• Socket.io Redis Adapter<br/>• Distributed Rate Limiter<br/>• Realtime State Cache")]
        S3Storage[("🪣 Amazon S3 / Fallback Local<br/>• Cifrado en Reposo AES-256<br/>• URLs Firmadas con TTL")]
        LiveKitServer["🎥 LiveKit Cloud SFU<br/>• WebRTC Media Relay<br/>• Adaptive Simulcast Engine"]
    end

    Mobile -->|HTTPS / WSS| Traefik
    WebPro -->|HTTPS / WSS| Traefik
    WebAdmin -->|HTTPS| Traefik

    Traefik --> AuthMod
    Traefik --> SocketGateway

    AuthMod --> Postgres
    UserMod --> Postgres
    PetMod --> Postgres
    ConsultMod --> Postgres
    AuditMod --> Postgres

    MediaMod --> S3Storage

    SocketGateway -->|Redis Pub/Sub| RedisStore
    RedisStore -->|Redis Pub/Sub| SocketGateway

    CallMod -.->|Token Grants| LiveKitServer
    Mobile -.->|RTP Media Traffic| LiveKitServer
    WebPro -.->|RTP Media Traffic| LiveKitServer
```

---

## 3. Modelo de Datos, Esquema Prisma & Máquinas de Estado

### 3.1 Mapeo Relacional & Convenciones de Nomenclatura
Para prevenir desincronizaciones entre la convención de código JavaScript (`camelCase`) y la nomenclatura de base de datos SQL (`snake_case`), **todas las columnas multi-palabra están mapeadas explícitamente con `@map`**.

```mermaid
erDiagram
    User ||--o{ Pet : "owns"
    User ||--o{ Consultation : "participates"
    User ||--o{ Message : "sends"
    User ||--o{ Prescription : "issues"
    User ||--o{ Review : "evaluates/receives"
    User ||--o{ FavoriteVet : "favorites"
    User ||--o{ PushToken : "registers"
    User ||--o{ Notification : "receives"
    User ||--o{ Attachment : "uploads"

    Pet ||--o{ Consultation : "subject"
    Consultation ||--o{ Message : "contains"
    Consultation ||--o{ Prescription : "generates"
    Consultation ||--o| Review : "receives"

    User {
        string id PK
        string email UK
        string password
        string role
        string vetStatus
        int tokenVersion
        float ratingAvg
        int ratingCount
        boolean isOnline
        datetime lastSeen
        datetime deletedAt
    }

    Pet {
        string id PK
        string name
        string species
        string breed
        float weightKg
        string sex
        string microchip
        string allergies
        string chronicConditions
        datetime deletedAt
    }

    Consultation {
        string id PK
        string clientId FK
        string vetId FK
        string petId FK
        string status
        string notes
        string diagnosisNotes
        datetime startedAt
        datetime endedAt
        datetime deletedAt
    }

    Message {
        string id PK
        string consultationId FK
        string senderId FK
        string content
        string attachmentUrl
        string clientMsgId UK
        datetime createdAt
        datetime deletedAt
    }

    Prescription {
        string id PK
        string consultationId FK
        string vetId FK
        string medication
        string dosage
        string frequency
        string durationDays
        string indications
        datetime createdAt
    }

    AuditLog {
        string id PK
        string adminId
        string action
        string targetId
        string ipAddress
        json details
        datetime createdAt
    }
```

### 3.2 Estrategia de Indexación Compuesta
Optimizada para consultas de alta concurrencia:
1. `users`: `@@index([role, isOnline, vetStatus, deletedAt])` — Filtrado instantáneo de veterinarios disponibles en triage.
2. `consultations`: `@@index([clientId, status, deletedAt])` y `@@index([vetId, status, deletedAt])` — Consultas activas de dashboards.
3. `messages`: `@@index([consultationId, createdAt])` — Paginación cronológica del chat clínico.
4. `messages`: `@@unique([clientMsgId])` — Deduplicación atómica garantizada por motor SQL.

---

### 3.3 Máquinas de Estado Finitas (FSM)

#### A. Ciclo de Vida de la Consulta Telemática
```mermaid
stateDiagram-v2
    [*] --> WAITING: Tutor solicita consulta
    WAITING --> PENDING: Asignada a Veterinario
    WAITING --> CANCELLED: Tutor cancela espera

    PENDING --> ACTIVE: Veterinario acepta
    PENDING --> WAITING: Veterinario declina o Timeout

    ACTIVE --> COMPLETED: Veterinario emite diagnostico
    ACTIVE --> CANCELLED: Terminacion extraordinaria

    COMPLETED --> [*]
    CANCELLED --> [*]
```

#### B. Onboarding & Validación Profesional (SENASA)
```mermaid
stateDiagram-v2
    [*] --> PENDING: Veterinario se registra
    PENDING --> APPROVED: Administrador valida matricula
    PENDING --> REJECTED: Matricula rechazada
    APPROVED --> [*]: Habilitado para atender
    REJECTED --> [*]: Cuenta inhabilitada
```

---

## 4. Contratos de API REST & Protocolo de Tiempo Real

### 4.1 Contratos de Endpoints REST Clave
Todos los payloads de entrada y salida se validan estrictamente mediante esquemas **Zod**.

| Método | Ruta | Descripción | Acceso | Código Éxito |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Registro de usuarios (CLIENT o VET) | Público | 201 Created |
| `POST` | `/api/auth/login` | Login, emisión de JWT y cookies HttpOnly | Público | 200 OK |
| `POST` | `/api/auth/refresh` | Renovación de access token | Público | 200 OK |
| `POST` | `/api/auth/logout` | Revocación de sesión e invalidación de cookie | Autenticado | 200 OK |
| `GET` | `/api/pets` | Listado de mascotas del tutor | CLIENT / ADMIN | 200 OK |
| `POST` | `/api/pets` | Registro de nueva ficha de mascota | CLIENT / ADMIN | 201 Created |
| `GET` | `/api/pets/:id` | Detalle clínico e historial | Dueño / Vet asignado | 200 OK |
| `POST` | `/api/consultations` | Ingreso a cola de triage | CLIENT | 201 Created |
| `PATCH`| `/api/consultations/:id/assign` | Veterinario toma consulta de cola | VET (APPROVED) | 200 OK |
| `PATCH`| `/api/consultations/:id/complete` | Cierre clínico con evolución y diagnóstico | VET asignado | 200 OK |
| `POST` | `/api/consultations/:id/prescriptions` | Emisión de receta oficial con firma/QR | VET asignado | 201 Created |
| `POST` | `/api/consultations/:id/messages` | Envío de mensaje en chat con clientMsgId | Participantes | 201 Created |
| `POST` | `/api/calls/token` | Generación de token efímero LiveKit SFU | Participantes | 200 OK |
| `POST` | `/api/media` | Subida de archivos con chequeo de Magic Bytes| Autenticado | 201 Created |
| `PATCH`| `/api/admin/vets/:id/approve` | Aprobación de matrícula SENASA | ADMIN | 200 OK |

### 4.2 Formato Estándar de Errores (RFC 7807 Pattern)
```json
{
  "success": false,
  "error": {
    "code": "VET_CREDENTIALS_PENDING_APPROVAL",
    "message": "Su matrícula se encuentra en proceso de validación por el equipo de auditoría.",
    "details": null,
    "timestamp": "2026-09-12T22:30:00.000Z"
  }
}
```

---

### 4.3 Matriz de Eventos de Tiempo Real (Socket.io)

| Evento | Dirección | Payload | Propósito |
|---|---|---|---|
| `join:consultation` | Cliente $\to$ Server | `{ consultationId: string }` | Suscribe el socket a la sala privada `consultation:{id}`. |
| `message:send` | Cliente $\to$ Server | `{ consultationId, content, clientMsgId, attachmentUrl }` | Envío de mensaje con deduplicación idempotente. |
| `message:new` | Server $\to$ Room | `MessageDTO` | Broadcast instantáneo a los participantes de la sala. |
| `call:incoming` | Server $\to$ Peer | `{ consultationId, callerName, roomName }` | Dispara la alerta de timbrado en Web y Mobile. |
| `call:answered` | Peer $\to$ Server | `{ consultationId }` | Detiene el timbrado y confirma inicio de sesión WebRTC. |
| `call:rejected` | Peer $\to$ Server | `{ consultationId, reason }` | Cancela el timbrado en el par emisor. |
| `prescription:new` | Server $\to$ Tutor | `PrescriptionDTO` | Notifica la emisión inmediata de la receta médica con QR. |

---

## 5. Arquitectura de Seguridad, IAM & Criptografía

### 5.1 Revocación Atómica de Sesión (`tokenVersion`)
1. El modelo `User` almacena un entero incremental `tokenVersion` (por defecto `1`).
2. Al firmar el JWT (HMAC-SHA256 con `JWT_SECRET`), se incluye en el payload: `{ userId: user.id, tokenVersion: user.tokenVersion }`.
3. El middleware `auth.middleware.ts` decodifica el token y valida que `payload.tokenVersion === user.tokenVersion`.
4. Ante cambio de password, baneo administrativo o logout global, se ejecuta `UPDATE users SET token_version = token_version + 1 WHERE id = :userId`, invalidando inmediatamente todos los tokens en circulación sin consultar listas negras pesadas.

### 5.2 Inspección Binaria de Archivos (*Magic Bytes*)
Para neutralizar la subida de ejecutables camuflados, el middleware interceptor inspecciona los primeros bytes del buffer en memoria:
- **JPEG:** `FF D8 FF`
- **PNG:** `89 50 4E 47 0D 0A 1A 0A`
- **PDF:** `25 50 44 46`
Si la firma binaria no concuerda con el MIME type declarado en la cabecera HTTP, la solicitud es rechazada de inmediato con `HTTP 400 Bad Request`.

### 5.3 Soft-Delete y Anonimización Legal (Ley 25.326)
Cuando se solicita la baja de una cuenta:
- Se reemplaza `email` por `anon_${uuid}@deleted.conectavet.internal`.
- Se reemplaza `firstName` y `lastName` por `"Usuario Eliminado"`.
- Se limpian `phone`, `bio` y `photoUrl`.
- Se establece `deletedAt = now()`.
- **Historias clínicas y consultas permanecen intactas**, asociadas al ID persistido para cumplir con el plazo legal de conservación médica sin exponer datos personales del tutor.

---

## 6. Requerimientos No Funcionales (NFRs) & Service Level Objectives (SLOs)

```
+-----------------------------------------------------------------------------------------+
|                                  SLI / SLO TARGET MATRIX                                |
+------------------------------------+-----------------------------+----------------------+
| Indicador (SLI)                    | Método de Medición          | SLO Target           |
+------------------------------------+-----------------------------+----------------------+
| Disponibilidad de la API           | Uptime HTTP mensual         | >= 99.9%             |
| Latencia REST (P95)                | Tiempo respuesta endpoints  | < 120 ms             |
| Latencia WebSockets (P95)          | Tiempo round-trip de mensaje| < 80 ms              |
| Conexión WebRTC LiveKit (P95)      | Handshake a primer frame    | < 1500 ms            |
| Tasa de Pérdida de Paquetes Video  | Packet loss en streaming SFU| < 2.0%               |
| Integridad Criptográfica de Repo   | Escaneo en CI pre-merge     | 0 secretos expuestos |
+------------------------------------+-----------------------------+----------------------+
```

---

## 7. Análisis de Modos de Falla & Resiliencia (FMEA)

| Escenario de Falla | Componente | Detección | Impacto | Mecanismo de Mitigación / Auto-Recovery |
|---|---|---|---|---|
| **Caída de Redis Clúster** | Redis Store | Error de conexión en `@socket.io/redis-adapter` | Imposibilidad de sincronizar entre múltiples réplicas | Fallback automático a `Socket.io in-memory` por nodo; logs de alerta SEV-2 en APM. |
| **Indisponibilidad de LiveKit SFU** | WebRTC Server | Error en handshake `POST /api/calls/token` | Falla en inicio de videoconsulta | El cliente conmuta a **Modo Chat de Contingencia con Notas de Audio e Imágenes**. |
| **Falla en Almacenamiento S3** | Amazon S3 | Excepción en llamada a SDK AWS | Error al adjuntar exámenes clínicos | Fallback transparente a almacenamiento local en disco (`/uploads`) con permisos restringidos. |
| **Microcortes en Red Móvil 4G** | Dispositivo Tutor | Evento `disconnect` en Socket.io | Mensaje en tránsito potencialmente perdido | Reintento automático con backoff exponencial y deduplicación por clave única `clientMsgId`. |
| **Agotamiento Pool Postgres** | Prisma Client | Código de error P2024 | Tiempos de espera elevados en API | Connection Pooling activo en Supabase con límite estricto de conexiones concurrentes por instancia. |

---

## 8. Despliegue en Producción & Pipeline de Integración Continua

### 8.1 Arquitectura de Despliegue Productivo
- **Backend API & Redis:** Desplegado mediante **Coolify (PaaS self-hosted)** en servidor VPS con Docker y proxy inverso Traefik.
- **Frontend Web:** Alojado en la red Edge de **Vercel** con CDN global, compresión Brotli y certificados SSL automáticos.
- **Frontend Mobile:** Compilado mediante **Expo EAS** generando binarios nativos optimizados para Android (AAB para Google Play y APK directo).

### 8.2 Estrategia de Migraciones Zero-Downtime (Expand/Contract)
1. **Fase de Expansión:** Se añade la nueva columna o tabla en la base de datos permitiendo valores nulos (`nullable`). El código nuevo comienza a escribir en ambas estructuras.
2. **Fase de Sincronización:** Se migran los datos históricos en background.
3. **Fase de Contracción:** Una vez verificado que el 100% del tráfico utiliza la nueva estructura, se deprecan y eliminan las columnas obsoletas en una migración separada.

---

## 9. Aprobación y Vigencia de la Especificación

| Rol | Ingeniero Responsable | Veredicto | Fecha |
|---|---|---|---|
| **Staff Systems Architect** | Antigravity AI (FAANG Spec) | `APPROVED` | 2026-09-12 |
| **Tech Lead / Backend Lead** | Tobias Vera | `APPROVED` | 2026-09-12 |
| **Mobile Lead** | Juan Mendoza | `APPROVED` | 2026-09-12 |
| **Web Lead** | Damian Orellana | `APPROVED` | 2026-09-12 |
