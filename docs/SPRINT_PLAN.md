# Sprint Plan — VetConnect

> **Calendario:** 2 sprints por semana | **Inicio:** 15 de junio | **MVP:** 20 de julio | **Fin:** 5 de septiembre (buffer hasta oct)

---

## Resumen ejecutivo

| Métrica | Valor |
|---------|-------|
| Sprints totales | 20 |
| Ritmo | 2 sprints/semana (lun-mié · jue-sáb) |
| Sprints pre-MVP | 10 (S1-S10) |
| Fecha MVP | 20 de julio |
| Vacaciones | 20-31 de julio |
| Sprints post-vacaciones | 10 (S11-S20) |
| Fin desarrollo | 5 de septiembre |
| Buffer presentación | Sep - Oct |

### Dónde estamos hoy

| Dimensión | Sprint | Estado |
|-----------|--------|--------|
| **Equipo** | **S9** (13-15 jul) | 🟡 Activo — Últimos bugs + preparar presentación |
| **MVP compliance** | Completado | ✅ Proyecto alineado al alcance MVP |

---

## Timeline visual

```
Jun 15 ─┤ S1 ├────┤ S2 ├────┤ S3 ├────┤ S4 ├────┤ S5 ├────┤ S6 ├────┤
         lun 15    jue 18    lun 22    jue 25    lun 29    jue 2

Jul  6 ─┤ S7 ├────┤ S8 ├────┤ S9 ├────┤ S10├────▓▓ MVP ▓▓──── VACACIONES ────
         lun 6     jue 9     lun 13    jue 16    lun 20    20-31 jul
         Chat      Pulido    Bugs      Freeze
         (texto)   completo

Ago  3 ─┤ S11├────┤ S12├────┤ S13├────┤ S14├────┤ S15├────┤ S16├────┤
         lun 3     jue 6     lun 10    jue 13    lun 17    jue 20

Ago 24 ─┤ S17├────┤ S18├────┤ S19├────┤ S20├─────────────────┤ oct 31
         lun 24    jue 27    lun 31    jue 3     Buffer presentación
```

---

## Sprint 1 — Setup (15-17 Jun) ✅

**Duración:** lun 15 · mar 16 · mié 17

| Quién | Tarea |
|-------|-------|
| **Tobias** | Repositorio GitHub. Estructura monorepo. Node + TS + Express + Prisma + PostgreSQL. README básico. |
| **Juan** | Proyecto Expo en `/mobile`. Verificar en Android. |
| **Damián** | Proyecto React + Vite + TypeScript + TailwindCSS en `/web`. |
| **Ezequiel** | Tablero Scrumban. 4 columnas. Cargar tareas S1. `DECISIONS.md`. |
| **Lara** | Project Charter. Roles. Stack. Arquitectura. |

---

## Sprint 2 — Modelos + Navegación + Wireframes (18-20 Jun) ⚠️

| Quién | Tarea | Estado |
|-------|-------|--------|
| **Tobias** | Modelos Prisma. Rutas base. | ✅ |
| **Juan** | Navegación mobile. | ❌ |
| **Damián** | Páginas web layout. | ❌ |
| **Ezequiel** | Wireframes Figma. | ❌ |
| **Lara** | Seguimiento. | ❌ |

---

## Sprint 3 — Auth Backend (22-24 Jun) ✅

| Quién | Tarea | Estado |
|-------|-------|--------|
| **Tobias** | Auth register/login/JWT/middlewares/roles. | ✅ |
| **Juan** | LoginScreen + RegisterScreen mobile. | ❌ |
| **Damián** | LoginPage + RegisterPage web. | ⚠️ |
| **Ezequiel** | Testing endpoints. | ❌ |
| **Lara** | Review S3. | ❌ |

---

## Sprint 4 — Conectar Frontends a Auth (25-27 Jun) ⚠️

| Quién | Tarea | Estado |
|-------|-------|--------|
| **Tobias** | Middleware roles, pets CRUD, tests. | ✅ |
| **Juan** | Conectar mobile a auth. | ❌ |
| **Damián** | Conectar web a auth. AuthContext. | ❌ |
| **Ezequiel** | Testing flujo auth. | ❌ |
| **Lara** | Review S4. | ❌ |

---

## Sprint 5 — Roles + Mascotas (29 Jun - 1 Jul) ✅

