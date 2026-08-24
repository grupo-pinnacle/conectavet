const H = {
  fecha: '12 de agosto de 2026',
  commit: '1c73b87',
  commitMsg: 'videollamadas LiveKit + ronda UX/QA (edad, mascotas, cola, vets, imágenes, contraseña)'
};

const FECHAS = {
  inicio: new Date('2026-06-15'),
  demo: new Date('2026-09-05'),
  buffer: new Date('2026-10-31')
};
const HOY = new Date('2026-08-12');
const diasTotales = Math.round((FECHAS.demo - FECHAS.inicio) / 86400000);
const diasVividos = Math.round((HOY - FECHAS.inicio) / 86400000);
const diasRestantes = Math.round((FECHAS.demo - HOY) / 86400000);
const pctCamino = Math.max(0, Math.min(100, Math.round((diasVividos / diasTotales) * 1000) / 10));

const STORAGE = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

let xp = STORAGE.get('vcxp', 0);

const DATA = {
  stats: [
    { icon: '🧪', value: '155/155', label: 'tests del backend en verde' },
    { icon: '🗓️', value: diasVividos + ' días', label: 'de viaje desde el 15 de junio' },
    { icon: '⏳', value: diasRestantes + ' días', label: 'para la presentación del 5-sep' },
    { icon: '🛡️', value: '13/20', label: 'sprints cubiertos' }
  ],

  capitulos: [
    {
      fecha: '15 Jun', emoji: '🌱', tipo: 'hito', tag: 'capítulo 1',
      titulo: 'El día cero',
      texto: `Doce personas caben en una sala de <b>cinco</b>. El repo no tiene ni un <code>package.json</code>. Hay un tablero vacío, un charter y un dream irrompible: que un dueño encuentre veterinario a las 3 de la mañana. <br><br>Arranca el <b>S1</b>: monorepo, Express + Prisma, Expo, Vite. Se eligen decisiones que van a doler después — y se documentan (ADR-001 al 008), cosa que después rezaríamos por tener.`
    },
    {
      fecha: '22 Jun', emoji: '🧱', tipo: 'hito', tag: 'capítulo 2',
      titulo: 'Los cimientos',
      texto: `Modelos, JWT, roles, mascotas. El backend crece rápido y con test desde el día uno: <b>9 tests de auth</b>, después <b>21 de pets</b>. Cada pantalla nueva se conecta a algo real.<br><br>La app pesa nada, pero pesa bien. Ese hábito de <b>testear lo que se entrega</b> va a salvar la presentación entera — aunque nadie lo sabe todavía.`
    },
    {
      fecha: '26 Jun', emoji: '📡', tipo: 'error', tag: 'capítulo 3',
      titulo: 'El desvío del LiveKit',
      texto: `El plan A era videollamada. Se instalan librerías, se prueba Expo Go, y el resultado es un bundle que <span class="bad">suma ~200MB</span> y una experiencia que muere en el primer intento. Doloroso.<br><br>La decisión del <b>ADR-009</b>: chat de texto con Socket.io. No fue rendirse: fue <b>elegir lo que se puede entregar</b>. El LiveKit se limpia del bundle (<span class="warn">d67dbdd</span>) y el proyecto respira de nuevo.`
    },
    {
      fecha: '2 — 18 Jul', emoji: '🏃', tipo: 'exito', tag: 'capítulo 4',
      titulo: 'La maratón del MVP',
      texto: `S6 a S10 a todo trapo: chat en tiempo real, historial, cerrar consulta con notas, freeze de código. Los testing del backend llegan a <b>108/108</b>.<br><br>La noche del <span class="ok">19 de julio</span> se cierra la rama. El <span class="ok">lunes 20</span> presentamos el MVP <b>a tiempo</b>, con tests en verde y una demo que camina sola. Hay algo que no se dijo en la presentación: cuántas noches costó.`
    },
    {
      fecha: '20 — 31 Jul', emoji: '🏖️', tipo: 'hito', tag: 'capítulo 5',
      titulo: 'La calma tensa',
      texto: `Doce días sin commits. Vacaciones reales, obligatorias, merecidas.<br><br>Pero en el fondo de todos duerme la misma pregunta: <i>¿seguirá funcionando cuando volvamos?</i> El código no se muere solo. Aunque — casi.`
    },
    {
      fecha: '3 — 5 Ago', emoji: '🦴', tipo: 'error', tag: 'capítulo 6',
      titulo: 'La reactivación y el esqueleto en el armario',
      texto: `S11: cola de espera, online/offline, recetas. La app vuelve a la vida.<br><br>Pero el <span class="bad">5 de agosto</span>, la CODE_AUDIT destapa lo que nadie quería ver: el backend del "sprint 9" <b>que se daba por hecho estaba incompleto</b>. Una race condition en la cola (B8), una fecha de nacimiento sin validar (B10), mensajes que se guardaban en consultas que ya no estaban activas (B14).<br><br>La lección más cara del proyecto: <b>darlo por hecho es el error más caro</b> — y la auditoría lo pagó con honor.`
    },
    {
      fecha: '11 Ago', emoji: '👑', tipo: 'exito', tag: 'capítulo 7',
      titulo: 'Los siete pedidos del CEO',
      texto: `Una sesión entera para el cliente: flujo <b>PENDING</b> (el vet acepta o rechaza), receta estructurada, chat web en vivo, <b>sistema de calificaciones</b> (1-5 post-consulta con promedio en el directorio), favoritos, perfiles editables, búsqueda con rating.<br><br>Todo en un día, con tests: <span class="ok">149/149</span>. Hay días así: donde el equipo recuerda por qué esto es un proyecto de verdad.`
    },
    {
      fecha: '12 Ago', emoji: '🪞', tipo: 'exito', tag: 'capítulo 8',
      titulo: 'La ronda del espejo',
      texto: `El CEO mira la app con otros ojos y encuentra lo que los tests no miran: la edad "5a 11m", el alta de mascota fea, la cola confusa, la contraseña que no se puede ver, las imágenes que se duplican solas.<br><br>Todo se cierra el mismo día — y <b>LiveKit vuelve</b>. Esta vez no como plan A fallido: con backend real emitiendo tokens, sala web code-split y WebView mobile que funciona en Expo Go. Backend: <span class="ok">155/155</span>, commit <span class="warn">1c73b87</span>.`
    },
    {
      fecha: 'Hoy — 12 Ago', emoji: '🔥', tipo: 'hoy', tag: 'capítulo 9',
      titulo: 'Donde estamos',
      texto: `S13 cerrado por Tobías. Quedan <b>${diasRestantes} días</b> para la presentación.<br><br>Lo que falta es de otro género: deuda manual del equipo (S13-S14), credenciales LiveKit de producción, un celular de 2GB prestado para la prueba de fuego, y después: prueba web del médico, E2E, deploy, documentación.<br><br>Lo difícil ya se hizo — ahora se trata de <b>no tropezar en la alfombra</b>.`
    },
    {
      fecha: '5 Sep → 31 Oct', emoji: '🚀', tipo: 'futuro', tag: 'capítulo 10',
      titulo: 'Lo que viene',
      texto: `S15: prueba completa de la web del médico. S16: el flujo E2E de punta a punta. S17: deploy real (Railway + Vercel + APK). S18: documentación. S19: la presentación final.<br><br>Y después, buffer hasta el 31 de octubre para ensayar, pulir y equivocarnos tranquilos.<br><br>El mejor capítulo todavía no se escribió.`
    }
  ],

  lecciones: [
    { tipo: 'exito', emoji: '🎯', titulo: 'El MVP se entregó en fecha', texto: '20 de julio, 108/108 tests en verde, demo que camina sola. En un proyecto de seis personas con vacaciones en el medio, decir "lunes 20" y cumplirlo es una rareza estadística.', commit: 'MVP b0a97d9 · 20-jul' },
    { tipo: 'exito', emoji: '👑', titulo: 'Siete pedidos del CEO en una sesión', texto: 'PENDING, receta estructurada, chat en vivo, calificaciones, favoritos, perfiles, búsqueda con rating: todo el 11-ago, con 149/149 de fondo. El ritmo de las últimas semanas se volvió industrial.', commit: '49fc880 · 11-ago' },
    { tipo: 'exito', emoji: '🪞', titulo: 'La ronda UX más dura del año', texto: 'Edad en años+meses, alta de mascota, cola rediseñada, pestaña Veterinarios, toggle de contraseña, dedup de imágenes — todo cerrado el 12-ago con 155/155.', commit: '1c73b87 · 12-ago' },
    { tipo: 'exito', emoji: '📡', titulo: 'LiveKit, segunda oportunidad bien usada', texto: 'El plan A fallido volvió como feature real: backend con tokens, sala web code-split (el bundle principal sigue en ~139 KB gzip) y WebView que funciona en Expo Go sin prebuild.', commit: '1c73b87 · 12-ago' },
    { tipo: 'exito', emoji: '📚', titulo: 'El hábito de documentar', texto: '14 documentos en /docs: decisiones de arquitectura, auditorías, plan de sprints, guías de deploy. Cuando algo se pregunta dos veces, ya está en un md.', commit: 'docs/ · continuo' },
    { tipo: 'error', emoji: '📦', titulo: 'Instalar no es implementar', texto: 'Las librerías de LiveKit del primer intento vivieron meses en el bundle sin uso, sumando ~200MB y un costo de mantenimiento invisible. La verdad se supo recién en S13, cuando se las borró (d67dbdd).', commit: 'd67dbdd · 10-ago' },
    { tipo: 'error', emoji: '🦴', titulo: 'El sprint 9 que no existía', texto: 'El S9 de backend se marcó como hecho. Tres semanas después, la auditoría del 5-ago encontró la race condition de la cola (B8), la fecha sin validar (B10) y los mensajes en consultas cerradas (B14). Nadie mintió: se dio por hecho.', commit: 'sesión 11-ago' },
    { tipo: 'error', emoji: '🖼️', titulo: 'Las imágenes que se duplicaban solas', texto: 'El optimista no contemplaba el adjunto: dos fotos con texto vacío se pisaban entre sí. Los tests no lo vieron. El cliente lo vio en un minuto de uso. El usuario siempre encuentra lo que nadie mira.', commit: '1c73b87 · 12-ago' },
    { tipo: 'error', emoji: '🔢', titulo: 'El badge hardcodeado en "3"', texto: 'El contador de mensajes del dashboard web decía 3 para siempre (W13). Los datos falsos son el ruido blanco de las demos: nadie te señala el código, te señalan el 3.', commit: 'W13 · pendiente' },
    { tipo: 'error', emoji: '🔑', titulo: 'Un secret que se fue de casa', texto: 'Los .env fueron trackeados al principio y luego sacados del repo, pero el histórico de git los conserva. JWT_SECRET con placeholder = cualquier persona puede forjar un JWT de ADMIN. La deuda se paga con rotación de credenciales y filter-repo.', commit: 'frente 5 · pendiente' },
    { tipo: 'error', emoji: '💾', titulo: 'El token en localStorage', texto: 'El JWT vive donde un XSS puede leerlo (W4, W5). El patch definitivo es validar contra /auth/me y mover la sesión a cookies httpOnly. Guardar un token donde el usuario no lo puede ver no significa que esté seguro.', commit: 'W4/W5 · pendiente' },
    { tipo: 'leccion', emoji: '🧠', titulo: 'Cortar a tiempo es una decisión, no una derrota', texto: 'ADR-009: el chat de texto reemplazó a la videollamada en el MVP y el proyecto entero respiró. Seis semanas después, LiveKit volvió — con la espalda del chat para apoyarse.' },
    { tipo: 'leccion', emoji: '🧠', titulo: 'El singleton de Prisma es sagrado', texto: 'ADR-006: un solo PrismaClient evita el incendio de conexiones en dev con hot reload. Las decisiones de una línea se pagan como una arquitectura.' },
    { tipo: 'leccion', emoji: '🧠', titulo: 'La cola se vuelve atómica', texto: 'Dos veterinarios online, un PENDING, un handler que no es transaccional: el vet que reasigna gana. La solución llegó con reintentos y condiciones atómicas — no con estilo.' },
    { tipo: 'leccion', emoji: '🧠', titulo: 'Nunca grites "queda poco" sin una auditoría', texto: 'El momento en que el proyecto parece más cerca del final es exactamente cuando conviene mirar el código con ojos nuevos. La CODE_AUDIT del 5-ago es el mejor ejemplo del proyecto.' },
    { tipo: 'leccion', emoji: '🧠', titulo: 'La deuda de hardware no se paga con código', texto: 'El testing en 2GB de RAM espera un celular prestado desde S9. Podés optimizar FlatLists y borrar librerías, pero la prueba de fuego necesita un teléfono en la mano.' }
  ],

  sprints: [
    { id: 'S1', fechas: '15-17 Jun', titulo: 'Setup', texto: 'Repositorio, monorepo, Expo, Vite, tablero y charter. Cero features, cien decisiones.', tag: 'done' },
    { id: 'S2', fechas: '18-20 Jun', titulo: 'Modelos + navegación + wireframes', texto: 'Prisma schema, rutas base, navegación mobile y Figma como referencia compartida.', tag: 'done' },
    { id: 'S3', fechas: '22-24 Jun', titulo: 'Auth backend', texto: 'Login, registro, JWT, middlewares y roles — con 9 tests desde el primer día.', tag: 'done' },
    { id: 'S4', fechas: '25-27 Jun', titulo: 'Conectar frontends a auth', texto: 'Pets CRUD, AuthContext web, login/register en mobile funcionales.', tag: 'done' },
    { id: 'S5', fechas: '29 Jun - 1 Jul', titulo: 'Roles + mascotas', texto: 'Singleton Prisma, helmet, rate-limit, Zod, soft delete, health check y la primera FAANG audit.', tag: 'done' },
    { id: 'S6', fechas: '2-4 Jul', titulo: 'Mobile + chat inicio', texto: 'Modelo Message, Socket.io, endpoints de consultas; pantallas de mascota en mobile.', tag: 'done' },
    { id: 'S7', fechas: '6-8 Jul', titulo: 'Chat + historial', texto: 'Chat de texto con veterinario (reemplaza IA + LiveKit), cierre de consulta con modal de notas.', tag: 'done' },
    { id: 'S8', fechas: '9-11 Jul', titulo: 'Pulir flujo completo', texto: 'MVP compliance: se eliminan IA, LiveKit y cola del MVP. 108/108 de acá a la entrega.', tag: 'done' },
    { id: 'S9', fechas: '13-15 Jul', titulo: 'Bugs + preparar presentación', texto: 'Bugs prioritarios. El backend quedó pendiente — la auditoría del 5-ago lo encontró y la sesión del 11-ago lo cerró (B8, B10, B14).', tag: 'done' },
    { id: 'S10', fechas: '16-18 Jul', titulo: 'Freeze', texto: 'Código congelado. Sin commits de nadie del 13-jul al 2-ago.', tag: 'done' },
    { id: '🎯', fechas: '20 Jul', titulo: 'MVP entregado', texto: 'Lunes 20 de julio: presentación en vivo con 108/108 tests. Después, vacaciones obligatorias.', tag: 'mvp' },
    { id: 'S11', fechas: '3-5 Ago', titulo: 'Reactivación', texto: 'Online/offline del médico, cola de espera por especie, búsqueda de vets, recetas.', tag: 'done' },
    { id: 'S12', fechas: '6-8 Ago', titulo: 'Imágenes + notificaciones', texto: 'Imágenes en el chat (de ida y vuelta), push notifications con bandeja in-app, UX audits documentadas.', tag: 'done' },
    { id: 'S13', fechas: '10-12 Ago', titulo: 'Estabilización', texto: 'Tobías: deuda técnica, queries optimizadas, seguridad + videollamadas LiveKit y ronda UX completa (155/155). Juan y Damián: pendientes de CODE_AUDIT.', tag: 'current' },
    { id: 'S14', fechas: '13-15 Ago', titulo: 'Testing 2GB RAM', texto: 'Auditoría de rendimiento desde código (hecha). Validación en Android físico de 2GB: espera un celular prestado.', tag: 'doing' },
    { id: 'S15', fechas: '17-19 Ago', titulo: 'Prueba web del médico', texto: 'Cross-browser, flujo completo del médico, multi-tab, responsive, errores de red.', tag: 'next' },
    { id: 'S16', fechas: '20-22 Ago', titulo: 'Flujo completo E2E', texto: 'Registro → vets → cola → consulta → chat → receta → rating → historial', tag: 'next' },
    { id: 'S17', fechas: '24-26 Ago', titulo: 'Deploy producción', texto: 'Backend en Railway, web en Vercel, APK firmado en EAS Build, smoke testing.', tag: 'next' },
    { id: 'S18', fechas: '27-29 Ago', titulo: 'Documentación', texto: 'README técnico, API docs, guía mobile, manual de usuario.', tag: 'next' },
    { id: 'S19', fechas: '31 Ago - 2 Sep', titulo: 'Presentación final', texto: 'Demo en vivo. Todo el equipo, una sola pantalla.', tag: 'next' },
    { id: 'S20', fechas: '3-5 Sep', titulo: 'Buffer final', texto: 'Código congelado. Solo bugs. Y después: ensayos hasta el 31-oct.', tag: 'next' }
  ],

  equipo: [
    { avatar: '⚙️', nombre: 'Tobías', rol: 'Backend + arquitecto', aportes: ['Backend completo: auth, pets, consultas, cola, chat, media, push', 'Suite Jest de 155 tests', 'Sesiones 11 y 12-ago: pedidos del CEO + videollamadas', 'Auditorías FAANG y CODE_AUDIT'], cita: '"El testing no es un freno: es la única forma de dormir antes de una demo."' },
    { avatar: '📱', nombre: 'Juan', rol: 'Mobile', aportes: ['Pantallas de mascotas y chat mobile', 'Selección de especie + búsqueda de vets (S11)', 'KeyboardAvoiding, datepicker nativo, toggle contraseña', 'Bugs de navegación y rendimiento'], cita: '"En 2GB no se puede fingir: o bien optimizás, o te optimiza el smartphone."' },
    { avatar: '🖥️', nombre: 'Damián', rol: 'Web', aportes: ['Dashboard médico completo', 'Login/register y dashboards arreglados en S9', 'Toggle online/offline con indicador', 'Responsive y edge cases de navegación'], cita: '"El médico mira la web con la mano en el celular. Todo tiene que ser inmediato."' },
    { avatar: '🧪', nombre: 'Ezequiel', rol: 'QA + UX', aportes: ['Cierre de sesión con logo en mobile', 'UX_UI_AUDIT + UX_UI_AUDIT_V2 (inconsistencias)', 'Reporte para profesores', 'Re-testing de bugs corregidos'], cita: '"Si lo puedo romper, lo voy a romper — y te lo documento."' },
    { avatar: '🗂️', nombre: 'Lara', rol: 'PM', aportes: ['Project Charter, roles y arquitectura', 'Seguimiento de sprints y reviews', 'Coordinó la demo del MVP del 20-jul', 'Verificación de links y demo final'], cita: '"El plan no sobrevive al primer contacto con el equipo — por eso lo escribimos en el tablero."' },
    { avatar: '🧩', nombre: 'Thiago', rol: 'Scaffolder', aportes: ['Scaffold completo de /mobile (29-jun): navegación, chat, historial, llamadas', 'La base sobre la que vive la app mobile'], cita: '"El que construye los cimientos no sale en las fotos — pero nadie duerme sobre cimientos ajenos."' }
  ],

  plataformas: [
    { icon: '⚙️', nombre: 'Backend', status: '155/155 tests', features: ['Auth JWT + roles + refresh token', 'Cola real-time + flujo PENDING', 'Chat Socket.io + imágenes', 'Calificaciones 1-5 con promedio', 'Tokens LiveKit + rooms de llamada', 'Push + bandeja in-app'] },
    { icon: '🖥️', nombre: 'Web (médico)', status: 'Build OK · code-split', features: ['Dashboard con tabs Ofertas/Cola/Activas', 'Vets online/offline con indicador', 'Chat en vivo + ficha del paciente', 'Sala de videollamada LiveKit', 'Directorio con rating y favoritos', 'Receta estructurada'] },
    { icon: '📱', nombre: 'Mobile (cliente)', status: 'tsc + lint en 0', features: ['Mascotas con foto y alta rediseñada', 'Pestaña Veterinarios + rating', 'Cola: rápido / elegir / cambiar vet', 'Chat con imágenes sin duplicados', 'Videollamada por WebView', 'Historial con calificación'] }
  ],

  frentes: [
    { icon: '🧪', nombre: 'QA automatizado', pct: 100, tone: '', nota: 'Suite Jest 155/155. Auth, pets, consultas, cola, media, push, calificaciones y llamadas.' },
    { icon: '🪞', nombre: 'Ronda UX 12-Ago', pct: 100, tone: '', nota: 'Edad en años+meses, alta de mascota, cola, pestaña vets, contraseña, imágenes.' },
    { icon: '📡', nombre: 'Videollamadas LiveKit', pct: 80, tone: 'blue', nota: 'Backend + sala web + WebView listos. Faltan credenciales de producción y prueba de 2 dispositivos.' },
    { icon: '🧹', nombre: 'Deuda técnica', pct: 60, tone: 'yellow', nota: 'Backend y seguridad backend 100%. Quedan manuales: disconnectSocket, petId (Juan), WS_URL + eas.json (Damián).' },
    { icon: '🗺️', nombre: 'Roadmap post-MVP', pct: 25, tone: 'blue', nota: 'Recetas, disponibilidad, imágenes, push, rating, llamadas listos. Falta S14-S20: QA real, deploy, docs, presentación.' },
    { icon: '📚', nombre: 'Documentación', pct: 75, tone: '', nota: '14 docs: ADRs, auditorías, sprint plan, deploys, guías. Falta manual de usuario y API docs final.' }
  ],

  auditorias: [
    { nombre: 'Testing', score: '9/10', nota: 'el orgullo del proyecto' },
    { nombre: 'Documentación', score: '8/10', nota: '14 docs y subiendo' },
    { nombre: 'Code Quality', score: '7/10', nota: 'mejorando sesión a sesión' },
    { nombre: 'Arquitectura', score: '7/10', nota: 'ADRs que se respetan' },
    { nombre: 'DevOps & Deploy', score: '6/10', nota: 'falta producción real (S17)' },
    { nombre: 'Seguridad', score: '4/10', nota: 'B1-B7 resueltos; JWT_SECRET y cookies pendientes' }
  ],

  pendientes: [
    { icon: '🧹', titulo: 'En curso (S13-S14)', items: [{ t: 'disconnectSocket() al logout', d: 'doing', w: 'Juan' }, { t: 'Leer petId en la cola', d: 'doing', w: 'Juan' }, { t: 'WS_URL real + eas.json', d: 'doing', w: 'Damián' }, { t: 'Auditoría rendimiento mobile', d: 'doing', w: 'Tobías' }, { t: 'Android físico de 2GB', d: 'next', w: 'Tobías' }] },
    { icon: '🚀', titulo: 'Hacia la meta (S15+)', items: [{ t: 'Credenciales LiveKit de producción', d: 'next', w: 'Tobías' }, { t: 'Prueba web completa del médico', d: 'next', w: 'Equipo' }, { t: 'Flujo E2E de punta a punta', d: 'next', w: 'Equipo' }, { t: 'Deploy: Railway + Vercel + APK', d: 'next', w: 'S17' }, { t: 'Presentación final 5-sep', d: 'next', w: 'S19' }] }
  ],

  catalogo: [
    { cap: 'Backend', done: 8, items: ['Auth + JWT + roles', 'Pets CRUD', 'Cola + flujo PENDING', 'Chat socket + imágenes', 'Push notifications', 'Calificaciones 1-5', 'Videollamada (tokens)', 'Suite de 155 tests'] },
    { cap: 'Web médica', done: 8, items: ['Login/registro + toggle', 'Dashboard con tabs', 'Online/offline', 'Chat vivo + ficha paciente', 'Receta estructurada', 'Directorio con rating', 'Videollamada (sala)', 'Perfiles editables'] },
    { cap: 'Mobile', done: 7, items: ['Mascotas con foto', 'Pestaña Veterinarios', 'Cola: rápido / eligir', 'Chat con imágenes (dedup)', 'Rating en historial', 'Videollamada (WebView)', 'Push + bandeja'] },
    { cap: 'QA real', done: 2, items: ['Tests automatizados 155', 'Build web + lint mobile', 'Cross-browser Chrome/FF/Edge', 'Flujo E2E completo', 'Android físico 2GB', 'Videollamada 2 dispositivos'] },
    { cap: 'Producción', done: 0, items: ['Credenciales LiveKit reales', 'Backend en Railway', 'Web en Vercel', 'APK firmado'] },
    { cap: 'Documentación', done: 1, items: ['14 docs del repo', 'Manual de usuario', 'Documentación API final'] }
  ],

  quizProyecto: [
    { q: '¿Qué reemplazó a las videollamadas en el MVP?', o: ['Chat de texto con Socket.io', 'Email al veterinario', 'Un call center falso', 'Notificaciones push'], a: 0, e: 'El ADR-009: chat de texto en el MVP; LiveKit volvió recién en la sesión del 12-ago.' },
    { q: '¿Cuántos tests tenía el backend al entregar el MVP?', o: ['63', '108', '149', '155'], a: 1, e: 'MVP el 20-jul con 108/108. Hoy, con calificaciones y llamadas, 155/155.' },
    { q: '¿Qué base de datos usa VetConnect?', o: ['MongoDB', 'MySQL local', 'Supabase (PostgreSQL) con Prisma', 'SQLite'], a: 2, e: 'ADR-003: Supabase como PostgreSQL gestionado.' },
    { q: '¿Qué hace el estado PENDING de una consulta?', o: ['Espera al cliente', 'El veterinario acepta o rechaza la consulta', 'Es una consulta cancelada', 'Pausa el chat'], a: 1, e: 'Pedido del CEO del 11-ago: el vet decide si atiende; si rechaza, vuelve a la cola.' },
    { q: '¿Cómo se califica a un veterinario?', o: ['Con like en Instagram', 'Estrellas 1-5 al cerrar la consulta (POST /rating)', 'Con un mail al admin', 'No se puede calificar'], a: 1, e: 'Sistema de calificaciones: 1-5 post-consulta, promedio y cantidad en el directorio.' },
    { q: '¿Cómo se llama el room de la videollamada?', o: ['vets-room', 'room-' + Math.random(), 'consultation-{id}', 'livekit-default'], a: 2, e: 'El room se deriva del id de la consulta: consultation-{id}. Sin estado extra que mantener.' },
    { q: '¿Por qué la videollamada mobile usa un WebView?', o: ['Porque Android lo exige', 'Para funcionar en Expo Go sin prebuild nativo', 'Porque el video nativo no existe', 'Para ahorrar batería'], a: 1, e: 'La sala web se reutiliza: mobile carga /call en un WebView y cero librerías nativas nuevas.' },
    { q: '¿Qué error de seguridad tiene guardar el JWT en localStorage?', o: ['Ninguno, es lo estándar', 'Un XSS puede leerlo y robar la sesión', 'Ocupa mucha memoria', 'Expira más rápido'], a: 1, e: 'W4/W5: la solución es validar contra /auth/me y cookies httpOnly.' },
    { q: '¿Qué pasó el 5 de agosto?', o: ['Se entregó el MVP', 'La CODE_AUDIT destapó el backend incompleto del S9', 'Se cayó la base de datos', 'Se mudó el repo'], a: 1, e: 'Race condition en la cola (B8), fecha sin validar (B10) y mensajes en consultas no activas (B14).' },
    { q: '¿Cuánto pesaba el bundle mobile con LiveKit sin uso?', o: ['+50MB', '+200MB aproximados', '+1GB', 'Nada, era solo código muerto'], a: 1, e: 'Por eso se eliminaron en d67dbdd: instalar no es implementar.' }
  ],

  quizEquipo: [
    { q: '¿Quién construyó el backend completo con sus 155 tests?', o: ['Juan', 'Tobías', 'Damián', 'Thiago'], a: 1, e: 'Tobías: auth, pets, consultas, cola, media, push, llamadas — y la suite Jest.' },
    { q: '¿Quién hizo el scaffold original de /mobile, hoy base de la app?', o: ['Thiago', 'Ezequiel', 'Lara', 'Juan'], a: 0, e: 'ThiagoBoca12, 29-jun: navegación, chat, historial y llamadas como cimientos.' },
    { q: '¿Quién arregló registro/login y los dashboards web en S9?', o: ['Damián', 'Tobías', 'Lara', 'Ezequiel'], a: 0, e: 'Damián, 4-ago (16fe58c): la web volvió a caminar sola.' },
    { q: '¿Quién documentó las inconsistencias de UX del S12?', o: ['Juan', 'Ezequiel', 'Damián', 'Tobías'], a: 1, e: 'Ezequiel: UX_UI_AUDIT.md y UX_UI_AUDIT_V2.md, la hoja de ruta del pulido.' },
    { q: '¿Quién coordinó la demo del MVP y las reviews de sprints?', o: ['Lara', 'Tobías', 'Thiago', 'Juan'], a: 0, e: 'Lara, PM: charter, seguimiento, reviews y la demo del 20-jul.' },
    { q: '¿Quién implementó la selección de especie + búsqueda de vets en S11?', o: ['Damián', 'Juan', 'Ezequiel', 'Lara'], a: 1, e: 'Juan, 3-ago (9219ff8): disponibilidad de vets, recetas, perfil vet y feedback de espera.' },
    { q: '¿Quién detectó el cierre de sesión con logo en mobile?', o: ['Ezequiel', 'Thiago', 'Tobías', 'Damián'], a: 0, e: 'Ezequiel lo implementó y su aporte se reconcilió en la lista del 10-ago.' },
    { q: '¿Cuál es el patrón real del equipo en S14?', o: ['Todos juntos', 'Tobías asume lo verificable desde código; el resto no viene', 'Solo QA', 'No hay sprint 14'], a: 1, e: 'Nota del SPRINT_PLAN: lo de hardware (celular 2GB) queda pendiente de uno prestado.' }
  ],

  memory: [
    'Monolito modular', 'Prisma sobre TypeORM', 'Supabase = PostgreSQL', 'JWT con refresh token', 'Soft delete', 'Singleton PrismaClient', 'Chat de texto en el MVP', 'Imágenes en disco (multer)',
    'ADR-001', 'ADR-002', 'ADR-003', 'ADR-004', 'ADR-005', 'ADR-006', 'ADR-009', 'ADR-010'
  ],

  ctf: [
    { id: 1, lvl: 'facil', area: 'Seguridad', titulo: 'El secret de cartón', escenario: 'Revisando el .env del backend te encontrás con esto. El sistema firma JWT con jsonwebtoken usando JWT_SECRET.', codigo: 'DATABASE_URL=postgres://...\nJWT_SECRET=dev-secret-placeholder\nLIVEKIT_API_KEY=\nLIVEKIT_API_SECRET=', q: '¿Cuál es la consecuencia REAL de dejar ese placeholder?', o: ['Solo afecta al entorno local', 'Un atacante puede forjar un JWT con rol ADMIN', 'La base de datos se expone', 'Ninguna: el secret se rota solo'], a: 1, e: 'Con el secret conocido se puede firmar un token con cualquier rol: JWT de ADMIN de la nada. Frente 5: generar secret real y rotarlo.', flag: 'VC{R0t4_l4_cl4v3}' },
    { id: 2, lvl: 'media', area: 'Seguridad', titulo: 'El token a la vista', escenario: 'El interceptor de la web guarda el JWT en localStorage y lo manda en el header Authorization. Un script de terceros logueado en la consola del navegador tiene acceso al mismo almacenamiento.', codigo: 'localStorage.setItem("token", res.data.accessToken)\napi.defaults.headers.Authorization = `Bearer ${token}`', q: '¿Cuál es la mitigación correcta?', o: ['Guardar el token en sessionStorage', 'Cookies httpOnly + refresh rotation', 'Ofuscar el token antes de guardarlo', 'Usar dos tokens idénticos'], a: 1, e: 'localStorage y sessionStorage son legibles por cualquier JS (XSS). Las cookies httpOnly las lee solo el servidor. W5.', flag: 'VC{c00k135_h7tp0nly}' },
    { id: 3, lvl: 'media', area: 'Seguridad', titulo: 'El token que no se verifica', escenario: 'El AuthContext de la web reconstruye el usuario desde el payload del JWT sin verificar la firma ni consultar al backend. Probás editar el payload en DevTools con un token corrupto y... entrás al dashboard.', codigo: 'const u = JSON.parse(atob(token.split(".")[1]))\nif (u.role === "VET") navigate("/dashboard")', q: '¿Qué diagnóstico es correcto?', o: ['Funciona igual porque expira pronto', 'El token corrupto no debería entrar: falta validar contra /auth/me', 'Es un problema visual menor', 'Solo falla con tokens vacíos'], a: 1, e: 'Firma sin verificar + rol del payload = autorización falsa. W4: validar el token con el backend (GET /auth/me).', flag: 'VC{v4l1d4_c0n_me}' },
    { id: 4, lvl: 'facil', area: 'Seguridad', titulo: 'El plan mío, el plan HTTP', escenario: 'Se arma la APK de producción y en un celular Android la app no conecta. Logs: bloq auth.', codigo: '// mobile/src/lib/env.ts\nWEB_URL = "http://192.168.0.15:5173" (fallback localhost)', q: '¿Por qué Android rechaza esta URL en el build final?', o: ['Porque el puerto 5173 está reservado', 'Android 9+ bloquea tráfico HTTP en claro salvo excepción', 'Porque el backend no soporta IPs', 'Es solo un warning visual'], a: 1, e: 'Cleartext HTTP bloqueado por defecto. GETUserMedia (cámara) además exige HTTPS. La producción debe ser https/wss.', flag: 'VC{https_o_d14g0n}' },
    { id: 5, lvl: 'media', area: 'Debugging', titulo: 'Dos médicos, una consulta', escenario: 'Dos vets online y un PENDING en la cola. Ambos handlers corren assignNextPendingVet al mismo tiempo, leen el mismo estado y cada uno asigna la consulta a un vet distinto.', codigo: 'const pending = await prisma.consultation.findFirst({ where: { status: "PENDING" } })\nawait prisma.consultation.update({ where: { id: pending.id }, data: { vetId } })', q: '¿Cuál es la corrección que elimina la race (B8)?', o: ['Loguear ambos accesos', 'Reintentar con condición atómica: updateMany donde status sigue PENDING y verificar affectedRows', 'Ordenar la cola por nombre', 'Bloquear todos los vets'], a: 1, e: 'Leer-modificar-escribir sin condición: reintento + updateMany({ where: { status: "PENDING" } }) y corroborar el conteo afectado.', flag: 'VC{at0m1c1d4d_3n_l4_c0l4}' },
    { id: 6, lvl: 'media', area: 'Debugging', titulo: 'Las dos fotos que se pisaban', escenario: 'El chat mobile deduplica los mensajes optimistas comparando solo el contenido. Dos imágenes consecutivas con texto vacío: la segunda se descarta como "duplicado". El cliente lo notó en un minuto.', codigo: 'if (msg.content === prev.content) return // "duplicado"\nmapeado, no importa el adjunto', q: '¿Qué campo hay que sumar al criterio de dedup (M11)?', o: ['El nombre del chat', 'El attachmentUrl (o el adjunto en sí)', 'El rol del usuario', 'La hora exacta con milisegundos'], a: 1, e: 'Dos imágenes con content vacío son indistinguibles para el dedup viejo. Comparar adjunto resolvió la duplicación el 12-ago.', flag: 'VC{3l_4djunt0_m3n71ra}' },
    { id: 7, lvl: 'dificil', area: 'Debugging', titulo: 'El chat congelado', escenario: 'El socket cae a mitad de conversación (cambio de red, backend reinicia). El hook mobile quedó con socketConnected=true para siempre: el polling de respaldo nunca se reactiva y el chat se congela.', codigo: 'const [socketConnected, setSocketConnected] = useState(true)\nonNewMessage(() => { /* escucha */ })\n// si el socket muere, nadie vuelve a setSocketConnected(false)', q: '¿Qué arreglo le devuelve la vida al chat (M10)?', o: ['Reiniciar la app', 'Escuchar el evento disconnect del socket y volver a false para activar el polling', 'Borrar el historial', 'Aumentar el timeout de fetch'], a: 1, e: 'Un chat adulto tiene dos planes de vida: socket y polling, con transición automática al desconectarse.', flag: 'VC{2_pl4n03s_d3_v1d4}' },
    { id: 8, lvl: 'media', area: 'Debugging', titulo: 'El polling que se multiplica', escenario: 'La web del médico monta su propio intervalo de polling en cada render. Con React re-montando componentes, los intervalos se acumulan y la red se llena de GETs huérfanos.', codigo: 'useEffect(() => {\n  setInterval(poll, 3000)\n}) // sin cleanup, sin abort', q: '¿Qué falta (W12)?', o: ['Nada, funciona igual', 'AbortController + cleanup del efecto + un solo intervalo', 'Más frecuencia de polling', 'Un setTimeout gigante'], a: 1, e: 'setInterval en un efecto sin cleanup ni AbortController: request duplicadas y memoria que crece.', flag: 'VC{ab0rt_th3_p0111ng}' },
    { id: 9, lvl: 'facil', area: 'API', titulo: 'Siete estrellas no existen', escenario: 'Un cliente manda su review con rating: 7. El schema de Zod valida el rango y el controller responde con un error controlado.', codigo: 'const reviewSchema = z.object({\n  rating: z.coerce.number().int().min(1).max(5)\n}) // 1-5', q: '¿Qué código HTTP responde el endpoint y por qué?', o: ['200 y guarda 7 igual', '400: rating fuera de rango (1-5)', '500: error interno', '404: el endpoint no existe'], a: 1, e: 'La validación con Zod es parte de la defensa: un 400 claro para el cliente, no un crash.', flag: 'VC{r4ng0_1_5}' },
    { id: 10, lvl: 'media', area: 'API', titulo: 'El token con fecha de vencimiento', escenario: 'POST /api/calls/:id/token es el nuevo endpoint de videollamada. Hay 4 caminos posibles para una consulta: participante en ACTIVE, ajeno a la consulta, no ACTIVE, o backend sin credenciales LiveKit.', codigo: 'assertParticipation(req)      // 403 si no participa\nstatus === "ACTIVE"            // 409 si no\nLIVEKIT_URL ? token : 503      // sin credenciales', q: 'Si el .env no tiene LIVEKIT_URL configurado, ¿qué devuelve el endpoint?', o: ['200 con token vacío', '503: videollamadas aún no habilitadas', '404', '401 siempre'], a: 1, e: 'Error controlado y honesto: 503 con mensaje claro. El 12-ago quedó todo implementado; falta solo el .env real.', flag: 'VC{3l_t0k3n_t13n3_f3ch4}' },
    { id: 11, lvl: 'facil', area: 'Arquitectura', titulo: 'Una sola puerta de entrada', escenario: 'En dev con hot reload, cada reinicio del servidor creaba clientes nuevos de Prisma. Las conexiones a la base empezaron a escaparse. La solución fue de una línea: exportar un solo PrismaClient.', codigo: '// ADR-006\nconst prisma = new PrismaClient() // un singeton, siempre', q: '¿Qué problema exacto resuelve el singleton?', o: ['Acelera las queries', 'Evita el agotamiento de conexiones en dev (hot reload)', 'Reduce tamaño de bundle', 'Evita SQL injections'], a: 1, e: 'Cada instancia nueva = pool de conexiones nuevo. Un solo cliente, un solo pool. ADR-006.', flag: 'VC{un_s0l0_pr15m4}' },
    { id: 12, lvl: 'media', area: 'Arquitectura', titulo: 'El historial que no se borra', escenario: 'Te proponen eliminar consultas cerradas para liberar espacio en la base. El esquema ya tiene deletedAt y los endpoints filtran por él.', codigo: 'createdAt: true, deletedAt: DateTime?  // soft delete (ADR-005)\nwhere: { deletedAt: null }', q: '¿Por qué soft delete y no borrado físico?', o: ['Porque ocupa menos', 'Conserva historial clínico, auditoría y referencias (recetas, reviews, chat)', 'Es más fácil de escribir', 'PostgreSQL no soporta DELETE'], a: 1, e: 'La historia clínica y las reviews de un vet no pueden desaparecer con un DELETE. El soft delete las preserva.', flag: 'VC{la_h1st0r14_n0_s3_b0rr4}' }
  ]
};

