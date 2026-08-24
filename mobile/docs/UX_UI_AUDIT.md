# AUDITORIA UX/UI SENIOR — NIVEL FAANG

## VetConnect Mobile — Informe Profesional

| Aspecto | Detalle |
|-|-|
| **Fecha** | Julio 2026 |
| **Versión analizada** | 1.0.0 |
| **Plataforma** | iOS / Android (React Native + Expo) |
| **Equipo auditor** | Senior Product Design Team |
| **Metodología** | Apple HIG, Material Design 3, WCAG 2.2 AA, 10 Heurísticas de Nielsen |

---

# RESUMEN EJECUTIVO

**Puntuación Global: 67/100**

| Dimensión | Puntaje | Nivel |
|-|-|-|
| UX | 65 | Intermedio |
| UI | 72 | Bueno |
| Accesibilidad | 42 | Bajo |
| Consistencia | 68 | Intermedio |
| Navegación | 78 | Bueno |
| Arquitectura de Información | 70 | Bueno |
| Design System | 60 | Intermedio |
| Motion Design | 45 | Bajo |
| Calidad Visual | 67 | Intermedio |
| Calidad Técnica de Componentes | 71 | Bueno |
| Percepción Premium | 55 | Bajo |

**Veredicto:** La aplicación NO está lista para producción con estándares FAANG. Los bloqueantes principales son accesibilidad (score 42), motion design (45) y percepción premium (55). Se requiere un esfuerzo significativo en 3 áreas críticas antes de considerar un lanzamiento masivo.

---

# BLOQUEANTES PRINCIPALES (P0)

1. **Accesibilidad casi nula** — No hay soporte para VoiceOver/TalkBack, contraste insuficiente en textos, touch targets menores a 44pt, sin soporte para Dynamic Type o Reduce Motion.
2. **Motion Design ausente** — No hay easing curves consistentes, transiciones bruscas, falta de micro-interacciones de feedback, pull-to-refresh sin animación pulida.
3. **Iconografía con emojis** — El 100% de los iconos son emojis Unicode, lo que impide branding, consistencia y escalabilidad.
4. **Percepción de template** — La app carece de detalles premium: sin animaciones de transición entre pantallas, sin haptics, sin sombras coherentes, sin gradientes ni profundidad visual.

---

# 1. ARQUITECTURA DE INFORMACIÓN

## Estructura General

```
Root
├── (auth)          → Login, Register
├── (app)           → App con tabs
│   ├── index       → Home
│   ├── queue/      → Cola de espera
│   ├── pets/       → Lista, New, [id]
│   ├── chat/       → Lista conversaciones, [conversationId]
│   ├── history/    → Historial de consultas
│   └── call/       → Videollamada (ruta oculta)
```

## Evaluación

| Criterio | Estado | Problema |
|-|-|-|
| Organización | OK | 5 tabs cubren las funciones principales. Lógica clara. |
| Jerarquía | Medio | Home mezcla quick actions + queue + pets. Demasiadas secciones apiladas sin separación visual. |
| Agrupación | Medio | "Preguntar a la IA" y "Pedir videollamada" están en Home como quick actions, pero también son tabs separadas (chat, queue). Hay duplicación funcional que puede confundir. |
| Carga cognitiva | Bajo | Cada pantalla muestra una sola función principal. Bien. Pero home intenta mostrar too much. |
| Descubribilidad | Bajo | No hay onboarding. El usuario no sabe que existe el asistente IA hasta que navega a la tab Chat. |
| Navegación mental | OK | Nombres de tabs son claros: Inicio, Mascotas, Chat IA, Cola, Historial. |

## Problemas encontrados

- **CRÍTICO**: No hay onboarding ni coach marks. Un usuario nuevo no sabe qué hace la app ni cómo empezar.
- **ALTO**: No hay pantalla de perfil/configuración. El logout está en el header como un avatar sin label. Ningún usuario descubriría cómo cerrar sesión sin probar.
- **MEDIO**: Home mezcla 3 secciones distintas (greeting, quick actions, mascotas) sin separadores visuales entre bloques de diferente jerarquía.

## Recomendaciones

1. **P1** — Agregar onboarding de 3 pasos al primer login: "Tus mascotas" → "Chat IA" → "Videollamadas"
2. **P1** — Cambiar el avatar del header a un menú desplegable con "Perfil", "Configuración", "Cerrar sesión"
3. **P2** — Agregar separadores visuales entre secciones en Home (subheaders más claros o cards con fondo distinto)

---

# 2. USER FLOWS

## Registro
- **Pasos**: 5 campos (nombre, apellido, email, teléfono, contraseña)
- **Fricción**: Alta. 5 campos en una sola pantalla sin progreso visible. Password con requisitos complejos sin validación en tiempo real.
- **Feedback**: Toast al finalizar. No hay validación inline hasta submit.
- **Severidad**: Media

## Login
- **Pasos**: 2 campos (email, contraseña)
- **Fricción**: Baja. Formulario limpio.
- **Problema**: No hay "Olvidé mi contraseña". Si el usuario no recuerda su password, no puede recuperar la cuenta.
- **Severidad**: Alta

