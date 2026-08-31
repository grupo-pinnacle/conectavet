# Continuar Desarrollo Pendiente — ConectaVet

Después de una investigación exhaustiva del código existente, las imágenes de Figma y la documentación, este plan cubre todo el trabajo pendiente para llevar la app a un estado funcional completo (web). El mobile queda para una fase posterior.

---

## Estado Actual (lo que YA está hecho)

✅ Monorepo pnpm con `apps/web`, `apps/mobile`, `packages/db`
✅ Prisma schema completo (10 modelos, 4 enums, relaciones)
✅ NextAuth con Credentials, `tokenVersion` para revocación global
✅ 6 routers tRPC: `auth`, `user`, `pet`, `consultation`, `media`, `notification`
✅ Servicios de backend: auth (bcrypt), Cloudinary (upload firmado)
✅ Componentes UI base: `Button`, `Card`, `Input`, `Select`, `Textarea`
✅ Layout + Header con navegación por rol
✅ Páginas funcionales: Landing, Login, Register, Dashboard dueño (mascotas + CRUD), Lista de consultas, Nueva consulta, Chat/sala de consulta, Panel veterinario (cola + activas + historial)
✅ Design tokens CSS variables + Tailwind config con colores de marca
✅ tRPC client + React Query + SessionProvider configurados

---

## User Review Required

> [!IMPORTANT]
> **Alcance de este plan**: Se enfoca exclusivamente en **completar la web** (F5 del plan de migración) + los fixes críticos de backend que faltan. El mobile (F6) y deploy (F7) quedan fuera de este ciclo.

> [!IMPORTANT]
> **Pantallas de Figma vs MVP**: Los prototipos incluyen pantallas de Reportes, Finanzas y Configuración que son features complejos post-MVP (requieren modelos de datos que no existen en el schema). Este plan las deja fuera y se enfoca en el **flujo core**: auth → mascotas → consulta → chat → receta → rating → favoritos.

> [!WARNING]
> **NextAuth route handler faltante**: El archivo `apps/web/src/app/api/auth/[...nextauth]/route.ts` NO EXISTE. Sin él, `signIn()`, `signOut()`, y `useSession()` no funcionan. Es el fix más crítico.

---

## Open Questions

> [!IMPORTANT]
> **¿Querés que implemente las pantallas de Reportes, Finanzas y Configuración del Figma?** Son features muy elaborados que requieren modelos de datos nuevos (facturas, gastos, configuración de clínica). Sugiero dejarlos para una fase posterior y enfocarnos en el flujo core funcional.

---

## Proposed Changes

El trabajo se divide en **5 bloques** ordenados por dependencia:

---

### Bloque 1 — Fixes Críticos de Backend

Arreglar lo que impide que la app funcione.

#### [NEW] [route.ts](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/app/api/auth/[...nextauth]/route.ts)
- Crear el catch-all route handler de NextAuth que expone `GET` y `POST` en `/api/auth/*`.
- Sin esto, `signIn("credentials")`, `signOut()`, `useSession()` y `getServerSession()` no funcionan.

#### [MODIFY] [consultation.ts](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/server/api/routers/consultation.ts)
- Agregar campo `reason` al `createConsultationSchema` (el formulario de nueva consulta lo envía pero el router no lo acepta).
- Incluir `reason` en la respuesta de `queue` para que el vet vea el motivo.

#### [MODIFY] [pet.ts](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/server/api/routers/pet.ts)
- Agregar procedimiento `restore` (soft delete restoration) que falta según el ANALISIS.md.

#### [MODIFY] [schemas.ts](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/server/schemas.ts)
- Agregar `reason` como campo opcional al `createConsultationSchema`.

---

### Bloque 2 — Layout del Dashboard Vet (Sidebar según Figma)

Los prototipos muestran un layout con **sidebar izquierdo fijo** con navegación, **header superior** con avatar/notificaciones, y **área de contenido** a la derecha. El layout actual solo tiene un header simple. Hay que crear el layout del dashboard del Figma.

#### [NEW] [layout.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/app/(vet)/layout.tsx)
- Layout para rutas de veterinario con Sidebar izquierdo fijo siguiendo el Figma:
  - Logo VetConnect + ícono hamburguesa
  - Navegación: Dashboard, Consultas/Agenda, Pacientes, Historial clínico, Recetas, Mensajes
  - Sección inferior: "Sincroniza tu calendario" CTA + "¿Necesitas ayuda?"
- Header superior con: barra de búsqueda, ícono notificaciones (badge), ícono calendario, avatar + nombre del vet
- Responsive: sidebar colapsable en mobile

#### [NEW] [Sidebar.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/components/layout/Sidebar.tsx)
- Componente de sidebar reutilizable con navegación activa highlight (fondo azul claro + texto brand)
- Íconos con `lucide-react` mapeados 1:1 del Figma