const $ = (id) => document.getElementById(id);

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

let audioCtx = null;
function tone(freq, start, dur, type = 'sine', vol = 0.12) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, audioCtx.currentTime + start);
    g.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(audioCtx.currentTime + start); o.stop(audioCtx.currentTime + start + dur + 0.05);
  } catch {}
}
const sndWin = () => { tone(523, 0, .18); tone(659, .13, .18); tone(784, .26, .3); };
const sndLose = () => { tone(330, 0, .2, 'triangle'); tone(247, .16, .3, 'triangle'); };
const sndClick = () => tone(880, 0, .07, 'square', .04);
const sndFlag = () => { tone(392, 0, .14); tone(523, .1, .14); tone(659, .2, .14); tone(784, .3, .4); };

function addXp(n) {
  xp += n;
  STORAGE.set('vcxp', xp);
  const el = $('game-xp');
  if (el) el.textContent = '⚡ ' + xp + ' XP acumuladas';
}

function renderStats() {
  $('hero-stats').innerHTML = DATA.stats.map((s) => `
    <div class="stat reveal"><div class="icon">${s.icon}</div><div class="value">${s.value}</div><div class="label">${s.label}</div></div>`).join('');
}

function renderStory() {
  const track = $('story');
  track.innerHTML = DATA.capitulos.map((c) => `
    <div class="slide" data-emoji="${c.emoji}">
      <div class="slide-inner">
        <div class="slide-visual">
          <span class="emoji">${c.emoji}</span>
          <span class="date">${esc(c.fecha)}</span>
        </div>
        <div>
          <div class="chap-tag ${c.tipo}">${esc(c.tag)}</div>
          <div class="chap-title">${esc(c.titulo)}</div>
          <div class="chap-text">${c.texto}</div>
          ${c.quote ? `<div class="chap-quote">${c.quote}</div>` : ''}
        </div>
      </div>
    </div>`).join('');
  const dots = $('story-dots');
  dots.innerHTML = DATA.capitulos.map((_, i) => `<button data-i="${i}"${i === 0 ? ' class="active"' : ''}></button>`).join('');
  $('story-count').textContent = 'Capítulo 1 de ' + DATA.capitulos.length + ' · ' + DATA.capitulos[0].titulo;

  const sync = () => {
    const idx = Math.max(0, Math.min(DATA.capitulos.length - 1, Math.round(track.scrollLeft / Math.max(1, track.clientWidth))));
    dots.querySelectorAll('button').forEach((d, i) => d.classList.toggle('active', i === idx));
    $('story-count').textContent = 'Capítulo ' + (idx + 1) + ' de ' + DATA.capitulos.length + ' · ' + DATA.capitulos[idx].titulo;
  };
  let ticking = false;
  track.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(() => { sync(); ticking = false; }); }
  });
  const go = (dir) => track.scrollBy({ left: dir * track.clientWidth, behavior: 'smooth' });
  $('s-prev').addEventListener('click', () => { sndClick(); go(-1); });
  $('s-next').addEventListener('click', () => { sndClick(); go(1); });
  dots.querySelectorAll('button').forEach((d) => d.addEventListener('click', () => {
    sndClick();
    track.scrollTo({ left: Number(d.dataset.i) * track.clientWidth, behavior: 'smooth' });
  }));
  if (!_storyKeysBound) {
    _storyKeysBound = true;
    const sec = $('historia');
    const io = new IntersectionObserver((e) => { _storyActive = e[0].isIntersecting; }, { threshold: 0.3 });
    io.observe(sec);
    document.addEventListener('keydown', (ev) => {
      if (!_storyActive || !_storyKeysBound) return;
      if (ev.key === 'ArrowRight') { ev.preventDefault(); go(1); }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); go(-1); }
    });
  }
}