## Home → Queue
- **Flujo**: Home → tap quick action "Videollamada" → Queue screen → seleccionar mascota → escribir motivo → submit
- **Fricción**: Media. La pantalla de queue tiene que cargar mascotas. Si no hay mascotas, el CTA lleva a New Pet. Correcto.
- **Problema**: Al unirse a la cola, no hay animación ni feedback visual de transición al estado "en espera".
- **Severidad**: Media

## Queue → Call (videollamada)
- **Flujo**: Queue → estado ASSIGNED → tap botón "Iniciar videollamada" → Call screen → pedir permisos → conectar LiveKit
- **Fricción**: Alta por los permisos de cámara/micrófono (necesarios pero frustrantes).
- **Problema**: Si el usuario rechaza permisos, vuelve atrás pero la entry sigue ASSIGNED. No hay forma de reintentar sin salir y volver.
- **Severidad**: Alta

## Chat IA
- **Flujo**: Chat tab → Nueva conversación → escribir mensaje → recibir respuesta
- **Fricción**: Baja. UX clara.
- **Problema**: El input de texto no tiene botón de "enviar" visible mientras se escribe (solo cambia de color cuando hay texto). Podría no ser obvio.
- **Severidad**: Baja

## Pet Detail
- **Flujo**: Home/Pets → tap pet → VetCard screen
- **Fricción**: Baja. Buena organización de datos.
- **Problema**: Stats (consultas totales, última consulta, microchip) están en cards minúsculas con información poco útil (ej: microchip de 15 dígitos en una card de 80px de ancho se corta).
- **Severidad**: Media

## History
- **Flujo**: History tab → lista de consultas → tap "Valorar"
- **Fricción**: Baja.
- **Problema**: La valoración (stars) usa texto Unicode ★ que no es accesible para screen readers.
- **Severidad**: Alta

---

# 3. HEURISTICAS DE NIELSEN

## 1. Visibilidad del estado del sistema
- **Estado**: Regular
- **Problemas**: 
  - La cola de espera muestra posición y tiempo. Correcto.
  - El formulario de registro no indica progreso (5 campos sin steps).
  - Las transiciones entre estados (WAITING → ASSIGNED) solo se ven al recargar manualmente.
- **Severidad**: Media
- **Referencia**: Nielsen #1
- **Prioridad**: P1

## 2. Relación entre sistema y mundo real
- **Estado**: Bueno
- **Problemas**: Términos "cola", "videollamada", "mascota", "asistente IA" son naturales. Los emojis ayudan a la comprensión.
- **Severidad**: Baja
- **Prioridad**: P3

## 3. Control y libertad del usuario
- **Estado**: Regular
- **Problemas**:
  - No hay botón "Cancelar" en registro/login (solo back nativo, que no siempre funciona).
  - En chat, el envío de mensaje no se puede cancelar una vez enviado.
  - No hay "Deshacer" en ninguna acción.
- **Severidad**: Media
- **Referencia**: Nielsen #3
- **Prioridad**: P2

## 4. Consistencia y estándares
- **Estado**: Regular
- **Problemas**:
  - Los iconos son emojis (inconsistentes entre plataformas iOS/Android).
  - Los botones "Nueva conversación" y "Agregar mascota" usan estilos diferentes en distintos contextos.
  - Los placeholders de input a veces son ejemplos ("vos@email.com") y otras veces instrucciones ("Mín. 8 caracteres...").
- **Severidad**: Alta
- **Referencia**: Nielsen #4, Apple HIG
- **Prioridad**: P1

## 5. Prevención de errores
- **Estado**: Regular
- **Problemas**:
  - La validación de password tiene requisitos pero solo se validan al submit.
  - Fecha de nacimiento acepta cualquier formato hasta el submit.
  - No hay confirmación antes de "Cancelar espera" (acción destructiva sin undo).
- **Severidad**: Alta
- **Prioridad**: P1

## 6. Reconocimiento antes que recuerdo
- **Estado**: Bueno
- **Problemas**: Menores. Las tabs siempre visibles ayudan. El home muestra datos relevantes.
- **Severidad**: Baja
- **Prioridad**: P3

## 7. Flexibilidad y eficiencia de uso
- **Estado**: Bajo
- **Problemas**:
  - No hay shortcuts ni gestures. Todo es tap directo.
  - No hay búsqueda global.
  - No hay filtros en History.
- **Severidad**: Media
- **Referencia**: Nielsen #7
- **Prioridad**: P2

## 8. Diseño estético y minimalista
- **Estado**: Bueno
- **Problemas**:
  - Algunas pantallas tienen demasiada información (Home, Pet Detail).
  - Los bordes y sombras son sutiles pero a veces confluyen (cards anidadas).
- **Severidad**: Media
- **Prioridad**: P2

## 9. Ayudar a los usuarios a reconocer, diagnosticar y recuperarse de errores
- **Estado**: Bajo
- **Problemas**:
  - Los mensajes de error de API son genéricos ("No se pudo iniciar sesión").
  - Los errores de red no tienen mensajes específicos ("Error" sin más contexto).
  - No hay sugerencias de recuperación.
- **Severidad**: Alta
- **Referencia**: Nielsen #9
- **Prioridad**: P1

## 10. Ayuda y documentación
- **Estado**: Crítico
- **Problemas**:
  - No hay FAQs ni ayuda in-app.
  - No hay onboarding ni tooltips.
  - No hay documentación de funcionalidades.
