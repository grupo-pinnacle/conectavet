# MVP Scope — Propuesta de Alcance Recortado

> **Fecha:** 30 de junio, 2026
> **Objetivo:** Definir QUÉ entra y QUÉ no entra en el MVP del 20 de julio.
> **Estado:** BORRADOR — pendiente de discusión y aprobación del equipo.

---

## Principios

1. **MVP no es el producto final.** Es la versión más chica que podemos mostrar y que funcione de punta a punta.
2. **Chicle:** web para médicos (dashboard, consultas). Mobile para clientes (registro, solicitar consulta). Ambos pueden usar lo del otro si quieren.
3. **Si un feature no está listo 3 días antes del MVP (17 julio), se saca.** Sin excepción.

---

## ✅ INCLUIDO en el MVP

| Feature | Estado actual | ¿Por qué entra? |
|---------|--------------|-----------------|
| **Auth (register + login)** | ✅ Listo (backend + web) | Base de todo. Sin auth no hay app. |
| **Roles CLIENT + VET + ADMIN** | ✅ Listo (backend + web) | Separa perfiles. Ya funciona. |
| **CRUD de mascotas** | ✅ Listo (backend + web) | Feature principal del cliente. |
| **Dashboard web del médico** | ✅ Listo (vista básica) | El médico tiene que ver sus pacientes. |
| **Registro de mascota desde mobile** | 🔧 Pendiente (Juan) | Experiencia mobile del cliente. |
| **Login/Registro desde mobile** | 🔧 Pendiente (Juan) | Mobile sin auth no sirve. |
| **Protección de rutas por rol** | ✅ Listo (backend) | Seguridad básica. |

## ❌ EXCLUIDO del MVP (pasa a post-MVP)

| Feature | Sprint original | ¿Por qué se saca? |
|---------|----------------|-------------------|
| **LiveKit (videollamada)** | S7 (6-8 Jul) | **Mayor riesgo técnico.** Requiere servidor LiveKit, SDK en web + mobile, probar latencia en dispositivos reales. Si falla, no hay plan B. Se reemplaza por **chat de texto**. |
| **Cola de espera automática** | S8 (9-11 Jul) | Lógica compleja de asignación por especie + disponibilidad. No es crítica para mostrar el concepto. |
| **Online/Offline del médico** | S8 (9-11 Jul) | Depende de la cola. Se mueve junto con ella. |
| **Historial clínico completo** | S9 (13-15 Jul) | Se puede mostrar un historial básico (consultas anteriores) sin el resumen automático. |
| **Asistente IA (Claude)** | S10 (16-18 Jul) | Dependencia externa, costos, latencia. No esencial para el MVP. |
| **Sistema de honorarios** | S10 (16-18 Jul) | Feature administrativo. No aporta al flujo principal. |
| **Testing en 2GB RAM** | S14 (13-15 Ago) | Post-MVP por definición. |

---

## 📦 Lo que queda después del recorte

```
MVP REAL:

CLIENTE (Mobile/Web)          MÉDICO (Web)
       │                           │
       ├─ Registrarse              ├─ Login
       ├─ Iniciar sesión           ├─ Ver dashboard
       ├─ Registrar mascota        ├─ Ver mascotas asignadas
       ├─ Ver histórico            ├─ Iniciar consulta (chat)
         de consultas              └─ Cerrar consulta
       └─ Chatear con el médico
```

**Sin videollamada, sin IA, sin cola automática, sin honorarios.**

La consulta funciona así:
1. CLIENTE se registra, carga su mascota
2. CLIENTE solicita consulta (se asigna a un VET manual o se muestra disponibles)
3. VET acepta la consulta
4. Chatean por texto
5. VET cierra la consulta y deja notas
6. CLIENTE ve el historial

---

## ⚠️ Reglas para el equipo

1. **Nadie empieza un feature que no esté en esta lista.** Si querés agregar algo, primero aprobarlo en la daily.
2. **Si un feature incluido no avanza, se saca.** No arrastrar tareas muertas.
3. **El 17 de julio se congela el código.** Solo bugs. No features nuevas, no experimentos.
4. **Si sobra tiempo después de tener lo incluido funcionando**, recién ahí considerar agregar algo de lo excluido (empezando por cola de espera).

---

## 🔧 Mejoras internas implementadas (no planificadas originalmente)

Las siguientes mejoras técnicas fueron implementadas sin estar en el alcance MVP original. No afectan el flujo funcional del producto pero mejoran la calidad interna:

| Mejora | Impacto | Aprobación |
|--------|---------|------------|
| **Refresh tokens** (`POST /api/auth/refresh`) | Evita que usuarios pierdan sesión cada 7 días | Técnica, aprobada en daily |
| **node-cache** para vets disponibles | Reduce queries a BD para listar veterinarios online | Técnica, aprobada en daily |
| **npm workspaces** (`packages/shared/`) | Tipos compartidos entre backend y web (User, Pet, JwtPayload) | Técnica, aprobada en daily |

> Para features funcionales nuevos, volver a la regla #1.

---

## 📐 Cómo se relaciona con los sprints

| Sprint | Feature |
|--------|---------|
| S5 (actual) | Cerrar auth + pets + web funcional |
| S6 (2-4 Jul) | Pantallas mobile (auth + registro mascota) + inicio chat |
| S7 (6-8 Jul) | Chat de texto (reemplaza LiveKit) + historial básico |
| S8 (9-11 Jul) | Pulir flujo completo + testing |
| S9 (13-15 Jul) | Últimos bugs + preparar presentación |
| S10 (16-18 Jul) | **Freeze** — solo bugs críticos |
| **MVP** | **20 de julio** |
