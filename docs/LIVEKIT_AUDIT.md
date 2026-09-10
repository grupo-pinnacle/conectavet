# Auditoría y Análisis Exhaustivo de la Conexión LiveKit — ConectaVet

> **Fecha:** 10 de Septiembre de 2026  
> **Alcance:** Integración de videollamadas WebRTC (Backend, Web Frontend y Mobile App)  
> **Referencia Oficial:** [LiveKit Documentation](https://docs.livekit.io/) · [LiveKit Docs MCP](https://docs.livekit.io/reference/developer-tools/docs-mcp/)

---

## 1. Resumen Ejecutivo y Arquitectura

Se realizó una auditoría técnica profunda sobre la implementación de videollamadas con LiveKit en la plataforma **ConectaVet**, evaluando la arquitectura en tres capas:

1. **Backend API & Gateway Realtime**:
   - `backend/src/modules/calls/calls.service.ts`: Generación de tokens JWT con `livekit-server-sdk`.
   - `backend/src/modules/calls/calls.controller.ts`: Endpoint `POST /api/calls/:id/token`.
   - `backend/src/modules/calls/calls.routes.ts`: Enrutamiento y autenticación.
   - `backend/src/modules/consultations/chat.gateway.ts`: Señalización de llamadas (`call:initiate`, `call:reject`).
   - `backend/src/modules/consultations/consultations.service.ts`: Ciclo de vida y cierre de consultas.
2. **Web Client (React / Vite)**:
   - `web/src/components/call/CallRoom.tsx`: Conexión WebRTC vía `@livekit/components-react` (`LiveKitRoom`, `VideoConference`, `PreJoin`).
   - `web/src/components/call/CallButton.tsx`: Disparador de llamada y emisión de señalización.
   - `web/src/components/call/GlobalCallListener.tsx`: Receptor global de llamada entrante con ringtone sintético.
   - `web/src/pages/CallPage.tsx`: Vista pública e interfaz de puente para el WebView móvil.
3. **Mobile Client (React Native / Expo)**:
   - `mobile/app/(app)/call/[consultationId].tsx`: Contenedor `WebView` para la llamada y pasarela de permisos de hardware.
   - `mobile/src/hooks/useIncomingCall.ts`: Listener de señalización socket y alerta modal con haptics.

---

## 2. Hallazgos Críticos frente a la Documentación Oficial de LiveKit

- **Privacidad y PII (*Personally Identifiable Information*)**:
  La documentación oficial (*Tokens & grants: PII Redaction*) establece:
  > *"🔥 Don't put PII in identity or room name. Participant identity and room name are recorded in logs and traces throughout LiveKit and its infrastructure, and aren't removed by PII redaction. Don't put personally identifiable information (such as real names, phone numbers, or email addresses) in these fields."*  
  En el backend se estaba pasando `req.user.email` al campo `name` del token, exponiendo correos electrónicos privados en logs de LiveKit Cloud y a otros participantes WebRTC.
- **Duplicación de Renderizadores de Audio**:
  El componente prefab `<VideoConference />` de `@livekit/components-react` ya incorpora internamente un `<RoomAudioRenderer />`. Al incluir un segundo `<RoomAudioRenderer />` como hijo directo de `<LiveKitRoom>`, se creaban dos instancias de reproducción de audio sobre los mismos tracks remotos, provocando eco y duplicación de volumen.
- **Violación de Elecciones de Usuario en `PreJoin`**:
  `PreJoin` recopila las elecciones del usuario (`LocalUserChoices`: estado de micrófono, cámara y hardware seleccionado). El código descartaba este objeto y forzaba `video={true}` y `audio={true}`, violentando la privacidad del usuario.
- **Condición de Carrera en el Puente WebView Mobile \(\rightarrow\) Web**:
  El evento `onLoad` de la WebView enviaba el token antes de que la página diferida (`lazy(() => import("./pages/CallPage"))`) terminara de descargarse e hidratarse, perdiéndose el token y dejando la llamada en carga infinita.
- **Falta de Gestión de Ciclo de Vida de Salas en Backend**:
  Al completar una consulta (`PATCH /api/consultations/:id/complete`), no se invocaba `RoomServiceClient.deleteRoom()`, permitiendo que la sala WebRTC continuara abierta consumiendo recursos y transmitiendo datos.
- **Inversión de Identidades en Señalización**:
  El emisor web pasaba `peerName` (nombre del destinatario) como argumento a `call:initiate`, haciendo que el receptor viera su propio nombre como llamante.

---

## 3. Reportes de Bugs (Formato Estandarizado Gherkin / BDD)

### Escenario:
**Nombre y sección (BUG-01: Inversión del nombre del emisor en la señalización de llamada entrante, seccion: Web / CallButton & Gateway Socket).**  
**Pasos para reproducir:**  
**Dado que** la veterinaria "Dra. María Gómez" tiene una consulta activa con el cliente "Carlos Pérez".  
**Cuando** la veterinaria hace clic en el botón "Videollamada" en `VetMessagesSection.tsx` para llamar a Carlos.  
**Entonces** el socket emite `socket.emit("call:initiate", consultationId, peerName)` enviando el nombre del cliente ("Carlos Pérez") al servidor, y el destinatario recibe una alerta emergente que dice "Videollamada entrante de Carlos Pérez" (resultado real obtenido), mostrando su propio nombre en lugar del nombre real de la veterinaria que lo está llamando (resultado esperado).

---

### Escenario:
**Nombre y sección (BUG-02: Emisión prematura de llamada entrante antes de validar y obtener el token de LiveKit, seccion: Web / CallButton).**  
**Pasos para reproducir:**  
**Dado que** el backend no tiene configuradas las credenciales de LiveKit en `.env` (o existe una falla temporal en el endpoint de llamadas).  
**Cuando** el usuario presiona el botón "Videollamada" en `CallButton.tsx`.  
**Entonces** el componente emite inmediatamente `call:initiate` por socket haciendo timbrar la pantalla o el móvil del receptor antes de invocar `getCallToken`, tras lo cual la obtención del token falla con HTTP 503 en el emisor, dejando al receptor con una llamada fantasma que arroja error al ser aceptada (resultado real obtenido) frente a validar y obtener exitosamente el token de conexión antes de alertar al otro participante (resultado esperado).

---

### Escenario:
**Nombre y sección (BUG-03: Inconsistencia entre el estado de consulta admitido por el Gateway y el Servicio de Tokens de LiveKit, seccion: Backend / chat.gateway vs calls.service).**  
**Pasos para reproducir:**  
**Dado que** una consulta se encuentra en estado "PENDING" (pendiente de confirmación por el veterinario).  
**Cuando** un usuario ejecuta la acción de llamada o dispara el evento `call:initiate` por WebSocket.  
**Entonces** `chat.gateway.ts` aprueba la solicitud porque valida `status: { in: ['ACTIVE', 'PENDING'] }` y emite `call:incoming` al destinatario, pero cuando cualquiera de los dos solicita el token de conexión en `calls.service.ts`, el backend rechaza la petición con HTTP 409 Conflict ("Solo podés llamar cuando la consulta está en curso") imposibilitando la videollamada (resultado real obtenido) frente a rechazar la señalización desde el gateway si la consulta no se encuentra en estado estrictamente "ACTIVE" (resultado esperado).

---

### Escenario:
**Nombre y sección (BUG-04: Exposición de Información de Identificación Personal (PII) en el token de LiveKit, seccion: Backend / calls.controller & calls.service).**  
**Pasos para reproducir:**  
**Dado que** un usuario autenticado con correo electrónico privado (ej. `juan.propietario@gmail.com`) participa de una consulta médica.  
**Cuando** el sistema solicita un token de videollamada a través de `POST /api/calls/:id/token`.  
**Entonces** `calls.controller.ts` asigna `name: req.user.email`, incrustando el correo electrónico directamente en el JWT de LiveKit en `calls.service.ts`, el cual es visible para todos los pares WebRTC y queda registrado sin anonimizar en los registros y telemetría de LiveKit Cloud (resultado real obtenido) frente a utilizar el nombre de pila público o un identificador opaco sin datos de contacto personales de acuerdo con las directivas oficiales de seguridad de LiveKit (resultado esperado).

---

### Escenario:
**Nombre y sección (BUG-05: Duplicación de renderizadores de audio en CallRoom provocando eco y distorsión, seccion: Web / CallRoom).**  
**Pasos para reproducir:**  
**Dado que** dos usuarios ingresan a una sala de consulta activa en `CallRoom.tsx`.  
**Cuando** el interlocutor remoto activa su micrófono y comienza a hablar.  
**Entonces** el componente monta simultáneamente `<VideoConference />` (que ya incluye internamente `<RoomAudioRenderer />`) y un `<RoomAudioRenderer />` secundario explícito como hijo directo de `<LiveKitRoom>`, provocando una doble suscripción de audio que genera eco local, volumen duplicado y potencial clipping (resultado real obtenido) frente a utilizar únicamente la reproducción provista de fábrica por el prefab `<VideoConference />` (resultado esperado).

---

### Escenario:
**Nombre y sección (BUG-06: Descarte total de las preferencias del usuario en PreJoin forzando cámara y micrófono encendidos, seccion: Web / CallRoom).**  
**Pasos para reproducir:**  
**Dado que** el usuario se encuentra en la pantalla de verificación previa (`PreJoin`) de la sala de consulta.  
**Cuando** el usuario desmarca la cámara y silencia su micrófono en los controles de `PreJoin` y presiona el botón "Unirse a la llamada".  
**Entonces** el handler `onSubmit` en `CallRoom.tsx` ejecuta `setPreJoined(true)` sin almacenar el parámetro `LocalUserChoices` y renderiza `<LiveKitRoom video={true} audio={true}>`, forzando el encendido inmediato de la cámara y el micrófono sin el consentimiento del usuario (resultado real obtenido) frente a inicializar `LiveKitRoom` con las preferencias de audio, video y dispositivos de entrada seleccionados por el usuario (resultado esperado).

---

### Escenario:
**Nombre y sección (BUG-07: Condición de carrera en WebView móvil por carga diferida perdiendo el token de LiveKit, seccion: Mobile / [consultationId] & Web / CallPage).**  
**Pasos para reproducir:**  
**Dado que** un usuario en la aplicación móvil presiona "Iniciar videollamada" o atiende una videollamada entrante.  
**Cuando** `[consultationId].tsx` carga el `WebView` hacia `/call` y dispara `sendCallInit` en el evento `onLoad`.  
**Entonces** la función envía el payload con el token por `postMessage` e `injectJavaScript` en el instante en que el HTML base termina de descargar, pero como la ruta en la web utiliza `lazy(() => import("./pages/CallPage"))`, el componente `CallPage` aún no se ha descargado ni montado, perdiendo el mensaje y dejando el WebView atrapado indefinidamente en la pantalla de carga con el spinner "Conectando a la videollamada..." (resultado real obtenido) frente a implementar un protocolo de handshake bidireccional donde la página web comunique su montaje efectivo antes de que el cliente móvil transmita las credenciales (resultado esperado).

---

### Escenario:
**Nombre y sección (BUG-08: Enlace de abandono con deep-link nativo móvil inaccesible en navegadores de escritorio, seccion: Web / CallPage).**  
**Pasos para reproducir:**  
**Dado que** un veterinario o cliente está participando de una videollamada desde el navegador web de una computadora de escritorio en `/call`.  
**Cuando** la llamada finaliza o el usuario hace clic en abandonar la llamada en `CallPage.tsx`.  
**Entonces** la aplicación ejecuta `window.location.href = "vetconnect://call-ended"` intentando abrir un protocolo URI exclusivo de la aplicación móvil, provocando que el navegador muestre un cuadro de error de protocolo desconocido ("No se pudo abrir la dirección") y dejando la ventana trabada sin redirigir al usuario al dashboard (resultado real obtenido) frente a detectar el entorno de ejecución y redirigir vía `navigate('/dashboard')` o `/vet-dashboard` cuando no se ejecuta dentro de un WebView móvil (resultado esperado).

---

### Escenario:
**Nombre y sección (BUG-09: Ausencia de controladores para errores de conexión WebRTC y fallos de hardware en LiveKitRoom, seccion: Web / CallRoom).**  
**Pasos para reproducir:**  
**Dado que** un usuario ingresa a una videollamada cuyo token ya expiró (más de 10 minutos de inactividad en la pantalla previa) o cuya red corporativa bloquea el tráfico WebRTC/UDP hacia el servidor LiveKit.  
**Cuando** `<LiveKitRoom>` intenta establecer la conexión WebRTC y el servidor rechaza la conexión o se produce un error de ICE/dispositivo.  
**Entonces** al no estar definidos los callbacks `onError` ni `onMediaDeviceFailure` en `CallRoom.tsx`, el error queda silenciado en la consola, la pantalla permanece congelada en negro y el usuario queda atrapado sin mensaje de diagnóstico ni posibilidad de reintento (resultado real obtenido) frente a capturar el error y renderizar un panel amigable de fallo de conexión con opción de reintentar o regresar al chat (resultado esperado).

---

### Escenario:
**Nombre y sección (BUG-10: Degradación severa de resolución y tasa de bits para examen clínico veterinario (360p @ 400kbps), seccion: Web / CallRoom).**  
**Pasos para reproducir:**  
**Dado que** un profesional veterinario realiza una teleconsulta en vivo donde necesita inspeccionar visualmente una lesión en la piel, una herida o la marcha de un animal.  
**Cuando** la videollamada se inicializa en `CallRoom.tsx`.  
**Entonces** la configuración pasa la instancia `VideoPresets.h360` a `resolution` (en lugar de `VideoResolution`) y fuerza `maxBitrate: 400_000` con `frameRate: 20`, provocando una transmisión fuertemente comprimida a 360p con artefactos de compresión y desenfoque de movimiento que impiden la apreciación clínica (resultado real obtenido) frente a utilizar una captura estándar de alta fidelidad (720p a 1.5–2 Mbps) con simulcast adaptativo según el ancho de banda disponible (resultado esperado).

---

### Escenario:
**Nombre y sección (BUG-11: Falta de señalización para cancelación de llamada antes de responder, seccion: Backend / chat.gateway & Web / GlobalCallListener).**  
**Pasos para reproducir:**  
**Dado que** el veterinario presiona "Videollamada" para comunicarse con un cliente, activando la alerta de llamada entrante en el dispositivo del cliente.  
**Cuando** el veterinario decide cancelar la llamada inmediatamente presionando "Volver al chat" o cerrando la pestaña antes de que el cliente responda.  
**Entonces** al no existir un evento socket `call:cancel` en `chat.gateway.ts`, el diálogo modal y el sonido de llamada entrante en `GlobalCallListener.tsx` y en el móvil continúan activos indefinidamente hasta que el usuario receptor pulsa "Rechazar" manualmente o intenta contestar una sala ya abandonada (resultado real obtenido) frente a emitir una señal de cancelación que cierre de inmediato la notificación en todos los dispositivos del receptor (resultado esperado).

---

### Escenario:
**Nombre y sección (BUG-12: Omisión del cierre remoto y revocación de la sala de LiveKit al finalizar la consulta médica, seccion: Backend / consultations.service).**  
**Pasos para reproducir:**  
**Dado que** dos usuarios se encuentran comunicándose activamente dentro de la sala de videollamada `consultation-[id]`.  
**Cuando** el veterinario hace clic en "Finalizar consulta" ejecutando `PATCH /api/consultations/:id/complete`.  
**Entonces** `consultations.service.ts` actualiza el registro en la base de datos a `COMPLETED` pero nunca interactúa con la API de LiveKit (`RoomServiceClient.deleteRoom`), permitiendo que ambos participantes permanezcan dentro de la sala transmitiendo audio y video sin límite hasta que sus tokens caduquen (resultado real obtenido) frente a cerrar la sala en el servidor LiveKit expulsando a los participantes y revocando las credenciales asociadas de forma inmediata (resultado esperado).

---

### Escenario:
**Nombre y sección (BUG-13: Dependencia cliente WebRTC para navegadores (`livekit-client`) incluida erróneamente en el backend, seccion: Backend / package.json).**  
**Pasos para reproducir:**  
**Dado que** el entorno del servidor backend se ejecuta sobre Node.js sin objetos globales del navegador como `window`, `RTCPeerConnection` o `navigator.mediaDevices`.  
**Cuando** se auditan las dependencias en `backend/package.json`.  
**Entonces** figura instalada la librería cliente de navegador `"livekit-client": "^2.21.0"` junto con `"livekit-server-sdk": "^2.17.0"`, introduciendo código cliente innecesario y riesgo de importaciones cruzadas en el servidor (resultado real obtenido) cuando en el backend únicamente debe existir `livekit-server-sdk` (resultado esperado).

---

## 4. Matriz Diagnóstica de Cumplimiento

| Aspecto Evaluado | Implementación Original | Directiva Oficial LiveKit | Estado Inicial |
| :--- | :--- | :--- | :---: |
| **Generación de Tokens** | `AccessToken` en `calls.service.ts` | Server-side JWT con API Key & Secret | **Aprobado con observaciones** |
| **Privacidad (PII)** | `name: req.user.email` | Prohibido incluir emails/teléfonos en identidades o nombres | ❌ **No cumple (BUG-04)** |
| **Renderizado de Audio** | `<VideoConference>` + `<RoomAudioRenderer>` | `<VideoConference>` ya incluye el audio renderer | ❌ **No cumple (BUG-05)** |
| **Flujo PreJoin** | Descarta `values` en `onSubmit` | Debe propagar `LocalUserChoices` a `LiveKitRoom` | ❌ **No cumple (BUG-06)** |
| **Manejo de Errores WebRTC** | Sin `onError` ni `onMediaDeviceFailure` | Obligatorio capturar fallos de ICE/token/hardware | ❌ **No cumple (BUG-09)** |
| **Calidad de Medios** | Forzado 360p @ 400kbps | 720p con simulcast y control de bitrate adaptativo | ❌ **No cumple (BUG-10)** |
| **Integración Mobile** | `WebView` con race condition en `onLoad` | Protocolo de sincronización seguro o SDK nativo | ❌ **No cumple (BUG-07)** |
| **Gestión de Salas Backend** | Sin `RoomServiceClient` | `deleteRoom()` y webhooks de ciclo de vida de sala | ❌ **No cumple (BUG-12)** |
| **Dependencias Backend** | Incluye `livekit-client` | Solo `livekit-server-sdk` en Node.js | ❌ **No cumple (BUG-13)** |

---

## 5. Hoja de Ruta de Remediación Técnica

1. **Señalización e Identidades (P0)**:
   - En `CallButton.tsx`: obtener primero el token mediante `getCallToken(consultationId)`; emitir `call:initiate` solo tras verificar éxito, enviando el nombre del **emisor** (`user.firstName`).
   - En `chat.gateway.ts`: restringir `call:initiate` a `status === 'ACTIVE'` e incorporar `call:cancel` \(\rightarrow\) `call:cancelled`.
2. **Alineación con LiveKit en Web (P0)**:
   - En `CallRoom.tsx`: remover `<RoomAudioRenderer />` duplicado, propagar `LocalUserChoices` a `LiveKitRoom`, actualizar presets a 720p y agregar handlers `onError` y `onMediaDeviceFailure`.
3. **Handshake Bidireccional Mobile-Web (P1)**:
   - En `CallPage.tsx`: emitir `page:ready` al montarse. En `onLeave`, detectar entorno y redirigir vía router en escritorio.
   - En `[consultationId].tsx`: esperar `page:ready` antes de inyectar el token.
4. **Ciclo de Vida y Limpieza Backend (P1)**:
   - En `calls.service.ts`: implementar `closeCallRoom` con `RoomServiceClient.deleteRoom()`, invocándolo en `completeConsultation`.
   - Eliminar `livekit-client` de `backend/package.json` y sanear el claim `name`.