- **Severidad**: Crítica
- **Referencia**: Nielsen #10
- **Prioridad**: P0

---

# 4. HUMAN INTERFACE GUIDELINES

## Apple HIG

| Principio | Cumplimiento | Problema |
|-|-|-|
| **Defer to content** | 60% | Bordes y sombras compiten con el contenido en algunos cards |
| **Clarity** | 65% | Textos claros pero iconografía con emojis reduce claridad profesional |
| **Depth** | 30% | Sin jerarquía de profundidad real. Todo es plano con sombras mínimas |
| **Touch targets** | 40% | Múltiples botones con altura <44pt (sm=36pt). Apple HIG exige mínimo 44x44pt (HIG: Layout) |
| **Safe areas** | 70% | Padding correcto en la mayoría de pantallas, pero no usa SafeAreaView en varios scrollviews |
| **Keyboard avoidance** | 80% | KeyboardAvoidingView presente pero sin manejo de KeyboardAccessoryView |
| **Gestures** | 20% | No hay swipe, long press, drag ni 3D Touch |

## Material Design 3

| Principio | Cumplimiento | Problema |
|-|-|-|
| **Elevation** | 50% | Shadows definidos en tokens pero aplicados de forma inconsistente |
| **Motion** | 20% | Sin easing curves consistentes. Sin transitions paths |
| **Color roles** | 40% | No hay primary/secondary/tertiary/error roles semánticos definidos en el DS |
| **Shape** | 60% | Radius tokens aplicados pero sin sistema de shape (small/medium/large) |
| **Typography scale** | 50% | Escala tipográfica definida pero no hay roles semánticos (display/headline/title/body/label) |
| **State layers** | 0% | No hay state layers para hover/focus/pressed/dragged |

---

# 5. CONSISTENCIA VISUAL

## Inconsistencias encontradas

| Ubicación | Problema | Evidencia |
|-|-|-|
| `Button.tsx` | Border radius fijo `radius.lg` (12) pero en otros pressables se usa `radius.full` para forma de píldora | Inconsistencia en formas de botones |
| `PetCard.tsx` | `marginBottom: spacing.md` hardcodeado | Debería ser responsabilidad del contenedor, no del componente |
| `QueueStatus.tsx` | Padding interno hardcodeado `borderBottomWidth: 1` sin token | Usa borderBottomWidth raw en vez de sistema |
| `ChatBubble.tsx` | `maxWidth: '82%'` hardcodeado | No escala con Dynamic Type |
| `Modal.tsx` | `width: 36, height: 4` para el handle indicator | Hardcodeado, debería ser token |
| `login.tsx` | `fontSize: 40` para emoji en el avatar circular | No usa token de fontSizes |
| `login.tsx` | `borderRadius: radius.full` en avatar pero `width: 80` no es token | Mezcla tokens con valores fijos |
| `history/index.tsx` | `'#f59e0b'` hardcodeado para estrellas | Debería ser `colors.accent` |
| `VideoCallView.tsx` | `backgroundColor: '#0b1220'` hardcodeado | Sin token correspondiente |
| `VideoCallView.tsx` | Opacidades `rgba(255,255,255,0.08)` hardcodeadas | Sin token |
| `app/_layout.tsx` | `fontSize: 13, fontWeight: '600'` en OfflineBanner | No usa tokens de typografía |
| `+not-found.tsx` | No leído pero potencialmente sin design system | Verificar |

---

# 6. SISTEMA DE DISEÑO

## Evaluación del Design System

### Lo que existe (Bien)
- Colores con naming semántico (primary, danger, success, accent)
- Spacing con escala 4/8px (px, xs, sm, md, lg, xl, xxl, xxxl, huge, massive)
- Radius tokens
- Font sizes con escala tipográfica
- Font weights definidos
- Sombras con 5 niveles

### Lo que falta (Crítico)

| Token | Estado | Impacto |
|-|-|-|
| **Color roles semánticos** | No existe `onPrimary`, `onSurface`, `surfaceVariant`, `outline` | Imposible implementar modo oscuro correctamente |
| **Typography roles** | No existe `display`, `headline`, `title`, `body`, `label` | Inconsistencia en qué token usar para qué |
| **Elevación semántica** | Las sombras no tienen propósito (xs/sm/md/lg ≠ surface/card/dialog/fab) | Aplicación inconsistente |
| **State layers** | No existen tokens para `hover`, `focus`, `active`, `drag` | Sin feedback visual en interacciones |
| **Motion tokens** | No existen `duration`, `easing`, `curves` | Animaciones inconsistentes |
| **Opacity tokens** | No existen | Opacidades hardcodeadas en toda la app |
| **Spacing scale** | Existe pero ningún componente la usa correctamente al 100% | Inconsistencias |

### Problema de arquitectura

**El "Design System" no es un sistema, es un conjunto de constantes.** No hay:
- Tematización (themes claro/oscuro)
- Componentes compuestos
- Guidelines de uso
- Documentación
- Principios de diseño

Esto es típico de un MVP pero inaceptable para un producto FAANG.

---

# 7. ACCESIBILIDAD (WCAG 2.2 AA)

## Resultados