#### [MODIFY] [Header.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/components/layout/Header.tsx)
- Refactorizar para soportar el modo "dashboard" con búsqueda, notificaciones badge, calendario y avatar del usuario

#### [NEW] [layout.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/app/(app)/layout.tsx)
- Layout para rutas de dueño (CLIENT) con sidebar adaptado (Inicio, Mascotas, Consultas, Veterinarios, Historial, Mensajes, Perfil)

---

### Bloque 3 — Pantallas del Vet Dashboard (Figma 1:1)

Implementar todas las pantallas del dashboard veterinario visibles en los prototipos.

#### [NEW] [page.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/app/(vet)/dashboard/page.tsx)
- **Dashboard Home del Vet** (image 4.png):
  - Saludo "¡Bienvenido, Dr. [nombre]! 👋"
  - 4 stat cards: Consultas hoy, Pacientes totales, Consultas completadas, Calificación promedio
  - "Consultas de hoy" — lista con hora, avatar mascota, nombre, raza, tipo consulta, estado badge, botón "Ver detalles"/"Iniciar"/"Ingresar"
  - "Agenda del día" — mini calendario con citas
  - "Notificaciones" — últimas 3 notificaciones con badge unread
  - 4 quick-action cards: Iniciar consulta, Nueva receta, Agregar paciente, Ver reportes

#### [NEW] [page.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/app/(vet)/consultas/page.tsx)
- **Consultas / Agenda** (image 5.png):
  - Tabs: Agenda | Lista | Solicitudes | Disponibilidad
  - Calendario mensual interactivo a la izquierda con filtros (estado, tipo, "solo mis consultas")
  - Lista de citas del día a la derecha con hora, avatar, nombre, tipo, badge de estado, botón acción
  - 4 stat cards pie: Consultas hoy, Completadas, Pendientes, En consulta

#### [NEW] [page.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/app/(vet)/pacientes/page.tsx)
- **Gestión de Pacientes** (image 6.png):
  - Tabs: Lista de Pacientes | Añadir Nuevo
  - Barra búsqueda + botón "+ Nuevo Paciente"
  - Panel filtros a la izquierda (especie, estado, checkbox "Mis Pacientes")
  - Tabla de pacientes: Foto, Nombre, Especie/Raza, Propietario, Última Consulta, Estado badge, botón "Ver Expediente"
  - 4 stat cards pie: Pacientes Totales, Activos, Nuevos (Mes), Ratio Gatos/Perros

#### [NEW] [page.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/app/(vet)/historial/page.tsx)
- **Historial Clínico** (image 7.png):
  - Tabs: Búsqueda de Pacientes | Registros Recientes
  - Panel filtros: Buscar paciente, Rango de fechas, Tipo de registro
  - "Últimos Pacientes Vistos" con avatar + link "Ver Historial Completo"
  - Timeline del último registro médico: consulta, diagnóstico, tratamiento, notas, adjuntos PDF
  - 4 stat cards: Total Registros, Consultas Recientes, Recetas Emitidas, Pacientes con Historial

#### [NEW] [page.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/app/(vet)/recetas/page.tsx)
- **Gestión de Recetas** (image 8.png):
  - Tabs: Lista de Recetas | Nueva Receta | Plantillas
  - Panel filtros: Buscar, Rango fechas, Estado, Por paciente
  - "Últimas Recetas Emitidas" con avatar + status badge
  - Tabla: Paciente, Medicamento, Dosis/Frecuencia, Fecha, Estado (Emitida/Firmada)
  - 4 stat cards: Total Emitidas, Recientes (Mes), Medicamentos Únicos, Pacientes con Recetas

#### [NEW] [page.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/app/(vet)/mensajes/page.tsx)
- **Gestión de Mensajes** (image 9.png):
  - Tabs: Bandeja de Entrada | Enviados | Borradores | Archivados
  - Panel filtros: Buscar, Rango fechas, Estado (Todos/Sin leer/Leídos/Respondidos)
  - "Conversaciones Recientes" con avatar + status
  - Panel derecho: "Conversación con [nombre]" — lista de mensajes del thread seleccionado con burbujas estilo chat + input de respuesta
  - 4 stat cards: Total Recibidos, Recientes (Mes), Nuevas Conversaciones, Tasa de Respuesta

---

### Bloque 4 — Pantallas Auth según Figma (Refinamiento 1:1)

Las pantallas de Login y Register actuales son funcionales pero no siguen el diseño del Figma. Hay que refactorizarlas para ser 1:1.

