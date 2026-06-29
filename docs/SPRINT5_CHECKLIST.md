# Sprint 5 — Checklist (29 Jun - 1 Jul)

> Arranca hoy. 3 días. Objetivo: cerrar roles + conectar frontends al backend + CRUD mascotas.

---

## 🧩 Resumen del sprint

| Sprint | Fechas | Tema |
|--------|--------|------|
| ~~S1~~ | 15-17 Jun | Setup |
| ~~S2~~ | 18-20 Jun | Modelos + wireframes |
| ~~S3~~ | 22-24 Jun | Auth backend |
| ~~S4~~ | 25-27 Jun | Conectar frontends |
| **→ S5** | **29 Jun - 1 Jul** | **Roles + Mascotas** |
| S6 | 2-4 Jul | LiveKit + CRUD screens |

---

## 📋 DÍA 1 — LUNES 29 (HOY)

### Tobias
- [x] ~~Middleware authenticate~~ ✅ ya
- [x] ~~Middleware authorize~~ ✅ ya
- [x] ~~GET /api/users/vets~~ ✅ ya
- [x] ~~CRUD /api/pets~~ ✅ ya
- [x] ~~Tests Jest (9/9)~~ ✅ ya
- [ ] **Push a main** — resolver remote `grupo-pinnacle` (verificar credenciales o cambiar URL)
- [ ] **Deploy a Railway** — conectar repo → root `/backend`
- [ ] **Ayudar a Damián** si se traba con AuthContext
- [ ] **Ayudar a Juan** si se traba con AsyncStorage/token

### Damián (Web)
- [ ] **AuthContext funcional** — reemplazar console.log en login/logout con llamadas reales al backend
  ```ts
  // src/context/AuthContext.tsx
  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { token, user } = res.data.data;
    localStorage.setItem('vetconnect_auth_token', token);
    setUser(user);
    setToken(token);
  };
  ```
- [ ] **LoginPage** — conectar inputs al AuthContext, mostrar errores, redirigir a /dashboard
- [ ] **RegisterPage** — formulario completo con email + password + selector rol (CLIENT/VET)
- [ ] **Persistir sesión** — al cargar app, leer token de localStorage y hacer GET /api/users/me

### Juan (Mobile)
- [ ] **Crear proyecto Expo** en `/mobile` (si no lo hizo en S2)
  ```bash
  npx create-expo-app mobile --template blank-typescript
  npx expo install axios @react-navigation/native @react-navigation/native-stack @react-native-async-storage/async-storage
  ```
- [ ] **Estructura de pantallas:** LoginScreen, RegisterScreen, ClientHomeScreen, VetHomeScreen
- [ ] **AuthContext mobile** con login(), register(), logout(), AsyncStorage
- [ ] **LoginScreen** — conectado al backend `POST /api/auth/login`
- [ ] **RegisterScreen** — conectado al backend `POST /api/auth/register` con selector de rol

### Ezequiel (QA)
- [ ] **Probar endpoints auth** con Postman (14 tests definidos en SPRINT3_GUIDE.md)
- [ ] **Probar roles** — verificar que CLIENT no accede a /admin-only, VET tampoco, ADMIN sí
- [ ] **Documentar bugs** en Trello/Notion con severidad
- [ ] **Wireframes Figma** — verificar que los flujos coinciden con la implementación real

### Lara (PM)
- [ ] **Tablero Trello/Notion** — mover tareas completadas a "Done", cargar S5
- [ ] **Coordinar catch-up** — Juan y Damián necesitan ponerse al día (vienen de S2-S3 atrasados)
- [ ] **Verificar que todos tienen acceso al repo** y pueden correr el backend local

---

## 📋 DÍA 2 — MARTES 30

### Tobias
- [ ] **Verificar que Damián tiene AuthContext funcional**
- [ ] **Verificar que Juan tiene LoginScreen conectado**
- [ ] **Responder bugs** reportados por Ezequiel
- [ ] **Preparar endpoint `POST /api/consultations`** si sobra tiempo (para S6)

