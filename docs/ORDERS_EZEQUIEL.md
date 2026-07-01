# Órdenes para Ezequiel — QA / Designer

> **Tu misión:** Asegurar que todo funciona antes del MVP. Encontrar bugs antes de que los encuentren los profesores.
> **TL;DR:** Testear todo el flujo, actualizar Figma, documentar bugs, romper la app a propósito.

---

## Flujo principal a testear

Este es el MVP recortado (ver `MVP_SCOPE.md`). Lo que hay que probar:

```
CLIENTE                         MÉDICO
   │                               │
   ├─ Registrarse                  ├─ Login
   ├─ Login                        ├─ Ver dashboard
   ├─ Registrar mascota            ├─ Ver consultas disponibles
   ├─ Solicitar consulta           ├─ Tomar consulta
   ├─ Chatear con el médico        ├─ Chatear con el cliente
   └─ Ver historial                └─ Cerrar consulta + notas
```

---

## Sprint 6 (2-4 Jul) — Probar Auth + Mascotas

### En web:
1. Registrate como CLIENT → ¿funciona?
2. Login como CLIENT → ¿dashboard correcto?
3. Registrate como VET → ¿dashboard diferente?
4. Intentá registrar un CLIENT sin email → ¿error 400?
5. Intentá login con contraseña incorrecta → ¿error 401?
6. CLIENT: creá una mascota → ¿aparece en la lista?
7. CLIENT: editá la mascota → ¿se guarda?
8. CLIENT: eliminá la mascota → ¿desaparece?
9. Sin token: intentá acceder a `/dashboard` → ¿redirige a `/login`?

### En mobile (cuando Juan lo tenga listo):
10. Mismos casos que web pero en Android físico.
11. Probar en Android 2GB RAM si tenés uno.

### En Postman (backend directamente):
12. Test de roles: `GET /api/users/admin-only` con token CLIENT → debe dar 403.
13. Test de ownership: CLIENT-A intenta `DELETE /api/pets/:id-de-B` → debe dar 403.

---

## Sprint 7 (6-8 Jul) — Probar Consultas + Chat

### Flujo completo de consulta:
1. CLIENT web: creá una consulta para una mascota
2. VET web: abrí el dashboard → ¿ves la consulta en WAITING?
3. VET web: tomá la consulta → ¿cambia a ACTIVE?
4. CLIENT web: abrí el chat de la consulta → ¿ves la sala?
5. CLIENT: enviá 3 mensajes
6. VET: ¿ves los mensajes en tiempo real? (sin recargar)
7. VET: respondé 2 mensajes
8. CLIENT: ¿ves las respuestas en tiempo real?
9. VET: cerrá la consulta con notas → ¿cambia a COMPLETED?
10. CLIENT: abrí el historial → ¿ves la consulta cerrada con las notas?

### Probar también:
11. Enviar mensaje vacío → ¿lo rechaza?
12. Desconectarse y reconectarse → ¿el historial se carga?
13. Dos CLIENT distintos → ¿cada uno ve solo sus consultas?
14. VET con token expirado → ¿Socket.io rechaza la conexión?

---

## Sprint 8 (9-11 Jul) — Romper la app a propósito

- Probar en Chrome, Firefox, Edge
- Probar en Android físico (si Juan ya tiene mobile)
- Probar con red lenta (Chrome DevTools → Network → throttling)
- Probar con 2 CLIENT y 1 VET simultáneos
- Probar registro con email inválido, password corta, datos vacíos

---

## Figma — Actualizar wireframes

Los wireframes deben reflejar el MVP recortado:
- Sacar pantallas de videollamada (LiveKit no está en MVP)
- Agregar pantallas de chat de texto
- Agregar pantalla de "registrar mascota"
- Agregar flujo de "tomar consulta" para VET

**Coordinación con Damián:** Damián necesita los wireframes actualizados para saber cómo dibujar el chat y el dashboard. No lo hagas esperar.

---

## Reporte de bugs

Cuando encuentres un bug:

```
BUG-001: [Título corto]
Severidad: 🛑 Crítica / 🟡 Media / 🟢 Baja
Dónde: Web / Mobile / Backend
Pasos:
  1. Ir a ...
  2. Hacer clic en ...
  3. Pasa esto...
Esperado: Debería pasar esto otro.
Asignado a: @responsable
```

Subilo a Trello/Notion en la columna "Bugs". En la daily, Lara revisa la columna.

---

## Dependencias con el equipo

| Dependencia | De quién | Qué necesitás |
|-------------|---------|---------------|
| Web para testear | Damián | Que tenga el dashboard + chat funcionando |
| Mobile para testear | Juan | Que tenga el proyecto Expo creado |
| Postman collection | Tobias | Tobias te puede pasar los endpoints para importar |
| Bug fixes | Tobias / Damián / Juan | Reportás el bug, ellos lo corrigen |

---

## Checklist rápido pre-MVP

- [ ] Auth web funciona (register + login + logout + roles)
- [ ] Auth mobile funciona (cuando Juan lo tenga)
- [ ] CRUD mascotas web
- [ ] CRUD mascotas mobile
- [ ] Crear consulta (CLIENT)
- [ ] Tomar consulta (VET)
- [ ] Chat en tiempo real (web + mobile)
- [ ] Cerrar consulta con notas
- [ ] Ver historial de consultas
- [ ] No se puede violar seguridad de roles (test 13)
- [ ] Figma actualizado con MVP recortado
- [ ] Reporte de bugs entregado al equipo