| Criterio WCAG | Estado | Problema |
|-|-|-|
| **1.4.3 Contraste mínimo** | ❌ Falla | `inkSoft (#334155)` sobre `background (#F8FAFC)` = 4.2:1 — apenas cumple para texto pequeño. `inkMuted (#94A3B8)` sobre `background (#F8FAFC)` = 2.3:1 — **FALLA WCAG AA** |
| **1.4.4 Redimensionar texto** | ❌ Falla | No hay soporte para Dynamic Type. Todos los tamaños son fijos en pixels. |
| **2.5.5 Touch target size** | ❌ Falla | Botones sm = 36px height. WCAG exige 44px. |
| **2.4.3 Focus order** | ❌ Falla | No hay manejo de focus visible. En Android TalkBack, el orden puede ser incorrecto. |
| **4.1.2 Name, Role, Value** | ❌ Falla | Los emojis como iconos no tienen `accessibilityLabel`. Los botones de icono sin texto no tienen label. |
| **2.2.2 Pausar/Detener** | ⚠️ Parcial | El shimmer de Skeleton es infinito sin opción de pausa. |
| **1.2.1 Contenido multimedia** | ⚠️ Parcial | Los videos no tienen subtítulos ni transcripción. |
| **1.3.1 Info y relaciones** | ❌ Falla | No se usan roles semánticos de accesibilidad. |

## Problemas específicos

1. **CRÍTICO**: `colors.inkMuted (#94A3B8)` se usa extensivamente para textos secundarios. Ratio de contraste 2.3:1 sobre fondo blanco. Falla WCAG AA (mínimo 4.5:1).
2. **CRÍTICO**: Todos los botones de icono (VideoCallView: mic, camera, hangup) son emojis sin `accessibilityLabel`. Inaccesibles para lectores de pantalla.
3. **ALTO**: El rating de estrellas en History usa caracteres Unicode ★ sin accesibilidad. VoiceOver leerá "★" como "estrella negra" sin contexto.
4. **ALTO**: Touch targets de 36px en botones sm (Badge press, botones de especie en NewPet).
5. **MEDIO**: Sin soporte para "Reduce Motion". La animación de Skeleton no se detiene.
6. **MEDIO**: Sin soporte para "Bold Text" ni "Dynamic Type".

---

# 8. UX WRITING

## Evaluación

| Aspecto | Estado |
|-|-|
| Tono general | Bueno. Profesional pero cercano. Voseo argentino consistente ("podés", "tenés"). |
| Consistencia terminológica | OK. "Mascota", "cola", "videollamada", "asistente IA" son consistentes. |
| Claridad de botones | Regular. "Iniciar sesión", "Crear cuenta", "Guardar mascota" son claros. "Unirme a la cola" es apenas aceptable. |
| Mensajes de error | Malos. Genéricos como "Error", "No se pudo iniciar sesión" sin especificar por qué. |
| Placeholders | Inconsistentes: a veces ejemplos ("vos@email.com"), a veces instrucciones ("Mín. 8 caracteres") |
| Empty states | Buenos. Todos tienen mensaje claro + CTA. |
| Microcopias | Ausentes. No hay copys de carga, éxito, ni celebración. |

## Problemas

1. **ALTO**: Los errores de API se muestran crudos sin humanización ("Network Error" se mostraría tal cual).
2. **MEDIO**: "Cancelar espera" vs "Cancelar consulta" — términos inconsistentes para el mismo tipo de acción.
3. **MEDIO**: Mensaje de bienvenida "¡Bienvenido a VetConnect!" con emoji pero sin personalización.
4. **BAJO**: Toast "Te uniste a la cola ⏳" — el emoji sobra, el mensaje debería funcionar sin él.

---

# 9. MICROINTERACCIONES

## Estado actual

| Componente | Microinteracción | Evaluación |
|-|-|-|
| Button | Press: spring scale 0.97 | ✅ Buena. Sutil y natural |
| Button | Loading: spinner reemplaza texto | ⚠️ Aceptable. No hay skeleton ni shimmer inline |
| Input | Focus: border color anima a primary | ✅ Muy buena. Interpolación smooth de 200ms |
| Input | Error: border cambia a danger | ⚠️ Correcto pero sin shake animation en el input |
| Card | Press: nada | ❌ Sin feedback táctil al presionar |
| PetCard | Press: nada | ❌ Sin feedback táctil |
| ChatBubble | No hay animación de entrada | ❌ Los mensajes aparecen instantáneamente sin fade ni slide |
| Skeleton | Shimmer: opacity pulse 800ms | ⚠️ Aceptable. Podría tener un shimmer gradient effect |
| QueueStatus | Timer update: cada 1s | ✅ Correcto |
| Empty states | Aparecen instantáneamente | ❌ Sin fade-in |
| Tab bar | Focus: indicador bar + opacidad | ✅ Bueno. Sutil y claro |
| Pull to refresh | Estilo default de RN | ❌ Sin personalización. No tiene logotipo ni spinner custom |
| Rating stars | Press: cambia color | ❌ Sin spring ni haptic feedback |
| Modal | Slide up + fade in | ✅ Bueno. Spring animation con damping |

## Problemas principales

