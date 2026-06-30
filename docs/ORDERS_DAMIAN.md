# Órdenes para Damián — Web Developer (Frontend Web)

> **Tu misión:** Tener la web del médico funcional para el MVP.
> **Estado actual:** Auth + Pets ya funcionan (los dejó Tobias). Te toca armar la interfaz de consultas y chat.
> **TL;DR:** Conectar Dashboard a la API de consultas + armar UI de chat + formulario de cierre.

---

## Lo que ya está listo y podés usar

| Recurso | Endpoint / Archivo |
|---------|-------------------|
| AuthContext funcional | `web/src/context/AuthContext.tsx` ✅ |
| Login + Register | `pages/LoginPage.tsx`, `pages/RegisterPage.tsx` ✅ |
| Dashboard básico | `pages/DashboardPage.tsx` ✅ (Tobias lo armó) |
| ProtectedRoute | `components/ProtectedRoute.tsx` ✅ |
| Pets API | `GET/POST /api/pets`, `GET/PUT/DELETE /api/pets/:id` ✅ |
| **Consultations API (nueva)** | `POST /api/consultations`, `GET /api/consultations/mine` |
| **Chat WebSocket** | Socket.io en `localhost:3000` |
| **Assign/Complete** | `PATCH /api/consultations/:id/assign`, `PATCH /:id/complete` |

---

## Sprint 6 (2-4 Jul) — Dashboard médico con consultas

### Tarea 1: Conectar Dashboard a la API de consultas

En `DashboardPage.tsx`, cuando el rol es `VET`:
- Mostrar lista de consultas disponibles (WAITING) → `GET /api/consultations/mine`
- Cada consulta muestra: nombre del cliente, mascota, especie, fecha
- Botón "Tomar consulta" → `PATCH /api/consultations/:id/assign`

Cuando el rol es `CLIENT`:
- Mostrar sus mascotas → `GET /api/pets`
- Botón "Nueva consulta" → `POST /api/consultations` con `{ petId }`

### Tarea 2: Pantalla de consulta activa

Crear `pages/ConsultationPage.tsx` (o un modal en el Dashboard):
- Información de la consulta: cliente, mascota, estado
- Botón "Cerrar consulta" → `PATCH /api/consultations/:id/complete` con `{ notes }`
- Campo de texto para notas del veterinario

**Verificación:** Podés ver consultas disponibles, tomarlas y cerrarlas.

---

## Sprint 7 (6-8 Jul) — Chat en tiempo real

### Tarea: Integrar Socket.io en el Dashboard

El backend ya tiene Socket.io funcionando. En la web:

```typescript
// Instalar socket.io-client
// npm install socket.io-client

import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: localStorage.getItem('vetconnect_auth_token') }
});

// Unirse a sala cuando abrís una consulta
socket.emit('join:consultation', consultationId);

// Enviar mensaje
socket.emit('message:send', { consultationId, content });

// Escuchar mensajes nuevos
socket.on('message:new', (message) => {
  // agregar mensaje a la lista
});

// Cargar historial al abrir la consulta
const res = await api.get(`/api/consultations/${id}/messages`);
```

**Coordinación con Juan:** El backend del chat es el mismo. Juan usa el mismo WebSocket desde mobile. Ambos consumen:
- `GET /api/consultations/:id/messages` para historial
- Socket.io para tiempo real

**La sala de chat se identifica por `consultationId`.** Si vos y Juan están en la misma consulta, se ven los mensajes de ambos.

---

## Sprint 8 (9-11 Jul) — Pulir

- Estados de carga (spinner mientras carga)
- Estados de error (toast si falla la API)
- Responsive: probar en pantalla chica (el plan B del MVP es web para todos)
- Formulario de notas clínicas con validación

---

## Dependencias con el equipo

| Dependencia | De quién | Qué necesitás |
|-------------|---------|---------------|
| Consultations API | Tobias | Ya está. Si algo no funciona, hablale |
| Chat WebSocket | Tobias | Ya está. Solo conectate |
| Wireframes | Ezequiel | Si Ezequiel actualizó Figma, seguí esos diseños |
| Testing | Ezequiel | Él prueba tu web y reporta bugs |

---

## Cómo correr todo local

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Web
cd web
npm run dev
```

La web se conecta a `localhost:3000` via Vite proxy (configurado en `vite.config.ts`).

---

## Checklist rápido pre-MVP

- [ ] Dashboard VET muestra consultas WAITING
- [ ] Botón "Tomar consulta" funciona
- [ ] Pantalla de chat con mensajes en tiempo real
- [ ] Botón "Cerrar consulta" con notas
- [ ] Dashboard CLIENT muestra sus mascotas
- [ ] CLIENT puede iniciar una consulta
- [ ] CLIENT puede ver el chat
- [ ] Build sin errores: `npm run build`
- [ ] Errores de red se muestran al usuario (no se rompe en silencio)
