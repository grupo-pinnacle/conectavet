# Estado del sprint — Tobias (Backend)

**Hoy:** Lun 29 de junio, 2026
**Sprint actual:** Sprint 3 (arrancó hoy, calendario nuevo desde 15/6 — lun/mar/jue)
**Rama activa:** `Backend`

---

## 📊 Progreso general del equipo

| Integrante | Sprint 1 | Sprint 2 | Sprint 3 (actual) |
|-----------|----------|----------|-------------------|
| **Tobias (vos)** | ✅ Completo | ✅ Completo | ✅ Adelantado (completaste S3 + S4 + parte S5) |
| Juan (Mobile) | ❌ No arrancó | ❌ No arrancó (mobile vacío) | ❌ Pendiente |
| Damián (Web) | ✅ Proyecto creado | ⚠️ LoginPage con UI, Register/Dashboard stubs | ❌ Sin conectar backend |
| Ezequiel (QA) | ✅ DECISIONS.md existe | ❌ Figma no verificado en repo | ❌ Pendiente |
| Lara (PM) | ❌ Project Charter no verificado | ❌ No verificado | ❌ Pendiente |

---

## ✅ Checklist personal — Tobias vs documento oficial

### Sprint 1 (Jun 8-13 → 15-20 real)
- [x] Repositorio GitHub con estructura monolito modular
- [x] Node + TypeScript + Express inicializado
- [x] Prisma configurado con PostgreSQL (migrado a Supabase)
- [x] Subido a main (pendiente push por remote)

### Sprint 2 (Jun 14-20 → 22-27 real)
- [x] Modelos Prisma: User, Pet, Consultation, MedicalRecord
- [ ] Modelo **Queue** — no está en schema (irá en Sprint 8)
- [x] Rutas base del servidor (`/api/auth`, `/api/users`, `/api/pets`)
- [x] Documentación: schema completo + DECISIONS.md + SPRINT3_GUIDE.md

### Sprint 3 ⬅️ ACTUAL (Jun 21-27 → 29-3 real) — ✅ COMPLETADO
- [x] POST /api/auth/register (CLIENT, VET, ADMIN)
- [x] POST /api/auth/login (JWT generado)
- [x] Middleware authenticate (verifica token)
- [x] Middleware authorize (verifica rol)
- [x] Los 3 perfiles funcionales

### Sprint 4 (Jun 28 - Jul 4 → 6-11 real) — ✅ ADELANTADO
- [x] Middleware de roles por ruta (authorize + Role.ADMIN en /admin-only)
- [x] Tests básicos de auth con Jest (9/9 tests)

### Sprint 5 (Jul 5-11 → 13-18 real) — 🔄 PARCIAL
- [x] POST /api/pets — crear mascota
- [x] GET /api/pets — listar mascotas del usuario
- [x] GET /api/pets/:id — detalle mascota
- [x] PUT /api/pets/:id — editar mascota
- [x] DELETE /api/pets/:id — eliminar mascota
- [ ] Modelo VetCard + historial de vacunas (pendiente)
- [ ] GET /api/pets/vaccines (pendiente)

---

## 📋 Resumen de entregables técnicos

### Endpoints funcionando (9 endpoints)

| Método | Ruta | Auth | Rol |
|--------|------|------|-----|
| POST | `/api/auth/register` | No | - |
| POST | `/api/auth/login` | No | - |
| GET | `/api/users/me` | Sí | Cualquiera |
| GET | `/api/users/vets` | Sí | Cualquiera |
| GET | `/api/users/admin-only` | Sí | ADMIN |
| GET | `/api/pets` | Sí | Cualquiera |
| POST | `/api/pets` | Sí | Cualquiera |
| GET/PUT/DELETE | `/api/pets/:id` | Sí | Cualquiera |
| GET | `/health` | No | - |

### Base de datos en Supabase
- [x] Tabla `users` (id, email, password, role, isOnline)
- [x] Tabla `pets` (id, name, species, breed, age, weight, ownerId)
- [x] Tabla `consultations` (id, clientId, vetId, petId, status, notes, liveKitRoom)
- [x] Tabla `medical_records` (id, petId, consultationId, diagnosis, treatment, notes)
- [x] Conexión pooler (DATABASE_URL) + directa (DIRECT_URL)

### Tests
- [x] 9 tests Jest de autenticación
- [x] 14 pruebas manuales de endpoints (todas OK)

---

## 🚧 Lo que falta de TU parte para cerrar el sprint

- [ ] **Resolver push a main**: el remote `grupo-pinnacle/conectavet` no es accesible. Verificar credentials o URL del remote:
  ```bash
  git remote set-url origin https://github.com/<org-real>/conectavet.git
  git push origin Backend
  git checkout main && git merge Backend && git push origin main
  ```
- [ ] **Deploy a Railway**: cuando el remote esté arriba, conectar repo a Railway, root `/backend`
- [ ] **Modelo Queue**: se va a necesitar en Sprint 8, podés crearlo ya en schema.prisma
- [ ] **Modelo VetCard**: pendiente para Sprint 5 (historial de vacunas)
- [ ] **Ayudar a Juan**: si se traba con mobile, sos el que mejor conoce la arquitectura

---

## 📌 NOTA SOBRE LOS SPRINTS

El calendario real arrancó el **15 de junio** con días **lun/mar/jue** (no lun-vie). Esto significa:

| Sprint | Semana real | Tus tareas asignadas vs reales |
|--------|-------------|-------------------------------|
| S1 | 15-20 jun | Setup repo — ✅ |
| S2 | 22-27 jun | Modelos BD — ✅ |
| **S3** | **29 jun - 2 jul** | **Auth backend — ✅ (hecho)** |
| S4 | 6-11 jul | Middleware roles + tests — ✅ (adelantado) |
| S5 | 13-18 jul | CRUD mascotas — 🔄 (parcial) |
