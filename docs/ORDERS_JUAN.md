# Órdenes para Juan — Mobile Developer (MVP Mobile)

> **Tu misión:** Tener la app mobile funcionando para el MVP del 20 de julio.
> **Deadline interno:** 11 de julio (fin S7). Si no llegás, el MVP se presenta solo con web.
> **TL;DR:** Crear proyecto Expo, copiar helpers, conectar auth + mascotas + chat.

---

## Lo que ya está listo y podés usar

| Recurso | Dónde está |
|---------|-----------|
| Backend auth (register + login) | `POST /api/auth/register` y `POST /api/auth/login` |
| Pets CRUD | `GET/POST /api/pets`, `GET/PUT/DELETE /api/pets/:id` |
| Consultations + Chat | `POST /api/consultations`, WebSocket Socket.io |
| Helpers mobile (código de ejemplo) | `docs/helpers/mobile/` — copiá esto a tu proyecto |
| Tobias | Te va a ayudar en pairing todo S6 si es necesario |

---

## Sprint 6 (2-4 Jul) — Crear proyecto + Auth + Mascotas

### Día 1 (jue 2)

```bash
cd mobile
npx create-expo-app . --template blank-typescript
```

Después instalá las dependencias:
```bash
npx expo install axios @react-navigation/native @react-navigation/native-stack @react-native-async-storage/async-storage
```

Copiá los archivos de `docs/helpers/mobile/` a `mobile/src/`:
- `App.tsx` → `mobile/src/App.tsx`
- `context/AuthContext.tsx` → `mobile/src/context/AuthContext.tsx`
- `screens/LoginScreen.tsx` → `mobile/src/screens/LoginScreen.tsx`
- `screens/RegisterScreen.tsx` → `mobile/src/screens/RegisterScreen.tsx`
- `screens/HomeScreen.tsx` → `mobile/src/screens/HomeScreen.tsx`

**Verificación:** La app debe mostrar LoginScreen al abrirse.

### Día 2 (vie 3) — Conectar auth

En `AuthContext.tsx`, cambiar `api.post('/api/auth/login')` — la URL del backend en desarrollo es `http://localhost:3000`.

En producción va a ser `https://conectavet-api.up.railway.app` (cuando Tobias deploye).

**Verificación:** Registrate como CLIENT → login → ves el HomeScreen.

### Día 3 (sáb 4) — Pantalla de mascotas

Crear:
- `screens/AddPetScreen.tsx` — formulario con name, species, breed, age, weight
- `screens/PetListScreen.tsx` — lista de mascotas del usuario

Ambos llaman a la API de pets (ya está lista en el backend).

**Verificación:** Podés registrar una mascota y verla en la lista.

---

## Sprint 7 (6-8 Jul) — Chat + Consultas

### Tarea: Pantalla de chat

Crear `screens/ChatScreen.tsx`:
- Input de texto + botón enviar
- Lista de mensajes (scroll vertical)
- Conectar al WebSocket de Socket.io

**Coordinación con Damián:** El backend del chat es el mismo para web y mobile. Los dos consumen los mismos endpoints:
- `GET /api/consultations/:id/messages` (historial)
- Socket.io en `http://localhost:3000` con `{ auth: { token } }`

**Eventos Socket.io:**
```typescript
// Conectar
const socket = io('http://localhost:3000', { auth: { token } });

// Unirse a sala de consulta
socket.emit('join:consultation', consultationId);

// Enviar mensaje
socket.emit('message:send', { consultationId, content });

// Recibir mensaje
socket.on('message:new', (message) => {
  setMessages(prev => [...prev, message]);
});
```

**Verificación:** CLIENT y VET pueden chatear en tiempo real.

---

## Sprint 8 (9-11 Jul) — Pulir + Navegación completa

- Conectar todas las pantallas: Register → Login → Home → AddPet → PetList → Chat
- Probar en Android físico (no solo emulador)
- Arreglar bugs de navegación

---

## Dependencias con el equipo

| Dependencia | De quién | Qué necesitás |
|-------------|---------|---------------|
| Backend funcionando | Tobias | Ya está. Si algo no funciona, hablale en la daily |
| Helpers mobile | Tobias (ya los hizo) | Están en `docs/helpers/mobile/` |
| Chat WebSocket | Tobias (ya lo implementó) | El backend ya tiene Socket.io. Solo conectate |
| URL de producción | Tobias | Cuando deploye Railway, te pasa la URL |
| Testing | Ezequiel | Él prueba tu mobile y reporta bugs |

---

## Plan B (si no llegás)

Si al 17 de julio mobile no está funcional:
1. **No entres en pánico.** Está documentado en `CHANNEL_DECISION.md`
2. El MVP se presenta con web responsive (Tailwind)
3. Mobile se muestra como "en progreso" con los helpers
4. Terminás mobile después de vacaciones (S11+)

**Pero ojalá no llegues a eso.** Pedí ayuda a Tobias en la daily si te trabás.