### Damián (Web)
- [ ] **ProtectedRoute** — componente que redirige a /login si no hay token
- [ ] **Redirección post-login** — si user.role === 'VET' → /dashboard/vet, si 'CLIENT' → /dashboard/client
- [ ] **Dashboard condicional** — contenido diferente según rol
- [ ] **Estilos Tailwind** — alinear con wireframes de Ezequiel (colores, bordes, hover)

### Juan (Mobile)
- [ ] **Redirección por rol** — después del login, ir a ClientHomeScreen o VetHomeScreen
- [ ] **ClientHomeScreen** — "Bienvenido, [email]" + botón cerrar sesión
- [ ] **VetHomeScreen** — "Panel del veterinario" placeholder
- [ ] **Probar en Android** físico o emulador el flujo completo

### Ezequiel (QA)
- [ ] **Probar web de Damián** — register, login, redirección por rol
- [ ] **Probar mobile de Juan** — register, login, redirección por rol
- [ ] **Actualizar reporte de bugs** con hallazgos de frontend
- [ ] **Casos de prueba CA-01** — formatear en Trello/Notion

### Lara (PM)
- [ ] **Checkpoint 18:00** — cada uno muestra avance. Detectar bloqueantes.

---

## 📋 DÍA 3 — MIÉRCOLES 1 (CIERRE)

### Tobias
- [ ] **Push final a main** (si no se resolvió el lunes)
- [ ] **Deploy Railway funcionando** (o al menos la config lista para cuando el remote esté OK)
- [ ] **Documentar en DECISIONS.md** los endpoints nuevos y cambios de arquitectura

### Damián (Web)
- [ ] **RegisterPage completa** con selector de rol, validaciones, feedback visual
- [ ] **Prueba de humo** — registrarse como CLIENT → login → dashboard CLIENT. Cerrar sesión. Login como VET → dashboard VET.
- [ ] **Build sin errores** — `npm run build` compila OK

### Juan (Mobile)
- [ ] **Prueba de humo en Android** — registro CLIENT, login, home. Registro VET, login, home.
- [ ] **Navegación consistente** — stack navigator funcionando sin errores
- [ ] **Push a mobile/** — todo subido al repo

### Ezequiel (QA)
- [ ] **Testing completo CA-01** — registrar, loguear, roles, tokens inválidos, 401, 403
- [ ] **Reporte final de bugs** asignados a cada responsable
- [ ] **Casos de prueba para CA-02** (flujo de consulta) adelantados

### Lara (PM)
- [ ] **Review de cierre S5** — cada uno muestra resultado final
- [ ] **Documentar qué pasó a S6** vs qué queda pendiente
- [ ] **Preparar revisión con profesores** para la semana de S6

---

## 📊 Seguimiento rápido

| Integrante | Día 1 (lun) | Día 2 (mar) | Día 3 (mié) | S5 Status |
|-----------|-------------|-------------|-------------|-----------|
| Tobias | ✅ Singleton Prisma, CORS, helmet, rate-limit, health check, graceful shutdown, paginación, soft delete, índices, zod, coverage, barrel exports, DECISIONS.md, DEPLOY.md fix, FAANG audit, AuthContext funcional, ProtectedRoute, RegisterPage, LoginPage, DashboardPage, colors.ts, Input/Button fix, Vite proxy, web env | ✅ Test coverage + web types | ✅ Push+deploy (bloqueado remote) | 🟢 **Sprint completo** |
| Damián | 🔴 (Lo hizo Tobias) | 🟢 Web ya funcional | 🟢 Sin cambios necesarios | 🟢 **Hecho por Tobias** |
| Juan | 🔴 Expo project + LoginScreen | 🟡 Redirección por rol | 🟢 Prueba Android | 🔴 Pendiente |
| Ezequiel | 🔴 Probar endpoints auth | 🟡 Probar frontends | 🟢 Reporte bugs | 🔴 Pendiente |
| Lara | 🔴 Tablero + coordinar | 🟡 Checkpoint | 🟢 Review | 🔴 Pendiente |

---

## 🎯 Meta del sprint

> **Al miércoles 1 de julio a las 20:00:**
> - Backend deployado y accesible
> - Web: cualquier persona puede registrarse, loguearse y ver su dashboard según su rol
> - Mobile: lo mismo en Android
> - Ezequiel validó que no se puede violar la seguridad de roles
> - Tablero actualizado para S6
