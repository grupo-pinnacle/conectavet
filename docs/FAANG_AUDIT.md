# FAANG Audit — VetConnect

> Evaluación del proyecto contra estándares de ingeniería de FAANG (Meta, Google, Amazon, Netflix, Apple).
> **Fecha:** 29 de junio, 2026 | **Auditor:** Tobias (Backend) | **Versión:** Post-fix

---

## Metodología

| Score | Significado |
|-------|-------------|
| 1-2 | No existe o es inexistente |
| 3-4 | Existe pero incompleto/inseguro |
| 5-6 | Funcional con problemas importantes |
| 7-8 | Sólido, con mejoras menores necesarias |
| 9-10 | Nivel producción FAANG |

---

## 1. Code Quality & Structure — 8/10 ↑ (+3)

### Lo que está bien ✅
- TypeScript strict mode en backend y web
- Monolito modular bien organizado (cada feature en su carpeta)
- Naming consistente: kebab-case archivos, camelCase funciones, PascalCase clases
- Separación backend/web/mobile en monorepo
- Prisma schema con enums, relaciones, índices y soft delete
- **Singleton de PrismaClient** compartido (nuevo)
- **Barrel exports (`index.ts`)** en todos los módulos (nuevo)
- **shared/utils/** con helpers compartidos (nuevo)
- **Sin placeholders .gitkeep** en módulos vacíos (nuevo)
- **DECISIONS.md** con 8 ADR formalmente documentados (nuevo)
- **nodemon.json actualizado** a tsx (nuevo)
- **Manejador de errores global** en Express (nuevo)
- **Graceful shutdown** con SIGTERM/SIGINT (nuevo)

### Lo que falta ❌
- Sin npm workspaces (monorepo no coordinado)
- Sin feature flags
- Sin JSDoc/TSDoc en todas las funciones

---

## 2. Security — 8/10 ↑ (+5)

### Lo que está bien ✅
- JWT con bcrypt para hashing de passwords
- Contraseñas hasheadas, nunca devueltas en respuestas
- Error 401 genérico en login (no revela si user existe o no)
- `authenticate` + `authorize` middlewares funcionando
- Token JWT con expiración (7 días)
- **.env en .gitignore** (nuevo)
- **docs/DEPLOY.md sin credenciales** (nuevo)
- **Pets CRUD con ownership verification** y 403 si no es dueño (nuevo)
- **CORS configurado** con origin por env var (nuevo)
- **helmet** activado para headers HTTP (nuevo)
- **Rate limiting global** (100 req/15min) + específico para login (10 req/15min) (nuevo)
- **Validación de request bodies con Zod** (nuevo)
- **JWT_SECRET validado al startup** — server no arranca si falta (nuevo)
- **Body size limit** (10kb en JSON) (nuevo)

### Lo que falta ❌
- Sin refresh token
- Sin HTTPS forzado (maneja Railway)
- Sin Content Security Policy personalizada

---

## 3. Testing — 6/10 ↑ (+3)

### Lo que está bien ✅
- Suite de 11 tests con Jest + ts-jest
- Tests usan Prisma singleton compartido
- **Coverage configurado** con reportes text + lcov + clover (nuevo)
- **2 tests nuevos** de JWT middleware (token expirado + decodificación)
- `--forceExit --detectOpenHandles` para evitar hangs

### Lo que falta ❌
- Tests escriben DIRECTAMENTE a Supabase (BD real) — sin BD de testing aislada
- Sin tests de integración HTTP (supertest)
- Sin tests de controllers ni de pets CRUD
- Sin globalSetup/globalTeardown para BD de testing
- Sin factories o fixtures para datos de prueba

---

## 4. Documentation — 9/10 ↑ (+1)

### Lo que está bien ✅
- README.md raíz con stack, arquitectura ASCII, setup, sprint plan, equipo
- backend/readme.md con API Reference completa, auth, roles, tests, deploy, roadmap, **prerequisitos, códigos de error, monitoreo, contribuir** (nuevo)
- docs/SPRINT_PLAN.md con timeline visual + 20 sprints detallados
- docs/SPRINT5_CHECKLIST.md — checklist día a día por integrante
- docs/TOBIAS_STATUS.md, docs/DEPLOY.md, docs/helpers/
- **docs/DECISIONS.md** con 8 ADR documentados (nuevo)
- **Badges de estado** en backend/readme.md (nuevo)
- **Diagrama ASCII de arquitectura** en README raíz
- **web/.env.example** (nuevo)
- **colors.ts con paleta completa** (nuevo)

### Lo que falta ❌
- Sin documentación OpenAPI/Swagger
- Sin diagramas visuales de arquitectura (más allá del ASCII)

---

## 5. Architecture & Scalability — 7/10 ↑ (+3)

### Lo que está bien ✅
- Monolito modular (buen balance entre simplicidad y organización)
- Prisma ORM con migrations versionadas
- Separación clara controller/service/routes
- Shared middlewares centralizados
- TypeScript en todas las capas
- **Singleton de Prisma** (nuevo)
- **Paginación** en /api/pets y /api/users/vets (nuevo)
- **Índices en la BD** para ownerId, species, clientId, vetId, status, petId (nuevo)
- **Soft delete** con `deletedAt` + endpoint restore (nuevo)
- **Manejador de errores global** en Express (nuevo)
- **Health check real** que verifica conexión a BD con `SELECT 1` (nuevo)
- **Logging estructurado** con timestamps ISO (nuevo)

### Lo que falta ❌
- Sin caché (Redis / in-memory)
- Sin cola de mensajes para procesos async
- Sin métricas (Prometheus / OpenTelemetry)
- Sin npm workspaces

---

## 6. DevOps & Deploy — 5/10 ↑ (+2)

### Lo que está bien ✅
- Build script configurado (`npx tsc` → `dist/`)
- Railway config documentada
- `dist/server.js` funciona correctamente
- **docs/DEPLOY.md sin credenciales hardcodeadas** (nuevo)
- **Script de test+coverage** en package.json (nuevo)
- **Graceful shutdown** para despliegues zero-downtime (nuevo)

### Lo que falta ❌
- **No hay deploy activo** — Railway no está conectado (requiere push desde tu máquina)
- **No hay Dockerfile**
- **No hay CI/CD** (GitHub Actions)
- **No hay separación de entornos** — dev y prod usan la misma BD Supabase
- **No hay migración automática en deploy**

---

## 7. Frontend Quality (Web) — 7/10 ↑ (+4)

### Lo que está bien ✅
- React 19 + Vite 8 + TypeScript 6 (stack moderno)
- TailwindCSS configurado
- Router con React Router v7
- Axios con interceptores de token
- **AuthContext funcional** con login(), register(), logout(), persistencia (nuevo)
- **LoginPage conectada al backend** con validación y errores (nuevo)
- **RegisterPage completa** con selector de rol CLIENT/VET (nuevo)
- **DashboardPage con contenido por rol** y botón de cerrar sesión (nuevo)
- **ProtectedRoute** que redirige a /login si no hay sesión (nuevo)
- **Types correctos** (User, AuthResponse, Pet) con role, sin name (nuevo)
- **Button y Input con atributos HTML** estándar (nuevo)
- **Vite proxy configurado** para desarrollo (nuevo)
- **colors.ts con paleta completa** (nuevo)
- **App.css sin template Vite** (nuevo)
- **useAuth hook** con error si se usa fuera de AuthProvider (nuevo)

### Lo que falta ❌
- Sin react-hook-form para formularios complejos
- Sin pruebas unitarias de componentes

---

## 8. Mobile Quality — 1/10

### Lo que está bien ✅
- Código helper completo en `docs/helpers/mobile/` (AuthContext, LoginScreen, RegisterScreen, HomeScreen, App.tsx)

### Lo que falta ❌
- **Directorio mobile/ completamente vacío** — ni siquiera `package.json`
- No hay proyecto Expo creado
- No se ha compilado ni probado en Android
- **Requiere acción de Juan**

---

## 9. Project Management — 6/10

### Lo que está bien ✅
- Sprint plan detallado con 20 sprints
- Checklist día a día por integrante
- Roles y responsabilidades claros
- Documentación de seguimiento (TOBIAS_STATUS.md)
- Metodología Scrumban documentada
- DECISIONS.md con 8 ADR

### Lo que falta ❌
- 3-4 sprints de atraso en Juan, Damián, Ezequiel, Lara
- Sin plan de contingencia para el atraso
- Remote de GitHub inaccesible desde el entorno de Tobias
- Sin daily standups documentados
- Sin métricas de velocidad del equipo

---

## 📊 Resumen de calificaciones

| Categoría | Score Anterior | Score Actual | Mejora |
|-----------|---------------|-------------|--------|
| Code Quality & Structure | 5/10 | **8/10** | 🟢 +3 |
| **Security** | **3/10** | **8/10** | 🟢 +5 |
| Testing | 3/10 | **6/10** | 🟢 +3 |
| Documentation | 8/10 | **9/10** | 🟢 +1 |
| Architecture & Scalability | 4/10 | **7/10** | 🟢 +3 |
| DevOps & Deploy | 3/10 | **5/10** | 🟢 +2 |
| Frontend Web | 3/10 | **7/10** | 🟢 +4 |
| Mobile | 1/10 | **1/10** | ⚪ 0 |
| Project Management | 6/10 | **6/10** | ⚪ 0 |
| | | | |
| **PROMEDIO PONDERADO** | **4.0/10** | **6.3/10** | **🟢 +2.3** |

---

## 🎯 Pendiente para llegar a 10

### Depende de Tobias (desde su máquina)
1. Push a main + Deploy Railway → DevOps sube a 7
2. Dockerfile → DevOps sube a 8
3. GitHub Actions con tests automáticos → DevOps sube a 9, Testing sube a 8
4. BD de testing aislada con Jest globalSetup → Testing sube a 9
5. Tests de integración con supertest (controllers + middleware) → Testing sube a 10

### Depende de Damián (Web)
6. No hay nada más que arreglar — web está 7/10 y funcional

### Depende de Juan (Mobile)
7. Crear proyecto Expo + copiar helpers → Mobile sube a 6
8. Probar en Android + pulir → Mobile sube a 8

### Depende de Ezequiel (QA)
9. Probar seguridad + documentar bugs → Code Quality sube a 9
10. Tests manuales documentados → PM sube a 8

### Depende de Lara (PM)
11. Daily standups + métricas de velocity → PM sube a 8
12. Plan de contingencia para atraso → PM sube a 9
