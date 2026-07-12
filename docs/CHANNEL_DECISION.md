# Channel Strategy — Web + Mobile

> **Decisión:** Ambos canales. Web para médicos (dashboard pesado). Mobile para clientes (registro rápido desde el celular).
> **Estado:** ✅ Implementado — MVP con ambos canales funcionales.

---

## 1. La división por rol

| Perfil | Canal primario | Estado MVP |
|--------|---------------|------------|
| **VET (veterinario)** | **Web** — Dashboard, Pacientes, Chat, Cerrar consulta | ✅ Implementado |
| **CLIENT (dueño)** | **Mobile** (principal) + Web (alternativo) | ✅ Mobile funcional, web también disponible |
| **ADMIN** | Web | 🟡 Básico |

---

## 2. Estado actual de cada canal (12 Jul 2026)

| Aspecto | Web | Mobile |
|---------|-----|--------|
| Auth | ✅ Login + Register + ProtectedRoute | ✅ Login + Register + secure store |
| Pets CRUD | ✅ Lista, crear, editar | ✅ Lista, crear, detalle, foto |
| Chat | ✅ Chat con Socket.io + cerrar consulta | ✅ Chat con veterinario (polling) |
| Historial | ✅ Básico | ✅ Con rating post-consulta |
| Landing | ✅ Profesional con servicios | — (navegación directa a auth) |
| Design System | ✅ Teal unificado con mobile | ✅ Misma paleta y componentes |
| Responsable | Damián + Tobias | Juan + Tobias |

---

## 3. Lo que se construyó para el MVP

### Web (vet dashboard)
- Dashboard con stats y citas del día
- Lista de pacientes asignados con búsqueda
- Chat en tiempo real con dueños de mascotas
- Botón "Cerrar consulta" con modal de notas

### Mobile (client app)
- Registro/login con almacenamiento seguro de tokens
- CRUD de mascotas con foto (Cloudinary)
- Chat con veterinario durante consulta activa
- Solicitar consulta simple (sin cola automática)
- Historial con valoración post-consulta

---

## 4. Features post-MVP (S11+)

| Feature | Canal | Sprint |
|---------|-------|--------|
| Cola de espera automática | Mobile + Web | S11 |
| Online/Offline del médico | Web | S11 |
| Imágenes en el chat | Mobile + Web | S12 |
| Notificaciones push | Mobile | S12 |
| Videollamada (LiveKit) | Mobile + Web | Post-MVP |
| Asistente IA | Mobile | Post-MVP |
| Sistema de honorarios | Web | Post-MVP |

---

## 5. Resumen

| Decisión | Valor |
|----------|-------|
| ¿Hacemos web y mobile? | **Sí** — ambos funcionando |
| Web para | Médicos (dashboard, consultas) |
| Mobile para | Clientes (registro, solicitar consulta, chat) |
| ¿Mobile llegó al MVP? | **Sí** — funcional y alineado al scope |
| ¿Plan B si mobile no llegaba? | Web responsive — no fue necesario |
