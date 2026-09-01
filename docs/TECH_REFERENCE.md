# 📚 Referencia Técnica Integral del Sistema — ConectaVet

Esta guía contiene la documentación de bajo nivel, contratos de endpoints, eventos de WebSocket y estructura completa de directorios para desarrolladores.

---

## 1. Estructura de Directorios del Monorepo

```
conectavet/
├── backend/                        # API REST, WebSockets & Capa de Persistencia
│   ├── prisma/
│   │   ├── schema.prisma           # Modelado de datos PostgreSQL
│   │   └── seed.js                 # Semilla de datos de prueba
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/               # Registro, Login, Refresh JWT, Verificación Email
│   │   │   ├── users/              # Perfil de usuario, veterinarios, aprobación SENASA
│   │   │   ├── pets/               # CRUD de mascotas, especies, fichas clínicas
│   │   │   ├── consultations/      # Triage, colas, asignación, estados, notas
│   │   │   ├── calls/              # Señalización WebRTC y tokens LiveKit
│   │   │   ├── media/              # Subida de adjuntos (S3 / Local), magic bytes
│   │   │   └── notifications/      # Push Expo API y bandeja in-app
│   │   ├── shared/
│   │   │   ├── middlewares/        # Auth, Role Guard, Rate Limit, Error Handler
│   │   │   ├── prisma.ts           # Cliente Prisma singleton
│   │   │   ├── redis.ts            # Cliente ioredis & socket.io adapter
│   │   │   └── types/              # Contratos y tipos compartidos
│   │   ├── app.ts                  # Configuración de Express & Middlewares
│   │   └── server.ts               # Punto de entrada HTTP y Socket.io
│   ├── jest.config.js              # Configuración de pruebas automatizadas
│   └── package.json
│
├── web/                            # Frontend Web (Veterinarios, Admins y Tutores)
│   ├── src/
│   │   ├── components/
│   │   │   ├── call/               # GlobalCallListener, CallButton, VideoRoom
│   │   │   ├── dashboard/          # HomeSection, PetsSection, MessagesSection
│   │   │   │   └── vet/            # VetHomeSection, PatientsSection, VetMessagesSection
│   │   │   └── ui/                 # Componentes base (Button, Input, Card, Modal)
│   │   ├── pages/                  # Landing, Login, Register, Dashboard, AdminDashboard
│   │   ├── hooks/                  # useAuth, useConsultations, useChatSocket
│   │   ├── services/               # Axios endpoints, socket.io client, chatStore
│   │   └── types/                  # Tipos TypeScript
│   ├── tailwind.config.js          # Sistema de diseño, sombras por capas y easing
│   └── vite.config.ts
│
├── mobile/                         # Aplicación Nativa Mobile (React Native / Expo)
│   ├── app/                        # File-based routing (Expo Router)
│   │   ├── (auth)/                 # Pantallas de Login y Registro
│   │   └── (app)/                  # Pantallas con Tabs (Home, Pets, Chat, Historial)
│   ├── src/
│   │   ├── components/             # Componentes UI nativos (NativeWind)
│   │   ├── hooks/                  # useAuth, useIncomingCall, usePets
│   │   ├── lib/                    # api.ts, socket.ts, secureStore.ts
│   │   └── stores/                 # Zustand state stores
│   └── app.json                    # Configuración de Expo, permisos y bundle IDs
│
└── docs/                           # Documentación técnica consolidada
    ├── PROJECT_CHARTER.md          # Carta fundacional y visión del proyecto
    ├── ARCHITECTURE.md             # Arquitectura de alto nivel y normativas
    ├── DECISIONS.md                # Registro de decisiones de arquitectura (ADRs)
    ├── TECH_REFERENCE.md           # Este documento
    └── DEPLOY.md                   # Manual de despliegue en producción
```

---

## 2. Contratos de API REST (Endpoints Clave)

### 2.1 Autenticación (`/api/auth`)
| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| `POST` | `/api/auth/register` | Registro de nuevos tutores o veterinarios | Público |
| `POST` | `/api/auth/login` | Inicio de sesión, retorna JWT y cookies | Público |
| `POST` | `/api/auth/refresh` | Renovación de access token mediante refresh token | Público |
| `POST` | `/api/auth/logout` | Cierre de sesión y revocación de cookies | Autenticado |

### 2.2 Mascotas (`/api/pets`)
| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| `GET` | `/api/pets` | Listar mascotas del usuario autenticado | CLIENT |
| `POST` | `/api/pets` | Crear nueva ficha de mascota | CLIENT |
| `GET` | `/api/pets/:id` | Obtener detalle e historial clínico de una mascota | Dueño / Vet asignado |
| `PUT` | `/api/pets/:id` | Modificar datos de la mascota | Dueño |
| `DELETE`| `/api/pets/:id` | Soft-delete de mascota | Dueño / Admin |

### 2.3 Consultas & Telemedicina (`/api/consultations`)
| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| `POST` | `/api/consultations` | Crear consulta e ingresar en cola de triage | CLIENT |
| `GET` | `/api/consultations/mine`| Listar consultas activas/pendientes del usuario | Autenticado |
| `POST` | `/api/consultations/:id/accept` | Veterinario acepta consulta en cola | VET (Approved) |
| `POST` | `/api/consultations/:id/complete` | Cerrar consulta con notas de evolución | VET asignado |
| `POST` | `/api/consultations/:id/prescriptions` | Emitir receta digital estructurada | VET asignado |

### 2.4 Videollamadas (`/api/calls`)
| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| `POST` | `/api/calls/token` | Generar token de acceso LiveKit para una consulta | Participantes de la consulta |
| `POST` | `/api/calls/ring` | Disparar notificación de timbrado global al par | Participantes de la consulta |

---

## 3. Matriz de Eventos en Tiempo Real (Socket.io)

| Evento | Payload | Emisor | Receptor | Descripción |
|---|---|---|---|---|
| `join:consultation` | `consultationId: string` | Cliente / Vet | Servidor | Une el socket a la sala de chat de la consulta |
| `message:send` | `{ consultationId, content, attachmentUrl }` | Cliente / Vet | Servidor | Envía un nuevo mensaje de chat |
| `message:new` | `Message` object | Servidor | Sala de Consulta | Broadcast del mensaje a ambos participantes |
| `call:incoming` | `{ consultationId, callerName, roomName }` | Servidor | Usuario llamado | Dispara la alerta de llamada entrante en Web y Mobile |
| `call:answered` | `{ consultationId }` | Usuario llamado | Servidor | Notifica que la videollamada fue atendida |
| `call:rejected` | `{ consultationId, reason }` | Usuario llamado | Servidor | Cancela el timbrado en el dispositivo emisor |
| `prescription:new` | `Prescription` object | Servidor | Tutor / Sala | Notificación en tiempo real de nueva receta emitida |

---

## 4. Guía de Ejecución de Pruebas Automatizadas

```bash
# Ejecutar toda la suite de pruebas del backend (119+ tests)
cd backend
npm test

# Ejecutar únicamente pruebas unitarias
npm run test:unit

# Modo observación interactiva de tests (TDD)
npm run test:watch
```