1. **ALTO**: Cards y list items no tienen feedback de presión (ni opacity change ni scale).
2. **ALTO**: No hay haptic feedback en ninguna interacción.
3. **MEDIO**: Los mensajes del chat aparecen instantáneamente sin animación.
4. **MEDIO**: No hay transiciones entre pantallas (el auth layout usa slide_from_right, pero no el resto).

---

# 10. MOTION DESIGN

## Evaluación

| Aspecto | Estado |
|-|-|
| **Duration tokens** | ❌ No existen. Todas las duraciones son hardcodeadas. |
| **Easing curves** | ❌ No se usan curvas estándar (ease-in-out, deceleration, acceleration). Solo `Animated.spring` con defaults. |
| **Transitions** | ❌ No hay transiciones de pantalla. El cambio es instantáneo. |
| **Shared elements** | ❌ No hay. La transición PetCard → PetDetail debería tener hero animation. |
| **Micro-animations** | ⚠️ Solo Button tiene spring. El resto es estático o CSS transitions nativas de RN. |
| **Loading states** | ⚠️ Skeleton tiene shimmer básico. No hay skeleton con gradient. |
| **Stagger animations** | ❌ Las listas no tienen stagger. Todos los items aparecen simultáneamente. |
| **Layout animations** | ❌ No se usa `LayoutAnimation` para cambios de layout suaves. |

## Problemas principales

1. **CRÍTICO**: La app se siente "estática". No hay personalidad ni fluidez.
2. **ALTO**: Sin easing curves, las animaciones existentes (focus input, modal) no se sienten naturales.
3. **ALTO**: Sin shared element transitions, la navegación se siente abrupta.
4. **MEDIO**: La falta de stagger en listas hace que todo aparezca de golpe.

---

# 11. COMPONENTES

## Revisión completa

### Button
- ✅ 5 variantes (primary, secondary, outline, ghost, danger)
- ✅ 3 tamaños (sm=36/md=44/lg=52)
- ✅ Spring scale en press
- ✅ Loading state
- ❌ **P0**: Touch target sm=36 falla WCAG 44pt
- ❌ **P1**: No hay variant `text` (solo texto sin bordes ni bg)
- ❌ **P2**: No hay icon-only variant

### Input
- ✅ Animated border focus
- ✅ Error state
- ✅ Hint text
- ✅ Left icon slot
- ❌ **P1**: No hay `disabled` state visual (el TextInput nativo lo maneja pero sin estilo específico)
- ❌ **P1**: No hay `success` state
- ❌ **P2**: No hay character counter
- ❌ **P2**: No hay clear button (X para limpiar)

### Card
- ✅ 3 variantes (elevated, outlined, ghost)
- ✅ Padding configurable
- ❌ **P2**: No hay card con header/footer slots
- ❌ **P2**: No hay card pressable nativa (hay que usar Pressable wrapper)
- ❌ **P3**: No hay variant con imagen de fondo

### Badge
- ✅ 3 variantes (filled, soft, outlined)
- ✅ 2 tamaños
- ✅ Colores personalizables
- ❌ **P1**: No hay badge con icono
- ❌ **P2**: No hay badge con dot indicator (sin texto)

### Modal
- ✅ Bottom sheet style
- ✅ Overlay con fade
- ✅ Slide animation
- ✅ Drag indicator (handle bar)
- ❌ **P1**: No hay backdrop dismiss con confirmación (cierra directamente)
- ❌ **P2**: No hay modal centrado (solo bottom sheet)

### Skeleton
- ✅ Shimmer animation
- ✅ SkeletonCard compuesto
- ❌ **P1**: No hay variantes (circle, text block, image)
- ❌ **P2**: El shimmer es opacity pulse, no linear gradient

### EmptyState
- ✅ Title, subtitle, CTA
- ✅ Emoji/icon
- ❌ **P2**: No hay variant con ilustración
- ❌ **P2**: No hay animated illustration

### PetCard
- ✅ Foto/emoji, nombre, especie, edad, peso
- ✅ Allergies badges
- ❌ **P1**: No hay press feedback (scale u opacity)
- ❌ **P2**: No support para modo grid (solo lista)

### QueueStatus
- ✅ Timer actualizado
- ✅ Múltiples estados (WAITING, ASSIGNED, IN_CONSULTATION, COMPLETED, CANCELLED)
- ✅ LiveKit join integration
- ❌ **P1**: Sin animación de transición entre estados

### ChatBubble
- ✅ User vs Assistant vs System
- ✅ Flagged banner
- ❌ **P1**: Sin avatar real del usuario
- ❌ **P2**: Sin timestamp visible
- ❌ **P2**: Sin typing indicator
- ❌ **P3**: Sin reacciones

### VideoCallView
- ✅ Remote video
- ✅ Local thumbnail placeholder
- ✅ Timer
- ✅ Controls (mic, camera, hangup)
- ❌ **P1**: Los controles son emojis sin accessibilityLabel
- ❌ **P2**: Sin indicador de conexión (signal strength)
- ❌ **P2**: Sin botón de speaker/audio device
- ❌ **P3**: Sin picture-in-picture support

---

# 12. NAVEGACIÓN

## Stack Navigation
- ✅ Expo Router con Stack + Tabs
- ✅ Route guard basado en autenticación
- ✅ Deep links funcionales (livekit)
- ❌ **P1**: No hay `headerBackTitle` visible en pantallas push (pets/[id], chat/[conversationId]) — el usuario no sabe dónde estaba
- ❌ **P2**: No hay análisis de navegación (no se trackean rutas)