#### [MODIFY] [page.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/app/(auth)/login/page.tsx)
- Refactorizar al layout de image 2.png:
  - Split layout: formulario a la izquierda, hero con imagen de mascota + texto marketing a la derecha
  - Navbar superior con logo VetConnect + links: Inicio, Servicios, Cómo funciona, Sobre nosotros, Contacto + botones Crear cuenta / Iniciar sesión
  - Formulario: email con ícono ✉, contraseña con ícono 🔒 + toggle visibilidad, checkbox "Recordarme", link "¿Olvidaste tu contraseña?"
  - Separador "o continúa con" + botones Google y Apple (visuales, sin funcionalidad OAuth por ahora)
  - Footer: "¿No tienes cuenta? Regístrate aquí"
  - Hero derecho: título "El mejor cuidado para tu **mascota**...", subtítulo, imagen perro+gato, 3 feature icons (Video consultas, Veterinarios verificados, Historial clínico)

#### [MODIFY] [page.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/app/(auth)/register/page.tsx)
- Refactorizar al layout de image 3.png:
  - Split layout similar al login
  - Formulario: Nombre + Apellido (2 cols), Email, Contraseña + Confirmar (2 cols), validación visual (✅ Mínimo 8 caracteres, ✅ Incluye mayúscula, ✅ Incluye número), Teléfono (opcional)
  - Checkbox "Acepto los Términos y Condiciones y la Política de Privacidad"
  - Botones Google + Apple
  - Hero derecho: features listadas con íconos (Consultas en línea, Veterinarios verificados, Agenda 24/7, Historial clínico seguro, Recordatorios y notificaciones) + banner privacidad

#### [NEW] [page.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/app/(auth)/forgot-password/page.tsx)
- Formulario de recuperación de contraseña

#### [NEW] [layout.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/app/(auth)/layout.tsx)
- Layout compartido para las páginas de auth con la navbar pública del Figma (logo + links + botones)

---

### Bloque 5 — Landing Page según Figma + Componentes Compartidos

#### [MODIFY] [page.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/app/page.tsx)
- Refactorizar al diseño de Group 1.png:
  - Navbar: logo VetConnect (verde/azul con ícono huella+corazón) + links + botón "Inicio Sesión"
  - Hero: badge "ATENCIÓN VETERINARIA 24/7", título "Conectar con el mejor cuidado para tu **mascota**", subtítulo, 2 CTAs (primario + outline), imagen perro+gato
  - Stats row: 4 cards con preguntas/stats (médicos, usuarios, mascotas atendidas, horas disponibles)
  - Sección "NUESTROS SERVICIOS": "Todo lo que tu mascota necesita"
  - Feature cards con íconos

#### [NEW] [StatCard.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/components/ui/StatCard.tsx)
- Componente stat card reutilizable (ícono, valor numérico, label, variación %, color) usado en todos los dashboards

#### [NEW] [Badge.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/components/ui/Badge.tsx)
- Componente badge/pill para estados (Completada, Pendiente, En consulta, Activo, Inactivo, Emitida, Firmada)

#### [NEW] [Tabs.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/components/ui/Tabs.tsx)
- Componente tabs reutilizable con underline activo (patrón visible en todas las pantallas del Figma)

#### [NEW] [FilterPanel.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/components/ui/FilterPanel.tsx)
- Panel de filtros lateral reutilizable (búsqueda, selects, checkboxes) usado en Pacientes, Recetas, Mensajes, Historial

#### [NEW] [DataTable.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/components/ui/DataTable.tsx)
- Tabla de datos reutilizable con columnas configurables, filas con avatar, badges de estado y botones de acción

#### [NEW] [Avatar.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/components/ui/Avatar.tsx)
- Componente avatar circular (imagen o iniciales como fallback) con variantes de tamaño

#### [NEW] [MessageBubble.tsx](file:///c:/Users/Alumno/Documents/conectavet/apps/web/src/components/ui/MessageBubble.tsx)
- Burbuja de chat reutilizable (enviado vs recibido, timestamp, adjuntos)

---

## Verification Plan

### Automated Tests
```bash
cd apps/web && npx tsc --noEmit    # typecheck limpio
cd apps/web && npm run build       # build sin errores
```

### Manual Verification
- Verificar que `/api/auth` funciona: login, logout, useSession
- Navegar todas las rutas del vet dashboard y verificar diseño 1:1 contra los PNGs de Figma
- Flujo completo: register → login → crear mascota → solicitar consulta → (login como vet) → tomar consulta → chat → completar → calificar
- Verificar responsive en mobile viewport

---

## Orden de Ejecución

1. **Bloque 1** (Fixes backend) — ~15 min — sin esto nada funciona
2. **Bloque 5** (Componentes UI compartidos) — ~30 min — base para todo lo demás
3. **Bloque 4** (Auth pages Figma 1:1) — ~45 min — primera impresión visual
4. **Bloque 2** (Layout sidebar dashboard) — ~30 min — estructura de todas las pantallas internas
5. **Bloque 3** (Pantallas vet dashboard) — ~2h — el grueso del trabajo visual
6. **Landing page** — ~30 min — con los componentes ya creados
