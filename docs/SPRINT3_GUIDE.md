# Guía Sprint 3 — Estado del Backend

**Fecha:** Lun 29 de junio, 2026
**Autor:** Tobias (Backend)
**Rama:** `Backend` (pendiente merge a `main`)

---

## ¿En qué parte del sprint estoy?

**Sprint 3 — Día 1 completado (lun 29).** Adelanté parte del Día 2.

### Lo que ya está listo

| Tarea | Estado |
|-------|--------|
| Migrar BD local a **Supabase** (online) | ✅ |
| `POST /api/auth/register` (CLIENT, VET, ADMIN) | ✅ |
| `POST /api/auth/login` (con JWT) | ✅ |
| `GET /api/users/me` (token requerido) | ✅ |
| `GET /api/users/admin-only` (solo ADMIN) | ✅ |
| Middleware `authenticate` y `authorize` por roles | ✅ |
| `GET /api/pets` — listar mascotas del usuario | ✅ |
| `POST /api/pets` — crear mascota | ✅ |
| `GET /api/pets/:id` — detalle mascota | ✅ |
| `PUT /api/pets/:id` — editar mascota | ✅ |
| `DELETE /api/pets/:id` — eliminar mascota | ✅ |
| `GET /api/users/vets` — listar veterinarios | ✅ |
| Tests de auth con Jest (9/9) | ✅ |
| Package.json limpiado (merge mal resuelto) | ✅ |
| Server compila y corre desde `dist/` | ✅ |

### Lo que falta para cerrar Sprint 3

- Push a `main` (el remote `grupo-pinnacle` no es accesible desde mi entorno, verificar credentials)
- Deploy a Railway (cuando el remote esté disponible)
- Los demás integrantes conectando mobile/web al backend

---

## ¿Qué cambió con Supabase?

**Antes:** Base de datos PostgreSQL local. Cada uno tenía que crear su propia BD. Para hacer cambios había que copiar SQL al editor de Supabase.

**Ahora:** Todo se maneja con **Prisma**. La BD está hosteada en Supabase (online). Todos se conectan desde su código a la misma BD.

### ¿Cómo se manejan los cambios en la BD?

```
1. Editás prisma/schema.prisma (agregás un modelo, campo, etc.)
2. Ejecutás: npx prisma db push
3. Prisma actualiza Supabase automáticamente
4. En el código usás prisma.algo.create(), prisma.algo.findMany(), etc.
```

Para ver los datos directamente: **Supabase Dashboard** → Table Editor, o `npx prisma studio` desde la terminal.

---

## Instrucciones para cada integrante

### 👉 Damián (Web)

**Tu tarea hoy:** Conectar Login y Register al backend.

**El backend ya está listo.** Solo tenés que correrlo localmente:

```bash
cd backend
npm install
npm run dev
# Server listening on http://localhost:3000
```

**Endpoints disponibles:**

```
POST http://localhost:3000/api/auth/register
  Body: { "email": "...", "password": "...", "role": "CLIENT" }
  Roles válidos: CLIENT, VET, ADMIN
  Respuesta: 201 { success: true, data: { id, email, role, ... } }

POST http://localhost:3000/api/auth/login
  Body: { "email": "...", "password": "..." }
  Respuesta: 200 { success: true, data: { token: "jwt...", user: {...} } }

GET http://localhost:3000/api/users/me
  Header: Authorization: Bearer <token>
  Respuesta: 200 { success: true, data: { id, email, role, ... } }
```

**Pasos para tu AuthContext (web/src/context/AuthContext.tsx):**

1. Reemplazar `console.log` en `login()` con:
```ts
const res = await api.post('/api/auth/login', { email, password });
const { token, user } = res.data.data;
localStorage.setItem('vetconnect_auth_token', token);
```

2. Reemplazar `console.log` en `logout()` con:
```ts
localStorage.removeItem('vetconnect_auth_token');
```

3. RegisterPage: formulario con email + password + selector de rol (CLIENT/VET/ADMIN), llama a `POST /api/auth/register`.

4. Al cargar la app, leer token de localStorage, si existe, hacer `GET /api/users/me` para restaurar sesión.

5. Proteger `/dashboard` con ProtectedRoute (si no hay token → redirect a /login).

**Verificación rápida:**
```bash
# Desde otra terminal:
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","role":"CLIENT"}'
# → {"success":true,"data":{...}}
```

---

### 👉 Juan (Mobile)

**Tu tarea hoy:** Crear proyecto Expo y conectar Login/Register.

El backend corre en `http://localhost:3000` (o si Tobias ya deployó, en la URL de Railway).

**Estructura de carpetas sugerida para mobile:**
```
mobile/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── ClientHomeScreen.tsx
│   │   └── VetHomeScreen.tsx
│   ├── services/
│   │   └── api.ts
│   ├── context/
│   │   └── AuthContext.tsx
│   └── App.tsx
```

**LoginScreen** → llama a `POST /api/auth/login`, guarda token con AsyncStorage.
**RegisterScreen** → llama a `POST /api/auth/register`, auto-login después.
**AuthContext** → provee `login()`, `logout()`, `user`, `token`, `isAuthenticated`.

El resto del equipo usa roles `CLIENT`, `VET`, `ADMIN` — asegurate de que el selector de rol en Register mande exactamente esos strings en mayúscula.

---

### 👉 Ezequiel (QA/Diseño)

**Tu tarea hoy:** Probar los endpoints del backend.

Ya funcionan 14 escenarios. Verificá estos casos con Postman o Thunder Client:

| # | Test | Esperado |
|---|------|----------|
| 1 | Register CLIENT con email válido | 201 |
| 2 | Register VET con email válido | 201 |
| 3 | Register ADMIN con email válido | 201 |
| 4 | Register con email existente | 409 |
| 5 | Register con password < 6 chars | 400 |
| 6 | Register sin email | 400 |
| 7 | Login correcto (CLIENT) | 200 + JWT |
| 8 | Login con contraseña incorrecta | 401 |
| 9 | Login con email inexistente | 401 |
| 10 | GET /api/users/me con token | 200 |
| 11 | GET /api/users/me sin token | 401 |
| 12 | GET /api/users/admin-only con token ADMIN | 200 |
| 13 | GET /api/users/admin-only con token CLIENT | 403 |
| 14 | GET /api/users/admin-only con token VET | 403 |
| 15 | GET /api/pets con token CLIENT | 200 [] |
| 16 | POST /api/pets con datos válidos | 201 |
| 17 | GET /api/users/vets | 200 |

Documentar bugs encontrados en el tablero de Trello/Notion.

---

### 👉 Lara (Project Manager)

**Checklist de hoy:**
1. Verificar que todos leyeron esta guía
2. Asegurar que Damián tiene el backend corriendo y puede pegarle desde web
3. Asegurar que Juan creó el proyecto Expo antes de fin de día
4. Coordinar con Tobias para resolver el push a main
5. Organizar review de mañana (mar 30) a las 18:00

---

## ¿Cómo correr el backend local?

```bash
# Requisitos: Node.js v18+, npm
cd backend
npm install
npm run dev    # con hot-reload (tsx watch)
# o
npm start      # desde el compilado (dist/)
```

El .env ya tiene las credenciales de Supabase. No necesitan cambiar nada.

## ¿Cómo ejecutar los tests?

```bash
cd backend
npm test       # Jest, 9 tests
```

---

## URL del backend (cuando esté deployado)

Una vez que Tobias haga el deploy en Railway:
```
https://conectavet-api.up.railway.app
```

Reemplazar `http://localhost:3000` por esa URL en los frontends cuando estén listos para producción.