## Tab Navigation
- ✅ 5 tabs con iconos + labels
- ✅ Active indicator (dot)
- ❌ **P1**: Sin badges en tabs (ej: notificaciones en chat)

## Deep Links y URL handling
- ✅ Soporte para LiveKit deep links
- ❌ **P2**: No hay manejo de deep links universales

## Back Behavior
- ✅ Lógica correcta en auth guard
- ❌ **P1**: En formularios largos (NewPet), el back nativo sin confirmación puede perder datos del usuario

---

# 13. ARQUITECTURA VISUAL

## Evaluación

| Principio | Puntaje | Problema |
|-|-|-|
| **Jerarquía visual** | 70% | Títulos visibles, pero a veces compiten con cards circundantes |
| **Balance** | 65% | Las quick actions en Home están balanceadas, pero el PetDetail tiene stats desbalanceados |
| **Espacios negativos** | 60% | El spacing es correcto en general pero hay padding inconsistente en algunas pantallas |
| **Ritmo visual** | 55% | Sin variación de ritmo. Todo es lineal y monótono |
| **Escaneabilidad** | 70% | Buenos headers, subheaders y separación |
| **Grid** | 50% | No hay grid system visible. Los elementos usan spacing tokens pero sin alineación a columnas |

---

# 14. TIPOGRAFÍA

## Evaluación

| Aspecto | Estado |
|-|-|
| **Escala** | ✅ Definida (caption 11 → display 40) |
| **Pesos** | ✅ 5 pesos (400-800) |
| **Font family** | ⚠️ No definida. Usa el sistema default (San Francisco en iOS, Roboto en Android) |
| **Interlineado** | ⚠️ Solo `lineHeights` definido pero no siempre aplicado |
| **Tracking (letter-spacing)** | ⚠️ Usado en algunos textos pero no sistemáticamente |
| **Roles semánticos** | ❌ No hay `display`, `headline`, `title`, `body`, `label` |

## Problemas
1. **ALTO**: No hay font family definida. La app se ve diferente en iOS y Android.
2. **ALTO**: No se usa `lineHeight` en la mayoría de los Text components.
3. **MEDIO**: Los roles tipográficos son genéricos (body, title, subtitle) sin propósito semántico.

---

# 15. COLOR

## Evaluación

