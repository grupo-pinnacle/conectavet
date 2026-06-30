# Channel Strategy — Web + Mobile

> **Decisión tomada:** Ambos canales. Web para médicos (dashboard pesado). Mobile para clientes (registro rápido desde el celular).
> **Este documento** analiza las implicancias técnicas de mantener ambos canales en el MVP y cómo dividir el trabajo para que sea viable.

---

## 1. La división por rol

| Perfil | Canal primario | Razón |
|--------|---------------|-------|
| **VET (veterinario)** | **Web** | Dashboard con listas, tablas, filtros. El médico trabaja desde una computadora. |
| **CLIENT (dueño)** | **Mobile** | El dueño saca una foto de su mascota, pide consulta desde el celular. |
| **ADMIN** | Web | Panel administrativo, tablas, filtros. |

**Pero ambos canales pueden hacer lo mismo.** Si un cliente quiere usar la web, puede. Si un veterinario quiere atender desde el celular, también (a futuro).

---

## 2. Estado actual de cada canal

| Aspecto | Web | Mobile |
|---------|-----|--------|
| Código existente | ✅ `web/src/` completo (Auth, Pets, Dashboard) | ❌ `mobile/` vacío |
| Auth | ✅ Login + Register + ProtectedRoute + Dashboard | ❌ Hay helpers en `docs/helpers/mobile/` |
| Pets CRUD | ✅ Listo (vía backend) | ❌ Falta implementar |
| Responsable | Damián + Tobias (ya lo dejaron funcional) | Juan |
| Tiempo estimado para tener lo básico | ✅ Ya está | ⏳ ~5-7 días hábiles |

---

## 3. Lo que Juan necesita construir para mobile (MVP)

Según el alcance recortado (`MVP_SCOPE.md`), mobile necesita:

| Feature | Depende de | Tiempo estimado |
|---------|-----------|-----------------|
| Crear proyecto Expo | Nada | 1 hora |
| AuthContext + AsyncStorage | Backend (ya listo) | 1 día |
| LoginScreen + RegisterScreen | AuthContext | 1 día |
| HomeScreen por rol | AuthContext | 0.5 día |
| Formulario registro de mascota | Pets API (ya lista) | 1 día |
| Lista de mascotas | Pets API | 0.5 día |
| Chat de texto básico | Backend (a construir) | 2-3 días |
| **Total estimado** | | **~7-9 días** |

**Deadline:** Si Juan arranca hoy (1 julio), y trabajamos con el calendario actual (S5 cierra 1 jul, S6 arranca 2 jul), tiene hasta el **11 de julio** para tener mobile funcional con auth + mascotas. Eso deja S7-S8 para chat y pulido.

---

## 4. Lo que Web necesita para el MVP (crítico)

Web ya tiene auth y pets funcionando. Lo que falta:

| Feature | Responsable | Tiempo |
|---------|-------------|--------|
| Dashboard con lista de consultas | Damián | 1 día |
| Chat de texto (interfaz) | Damián + Tobias (backend) | 2-3 días |
| Formulario de notas clínicas | Damián | 1 día |
| Historial de consultas (ver) | Damián | 1 día |

---

## 5. Riesgos de mantener ambos canales

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| **Juan es el único bottleneck de mobile.** Si se atrasa, mobile no llega. | Alto | Tobias prepara helpers completos (ya los hizo). Juan tiene que copiar y conectar, no inventar. |
| **Dos interfaces de chat que consumen el mismo backend.** | Medio | El backend del chat debe ser genérico (un endpoint que sirve tanto a web como a mobile). Tobias lo construye una vez. |
| **Testing duplicado (web + mobile).** | Medio | Ezequiel prueba los dos. Los casos de prueba son los mismos, solo cambia la interfaz. |
| **Si mobile no llega, el cliente no tiene app.** | Alto | El cliente puede usar la web como plan B. No es ideal, pero el MVP se puede presentar igual. |

---

## 6. Plan de contingencia

Si Juan no llega con mobile al 17 de julio (freeze):

1. **El MVP se presenta con web solamente.** El cliente usa la web desde el navegador del celular (es responsive con Tailwind).
2. **Mobile se entrega como "en progreso"** para la presentación, mostrando los helpers y el proyecto creado.
3. **Post-MVP (S11 en adelante):** Juan termina mobile sin presión de fecha.

Si al equipo le parece que mobile es obligatorio para el MVP, entonces **el alcance general debe reducirse aún más** para que Juan tenga tiempo (por ejemplo, sacar el chat de texto del MVP y dejarlo como "solicitar consulta" nomás).

---

## 7. Resumen

| Decisión | Valor |
|----------|-------|
| ¿Hacemos web y mobile? | **Sí** |
| Web para | Médicos (dashboard, consultas) |
| Mobile para | Clientes (registro, solicitar consulta) |
| ¿Mobile puede no llegar? | Sí, plan B = web responsive |
| ¿Quién desbloquea a Juan? | Tobias (helpers ya listos) |
