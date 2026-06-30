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
| **Equipo (oficial)** | **S5** (29 jun - 1 jul) | 🟡 Activo |
| **Tobias (individual)** | **S5** ✅ | 🟢 Completó S3, S4, adelantó parte S6 |
| Juan | S2-S3-S4 | 🔴 Atrasado |
| Damián | S3-S4 | 🔴 Atrasado |
| Ezequiel | S2-S3 | 🔴 Atrasado |
| Lara | S2-S3 | 🔴 Atrasado |

> ⚠️ **Corrección de calendario:** Tobias documentó sprints con numeración distinta en `TOBIAS_STATUS.md` (usó bloques de 6 días en vez de 3 días). La tabla de abajo mapea ambas numeraciones. **La numeración oficial es la de este documento.**

| Numeración oficial (SPRINT_PLAN) | Numeración Tobias (TOBIAS_STATUS) | Fechas | Tema |
|---|---|---|---|
| S1 + S2 | S1 | 15-20 jun | Setup + Modelos |
| S3 + S4 | S2 | 22-27 jun | Auth backend + Conectar frontends |
| **S5 + S6** | **S3** | **29 jun - 4 jul** | **Roles + Mascotas + LiveKit inicio** |
| S7 + S8 | S4 | 6-11 jul | LiveKit + Cola de espera |
| S9 + S10 | S5 | 13-18 jul | Historial clínico + IA + Honorarios |

---

## Timeline visual

