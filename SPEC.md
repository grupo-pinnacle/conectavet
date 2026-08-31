# SPEC.md — Futura app ConectaVet (diseño en Figma)

> **Alcance:** especificación de producto + técnica de la app a construir sobre T3 Stack (ver [`PLAN_MIGRACION_T3APP.md`](./PLAN_MIGRACION_T3APP.md)).
> **Diseño visual:** definido en Figma.
> 🔗 **Link de Figma:** https://www.figma.com/design/sMi6G4C7EDbG8hj1tpCm0q/Protoripado-de-APP-Pinnacle---Veterinaria?node-id=2072-67
>
> **Estrategia de diseño (definida por el humano):**
> - **Web:** sigue 1:1 el diseño del website en Figma (frames web del archivo).
> - **Mobile:** NO es un calco del Figma; es un diseño **original** construido a partir de los **tokens del website** (colores, tipografías, espaciado, radios). Se reusa el sistema visual, pero el layout de pantallas mobile se crea desde cero respetando esos tokens.
>
> ⚠️ **Extracción de tokens:** Figma no es accesible por web scrape (requiere WebGL). Para poblar §8 el humano debe exportar **Figma Variables** (color/tipografía/espaciado) o pegarlas, o bien proveer un token de la **Figma REST API** para consultarlas por código. Hasta entonces, §8 queda como plantilla.

---

## 1. Visión

Telemedicina veterinaria: dueño de mascota inicia una consulta, entra en cola, un vet online la toma, chatean en tiempo real (texto + imágenes), el vet emite receta y cierra; el dueño califica y guarda al vet en favoritos.

## 2. Usuarios y roles

| Rol | Puede |
|-----|-------|
| **CLIENT** (dueño) | registrarse, gestionar sus mascotas, iniciar consultas, chatear, calificar, favoritos, ver historial. |
| **VET** | ponerse online/offline, tomar/declinar/cerrar consultas, chatear, recetar, ver ficha de pacientes atendidos. `vetStatus=PENDING` hasta aprobación admin. |
| **ADMIN** | crear usuarios, aprobar vets, paneles. |

## 3. Requisitos funcionales (del [`ANALISIS.md`](./ANALISIS.md))

- **Auth:** registro (solo CLIENT), login, refresh, logout (revoca sesión global), recuperar password (rate-limited), verificar email.
- **Mascotas:** CRUD + soft delete/restore; ficha clínica (especie, raza, edad, peso, sexo, nacimiento, color, microchip, alergias[], condiciones crónicas[], foto, fallecido).
- **Consultas:** crear (con `petId`) → cola `WAITING` → auto-asignación a vet online → `ACTIVE` → `COMPLETED`/`CANCELLED`; notas de cierre.
- **Chat en vivo:** texto + imagen; dedup por `clientMsgId`; rate-limit; presencia.
- **Recetas:** medicamento, dosis, frecuencia, duración, indicaciones.
- **Rating 1–10** + favoritos de vet.
- **Notificaciones:** push (Expo) + bandeja in-app (marcar leída, `unreadCount`).
- **Video (LiveKit):** sala por consulta (opcional/post-MVP).
- **Presencia:** online/offline + `lastSeen`.

## 4. Modelo de datos

Ver [`ANALISIS.md`](./ANALISIS.md) §3 (11 entidades: User, Pet, Consultation, Message, Prescription, Attachment, Notification, Review, FavoriteVet, PushToken, + enums). En T3 se implementa con Prisma en `packages/db`.

## 5. API (tRPC)

Ver mapeo en [`PLAN_MIGRACION_T3APP.md`](./PLAN_MIGRACION_T3APP.md) §2: `authRouter`, `userRouter`, `petRouter`, `consultationRouter`, `mediaRouter`, `notificationRouter`, `callRouter`. Protección por `publicProcedure` / `protectedProcedure` / `authorizedProcedure(roles)`.

## 6. Realtime (Supabase Realtime) — DECISIÓN CERRADA ✅