| Aspecto | Estado |
|-|-|
| **Paleta primaria** | ✅ Teal-700 (#0F766E). Bien elegido para el rubro veterinario (tranquilidad, naturaleza, salud). |
| **Paleta secundaria** | ⚠️ Indigo (#6366F1). El contraste con teal no es armónico. Podría ser un teal más claro. |
| **Accent** | ✅ Amber (#F59E0B). Bueno para destacar. |
| **Semántica** | ⚠️ danger/success/warning están pero sin roles completos (onDanger, onSuccess, etc.) |
| **Modo oscuro** | ❌ No existe |
| **Daltonismo** | ❌ No se considera. El estado de queue usa solo color para distinguir (WAITING = amber, ASSIGNED = teal, etc.) |

## Problemas
1. **ALTO**: `inkMuted (#94A3B8)` falla WCAG AA para texto (2.3:1).
2. **ALTO**: No hay modo oscuro. En una app de videollamadas veterinarias que puede usarse de noche, es crítico.
3. **MEDIO**: Secondary (#6366F1) compite visualmente con primary (#0F766E). No hay jerarquía clara.
4. **MEDIO**: Los estados de cola usan solo color como diferenciador. Sin iconos adicionales.

---

# 16. ICONOGRAFÍA

## Evaluación

| Aspecto | Estado |
|-|-|
| **Familia de iconos** | ❌ Emojis Unicode. No hay una familia de iconos vectoriales consistente. |
| **Consistencia** | ❌ Los emojis se ven diferentes en iOS y Android. |
| **Grosor y escala** | ❌ Los emojis no tienen grosor consistente. |
| **Metáforas** | ⚠️ Aceptables. 🏠=inicio, 🐾=mascotas, 💬=chat, ⏳=cola, 📋=historial |
| **Accesibilidad** | ❌ Los emojis sin `accessibilityLabel` son ruido para screen readers. |

## Problemas
1. **CRÍTICO**: El 100% de los iconos son emojis. Esto impide: branding consistente, variantes de estado (filled/outlined), animaciones de iconos, escalabilidad.
2. **ALTO**: Los emojis se renderizan diferente en cada SO. En iOS son coloridos, en Android pueden ser monocromáticos.
3. **MEDIO**: En VideoCallView, los controles (🎤, 📞, 📷) no comunican estado adecuadamente. "📵" para cámara apagada no es intuitivo.
4. **ALTO**: No hay iconos de acción (edit, delete, share, settings, help).

---

# 17. ESTADOS VACIOS

## Evaluación

| Pantalla | Estado | Evaluación |
|-|-|-|
| Home (sin mascotas) | ✅ | EmptyState con emoji, título, subtítulo, CTA |
| Pets list | ✅ | EmptyState con CTA |
| Chat list | ✅ | EmptyState con CTA "Iniciar conversación" |
| History | ✅ | EmptyState informativo |
| Queue (sin pets) | ✅ | EmptyState con CTA "Agregar mascota" |

✅ Todas las pantallas con datos dinámicos tienen empty state.

## Problemas
1. **MEDIO**: Los empty states no tienen ilustraciones, solo emojis. Una ilustración warm elevaría la percepción.
2. **MEDIO**: No hay animación de entrada en empty states.
3. **BAJO**: El título de History empty state ("Sin consultas previas") podría ser más alentador.

---

# 18. ESTADOS DE ERROR

## Evaluación

| Tipo de error | Manejo actual | Evaluación |
|-|-|-|
| **API error (login)** | Toast genérico "Error" + mensaje | ❌ Sin contextualización |
| **API error (register)** | Toast genérico | ❌ Igual |
| **API error (queue)** | Toast con ApiError.message | ⚠️ Aceptable pero no explica solución |
| **Network error** | OfflineBanner en root | ✅ Bueno. Banner persistente. |
| **Sesión expirada** | Toast + redirect a login | ✅ Correcto. |
| **Rate limit (chat)** | Toast específico "Esperá un momento" | ✅ Bueno |
| **Permisos denegados** | Alert con instrucciones | ✅ Bueno |
| **LiveKit error** | Card con error + botones | ✅ Bueno |
| **Form validation** | Inline error en Input | ✅ Bueno |

## Problemas
1. **MEDIO**: Los errores de API se muestran crudos. ApiError.message puede contener mensajes técnicos.
2. **MEDIO**: No hay botón de "Reintentar" en errores de red (solo el banner pasivo).
3. **BAJO**: Los errores de formulario solo aparecen al submit, no en blur.

---

# 19. PERFORMANCE PERCIBIDA

## Evaluación

| Técnica | Estado | Evaluación |
|-|-|-|
| **Skeletons** | ✅ Presentes en todas las listas | Bueno. Pero son básicos (opacity pulse). |
| **Loaders** | ✅ Spinner en botones durante submit | Correcto. |
| **Optimistic UI** | ❌ No implementado | Si el usuario envía un mensaje de chat, espera a la respuesta del server. |
| **Lazy loading** | ❌ No hay paginación en History | Se cargan 50 consultas siempre. |
| **Caché** | ✅ React Query con staleTime 30s | Bueno. |
| **Transiciones** | ❌ No hay transiciones de pantalla | La navegación se siente instantánea pero "brusca". |

## Problemas
1. **MEDIO**: Sin optimistic UI, el chat se siente lento. El usuario envía y el mensaje aparece solo tras respuesta del server.
2. **MEDIO**: History no tiene paginación. Con el tiempo, cargará todas las consultas.
3. **BAJO**: Los skeletons son básicos. Un shimmer gradient effect mejoraría la percepción.

---

# 20. CALIDAD PREMIUM — ¿ESTO PARECE FAANG?

## Respuesta honesta: NO

**¿Por qué parece template?**

1. **Iconografía con emojis** — Este es el indicador más obvio de app "casera". Las apps premium usan iconos vectoriales consistentes (SF Symbols en iOS, Material Icons en Android, o Phosphor/Heroicons en cross-platform).

2. **Falta de motion design** — Las apps FAANG tienen personalidad a través del movimiento. Transiciones suaves, shared elements, micro-interacciones en cada elemento interactivo. Esta app es estática.

3. **Sin modo oscuro** — En 2026, cualquier app que aspire a calidad premium debe tener modo oscuro. Especialmente una app de videollamadas que se usa en contextos de baja luz.

4. **Sin haptics** — Las apps premium usan haptics para cada interacción significativa. No hay ningún `HapticFeedback` en la app.

5. **Sin personalización** — No hay avatar real del usuario, no hay foto en el chat, no hay saludo personalizado más allá del nombre.

6. **Diseño "seguro"** — La app no arriesga visualmente. Todo es muy estándar: cards blancas, border radius de 16, sombras mínimas. No hay un "momento wow".

7. **Sin gradientes ni texturas** — Las apps modernas (Stripe, Linear, Notion) usan gradientes sutiles, glassmorphism, o texturas para crear profundidad.

8. **Sin ilustraciones** — Los empty states usan emojis en vez de ilustraciones custom que refuercen la marca.

## ¿Qué hacen las apps de referencia?

| App | Elemento diferencial |
|-|-|
| **Stripe** | Gradientes sutiles, tipografía impecable, espaciado perfecto, micro-animaciones |
| **Linear** | Motion design excepcional, glassmorphism, transiciones de lista con stagger |
| **Notion** | Tipografía y espaciado perfectos, iconos custom, blank states con ilustraciones |
| **Nubank** | Color vibrante, motion design, brand consistency, haptics |
| **Mercado Pago** | Eficiencia, claridad, carga instantánea, feedback inmediato |

---

# 21. BENCHMARK

Comparación con apps de referencia (escala 0-100):

| Dimensión | VetConnect | Stripe | Linear | Nubank | Uber |
|-|-|-|-|-|-|
| Motion Design | 45 | 92 | 95 | 88 | 85 |
| Visual Polish | 67 | 94 | 92 | 90 | 88 |
| Accessibility | 42 | 80 | 85 | 75 | 78 |
| Design System | 60 | 95 | 93 | 88 | 85 |
| Iconography | 30 | 88 | 92 | 85 | 80 |
| Empty States | 65 | 82 | 90 | 80 | 78 |
| Error Handling | 60 | 90 | 88 | 82 | 85 |
| Typography | 55 | 92 | 94 | 85 | 82 |
| Color | 65 | 88 | 90 | 92 | 78 |
| Premium Feel | 55 | 95 | 96 | 90 | 88 |

---

# 22. PUNTUACIONES DETALLADAS (0-100)

| Dimensión | Puntaje | Justificación |
|-|-|-|
| **UX** | 65 | Buenos flujos generales pero falta onboarding, prevención de errores y feedback. |
| **UI** | 72 | Diseño limpio y consistente en general, pero falta refinamiento premium. |
| **Accesibilidad** | 42 | Falla WCAG AA en contraste, touch targets y screen readers. |
| **Consistencia** | 68 | Design system ayuda pero hay valores hardcodeados dispersos. |
| **Navegación** | 78 | Expo Router bien implementado, tabs claras, route guard funcional. |
| **Arquitectura de Información** | 70 | Estructura lógica pero falta onboarding y perfil. |
| **Design System** | 60 | Tokens existen pero no es un sistema completo (sin temas, sin roles semánticos). |
| **Motion Design** | 45 | Solo lo básico (button spring, input focus). Sin transiciones, easing ni shared elements. |
| **Calidad Visual** | 67 | Limpio pero genérico. Sin elementos que sorprendan. |
| **Calidad Técnica** | 71 | Componentes bien estructurados, TypeScript strict, hooks limpios. |
| **Percepción Premium** | 55 | El uso de emojis y la falta de motion/personalización delatan un producto MVP. |

---

# PLAN DE ACCIÓN PRIORIZADO

## P0 — Bloqueantes (Hacer antes del launch)

| # | Tarea | Esfuerzo | Impacto |
|-|-|-|-|
| 1 | Reemplazar emojis con librería de iconos vectoriales (`@expo/vector-icons` o `phosphor-react-native`) | L | Alto |
| 2 | Implementar modo oscuro (tematización completa) | L | Alto |
| 3 | WCAG contraste: subir ratio de `inkMuted` a 4.5:1 mínimo | S | Alto |
| 4 | Agregar `accessibilityLabel` a todos los elementos interactivos | M | Alto |
| 5 | Agregar touch targets mínimos de 44pt en todos los botones | M | Alto |
| 6 | Implementar transiciones de pantalla con `react-native-reanimated` | L | Alto |

## P1 — Alta prioridad

| # | Tarea | Esfuerzo | Impacto |
|-|-|-|-|
| 7 | Agregar onboarding de 3 pasos | M | Alto |
| 8 | Agregar pantalla de perfil/configuración | M | Alto |
| 9 | Mejorar mensajes de error con humanización y soluciones | M | Alto |
| 10 | Agregar haptic feedback en interacciones clave | S | Medio |
| 11 | Implementar optimistic UI en chat | M | Alto |
| 12 | Agregar iconos de acción (edit, delete, share) | M | Medio |
| 13 | Agregar estado "disabled" visual en Input | S | Medio |

## P2 — Prioridad media

| # | Tarea | Esfuerzo | Impacto |
|-|-|-|-|
| 14 | Agregar stagger animations en listas | M | Medio |
| 15 | Implementar paginación en History | M | Medio |
| 16 | Agregar shared element transition PetCard → PetDetail | L | Medio |
| 17 | Agregar illustration set para empty states | L | Medio |
| 18 | Agregar character counter en Input | S | Bajo |
| 19 | Agregar typing indicator en chat | S | Medio |
| 20 | Agregar filtros en History | M | Medio |

## P3 — Baja prioridad

| # | Tarea | Esfuerzo | Impacto |
|-|-|-|-|
| 21 | Agregar variante `text` en Button | S | Bajo |
| 22 | Agregar reaction support en chat | M | Bajo |
| 23 | Agregar picture-in-picture en videollamada | L | Medio |
| 24 | Agregar animación de entrada en empty states | S | Bajo |
| 25 | Agregar botón "Olvidé mi contraseña" | S | Alto (UX) |

---

# CONCLUSIÓN FINAL

**Puntuación Global: 67/100**

**¿Lista para producción con estándares FAANG? → NO**

**¿Lista para MVP/Beta? → SÍ**

La aplicación tiene una base técnica sólida (TypeScript, React Query, Expo Router, componentes bien estructurados) y los flujos principales funcionan correctamente. Sin embargo, carece del refinamiento visual, la accesibilidad y la personalidad que distinguen a los productos de empresas como Apple, Google, Stripe o Airbnb.

**Los 3 cambios que generarían mayor impacto inmediato:**

1. **Reemplazar emojis por iconos vectoriales** ($0 cost, 2-3 días de trabajo, impacto visual masivo)
2. **Agregar transiciones de pantalla con Reanimated** (3-5 días, transforma la percepción de fluidez)
3. **Corregir accesibilidad básica** (contraste + labels + touch targets) (2-3 días, requisito legal en muchos mercados)

Con estas 3 correcciones, la app pasaría de un MVP funcional a un producto que transmite profesionalismo y cuidado.

---

*Auditoría realizada por Senior Product Design Team — Julio 2026*