```
Jun 15 ─┤ S1 ├────┤ S2 ├────┤ S3 ├────┤ S4 ├────┤ S5 ├────┤ S6 ├────┤ ◄── HOY S5
         lun 15    jue 18    lun 22    jue 25    lun 29    jue 2

Jul  6 ─┤ S7 ├────┤ S8 ├────┤ S9 ├────┤ S10├────▓▓ MVP ▓▓──── VACACIONES ────
         lun 6     jue 9     lun 13    jue 16    lun 20    20-31 jul

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
| **Tobias** | Repositorio GitHub. Estructura monorepo (`/backend`, `/mobile`, `/web`). Node + TS + Express + Prisma + PostgreSQL (local). README básico. Push a `main`. |
| **Juan** | Proyecto Expo en `/mobile`. Verificar en Android físico/emulador. Pushear. |
| **Damián** | Proyecto React + Vite + TypeScript + TailwindCSS en `/web`. Verificar en navegador. Pushear. |
| **Ezequiel** | Tablero Scrumban (Trello/Notion). 4 columnas. Cargar tareas S1. `DECISIONS.md` en el repo. |
| **Lara** | Project Charter actualizado. Roles definitivos. Stack. Arquitectura monolito modular. Sistema honorarios. Metodología Scrumban. Agendar primera review con profesores. |

---

## Sprint 2 — Modelos + Navegación + Wireframes (18-20 Jun) ⚠️

**Duración:** jue 18 · vie 19 · sáb 20

| Quién | Tarea |
|-------|-------|
| **Tobias** | ✅ Modelos Prisma: User, Pet, Consultation, MedicalRecord. Rutas base. Documentar schema. |
| **Juan** | ❌ Navegación mobile: Login, Registro, Home Cliente, Home Veterinario. Solo estructura (sin lógica). |
| **Damián** | ❌ Páginas web: Login, Dashboard médico, Historial. Layout con Tailwind (sin lógica). |
| **Ezequiel** | ❌ Wireframes Figma: registro usuario, inicio consulta, videollamada, historial clínico. |
| **Lara** | ❌ Seguimiento del sprint. Documentar estado. |

---

## Sprint 3 — Auth Backend (22-24 Jun) ✅

**Duración:** lun 22 · mar 23 · mié 24

| Quién | Tarea | Estado |
|-------|-------|--------|
| **Tobias** | POST /api/auth/register. POST /api/auth/login. JWT. Middleware authenticate + authorize. 3 perfiles. | ✅ Completo |
| **Juan** | Crear LoginScreen y RegisterScreen en mobile (navegación). | ❌ |
| **Damián** | Crear UI de LoginPage y RegisterPage en web (formularios). | ⚠️ Login UI, Register stub |
| **Ezequiel** | Probar endpoints auth con Postman. Documentar. | ❌ |
| **Lara** | Review S3. Actualizar tablero. | ❌ |

---

## Sprint 4 — Conectar Frontends a Auth (25-27 Jun) ⚠️

**Duración:** jue 25 · vie 26 · sáb 27

| Quién | Tarea | Estado |
|-------|-------|--------|
| **Tobias** | ✅ Adelantó: middleware roles, pets CRUD, tests Jest. | ✅ |
| **Juan** | ❌ Conectar Login y Register mobile al backend. Guardar token en AsyncStorage. |
| **Damián** | ❌ Conectar Login y Register web al backend. AuthContext funcional. localStorage. |
| **Ezequiel** | ❌ Probar flujo auth mobile + web. Test CA-01. Reporte bugs. |
| **Lara** | ❌ Review S4. Actualizar tablero. |

---

## Sprint 5 — Roles + Mascotas (29 Jun - 1 Jul) 🟢 COMPLETADO (Tobias)

**Duración:** lun 29 · mar 30 · mié 1

| Quién | Tarea | Estado |
|-------|-------|--------|
| **Tobias** | Singleton Prisma. CORS + helmet + rate-limit. Zod validation. Soft delete. Paginación. Health check real. Global error handler. Graceful shutdown. Índices BD. Barrel exports. DECISIONS.md. FAANG audit fix (de 4.0 a 6.3). Web AuthContext funcional + ProtectedRoute + RegisterPage. Push a main + Deploy Railway (bloqueado por remote). | 🟢 Completo |
| **Juan** | Redirección por rol en mobile (login → home según rol). Pantallas ClientHome y VetHome. | 🔴 Pendiente |
| **Damián** | ProtectedRoute en web. AuthContext real. Redirección post-login. RegisterPage completa con selector de rol. | ✅ **Hecho por Tobias** |
| **Ezequiel** | Testing completo CA-01. Intentar romper seguridad de roles. Reporte bugs para Tobias. | 🔴 Pendiente |
| **Lara** | Review S5. Coordinar catch-up con Juan y Damián. Preparar demo. | 🔴 Pendiente |

---

## Sprint 6 — CRUD Mascotas + Screens (2-4 Jul)

**Duración:** jue 2 · vie 3 · sáb 4

| Quién | Tarea |
|-------|-------|
| **Tobias** | Adelantar: historial vacunas (VetCard). Endpoint subir imágenes. |
| **Juan** | Pantalla alta mascota. Lista mascotas. Detalle mascota. Conectado al backend. |
| **Damián** | Dashboard web médico: lista mascotas de consultas. Tailwind según wireframes Ezequiel. |
| **Ezequiel** | Testing pantallas mascota mobile. Verificar datos guardados/mostrados. Casos CA-03. Actualizar Figma. |
| **Lara** | Review con profesores. Última semana antes de vacaciones: objetivo = auth + mascotas funcionando. |

---

## Sprint 7 — LiveKit (6-8 Jul)

**Duración:** lun 6 · mar 7 · mié 8

| Quién | Tarea |
|-------|-------|
| **Tobias** | Servidor LiveKit en Railway. Endpoints crear/unirse sala. Token LiveKit por usuario. |
| **Juan** | SDK LiveKit en mobile. Vet inicia sala, cliente se une. Video + audio en Android. |
| **Damián** | LiveKit en web. Médico hace videollamada desde el navegador. Misma sala que mobile. |
| **Ezequiel** | Probar videollamada en dispositivos reales. Latencia, caídas, audio/video. |
| **Lara** | Coordinar. Mayor riesgo técnico del proyecto. Escalar problemas rápido. |

---

## Sprint 8 — Cola de Espera + Online/Offline (9-11 Jul)

**Duración:** jue 9 · vie 10 · sáb 11

| Quién | Tarea |
|-------|-------|
| **Tobias** | Lógica de cola: asignación automática de vet disponible por especie. Endpoint primer vet disponible. |
| **Juan** | Pantalla selección tipo mascota. Búsqueda de veterinario. Feedback visual de espera. |
| **Damián** | Botón online/offline en web del médico. Indicador visual de estado. |
| **Ezequiel** | Testing cola de espera. Simular múltiples clientes. Chat de texto básico en consulta. |
| **Lara** | Review S8. Ajustar tablero. |

---

## Sprint 9 — Historial Clínico (13-15 Jul)

**Duración:** lun 13 · mar 14 · mié 15

| Quién | Tarea |
|-------|-------|
| **Tobias** | Endpoint resumen automático al finalizar consulta. Guardar en historial: fecha, vet, duración, notas. |
| **Juan** | Pantalla historial clínico en mobile. Consultas ordenadas por fecha. |
| **Damián** | Formulario notas clínicas durante consulta. Enviar notas al backend al cerrar. |
| **Ezequiel** | Testing CA-03 y CA-04. Historial se guarda correctamente. Resumen llega al cliente. |
| **Lara** | Review. CA-03 y CA-04 cerrados. |

---

## Sprint 10 — IA + Honorarios (16-18 Jul)

**Duración:** jue 16 · vie 17 · sáb 18

| Quién | Tarea |
|-------|-------|
| **Tobias** | Integrar Claude API. Módulo asistente veterinario: síntomas → prompt → referencias clínicas. Contenido videollamada nunca se envía a IA. Sistema honorarios: duración, tarifa base, comprobante. |
| **Juan** | Campo texto síntomas en mobile vet. Botón consultar IA. Sección honorarios por consulta. |
| **Damián** | Misma interfaz IA en web. Panel admin: tabla consultas + duración + monto + filtros. |
| **Ezequiel** | Probar IA con síntomas reales. Evaluar respuestas. Documentar limitaciones. Testing CA-05 honorarios. |
| **Lara** | Review S10. Mostrar módulo IA a profesores. |

---

## 🎯 MVP — Domingo 19 Julio

| Quién | Tarea |
|-------|-------|
| **Todo el equipo** | Cerrar ramas. Commits finales. Nadie empieza nada nuevo. Revisión grupal por la tarde. |

### MVP entregado: **Lunes 20 Julio** ✅

---

## 🏖️ Vacaciones — 20 al 31 de Julio

Sin sprints. Sin código. Descanso obligatorio.

---

## Sprint 11 — Reactivación (3-5 Ago)

**Duración:** lun 3 · mar 4 · mié 5

| Quién | Tarea |
|-------|-------|
| **Tobias** | Revisar cola de espera. Endpoint primer vet disponible por especie. |
| **Juan** | Pantalla selección tipo mascota + búsqueda vet. Feedback visual espera. |
| **Damián** | Botón online/offline médico. Indicador visual. |
| **Ezequiel** | Testing cola de espera. Chat de texto básico. |
| **Lara** | Review reactivación. Verificar ritmo. |

---

## Sprint 12 — Imágenes + Notificaciones (6-8 Ago)

**Duración:** jue 6 · vie 7 · sáb 8

| Quién | Tarea |
|-------|-------|
| **Tobias** | Endpoint recibir/almacenar imágenes. Sistema notificaciones push (vet disponible). |
| **Juan** | Botón enviar imagen desde galería. Mostrar imágenes en chat. |
| **Damián** | Mostrar imágenes recibidas. Pulir dashboard médico con feedback acumulado. |
| **Ezequiel** | Recorrer mobile buscando inconsistencias UX. Documentar y asignar. |
| **Lara** | Review. Empieza a sentirse como producto real. |

---

## Sprint 13 — Estabilización (10-12 Ago)

**Duración:** lun 10 · mar 11 · mié 12

> No se agregan features nuevas.

| Quién | Tarea |
|-------|-------|
| **Tobias** | Deuda técnica. Optimizar queries Prisma lentas. Revisar seguridad endpoints. |
| **Juan** | Corregir bugs UX documentados por Ezequiel. Rendimiento en 2GB RAM. |
| **Damián** | Corregir bugs web. Chrome, Firefox, Edge. |
| **Ezequiel** | Re-testear correcciones. Actualizar casos de prueba. Reporte para profesores. |
| **Lara** | Review formal con profesores. Estado del MVP. Feedback pre-QA. |

---

## Sprint 14 — Testing 2GB RAM (13-15 Ago)

**Duración:** jue 13 · vie 14 · sáb 15

| Quién | Tarea |
|-------|-------|
| **Todo el equipo** | Testing en dispositivos Android físicos con 2GB RAM. Tobias prioriza y corrige bugs críticos. Ezequiel documenta en bug tracker. Cerrar CA-06. |

---

## Sprint 15 — Prueba Web Médico (17-19 Ago)

**Duración:** lun 17 · mar 18 · mié 19

| Quién | Tarea |
|-------|-------|
| **Todo el equipo** | Prueba completa interfaz web del médico. Damian lidera. Tobias corrige bugs backend. Ezequiel valida CA-07. Juan ayuda testing general. |

---

## Sprint 16 — Flujo Completo E2E (20-22 Ago)

**Duración:** jue 20 · vie 21 · sáb 22

| Quién | Tarea |
|-------|-------|
| **Todo el equipo** | Flujo completo: registro → busca vet → cola → conecta < 5 min → consulta → historial. Cerrar CA-02. Tobias optimiza cola si > 5 min. |

---

## Sprint 17 — Deploy Producción (24-26 Ago)

**Duración:** lun 24 · mar 25 · mié 26

| Quién | Tarea |
|-------|-------|
| **Tobias** | Deploy Railway. Variables de entorno producción. BD producción separada. |
| **Damián** | Deploy web en Vercel. Apuntar a backend producción. |
| **Juan** | Compilar APK Android firmado. Probar en dispositivos físicos. |
| **Ezequiel** | Smoke testing: registrar usuario real, consulta real, verificar producción. |
| **Lara** | Verificar links producción. Compartir con profesores. |

---

## Sprint 18 — Documentación (27-29 Ago)

**Duración:** jue 27 · vie 28 · sáb 29

| Quién | Tarea |
|-------|-------|
| **Tobias** | README técnico completo: cómo correr, arquitectura, variables de entorno, decisiones. |
| **Damián** | Documentación API: endpoints, qué reciben, qué devuelven (Markdown o Postman). |
| **Juan** | Instrucciones instalación APK. Guía de uso para cliente. |
| **Ezequiel** | Manual de usuario: capturas, flujos paso a paso para 3 perfiles. |
| **Lara** | Revisar y editar toda la documentación. Consistencia y claridad. |

---

## Sprint 19 — Presentación Final (31 Ago - 2 Sep)

**Duración:** lun 31 · mar 1 · mié 2

| Quién | Tarea |
|-------|-------|
| **Todo el equipo** | Preparar presentación final. Definir quién habla en cada parte. Demo en vivo con casos reales. Ensayar con profesores. |

---

## Sprint 20 — Buffer Final (3-5 Sep)

**Duración:** jue 3 · vie 4 · sáb 5

| Quién | Tarea |
|-------|-------|
| **Todo el equipo** | Código congelado. Solo bugs de ensayos. Nadie agrega features. Nadie experimenta. Objetivo: estable para presentación. |

---

## 📅 Buffer extra hasta Octubre 31

Los sprints terminan el 5 de septiembre. El tiempo restante hasta el 31 de octubre es **buffer exclusivamente para:**
- Ensayos de presentación
- Corrección de bugs descubiertos en ensayos
- Refinamiento de documentación
- NO se agregan features nuevas

---

## Seguimiento

| Sprint | Fechas | Tobias | Juan | Damián | Ezequiel | Lara |
|--------|--------|--------|------|--------|----------|------|
| S1 | 15-17 Jun | ✅ | ✅ | ✅ | ✅ | ✅ |
| S2 | 18-20 Jun | ✅ | ❌ | ❌ | ❌ | ❌ |
| S3 | 22-24 Jun | ✅ | ❌ | ❌ | ❌ | ❌ |
| S4 | 25-27 Jun | ✅ | ❌ | ❌ | ❌ | ❌ |
| **S5** | **29 Jun - 1 Jul** | **🟢** | **🔴** | **🟢** | **🔴** | **🔴** |
| S6 | 2-4 Jul | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| S7 | 6-8 Jul | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| S8 | 9-11 Jul | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| S9 | 13-15 Jul | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| S10 | 16-18 Jul | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| MVP | 19-20 Jul | 🎯 | 🎯 | 🎯 | 🎯 | 🎯 |
| S11-S20 | 3 Ago - 5 Sep | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