- Canal `consultation:{id}`: eventos `message:new`, `consultation:updated`, `prescription:new`.
- Presencia para online/offline en la sala de consulta (Supabase Presence / campo `isOnline`).
- Reemplaza a Socket.io; el cliente (web y mobile) se suscribe al canal en vez de abrir socket propio.
- Dedup por `clientMsgId` + rate-limit se mantienen en el servicio (no en el transporte).

## 7. Pantallas

### 7.1 Web (mapeo 1:1 desde Figma)
> El agente debe listar aquí cada **frame web** de Figma → ruta/componente. Plantilla:

| Frame en Figma | Rol | Ruta (Next) | Componente sugerido |
|----------------|-----|-------------|---------------------|
| `[nombre]` | CLIENT | `/login` | `apps/web/src/app/(auth)/login` |
| `[nombre]` | CLIENT | `/dashboard` | `apps/web/src/app/(app)/dashboard` |
| … | … | … | … |

**Mínimo cubrir (web):** Landing, Login, Register, Dashboard dueño (Home/Directorio/Mascotas/Consultas/Historial/Mensajes/Perfil), Dashboard vet (Pacientes/Home/Mensajes/Ficha), Call.

### 7.2 Mobile (diseño ORIGINAL derivado de los tokens del website)
> No se copia el Figma: se crean las pantallas desde cero usando los tokens de §8. Plantilla de lo que debe existir:

| Pantalla (original) | Rol | Ruta (Expo) |
|---------------------|-----|-------------|
| Inicio | CLIENT | `app/(app)/index` |
| Mascotas + alta/detalle | CLIENT | `app/(app)/pets` |
| Consultas (cola) | CLIENT | `app/(app)/queue` |
| Veterinarios + ficha | CLIENT | `app/(app)/vets` |
| Chat por consulta | CLIENT | `app/(app)/chat/[consultationId]` |
| Llamada | CLIENT | `app/(app)/call/[consultationId]` |
| Historial | CLIENT | `app/(app)/history` |
| Perfil + edición | CLIENT | `app/(app)/profile` |

Todas usan los mismos `color-primary`, tipografía y radios que web (§8), pero con jerarquía y componentes adaptados a mobile.

## 8. Design tokens (extraídos de los PNG — ver [`design-tokens.md`](./design-tokens.md))

> **Fuente:** muestreo de píxeles reales de los frames PNG (`Prototipado/`). Figma no exportó Variables; el SVG era ráster embebido.

Paleta de marca **medida** (no adivinada):

| Token | Hex | Uso |
|-------|-----|-----|
| `brand` (primary) | `#1C60F0` | Botones primarios, activos, links (azul eléctrico). Variaciones: `#044CF4`, `#0C4CD4`. |
| `ink` (texto) | `#080808` | Texto principal (casi negro). |
| `bg` | `#FFFFFF` | Fondo (77–91% del frame). |
| `accent-warm` | `#C28E52` | Solo para media/ilustraciones de mascotas (ámbar), NO color de UI. |

Tipografía, radios y espaciado son **inferencias** (ver `design-tokens.md` §2–§3) y deben validarse contra el PNG. Web = 1:1 del Figma; mobile reusa estos tokens con layout propio.

## 9. Requisitos no funcionales

- **Seguridad:** nunca exponer `password`; revocación global por `tokenVersion`; CORS restrictivo; rate-limit en auth/forgot-password/media.
- **Accesibilidad (a11y):** roles ARIA, contraste AA, focus visible, labels en iconos (ya estaba en mobile).
- **Testing:** Vitest + RTL para web/mobile; tsc limpio; smoke E2E de flujo dueño→vet.
- **Rendimiento:** lazy de rutas pesadas; imágenes optimizadas; realtime efímero.
- **Observabilidad:** health + logs + alerta de caída.

## 10. Fuera de alcance (post-MVP)

- Asistente IA (Claude).
- Historial clínico con resumen automático.
- Sistema de honorarios/pagos.