| Quién | Tarea | Estado |
|-------|-------|--------|
| **Tobias** | Singleton Prisma, CORS, helmet, rate-limit, Zod, soft delete, paginación, health check, error handler, graceful shutdown, FAANG audit, Web AuthContext + ProtectedRoute + RegisterPage. | ✅ |
| **Juan** | Redirección por rol mobile. | 🔴 |
| **Damián** | ProtectedRoute + RegisterPage web. | ✅ Hecho por Tobias |
| **Ezequiel** | Testing roles. | 🔴 |
| **Lara** | Review S5. | 🔴 |

---

## Sprint 6 — Conexión Mobile + Chat Inicio (2-4 Jul) ✅

**Nota:** Se reemplazó LiveKit por chat de texto según `MVP_SCOPE.md`.

| Quién | Tarea | Estado |
|-------|-------|--------|
| **Tobias** | Modelo Message en Prisma + migración. Socket.io. Endpoints consultas + chat. | ✅ |
| **Juan** | Pantallas mascota mobile. Login/Register mobile funcional. | ✅ |
| **Damián** | Dashboard web médico: lista consultas. | ✅ |
| **Ezequiel** | Testing mascotas mobile. | 🔴 |
| **Lara** | Review con profesores. | 🔴 |

---

## Sprint 7 — Chat de Texto + Historial Básico (6-8 Jul) ✅

| Quién | Tarea | Estado |
|-------|-------|--------|
| **Tobias** | Socket.io + endpoints consultas + paginación + autorización. | ✅ |
| **Juan** | Chat mobile con veterinario (reemplaza IA + LiveKit). | ✅ |
| **Damián** | Chat web + cerrar consulta + modal notas. | ✅ |
| **Ezequiel** | Testing chat. | 🔴 |
| **Lara** | Coordinar. | 🔴 |

---

## Sprint 8 — Pulir Flujo Completo + Testing (9-11 Jul) ✅

| Quién | Tarea | Estado |
|-------|-------|--------|
| **Tobias** | MVP compliance backend: migration cleanup, eliminar isOnline/liveKitRoom. | ✅ |
| **Juan** | MVP compliance mobile: eliminar IA, LiveKit, cola. Agregar chat con vet y solicitud simple. | ✅ |
| **Damián** | MVP compliance web: eliminar secciones excluidas, agregar cerrar consulta. | ✅ |
| **Ezequiel** | Testing flujo completo MVP. | 🔴 |
| **Lara** | Preparar demo. | 🔴 |

---

## Sprint 9 — Últimos Bugs + Preparar Presentación (13-15 Jul) 🟡

**Duración:** lun 13 · mar 14 · mié 15

> **No se agregan features nuevas.** Solo bugs detectados en S8.

| Quién | Tarea |
|-------|-------|
| **Tobias** | Bugs backend priorizados (máximo 3). Optimizar queries si es necesario. |
| **Juan** | Bugs mobile: navegación, carga de datos, errores de conexión. Probar en Android físico. |
| **Damián** | Bugs web: responsive, estados de carga/error, edge cases de navegación. |
| **Ezequiel** | Re-testear bugs corregidos. Armar casos de prueba para la presentación. |
| **Lara** | Coordinar demo. Definir quién muestra qué. Preparar slides. |

---

## Sprint 10 — Freeze (16-18 Jul)

**Duración:** jue 16 · vie 17 · sáb 18

> **Código congelado.** No se agrega nada. Solo bugs críticos que rompan el flujo principal.

| Quién | Tarea |
|-------|-------|
| **Todo el equipo** | Últimos retoques. Nadie empieza nada nuevo. Preparar la presentación del lunes 20. |

---

## 🎯 MVP — Domingo 19 Julio

| Quién | Tarea |
|-------|-------|
| **Todo el equipo** | Cerrar ramas. Commits finales. Revisión grupal. |

### MVP entregado: **Lunes 20 Julio** ✅

---

## 🏖️ Vacaciones — 20 al 31 de Julio

Sin sprints. Sin código. Descanso obligatorio.

---

## Sprint 11 — Reactivación (3-5 Ago)

**Duración:** lun 3 · mar 4 · mié 5

| Quién | Tarea | Estado |
|-------|-------|--------|
| **Tobias** | Online/offline médico + cola de espera. Endpoint primer vet disponible por especie. | ✅ |
| **Juan** | Pantalla selección tipo mascota + búsqueda vet. Feedback visual espera. | ⏳ |
| **Damián** | Botón online/offline médico. Indicador visual. | ⏳ |
| **Ezequiel** | Testing cola de espera. | 🔴 |
| **Lara** | Review reactivación. | 🔴 |

---

## Sprint 12 — Imágenes + Notificaciones (6-8 Ago)

**Duración:** jue 6 · vie 7 · sáb 8