let deckState = { filter: 'todo', order: [], i: 0, flipped: false, out: false, done: false };

function deckList() {
  return deckState.filter === 'todo' ? DATA.lecciones : DATA.lecciones.filter((l) => l.tipo === deckState.filter);
}

function renderDeckFilters() {
  const f = $('deck-filters');
  f.innerHTML = ['todo', 'exito', 'error', 'leccion'].map((x) =>
    `<button data-f="${x}" class="${x === deckState.filter ? 'active' : ''}">${x === 'todo' ? 'Todas' : x === 'exito' ? 'Éxitos' : x === 'error' ? 'Errores' : 'Lecciones'}</button>`).join('');
  f.addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    sndClick();
    deckState.filter = b.dataset.f;
    deckState.order = DataShuffle(deckList().length);
    deckState.i = 0; deckState.flipped = false; deckState.out = false; deckState.done = false;
    renderDeckFilters();
    renderDeck();
  });
}

function DataShuffle(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderDeck() {
  const list = deckList();
  if (!deckState.order.length && !deckState.done) deckState.order = DataShuffle(list.length);
  if (deckState.done) {
    $('deck').innerHTML = `<div class="deck-done">
      <div class="big">🗃️</div>
      <h3>Cajón vaciado</h3>
      <p>Sacaste las ${list.length} cartas. Ahora el cajón solo tiene polvo y un rubber duck sin usar.<br>Ojo: el cajón del <b>.env</b> que se filtró a git no se vacía con un botón — eso lleva <i>filter-repo</i>.</p>
      <button class="sim-start" id="deck-restart">Reabrir el cajón</button>
    </div>`;
    $('deck').querySelector('#deck-restart').addEventListener('click', () => { sndClick(); deckState = { filter: deckState.filter, order: DataShuffle(list.length), i: 0, flipped: false, out: false, done: false }; renderDeckFilters(); renderDeck(); });
    return;
  }
  const n = deckState.order.length;
  const idx = deckState.order[deckState.i];
  const c = list[idx];
  const stack = Math.min(4, n - deckState.i);
  const cards = [];
  for (let k = 0; k < stack; k++) {
    const ci = list[deckState.order[deckState.i + k]];
    const isTop = k === 0;
    cards.push(`<div class="dcard ${isTop && deckState.flipped ? 'flipped' : ''} ${isTop && deckState.out ? 'out' : ''}" data-k="${k}" style="z-index:${20 - k};transform:translateY(${k * 14}px) scale(${1 - k * 0.035});${isTop ? 'cursor:pointer' : ''}">
      <div class="dc-side dc-front">
        <div class="dc-top"><span class="dc-emoji">${ci.emoji}</span><span class="dc-tag ${ci.tipo}">${ci.tipo === 'exito' ? 'vieron en el sprint' : ci.tipo === 'error' ? 'la cicatriz' : 'la iluminación'}</span></div>
        <div class="dc-title">${esc(ci.titulo)}</div>
        ${k === 0 ? '<div class="dc-hint">☝ tocá la carta para leer la anécdota completa</div>' : '<div style="opacity:0">·</div>'}
      </div>
      <div class="dc-side dc-back">
        <div class="dc-emoji-big">${ci.emoji}</div>
        <div style="overflow:auto;max-height:190px;padding-right:4px;color:#b9c5e6;font-size:13.5px;line-height:1.65">${ci.texto}</div>
        ${ci.commit ? `<div style="margin-top:10px;font-size:11.5px;color:var(--muted);font-family:monospace">${esc(ci.commit)}</div>` : ''}
        ${k === 0 ? '<div class="dc-hint">👈 tocá para dar vuelta la carta</div>' : ''}
      </div>
    </div>`);
  }
  $('deck').innerHTML = cards.join('');
  $('deck-info').textContent = `Carta ${deckState.i + 1} de ${n} · quedan ${n - deckState.i}`;
  $('deck-actions').innerHTML = `
    <button class="da-flip" id="da-flip">🔄 Dar vuelta</button>
    <button class="da-next" id="da-next">✔ Aprendida — sacar del cajón</button>`;
  $('deck-actions').querySelector('#da-flip').addEventListener('click', () => { sndClick(); deckState.flipped = !deckState.flipped; renderDeck(); });
  $('deck-actions').querySelector('#da-next').addEventListener('click', () => {
    if (deckState.flipped) sndWin(); else sndClick();
    deckState.flipped = false;
    deckState.out = true;
    addXp(3);
    renderDeck();
    setTimeout(() => {
      deckState.i++;
      deckState.out = false;
      deckState.flipped = false;
      if (deckState.i >= n) deckState.done = true;
      renderDeck();
    }, 420);
  });
  $('deck').querySelectorAll('.dcard').forEach((d) => {
    if (Number(d.dataset.k) !== 0) return;
    d.addEventListener('click', () => { sndClick(); deckState.flipped = !deckState.flipped; renderDeck(); });
  });
}

function renderSprints() {
  $('sprints').innerHTML = DATA.sprints.map((s) => `
    <div class="sprint-card reveal">
      <div class="sprint-id ${s.tag === 'mvp' ? 'mvp' : ''}">${s.id}</div>
      <div>
        <h3>${esc(s.titulo)}</h3>
        <div class="s-dates">${esc(s.fechas)}</div>
        <p>${s.texto}</p>
      </div>
      <span class="s-tag ${s.tag}">${s.tag === 'done' ? '✅ hecho' : s.tag === 'mvp' ? '🎯 entregado' : s.tag === 'current' ? '👉 en curso' : s.tag === 'doing' ? '⚡ activo' : '⏳ próximo'}</span>
    </div>`).join('');
}

function renderTeam() {
  $('team').innerHTML = DATA.equipo.map((m) => `
    <div class="flip-scene reveal" tabindex="0">
      <div class="flip-card">
        <div class="flip-face front">
          <div class="avatar">${m.avatar}</div>
          <h3>${esc(m.nombre)}</h3>
          <div class="role">${esc(m.rol)}</div>
          <div class="flip-hint">↻ tocá para ver el expediente</div>
        </div>
        <div class="flip-face back">
          <h3 style="color:var(--gold)">${esc(m.nombre)}</h3>
          <ul style="list-style:none;text-align:left;margin:10px 0;font-size:12.5px;color:#b9c5e6">${m.aportes.map((a) => `<li style="padding:3px 0 3px 18px;position:relative">▹ ${esc(a)}</li>`).join('')}</ul>
          <div class="quote" style="font-size:11.5px">"${esc(m.cita)}"</div>
          <div class="flip-hint">↻ volver</div>
        </div>
      </div>
    </div>`).join('');
  $('team').querySelectorAll('.flip-scene').forEach((s) => {
    const flip = () => { sndClick(); s.classList.toggle('flipped'); };
    s.addEventListener('click', flip);
    s.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
  });
}

function renderPlats() {
  $('plats').innerHTML = DATA.plataformas.map((p) => `
    <div class="plat reveal">
      <h3>${p.icon} ${esc(p.nombre)}</h3>
      <span class="status">${esc(p.status)}</span>
      <ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
    </div>`).join('');
  const gauge = (pct, tone, ic, name, note) => {
    const r = 42, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
    const col = tone === 'yellow' ? 'var(--gold)' : tone === 'blue' ? 'var(--blue)' : 'var(--green)';
    return `<div class="gauge reveal">
      <svg width="104" height="104" viewBox="0 0 104 104">
        <circle cx="52" cy="52" r="${r}" fill="none" stroke="#1b2347" stroke-width="9"/>
        <circle class="g-fill" cx="52" cy="52" r="${r}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-off="${off}"/>
      </svg>
      <div class="g-val">${pct}%</div>
      <div class="g-foot"><b>${ic} ${esc(name)}</b><br><span>${esc(note)}</span></div>
    </div>`;
  };
  $('frentes').innerHTML = DATA.frentes.map((f) => gauge(f.pct, f.tone, f.icon, f.nombre, f.nota)).join('');
  const items = DATA.auditorias.map((a) => ({ n: a.nombre.split(' ')[0], v: parseInt(a.score) }));
  const N = items.length, R = 118, cx = 150, cy = 150;
  const ang = (i) => (Math.PI * 2 * i) / N - Math.PI / 2;
  const pt = (i, rad) => [cx + Math.cos(ang(i)) * rad, cy + Math.sin(ang(i)) * rad];
  const poly = (scale) => items.map((it, i) => { const [x, y] = pt(i, R * scale * (it.v / 10)); return x.toFixed(1) + ',' + y.toFixed(1); }).join(' ');
  let grid = '';
  [0.34, 0.67, 1].forEach((s) => { grid += `<polygon points="${poly(s)}" fill="none" stroke="#2a3565" stroke-width="1"/>`; });
  const axes = items.map((it, i) => { const [x, y] = pt(i, R); const [lx, ly] = pt(i, R + 16); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#2a3565" stroke-width="1"/><text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" fill="#8fa0c9" font-size="11" font-weight="700" text-anchor="middle">${esc(it.n)}</text>`; }).join('');
  $('audits').innerHTML = `<div class="audit reveal" style="grid-column:1/-1">
    <h3 style="margin-bottom:4px">📡 Radar de madurez FAANG</h3>
    <div class="radar-wrap">
      <div id="radar-host"><svg width="300" height="300" viewBox="0 0 300 300">${grid}${axes}<polygon class="radar-poly" points="${poly(0)}" fill="rgba(88,204,2,.22)" stroke="var(--green)" stroke-width="2.5"/></svg></div>
      <div class="radar-legend">${DATA.auditorias.map((a) => `<div><b>${esc(a.score)}</b> — ${esc(a.nombre)}<br><span style="font-weight:600">${esc(a.nota)}</span></div>`).join('')}</div>
    </div>
  </div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll('.g-fill').forEach((c) => { c.style.strokeDashoffset = c.dataset.off; });
    const rp = document.querySelector('.radar-poly');
    if (rp) rp.setAttribute('points', poly(1));
  }));
  $('pending').innerHTML = DATA.pendientes.map((g) => `
    <div class="pending-card reveal">
      <h3>${g.icon} ${esc(g.titulo)}</h3>
      <ul>${g.items.map((t) => `<li><span class="dot ${t.d}"></span>${esc(t.t)}<span class="who">${esc(t.w)}</span></li>`).join('')}</ul>
    </div>`).join('');
}

const LEVELS = [
  'Pasante de README', 'Junior del wireframe', 'Dev del sprint 1', 'Héroe del scaffold', 'Guardián del schema',
  'Señor de las migraciones', 'Maestro del socket', 'Cazador de duplicados', 'Senior de la cola', 'Veterano del MVP',
  'Arquitecto del ADR', 'Mago del cache', 'Guardián de los tests', 'Oficial de la cola atómica', 'Comandante del deploy',
  'Señor del 100%', 'Leyenda del 2GB', 'Embajador de producción', 'Cronista del proyecto', 'Guardián del 31-oct'
];

function renderHero() {
  $('hero-kicker').textContent = `actualizado el ${H.fecha} · commit ${H.commit} · ${H.commitMsg}`;
  $('hero-title').innerHTML = `De cero a <span class="grad">videollamada veterinaria</span> en ${diasTotales} días`;
  $('hero-sub').textContent = 'La historia real de VetConnect: seis personas, un tablero, dos auditorías, tres sobresaltos y una presentación que todavía no se escribió. Esto es lo que vivimos, lo que falló, y lo que nos falta para el 100%.';
  $('hero-days').innerHTML = `<b>${diasRestantes} días</b> separan al equipo de la presentación final del 5 de septiembre`;
  const P = computeProgress();
  const lv = Math.max(1, Math.min(20, Math.floor(P.pct / 5) + 1));
  const emoji = lv >= 18 ? '👑' : lv >= 13 ? '🚀' : lv >= 9 ? '🛡️' : lv >= 5 ? '🔧' : '🌱';
  const chip = $('level-chip');
  if (chip) chip.innerHTML = `<span class="lv">${emoji} Nivel <b>${lv}</b></span><span class="lv-title">${LEVELS[lv - 1]}</span>`;
}

let _storyKeysBound = false;
let _storyActive = false;

function computeProgress() {
  let done = 0, total = 0;
  DATA.catalogo.forEach((c) => { done += c.done; total += c.items.length; });
  const features = Math.round((done / total) * 1000) / 10;
  const sprints = 65;
  const tiempo = pctCamino;
  const pct = Math.round((0.6 * features + 0.25 * sprints + 0.15 * tiempo) * 10) / 10;
  return { pct, features, sprints, tiempo, done, total };
}

function renderBar() {
  const P = computeProgress();
  const prev = STORAGE.get('vcprogprev', null);
  const from = prev && typeof prev.pct === 'number' ? prev.pct : 0;
  const gain = Math.max(0, Math.round((P.pct - from) * 10) / 10);
  const banner = $('delta-banner');
  if (prev && gain > 0.1) {
    banner.innerHTML = `<span class="d-chip">⚡ +${gain}% de progreso desde ${esc(prev.fecha)}</span>`;
    setTimeout(() => { try { sndFlag(); } catch {} }, 500);
  } else {
    banner.innerHTML = `<span class="d-chip wait">progreso en vivo: editá <b>DATA.catalogo</b> en app.js y la barra avanza sola</span>`;
  }
  STORAGE.set('vcprogprev', { pct: P.pct, fecha: H.fecha });

  $('big-pct-done').textContent = P.pct + '% completado';
  $('big-pct-left').textContent = Math.round((100 - P.pct) * 10) / 10 + '% para el 100%';
  $('mini-grid').innerHTML = [
    { l: 'Features reales', v: P.features, n: P.done + '/' + P.total + ' items', tone: '' },
    { l: 'Sprints', v: P.sprints, n: '13/20 cubiertos', tone: 'yellow' },
    { l: 'Calendario', v: P.tiempo, n: diasVividos + ' de ' + diasTotales + ' días', tone: 'blue' }
  ].map((m) => `
    <div class="mini">
      <div class="m-top"><span class="m-label">${m.l}</span><span class="m-pct">${m.v}%</span></div>
      <div class="bar ${m.tone}"><span data-pct="${m.v}"></span></div>
      <div class="ctf-note" style="margin-top:6px">${m.n}</div>
    </div>`).join('');
  $('big-bar-note').textContent = `Índice de progreso: 60% features + 25% sprints + 15% calendario. Hoy ${P.done} de ${P.total} features del alcance están hechas (${P.features}%). El buffer hasta el 31-oct es el aire de los ensayos.`;

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  (async () => {
    await delay(250);
    $('big-bar-fill').style.width = P.pct + '%';
    const now = $('big-bar-now');
    now.style.left = P.pct + '%';
    now.style.opacity = 1;
    document.querySelectorAll('.bar span[data-pct]').forEach((b) => { b.style.width = b.dataset.pct + '%'; });
  })();
}

let gameTab = 'proyecto';
let simMode = null;
let simTimers = [];
let quizState = {};
let memState = {};

function clearSim() {
  simTimers.forEach(clearInterval);
  simTimers = [];
}

function renderGameTabs() {
  const tabs = [
    ['proyecto', '🧠 El proyecto'],
    ['equipo', '🤝 El equipo'],
    ['memory', '🃏 ADR Memory'],
    ['sim', '🎮 Simuladores']
  ];
  $('game-tabs').innerHTML = tabs.map(([k, l]) => `<button class="${k === gameTab ? 'active' : ''}" data-g="${k}">${l}</button>`).join('');
  $('game-tabs').addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    sndClick();
    clearSim();
    gameTab = b.dataset.g;
    renderGameTabs();
    renderGame();
  });
  $('game-xp').textContent = '⚡ ' + xp + ' XP acumuladas';
}

function renderGame() {
  const g = $('game');
  if (gameTab === 'proyecto') quizUI(g, DATA.quizProyecto, 'proyecto');
  else if (gameTab === 'equipo') quizUI(g, DATA.quizEquipo, 'equipo');
  else if (gameTab === 'memory') memUI(g);
  else simUI(g);
}

const SIMS = [
  { id: 'queue', emoji: '🎰', nombre: 'La cola atómica', desc: 'Sos el handler del backend con dos veterinarios online (B8). Asigná consultas con updateMany atómico antes de que el otro handler las tome — si ambos asignan la misma, es una RACE.' },
  { id: 'dedup', emoji: '📸', nombre: 'Dedup del chat', desc: 'Viví la ronda del 12-ago (M11): el optimista recibe mensajes y las imágenes se duplican. Decidí rápido qué es nuevo y qué es duplicado.' },
  { id: 'swipe', emoji: '🃏', nombre: 'Triage en cartas', desc: 'Sos Dra. Vidal (vet.demo · test1234). Cada oferta es una carta en tu mano: arrastrala a la derecha para ACTIVE o a la izquierda para devolverla a la cola. Emergencia siempre; gato de tu especialidad también.' },
  { id: 'socket', emoji: '🛰️', nombre: 'Sobrevive al socket', desc: 'El chat del cliente corre sobre Socket.io (rey M10). Cuando se cae, tocá activar el polling de respaldo antes de que el chat se congele. Arcade de reflejos.' },
  { id: 'terminal', emoji: '🖥️', nombre: 'La terminal, tu 6º', desc: 'Cada incendio real del repo pide un comando: npm test, prisma migrate, openssl, git commit, el build. Escribilo exacto y apagá el fuego.' }
];

function simUI(g) {
  if (!simMode) {
    g.innerHTML = `<div class="game-card"><div class="sim-area">${SIMS.map((s) => `
      <div class="queue-card" data-s="${s.id}" style="cursor:pointer;grid-template-columns:56px 1fr auto">
        <div style="font-size:34px;text-align:center">${s.emoji}</div>
        <div><div class="q-info">${s.nombre}</div><div class="q-wait" style="margin-top:4px">${s.desc}</div></div>
        <button class="qt-btn">Jugar</button>
      </div>`).join('')}</div></div>`;
    g.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => {
      sndClick();
      simMode = b.dataset.s;
      simUI(g);
    }));
    return;
  }
  if (simMode === 'queue') simQueueUI(g);
  else if (simMode === 'dedup') simDedupUI(g);
  else if (simMode === 'swipe') simSwipeUI(g);
  else if (simMode === 'socket') simSocketUI(g);
  else if (simMode === 'terminal') simTerminalUI(g);
}

function simBack(g, title) {
  g.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => {
    sndClick(); clearSim(); simMode = null; simUI(g);
  }));
}

function simEnd(g, r) {
  g.innerHTML = `<div class="game-card"><div class="sim-end">
    <div class="big">${r.emoji}</div>
    <h3>${esc(r.title)}</h3>
    <p><b style="color:var(--gold)">${r.score}</b></p>
    ${r.best ? `<p>Mejor registro: <b style="color:var(--text)">${r.best}</b></p>` : ''}
    <p class="lesson-txt">${r.lesson}</p>
    <button class="sim-start" data-back style="margin-top:18px">Volver a los simuladores</button>
    <button class="sim-start" data-retry style="margin-top:12px;background:var(--blue);color:#00314d;box-shadow:0 0 26px rgba(76,195,255,.35)">Reintentar</button>
  </div></div>`;
  g.querySelector('[data-retry]').addEventListener('click', () => {
    sndClick();
    clearSim();
    simQ = null; simD = null; simP = null; simW = null; simS = null; simT = null;
    simUI(g);
  });
  simBack(g, document.title);
  clearSim();
}

const QMOTIVOS = ['Dolor agudo', 'Chequeo anual', 'Vacunas', 'Fiebre alta', 'Emergencia', 'Corte de pelo', 'Nudos en el pelo'];
let simQ = null;

function simQueueUI(g) {
  if (!simQ) {
    g.innerHTML = `<div class="game-card"><div class="sim-area">
      <p class="sim-empty">⚠️ Scenario: dos veterinarios online y una corriente de consultas PENDING entrando a la cola. El handler original (B8) leía el estado y actualizaba sin condición atómica: dos handlers podían asignar la misma consulta a dos vets distintos.<br><br>Vos sos el handler arreglado: <b>asigná con updateMany atómico</b> antes de que expire o antes de que el otro handler (que corre en paralelo) la tome. Si la tomás cuando ya está tomada: RACE.</p>
      <button class="sim-start">Comenzar el turno</button>
    </div></div>`;
    g.querySelector('.sim-start').addEventListener('click', () => {
      sndClick();
      simQ = { vidas: 3, pts: 0, t: 45, n: 0, cols: [], done: false, started: true };
      simQueueUI(g);
    });
    return;
  }
  if (simQ.done) {
    const best = STORAGE.get('vcbest-q', 0);
    const newBest = simQ.pts > best ? simQ.pts : best;
    STORAGE.set('vcbest-q', newBest);
    simEnd(g, {
      emoji: simQ.pts >= 120 ? '🏆' : simQ.pts >= 70 ? '🌟' : '💀',
      title: simQ.pts >= 120 ? 'Asignación perfecta' : simQ.pts >= 70 ? 'Cola estable' : 'La cola se te escapó',
      score: '⭐ ' + simQ.pts + ' puntos · ❤️ ' + simQ.vidas + ' vidas restantes',
      best: newBest,
      lesson: 'Lección B8 real: leer y actualizar sin condición atómica permite que dos handlers asignen lo mismo. La corrección fue updateMany donde status sigue PENDING y verificar las filas afectadas. Hoy la cola asigna una sola vez, siempre.',
      reset: null
    });
    return;
  }
  const hud = `
    <div class="sim-hud">
      <span class="hud-item">❤️ <span class="live">${simQ.vidas}</span></span>
      <span class="hud-item">⭐ <span class="pts">${simQ.pts}</span></span>
      <span class="hud-item">⏱ <span class="tm">${simQ.t}s</span></span>
    </div>
    <div class="sim-bar"><span id="q-time" class="${simQ.t < 12 ? 'red' : ''}" style="transform:scaleX(${simQ.t / 45})"></span></div>`;
  const cards = simQ.cols.length
    ? simQ.cols.map((c) => `
      <div class="queue-card ${c.st === 'mine' ? '' : c.st === 'taken' ? 'taken' : ''}" data-id="${c.id}">
        <div>
          <div class="q-id">consulta ${c.id}</div>
          <div class="q-info">${esc(c.motivo)}</div>
          <div class="q-wait">${c.st === 'taken' ? '⚡ el otro handler la asignó primero' : c.st === 'mine' ? '✓ asignada por vos (atómica)' : 'esperando en cola…'}</div>
          ${c.st === 'open' ? `<div class="q-fill"><span style="transform:scaleX(${c.vida / 6})"></span></div>` : ''}
        </div>
        ${c.st === 'open' ? `<button class="qt-btn" data-a="${c.id}">⚡ Asignar</button>` : c.st === 'mine' ? '<div style="font-size:26px;color:var(--green)">✓</div>' : '<div style="font-size:26px;color:var(--muted)">⏳</div>'}
      </div>`).join('')
    : '<div class="sim-empty">La cola está vacía… por ahora.</div>';
  const logHtml = simQ.log ? `<div class="sim-log">${simQ.log.map((l) => `<div class="${l.k}">${esc(l.t)}</div>`).join('')}</div>` : '';
  g.innerHTML = `<div class="game-card">${hud}<div class="sim-area">${cards}</div>${logHtml}
    <button class="sim-start" data-quit style="margin-top:18px;background:var(--card);color:var(--muted);box-shadow:none">Abandonar turno</button>
  </div>`;

  const push = (k, t) => { if (!simQ.log) simQ.log = []; simQ.log.push({ k, t }); if (simQ.log.length > 5) simQ.log.shift(); };
  const assign = (id) => {
    if (simQ.done) return;
    const c = simQ.cols.find((x) => x.id === id);
    if (!c) return;
    if (c.st === 'taken') {
      simQ.vidas--; push('bad', 'RACE: 0 filas afectadas — el otro handler ya la asignó. Vos la reasignaste. ❤️-1');
      sndLose();
    } else if (c.st === 'mine') return;
    else {
      const bonus = c.vida > 3 ? 5 : 0;
      simQ.pts += 10 + bonus;
      c.st = 'mine';
      push('good', `✓ updateMany atómico: 1 fila afectada (consulta ${c.id}) +${10 + bonus} pts`);
      sndWin();
    }
    simQueueUI(g);
  };
  g.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => assign(b.dataset.a)));
  g.querySelector('[data-quit]').addEventListener('click', () => { sndClick(); clearSim(); simQ = null; simUI(g); });
  simBack(g, document.title);
  if (!simQ.startedTimer) {
    simQ.startedTimer = true;
    simTimers.push(setInterval(() => {
      if (simQ.done) return;
      simQ.t--;
      const tl = g.querySelector('#q-time');
      if (tl) {
        tl.style.transform = 'scaleX(' + Math.max(0, simQ.t / 45) + ')';
        tl.classList.toggle('red', simQ.t < 12);
      }
      simQ.cols.forEach((c) => {
        if (c.st === 'open') {
          c.vida -= 0.25;
          if (c.vida <= 0) {
            c.st = 'exp';
            push('bad', `consulta ${c.id} expiró sin asignar (el tiempo de espera se agotó)`);
          }
        }
      });
      if (simQ.cols.some((c) => c.st === 'exp')) { simQ.cols = simQ.cols.filter((c) => c.st !== 'exp'); simQueueUI(g); return; }
      if (simQ.t <= 0) { simQ.done = true; simQueueUI(g); return; }
      const tl2 = g.querySelector('#q-time');
      if (tl2 && simQ.t % 5 === 0) simQueueUI(g);
    }, 250));
    simTimers.push(setInterval(() => {
      if (simQ.done) return;
      simQ.n++;
      const id = 'C-' + simQ.n;
      const motivo = QMOTIVOS[Math.floor(Math.random() * QMOTIVOS.length)];
      const c = { id, motivo, vida: 6, st: 'open' };
      simQ.cols.push(c);
      const delay = 2400 + Math.random() * 2200;
      if (Math.random() < 0.5) {
        simTimers.push(setTimeout(() => {
          const cc = simQ.cols.find((x) => x.id === id);
          if (cc && cc.st === 'open') { cc.st = 'taken'; push('info', `consulta ${id} fue tomada por el otro handler`); }
          if (cc && cc.st === 'taken') simQueueUI(g);
        }, delay));
      }
      simQueueUI(g);
    }, 2600));
  }
}

let simD = null;
const DUPLICABLES = [
  { c: 'Hola doctor, mi gata no come desde ayer', img: '📷 foto.jpg' },
  { c: '', img: '📷 foto-medicina.jpg' },
  { c: 'Le duele al caminar', img: '' },
  { c: 'Le dimos el antibiótico', img: '' },
  { c: '', img: '📷 foto-herida.jpg' },
  { c: 'Gracias por la receta', img: '' },
  { c: '¿Cuándo lo llevo al control?', img: '' },
  { c: '', img: '📷 foto-ojo.jpg' }
];

function simDedupUI(g) {
  if (!simD) {
    g.innerHTML = `<div class="game-card"><div class="sim-area">
      <p class="sim-empty">📋 Escenario real (12-ago): el chat mobile mandaba el mensaje apenas elegías la foto, y el dedup comparaba solo el contenido — dos imágenes con texto vacío se pisaban entre sí.<br><br>Vos sos el hook optimista arreglado: cada mensaje que llega del socket hay que clasificarlo como <b>nuevo</b> o <b>duplicado</b>. Ojo: duplicado = mismo contenido <b>y</b> mismo adjunto.</p>
      <button class="sim-start">Empezar el turno</button>
    </div></div>`;
    g.querySelector('.sim-start').addEventListener('click', () => {
      sndClick();
      simD = { vidas: 3, pts: 0, i: 0, done: false, plan: null, fb: null };
      simD.plan = buildPlan();
      simDedupUI(g);
    });
    return;
  }
  if (simD.done) {
    const best = STORAGE.get('vcbest-d', 0);
    const newBest = simD.pts > best ? simD.pts : best;
    STORAGE.set('vcbest-d', newBest);
    simEnd(g, {
      emoji: simD.pts >= 110 ? '🏆' : simD.pts >= 70 ? '🌟' : '💀',
      title: simD.pts >= 110 ? 'Dedup impecable' : simD.pts >= 70 ? 'Chat estable' : 'El chat se llenó de duplicados',
      score: '⭐ ' + simD.pts + ' puntos · ❤️ ' + simD.vidas + ' vidas',
      best: newBest,
      lesson: 'Lección M11: el dedup por contenido solo confunde dos fotos sin texto. La ronda del CEO lo mostró en un minuto. Ahora se compara content + attachmentUrl: nada se descarta por error, nada se duplica de nuevo.',
      reset: null
    });
    return;
  }
  const item = simD.plan[simD.i];
  const hist = simD.plan.slice(0, simD.i);
  const bubbles = hist.map((m) => `
    <div class="bubble mine">
      ${m.img ? '<div class="b-tag">📷 imagen</div>' : ''}${m.c || '(foto)'}
    </div>`).join('');
  g.innerHTML = `<div class="game-card">
    <div class="sim-hud">
      <span class="hud-item">❤️ <span class="live">${simD.vidas}</span></span>
      <span class="hud-item">⭐ <span class="pts">${simD.pts}</span></span>
      <span class="hud-item">📨 ${simD.i + 1}/12</span>
    </div>
    <div class="chat-bubbles">${bubbles}</div>
    <div class="bubble mine" style="border-color:var(--gold);margin-top:12px;box-shadow:0 0 16px rgba(255,184,0,.25)">
      ${item.img ? '<div class="b-tag">📷 imagen entrante</div>' : ''}${item.c || '(foto sin texto)'}
    </div>
    ${simD.fb ? `<div class="offer-fb ${simD.fb.ok ? 'ok' : 'bad'}">${simD.fb.t}</div>` : `
      <div class="dedup-actions">
        <button data-d="new">Es un mensaje NUEVO</button>
        <button data-d="dup" class="primary">Es DUPLICADO</button>
      </div>`}
    ${simD.fb ? `<button class="sim-start" data-next style="margin-top:14px">Siguiente mensaje</button>` : ''}
  </div>`;

  const respond = (dec) => {
    if (simD.fb) return;
    const ok = dec === item.dup ? 'dup' : 'new';
    const right = ok === item.answer;
    simD.fb = {
      ok: right,
      t: right
        ? (item.answer === 'dup' ? '✓ Duplicado: mismo contenido Y mismo adjunto. El dedup lo descarta sin perder nada.' : '✓ Nuevo: no coincide con nada del historial. Se guarda.')
        : (item.answer === 'dup' ? '✗ Era DUPLICADO (mismo content + mismo attachment). Al marcarlo como nuevo, entró dos veces.' : '✗ Era NUEVO. Al descartarlo como duplicado, perdiste un mensaje real.')
    };
    if (right) { simD.pts += 10; sndWin(); } else { simD.vidas--; sndLose(); }
    simDedupUI(g);
  };
  g.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => respond(b.dataset.d)));
  const nx = g.querySelector('[data-next]');
  if (nx) nx.addEventListener('click', () => {
    sndClick();
    simD.i++;
    simD.fb = null;
    if (simD.i >= simD.plan.length || simD.vidas <= 0) simD.done = true;
    simDedupUI(g);
  });
}

function buildPlan() {
  const plan = [];
  for (let k = 0; k < 12; k++) {
    const src = DUPLICABLES[Math.floor(Math.random() * DUPLICABLES.length)];
    const dup = Math.random() < 0.45;
    plan.push({ ...src, dup, answer: dup ? 'dup' : 'new' });
  }
  return plan;
}

let simP = null;
let simW = null;
let simS = null;
let simT = null;
const OFERTAS = [
  { nombre: 'Valentina', mascota: 'Milo', especie: 'perro', motivo: 'Dolor agudo al caminar', urgencia: 'alta', espera: 12 },
  { nombre: 'Sol', mascota: 'Nube', especie: 'gato', motivo: 'Vacunas anuales', urgencia: 'baja', espera: 6 },
  { nombre: 'Bruno', mascota: 'Rocky', especie: 'perro', motivo: 'Chequeo anual', urgencia: 'baja', espera: 25 },
  { nombre: 'Caro', mascota: 'Michi', especie: 'gato', motivo: 'Nudos en el pelo', urgencia: 'baja', espera: 9 },
  { nombre: 'Diego', mascota: 'Pepe', especie: 'ave', motivo: 'Fiebre alta y plumas caídas', urgencia: 'alta', espera: 18 },
  { nombre: 'Lourdes', mascota: 'Luna', especie: 'gato', motivo: 'Emergencia: ingirió algo tóxico', urgencia: 'alta', espera: 4 },
  { nombre: 'Martín', mascota: 'Thor', especie: 'perro', motivo: 'Corte de pelo (estética)', urgencia: 'baja', espera: 33 },
  { nombre: 'Agustina', mascota: 'Simba', especie: 'gato', motivo: 'Dolor agudo al orinar', urgencia: 'alta', espera: 15 },
  { nombre: 'Facundo', mascota: 'Paco', especie: 'ave', motivo: 'Vacunas de rutina', urgencia: 'baja', espera: 40 },
  { nombre: 'Rocío', mascota: 'Kiara', especie: 'gato', motivo: 'Chequeo post-castración', urgencia: 'baja', espera: 21 }
];

function simSwipeUI(g) {
  if (!simW) {
    g.innerHTML = `<div class="game-card"><div class="sim-area">
      <p class="sim-empty">🥼 Sos <b>Dra. Vidal, especialista en gatos</b> (vet.demo en el backend real, password <code>test1234</code>). Con el flujo PENDING cada oferta llega como una carta en tu mano: <b>arrastrala a la derecha para ACTIVE</b> o a la izquierda para devolverla a la cola.<br><br>Regla de triage: <b>emergencia → aceptás siempre</b>; <b>gato de tu especialidad → aceptás</b> (salvo corte de pelo); el resto puede esperar a otro colega. Si la rechazás mal, el cliente espera 40 min más.</p>
      <button class="sim-start">Repartir cartas</button>
    </div></div>`;
    g.querySelector('.sim-start').addEventListener('click', () => {
      sndClick();
      simW = { i: 0, ok: 0, done: false, fb: null, dx: 0, dragging: false };
      simSwipeUI(g);
    });
    return;
  }
  if (simW.done) {
    const pctOK = Math.round((simW.ok / OFERTAS.length) * 100);
    simEnd(g, {
      emoji: pctOK >= 90 ? '🏆' : pctOK >= 70 ? '🌟' : '💀',
      title: pctOK >= 90 ? 'Criterio clínico de oro' : pctOK >= 70 ? 'Buen ojo de triage' : 'El triage necesita práctica',
      score: '🩺 ' + simW.ok + '/' + OFERTAS.length + ' aciertos (' + pctOK + '%)',
      lesson: 'El PENDING le devolvió la autonomía al veterinario, pero el sistema protege al cliente: toda oferta rechazada vuelve a la cola como WAITING. Nadie queda varado — salvo que la rechazes mal.',
      reset: null
    });
    return;
  }
  const o = OFERTAS[simW.i];
  const correcto = o.urgencia === 'alta' || (o.especie === 'gato' && o.motivo !== 'Nudos en el pelo');
  const decide = (acc) => {
    if (simW.fb) return;
    const right = acc === correcto;
    if (right) { simW.ok++; sndWin(); } else sndLose();
    simW.fb = right
      ? (acc ? '✓ ACTIVE: el chat con ' + o.nombre + ' se abrió. ' + o.mascota + ' en buenas patas.' : '✓ Bien rechazada: volvió a WAITING para otro vet online.')
      : (acc ? '✗ Aceptaste lo que no te tocaba: la agenda vale oro, había un colega libre.' : '✗ Rechazaste ' + (o.urgencia === 'alta' ? 'una EMERGENCIA: ' + o.nombre + ' esperó ' + o.espera + ' min más.' : 'un gato tuyo que esperaba ' + o.espera + ' min.'));
    simSwipeUI(g);
  };
  const back = (j) => (simW.i + j < OFERTAS.length) ? `<div class="swipe-card back-${j}"></div>` : '';
  g.innerHTML = `<div class="game-card">
    <div class="sim-hud">
      <span class="hud-item">🩺 carta ${simW.i + 1}/${OFERTAS.length}</span>
      <span class="hud-item">🎯 <span class="pts">${simW.ok} aciertos</span></span>
      <span class="hud-item">🐱 tu especialidad: gatos</span>
    </div>
    <div class="swipe-area">
      ${back(2)}${back(1)}
      <div class="swipe-card" id="top">
        <span class="swipe-verdict verdict-acc">ACTIVE ⚡</span>
        <span class="swipe-verdict verdict-rej">→ COLA</span>
        <div class="o-top"><h4>${esc(o.nombre)} · ${esc(o.mascota)}</h4><span class="q-id">esperando ${o.espera} min</span></div>
        <div class="o-meta">Especie: ${esc(o.especie)} · cliente desde la cola</div>
        <div class="o-reason"><b>Motivo:</b> ${esc(o.motivo)}</div>
        ${simW.fb ? `<div class="offer-fb ${simW.fb.indexOf('✓') === 0 ? 'ok' : 'bad'}">${simW.fb}</div>` : ''}
      </div>
    </div>
    ${simW.fb
      ? `<button class="sim-start" data-next style="margin-top:14px">${simW.i + 1 === OFERTAS.length ? 'Ver resultado' : 'Siguiente carta'}</button>`
      : `<div class="offer-btns" style="margin-top:14px"><button class="acc" data-sw="1">✔ Arrastrar a ACTIVE</button><button class="rej" data-sw="0">✖ A la cola</button></div>`}
  </div>`;
  const top = g.querySelector('#top');
  const setDx = (dx) => { simW.dx = dx; top.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx / 14) + 'deg)'; top.classList.toggle('drag-acc', dx > 40); top.classList.toggle('drag-rej', dx < -40); };
  const down = (e) => { simW.dragging = true; simW.x0 = e.clientX; top.setPointerCapture(e.pointerId); };
  const move = (e) => { if (!simW.dragging) return; setDx(e.clientX - simW.x0); };
  const up = () => {
    if (!simW.dragging) return;
    simW.dragging = false;
    if (simW.dx > 110) { top.classList.add('leaving-r'); setTimeout(() => decide(true), 260); }
    else if (simW.dx < -110) { top.classList.add('leaving-l'); setTimeout(() => decide(false), 260); }
    else { top.style.transform = ''; top.classList.remove('drag-acc', 'drag-rej'); }
  };
  top.addEventListener('pointerdown', down);
  top.addEventListener('pointermove', move);
  top.addEventListener('pointerup', up);
  top.addEventListener('pointercancel', up);
  g.querySelectorAll('[data-sw]').forEach((b) => b.addEventListener('click', () => { sndClick(); decide(b.dataset.sw === '1'); }));
  const nx = g.querySelector('[data-next]');
  if (nx) nx.addEventListener('click', () => {
    sndClick();
    simW.i++;
    simW.fb = null;
    if (simW.i >= OFERTAS.length) simW.done = true;
    simSwipeUI(g);
  });
}

const INCIDENTS = [
  { t: 'La suite del backend se rompió en CI', err: '✗ FAIL backend/src/__tests__/consultations.test.ts · 155 expected, 0 passed', cmd: 'npm test', out: ['> vetconnect-backend@ test', '✓ 155 passed · 0 failed · 2.4s'], hint: 'corré la suite del backend' },
  { t: 'El schema cambió y Prisma se queja', err: 'Error: Prisma schema was changed - please run prisma migrate dev', cmd: 'npx prisma migrate dev', out: ['Applying migration 20260813000000_rating_favorites_profiles', '✓ Migration applied'], hint: 'aplicá la migración' },
  { t: 'El secret de JWT es de cartón (FAANG 4/10)', err: 'WARN JWT_SECRET=dev-secret-placeholder', cmd: 'openssl rand -base64 48', out: ['> THVlZG9jU2VjcmV0QmFzZTY0...'], hint: 'generá un secret real de 48 bytes' },
  { t: '18 errores de lint en web/src', err: '✗ eslint . --max-warnings 0 · 18 problems', cmd: 'npm run lint', out: ['✓ 0 errors · 0 warnings'], hint: 'pasá el linter' },
  { t: 'Adelantar el trabajo al repo', err: 'On branch main · 36 files changed, +1297 −221', cmd: 'git commit -m "fix: race en la cola"', out: ['[main 1c73b87] fix: race en la cola', ' 36 files changed'], hint: 'commiteá con un mensaje claro' },
  { t: 'Build final antes de deploy', err: "✗ error TS2304: cannot find module './CallRoom'", cmd: 'npm run build', out: ['> vite build', '✓ built in 2.1s · main chunk 139KB gzip'], hint: 'corré el build de producción' }
];

function simTerminalUI(g) {
  if (!simT) {
    g.innerHTML = `<div class="game-card"><div class="term-frame">
      <div class="term-bar"><span class="tb tb-r"></span><span class="tb tb-y"></span><span class="tb tb-g"></span><span class="tb-title">vetconnect@ops: ~/conectavet</span></div>
      <div class="term-body"><p>Este es tu 6º integrante: la terminal. Cada incidente real del proyecto pide un comando. Escribilo exacto (o suficientemente cerca). Si te equivocás 2 veces seguidas, perdés un corazón.</p></div>
    </div><button class="sim-start">Abrir terminal</button></div>`;
    g.querySelector('.sim-start').addEventListener('click', () => { sndClick(); simT = { i: 0, pts: 0, vidas: 3, fails: 0, done: false, log: '' }; simTerminalUI(g); });
    return;
  }
  if (simT.done) {
    simEnd(g, {
      emoji: simT.pts >= 60 ? '🏆' : simT.pts >= 30 ? '🌟' : '💀',
      title: simT.pts >= 60 ? 'Operador de consola' : simT.pts >= 30 ? 'Aprendiz de shell' : 'Pantalla azul de la vida',
      score: '⭐ ' + simT.pts + ' pts · ❤️ ' + simT.vidas,
      lesson: 'El 6º integrante del equipo es la terminal: npm test, prisma migrate, openssl para secrets, git commit, el build. No es magia, es cache — y disciplina.',
      reset: null
    });
    return;
  }
  const inc = INCIDENTS[simT.i];
  const norm = (s) => s.toLowerCase().replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
  const run = () => {
    const val = norm(g.querySelector('#term-in').value);
    const exp = norm(inc.cmd);
    const ok = inc.cmd.startsWith('git commit') ? /^git commit -m .+/.test(val) : (val === exp || val.startsWith(exp + ' '));
    if (ok) {
      simT.pts += 10; simT.fails = 0; sndWin();
      simT.log = '<span class="term-ok">' + inc.out.join('\n') + '</span>';
    } else {
      simT.fails++; sndLose();
      if (simT.fails >= 2) { simT.vidas--; simT.fails = 0; }
      simT.log = '<span class="term-err">command not found: ' + esc(g.querySelector('#term-in').value) + ' (pista: ' + inc.hint + ')</span>';
    }
    simT.i++;
    if (simT.i >= INCIDENTS.length || simT.vidas <= 0) simT.done = true;
    simTerminalUI(g);
  };
  g.innerHTML = `<div class="game-card"><div class="term-frame">
    <div class="term-bar"><span class="tb tb-r"></span><span class="tb tb-y"></span><span class="tb tb-g"></span><span class="tb-title">vetconnect@ops: ~/conectavet</span></div>
    <div class="term-body">
      <p><b style="color:var(--text)">Incidente ${simT.i + 1}/${INCIDENTS.length}:</b> ${esc(inc.t)}</p>
      <p class="term-err">${esc(inc.err)}</p>
      ${simT.log}
      <p><span class="t-prompt">vetconnect@ops:~$</span> <input id="term-in" class="term-input" placeholder="escribí el comando..." autocomplete="off"/></p>
    </div>
  </div>
  <div class="sim-hud" style="margin-top:14px"><span class="hud-item">❤️ ${simT.vidas}</span><span class="hud-item">⭐ ${simT.pts}</span><span class="hud-item">pista: ${esc(inc.hint)}</span></div>
  <button class="sim-start" data-run style="margin-top:12px">Ejecutar ⏎</button>
  </div>`;
  const inp = g.querySelector('#term-in');
  inp.focus();
  g.querySelector('[data-run]').addEventListener('click', run);
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
}

function simSocketUI(g) {
  if (!simS) {
    g.innerHTML = `<div class="game-card"><div class="sim-area">
      <p class="sim-empty">🛰️ Sos el cliente. El chat del médico vive sobre <b>Socket.io</b>; si el socket se cae, el <b>polling de respaldo</b> (rey M10: un chat que se congela cuando el socket muere) tiene que entrar solo. Cuando diga <b>"socket disconnected"</b>: tocá <b>activar polling</b> antes de que se llene la barra de congelamiento. Si llega a 0 → el chat muere y perdés una vida.</p>
      <button class="sim-start">Abrir la app</button>
    </div></div>`;
    g.querySelector('.sim-start').addEventListener('click', () => {
      sndClick();
      simS = { vidas: 3, pts: 0, t: 30, mode: 'ok', freeze: 0, done: false, msg: 'socket conectado · canal estable', cls: 'ok', pause: 0, next: 4 };
      simSocketUI(g);
    });
    return;
  }
  if (simS.done) {
    if (simS.timer) { clearInterval(simS.timer); simS.timer = null; }
    simEnd(g, {
      emoji: simS.pts >= 220 ? '🏆' : simS.pts >= 120 ? '🌟' : '💀',
      title: simS.pts >= 220 ? 'Canal imbatible' : simS.pts >= 120 ? 'Chat estable' : 'El chat se congeló',
      score: '⭐ ' + simS.pts + ' pts · ❤️ ' + simS.vidas + ' vidas',
      lesson: 'Lección M10: un chat adulto tiene DOS planes de vida. El socket cae en cualquier red real; el polling de respaldo tiene que activarse SOLO al desconectarse, no a mano. Tu código escucha disconnect, no espera a que lo toquen.',
      reset: null
    });
    return;
  }
  const tick = () => {
    if (simS.done) return;
    simS.t -= 0.2;
    if (simS.pause > 0) simS.pause -= 0.2;
    if (simS.mode === 'dead') {
      simS.freeze += 0.16;
      if (simS.freeze >= 3) { simS.vidas--; simS.freeze = 0; simS.mode = 'ok'; simS.pause = 2; simS.msg = '❄️ chat congelado 3s — perdiste una vida'; simS.cls = 'dead'; }
    } else if (simS.mode === 'ok' && simS.pause <= 0) {
      simS.next -= 0.2;
      if (simS.next <= 0) { simS.mode = 'dead'; simS.freeze = 0; simS.msg = '⚠️ socket disconnected — polling inactivo'; simS.cls = 'warn'; simS.next = 3 + Math.random() * 3; }
    } else if (simS.mode === 'poll' && simS.pause <= 0) {
      simS.next -= 0.2;
      if (simS.next <= 0) { simS.mode = 'ok'; simS.msg = '🛰️ socket reconnected — volvé al canal'; simS.cls = 'ok'; simS.next = 4 + Math.random() * 3; }
    }
    if (simS.t <= 0) simS.done = true;
    simSocketUI(g);
  };
  const toggle = () => {
    if (simS.mode === 'dead') { simS.mode = 'poll'; simS.freeze = 0; simS.pts += 10; simS.msg = '🔄 polling activado — el chat respira'; simS.cls = 'poll'; simS.next = 3 + Math.random() * 2; sndWin(); }
    else if (simS.mode === 'poll') { simS.mode = 'ok'; simS.pts += 5; simS.msg = '🛰️ volviste al socket (bonus)'; simS.cls = 'ok'; simS.next = 4 + Math.random() * 3; sndWin(); }
    simSocketUI(g);
  };
  g.innerHTML = `<div class="game-card">
    <div class="sim-hud"><span class="hud-item">❤️ <span class="live">${simS.vidas}</span></span><span class="hud-item">⭐ <span class="pts">${simS.pts}</span></span><span class="hud-item">⏱ ${Math.ceil(simS.t)}s</span></div>
    <div class="socket-scene">
      <div class="socket-line">
        <div class="seg ${simS.mode === 'ok' ? 'sock' : simS.mode === 'poll' ? 'poll' : 'dead'}">${simS.mode === 'ok' ? 'SOCKET' : simS.mode === 'poll' ? 'POLLING' : 'DEAD'}</div>
      </div>
      <div class="freeze-bar"><span style="transform:scaleX(${simS.mode === 'dead' ? simS.freeze / 3 : 0})"></span></div>
      <div class="socket-badge ${simS.cls}">${simS.msg}</div>
      <button class="socket-btn" data-tg ${simS.mode === 'ok' ? 'disabled' : ''}>${simS.mode === 'dead' ? '🔄 Activar polling' : '🛰️ Volver al socket'}</button>
    </div>
  </div>`;
  g.querySelector('[data-tg]').addEventListener('click', toggle);
  if (simS.timer) clearInterval(simS.timer);
  simS.timer = setInterval(tick, 200);
  simTimers.push(simS.timer);
}

function quizUI(g, questions, key) {
  const st = quizState[key] || (quizState[key] = { i: 0, right: 0, done: false, answered: false, picked: null, firstTry: new Set() });
  if (st.done) {
    const stars = st.right >= questions.length ? '🏆' : st.right >= questions.length * .6 ? '🌟' : '💪';
    g.innerHTML = `<div class="game-card"><div class="quiz-done">
      <div class="big">${stars}</div>
      <h3>${st.right} de ${questions.length} correctas</h3>
      <p>${st.right >= questions.length ? 'Perfección absoluta. Sabés el proyecto de memoria.' : st.right >= questions.length * .6 ? 'Muy bien. Algunas cicatrices te faltan ver.' : 'Volvé a vivir la historia: leé los capítulos de arriba.'}</p>
      <button class="quiz-next" id="q-restart">Volver a jugar</button>
    </div></div>`;
    g.querySelector('#q-restart').addEventListener('click', () => { sndClick(); quizState[key] = null; renderGame(); });
    return;
  }
  const q = questions[st.i];
  const opts = q.o.map((o, idx) => {
    let cls = 'quiz-opt';
    if (st.answered) cls += idx === q.a ? ' ok' : (idx === st.picked ? ' bad' : '');
    return `<button class="${cls}" data-i="${idx}" ${st.answered ? 'disabled' : ''}>${esc(o)}</button>`;
  }).join('');
  g.innerHTML = `<div class="game-card">
    <div class="quiz-q">${esc(q.q)}</div>
    <div class="quiz-opts">${opts}</div>
    ${st.answered ? `<div class="quiz-fb ${st.picked === q.a ? 'ok' : 'bad'}">${esc(q.e)}</div>
      <button class="quiz-next" id="q-next">${st.i + 1 === questions.length ? 'Ver resultado' : 'Siguiente'}</button>` : ''}
    <div class="ctf-note" style="margin-top:16px">Pregunta ${st.i + 1} de ${questions.length}</div>
  </div>`;
  if (!st.answered) {
    g.querySelectorAll('.quiz-opt').forEach((b) => b.addEventListener('click', () => {
      const pick = Number(b.dataset.i);
      st.picked = pick; st.answered = true;
      if (pick === q.a) {
        sndWin();
        st.right++;
        if (!st.firstTry.has(st.i)) { st.firstTry.add(st.i); addXp(10); }
      } else sndLose();
      renderGame();
    }));
  } else {
    g.querySelector('#q-next').addEventListener('click', () => {
      sndClick();
      st.i++; st.answered = false; st.picked = null;
      if (st.i >= questions.length) st.done = true;
      renderGame();
    });
  }
}

function memUI(g) {
  if (!memState.cards) {
    const cards = DATA.memory.map((label, i) => ({ label, grp: i < 8 ? i : i - 8, idx: i }))
      .sort(() => Math.random() - 0.5);
    memState = { cards, open: [], matched: new Set(), moves: 0, lock: false, started: false };
  }
  const s = memState;
  const grid = s.cards.map((c, i) => {
    const flipped = s.open.includes(i) || s.matched.has(c.grp);
    const cls = ['mem', flipped ? 'flip' : ''];
    if (s.matched.has(c.grp)) cls.push('match');
    return `<div class="${cls.join(' ')}" data-i="${i}">${flipped ? (c.idx < 8 ? '<span style="color:var(--violet)">' + esc(c.label) + '</span>' : c.label) : '❓'}</div>`;
  }).join('');
  g.innerHTML = `<div class="game-card">
    <div class="quiz-q" style="font-size:15px;margin-bottom:14px">Matcheá cada ADR con su decisión. Empezá tocando cualquier ficha. Movimientos: <span id="mem-moves">${s.moves}</span> · pares: <span id="mem-pairs">${s.matched.size}/8</span></div>
    <div class="memory-grid">${grid}</div>
    ${s.matched.size === 8 ? `<div class="quiz-done"><div class="big">🏆</div><p style="margin-top:10px">Entendés las decisiones de arquitectura mejor que nadie.</p><button class="quiz-next" id="mem-restart">Reiniciar</button></div>` : ''}
  </div>`;
  g.querySelectorAll('.mem').forEach((m) => m.addEventListener('click', () => {
    const i = Number(m.dataset.i);
    if (s.lock || s.open.includes(i) || s.matched.has(s.cards[i].grp)) return;
    sndClick(); s.started = true;
    s.open.push(i);
    if (s.open.length === 2) {
      s.moves++;
      const [a, b] = s.open;
      const same = s.cards[a].grp === s.cards[b].grp;
      if (same) {
        s.matched.add(s.cards[a].grp);
        s.open = [];
        sndWin(); addXp(5);
      } else {
        s.lock = true;
        sndLose();
        setTimeout(() => { s.open = []; s.lock = false; memUI(g); }, 650);
      }
    }
    memUI(g);
  }));
  const rr = g.querySelector('#mem-restart');
  if (rr) rr.addEventListener('click', () => { sndClick(); memState = {}; renderGame(); });
  const mv = g.querySelector('#mem-moves');
  if (mv) mv.textContent = s.moves;
}

let ctfDone = STORAGE.get('vcctf', []);
let openReto = null;

function renderCtf() {
  const pct = Math.round((ctfDone.length / DATA.ctf.length) * 100);
  $('ctf-progress').innerHTML = `
    <div class="bar"><span data-pct="${pct}"></span></div>
    <div class="ctf-note">${ctfDone.length} de ${DATA.ctf.length} flags capturadas · ${pct}% de la sala dominada</div>`;
  requestAnimationFrame(() => { requestAnimationFrame(() => { document.querySelectorAll('#ctf-progress .bar span').forEach((b) => { b.style.width = b.dataset.pct + '%'; }); }); });

  if (openReto) { renderChallenge(openReto); return; }

  const logLines = ctfDone.length
    ? DATA.ctf.filter((r) => ctfDone.includes(r.id)).map((r) => `<span class="ctf-log-ok">[+] flag ${String(r.id).padStart(2, '0')} → ${esc(r.flag)}</span>`).join('')
    : '<span class="ctf-log-idle">[ ] ninguna flag todavía — la sala te espera</span>';
  $('ctf').innerHTML = `<div class="ctf-frame">
    <div class="ctf-term-bar"><span class="tb tb-r"></span><span class="tb tb-y"></span><span class="tb tb-g"></span><span class="tb-title">root@vetconnect-ctf: ~/reto</span></div>
    <div class="ctf-term-body">
      <p class="ctf-prompt">root@vetconnect-ctf:~$ ls -la retos/</p>
      <div class="ctf-list">${DATA.ctf.map((r) => {
        const got = ctfDone.includes(r.id);
        return `<div class="ctf-card ${got ? 'done' : ''}" data-id="${r.id}">
          <div class="ctf-num">${String(r.id).padStart(2, '0')}</div>
          <div><h3>${esc(r.titulo)}</h3><p>${esc(r.area)} · ${got ? 'resuelto' : 'pendiente'}</p></div>
          <div style="text-align:right">
            <div class="ctf-lvl ${r.lvl}">${r.lvl === 'facil' ? 'fácil' : r.lvl}</div>
            ${got ? '<div class="flag-got" style="margin-top:6px">✅ flag</div>' : ''}
          </div>
        </div>`;}).join('')}</div>
      <p class="ctf-prompt">root@vetconnect-ctf:~$ cat log/flags.txt</p>
      <div class="ctf-log">${logLines}</div>
      <p class="ctf-cursor">root@vetconnect-ctf:~$ <span class="blink">█</span></p>
    </div>
  </div>`;
  $('ctf').querySelectorAll('.ctf-card').forEach((c) => c.addEventListener('click', () => {
    sndClick();
    openReto = Number(c.dataset.id);
    renderCtf();
    $('academia').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}

function renderChallenge(id) {
  const r = DATA.ctf.find((x) => x.id === id);
  const got = ctfDone.includes(id);
  $('ctf').innerHTML = `<div class="ctf-frame">
    <div class="ctf-term-bar"><span class="tb tb-r"></span><span class="tb tb-y"></span><span class="tb tb-g"></span><span class="tb-title">root@vetconnect-ctf: ~/reto/${String(r.id).padStart(2, '0')}</span></div>
    <div class="ctf-term-body">
      <p class="ctf-prompt">root@vetconnect-ctf:~$ cat reto_${String(r.id).padStart(2, '0')}.txt</p>
      <div class="challenge-head">
        <span class="ctf-lvl ${r.lvl}">${r.lvl === 'facil' ? 'fácil' : r.lvl}</span>
        <span class="challenge-area">${r.area} · reto ${String(r.id).padStart(2, '0')}</span>
        <h3>${esc(r.titulo)}</h3>
      </div>
      <div class="challenge-scenario">${r.escenario}</div>
      ${r.codigo ? `<div class="challenge-pre">${r.codigo.split('\n').map((l) => esc(l)).join('<br>')}</div>` : ''}
      <p class="ctf-prompt">root@vetconnect-ctf:~$ ./resolver --reto ${String(r.id).padStart(2, '0')}</p>
      <div class="challenge-q">${esc(r.q)}</div>
      <div class="quiz-opts">${r.o.map((o, i) => `<button class="quiz-opt" data-i="${i}" ${got ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
      ${got ? '<div class="flag-box"><pre>🏁 ' + r.flag + '</pre><div class="flag-congrats">Ya la resolviste. La sala lo recuerda.</div></div>' : '<div class="quiz-fb" id="ch-fb"></div>'}
      <button class="quiz-next" id="ch-back" style="margin-top:16px">← Volver a la sala</button>
    </div>
  </div>`;

  const back = $('ch-back');
  back.addEventListener('click', () => { sndClick(); openReto = null; renderCtf(); $('academia').scrollIntoView({ behavior: 'smooth', block: 'start' }); });

  if (got) return;
  const fb = $('ch-fb');
  $('ctf').querySelectorAll('.quiz-opt').forEach((b) => b.addEventListener('click', () => {
    const pick = Number(b.dataset.i);
    sndClick();
    if (pick === r.a) {
      sndFlag();
      ctfDone.push(r.id);
      STORAGE.set('vcctf', ctfDone);
      addXp(15);
      fb.className = 'quiz-fb ok';
      fb.innerHTML = '<b>Correcto.</b> ' + esc(r.e) + '<div class="flag-box"><pre>🏁 FLAG CAPTURADA: ' + r.flag + '</pre><div class="flag-congrats">La sala queda registrada. Seguí con el próximo reto.</div></div>';
      const allDone = ctfDone.length === DATA.ctf.length;
      if (allDone) {
        fb.innerHTML += '<div class="quiz-done"><div class="big">🔥🔥🔥</div><h3>DOMINASTE TODA LA SALA</h3><p>Sabés el sistema por dentro: debugging, seguridad, API y arquitectura.</p></div>';
      }
      setTimeout(() => { renderCtf(); $('academia').scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 2600);
    } else {
      sndLose();
      fb.className = 'quiz-fb bad';
      fb.innerHTML = 'Incorrecto. Volvé a leer el escenario y el código: la respuesta está en los detalles.';
    }
  }));
}

function mountReveals() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}

(function boot() {
  renderHero();
  renderStats();
  renderBar();
  renderStory();
  renderDeckFilters();
  renderDeck();
  renderSprints();
  renderTeam();
  renderPlats();
  renderGameTabs();
  renderGame();
  renderCtf();
  mountReveals();
})();