| Quién | Tarea | Estado |
|-------|-------|--------|
| **Tobias** | Endpoint recibir/almacenar imágenes. Sistema notificaciones push. | ✅ |
| **Juan** | Botón enviar imagen desde galería. Mostrar imágenes en chat. | ✅ |
| **Damián** | Mostrar imágenes recibidas. Pulir dashboard médico. | ✅ |
| **Ezequiel** | UX review mobile. Documentar inconsistencias. | ⏳ |
| **Lara** | Review. | ⏳ |

---

## Sprint 13 — Estabilización (10-12 Ago)

> No se agregan features nuevas.

| Quién | Tarea |
|-------|-------|
| **Tobias** | Deuda técnica. Optimizar queries Prisma. Revisar seguridad. |
| **Juan** | Bugs UX. Rendimiento en 2GB RAM. |
| **Damián** | Bugs web. Chrome, Firefox, Edge. |
| **Ezequiel** | Re-testear. Reporte para profesores. |
| **Lara** | Review formal. Feedback pre-QA. |

---

## Sprint 14 — Testing 2GB RAM (13-15 Ago)

| Quién | Tarea |
|-------|-------|
| **Todo el equipo** | Testing en dispositivos Android físicos con 2GB RAM. |

---

## Sprint 15 — Prueba Web Médico (17-19 Ago)

| Quién | Tarea |
|-------|-------|
| **Todo el equipo** | Prueba completa interfaz web del médico. |

---

## Sprint 16 — Flujo Completo E2E (20-22 Ago)

| Quién | Tarea |
|-------|-------|
| **Todo el equipo** | Flujo completo: registro → busca vet → cola → consulta → historial. |

---

## Sprint 17 — Deploy Producción (24-26 Ago)

| Quién | Tarea |
|-------|-------|
| **Tobias** | Deploy Railway. BD producción separada. |
| **Damián** | Deploy web en Vercel. |
| **Juan** | Compilar APK Android firmado. |
| **Ezequiel** | Smoke testing. |
| **Lara** | Verificar links. |

---

## Sprint 18 — Documentación (27-29 Ago)

| Quién | Tarea |
|-------|-------|
| **Tobias** | README técnico completo. |
| **Damián** | Documentación API. |
| **Juan** | Guía de uso mobile. |
| **Ezequiel** | Manual de usuario. |
| **Lara** | Revisar documentación. |

---

## Sprint 19 — Presentación Final (31 Ago - 2 Sep)

| Quién | Tarea |
|-------|-------|
| **Todo el equipo** | Preparar presentación final. Demo en vivo. |

---

## Sprint 20 — Buffer Final (3-5 Sep)

| Quién | Tarea |
|-------|-------|
| **Todo el equipo** | Código congelado. Solo bugs. |

---

## 📅 Buffer extra hasta Octubre 31

Los sprints terminan el 5 de septiembre. El tiempo restante hasta el 31 de octubre es **buffer exclusivamente para:**
- Ensayos de presentación
- Corrección de bugs descubiertos en ensayos
- Refinamiento de documentación

---

## Seguimiento

| Sprint | Fechas | Tobias | Juan | Damián | Ezequiel | Lara |
|--------|--------|--------|------|--------|----------|------|
| S1 | 15-17 Jun | ✅ | ✅ | ✅ | ✅ | ✅ |
| S2 | 18-20 Jun | ✅ | ❌ | ❌ | ❌ | ❌ |
| S3 | 22-24 Jun | ✅ | ❌ | ❌ | ❌ | ❌ |
| S4 | 25-27 Jun | ✅ | ❌ | ❌ | ❌ | ❌ |
| S5 | 29 Jun - 1 Jul | ✅ | 🔴 | ✅ | 🔴 | 🔴 |
| S6 | 2-4 Jul | ✅ | ✅ | ✅ | 🔴 | 🔴 |
| S7 | 6-8 Jul | ✅ | ✅ | ✅ | 🔴 | 🔴 |
| S8 | 9-11 Jul | ✅ | ✅ | ✅ | 🔴 | 🔴 |
| **S9** | **13-15 Jul** | **🟡** | **🟡** | **🟡** | **🔴** | **🔴** |
| S10 | 16-18 Jul | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| MVP | 19-20 Jul | 🎯 | 🎯 | 🎯 | 🎯 | 🎯 |
| **S11** | **3-5 Ago** | **✅** | ⏳ | ⏳ | 🔴 | 🔴 |
| **S12** | **6-8 Ago** | **✅** | **✅** | **✅** | ⏳ | ⏳ |
| S13-S20 | 10 Ago - 5 Sep | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
