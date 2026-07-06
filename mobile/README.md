# VetConnect Mobile 📱🐾

App móvil de **VetConnect** — la plataforma de telesalud veterinaria del Grupo Pinnacle. Esta es la app para **dueños de mascotas (OWNER)** construida con **React Native + Expo** según el sub-prompt **SP-09** del sistema de prompts VetConnect.

> Las interfaces de veterinarios y administradores se desarrollan solo en la web (ver `apps/web` en el monorepo). Esta app móvil es exclusiva para owners.

---

## 📋 Tabla de contenidos

1. [Características](#-características)
2. [Stack tecnológico](#-stack-tecnológico)
3. [Requisitos previos](#-requisitos-previos)
4. [Instalación paso a paso](#-instalación-paso-a-paso)
5. [Configuración de variables de entorno](#-configuración-de-variables-de-entorno)
6. [Levantar la app en desarrollo](#-levantar-la-app-en-desarrollo)
7. [Build de APK con EAS](#-build-de-apk-con-eas)
8. [Estructura del proyecto](#-estructura-del-proyecto)
9. [Solución de problemas](#-solución-de-problemas)
10. [Integración con backend y otras plataformas](#-integración-con-backend-y-otras-plataformas)

---

## ✨ Características

MVP mobile (scope SP-09):

- ✅ **Registro y login** de owners con JWT rotativo.
- ✅ **CRUD de mascotas** + subida de fotos a Cloudinary (opcional).
- ✅ **VetCard** — perfil digital de la mascota con stats, alergias, condiciones crónicas y últimas consultas.
- ✅ **Chat con asistente IA** (Claude) con detección de emergencias y prompt-injection.
- ✅ **Cola de espera en tiempo real** vía WebSocket con posición, reconexión automática y heartbeat.
- ✅ **Videollamada con veterinario** vía LiveKit (WebRTC) con controles de micrófono/cámara.
- ✅ **Historial de consultas** con diagnóstico, tratamiento, resumen IA y valoración post-consulta.
- ✅ **Manejo de red** — banner offline, reconexión de WebSocket y refetch automático.
- ✅ **Almacenamiento seguro** de tokens en Android Keystore / iOS Keychain vía `expo-secure-store`.

---

## 🧰 Stack tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| Framework | React Native + Expo | SDK 51 |
| Navegación | Expo Router (file-based) | 3.5 |
| Estilos | NativeWind v4 (Tailwind para RN) + StyleSheet | — |
| Server state | TanStack React Query | 5.x |
| UI state | Zustand | 4.x |
| Forms | React Hook Form + Zod | — |
| HTTP | Axios (con interceptores de refresh token) | 1.x |
| Realtime | WebSocket nativo + `react-native-url-polyfill` | — |
| Videollamada | `@livekit/react-native` + `react-native-webrtc` | 2.x / 118 |
| Secure storage | `expo-secure-store` | 13.x |
| Imágenes | `expo-image-picker` + Cloudinary (opcional) | 15.x |
| Permisos | `expo-camera`, `expo-av`, `expo-permissions` | — |
| Red | `@react-native-community/netinfo` | 11.x |
| Toasts | `react-native-toast-message` | 2.x |

---

## ✅ Requisitos previos

Antes de empezar, verificá tener instalado:

| Herramienta | Versión mínima | Cómo verificar |
|--------------|----------------|----------------|
| **Node.js** | 18 LTS | `node --version` → `v18.x` o superior |
| **npm** | 9+ | `npm --version` |
| **Expo CLI** | global o vía npx | `npx expo --version` |
| **Java JDK** | 17 (para builds Android) | `java -version` |
| **Android Studio** | Hedgehog o superior | Para emulador Android + SDK |
| **EAS CLI** | 5+ | `npm i -g eas-cli` → `eas --version` |
| **Git** | cualquiera | `git --version` |

**Opcional (recomendado para emulador Android):**
- Variable de entorno `ANDROID_HOME` apuntando al SDK de Android.
- Un dispositivo físico Android con **USB debugging** habilitado (alternativa al emulador).

**Backend VetConnect:**
- Necesitás el backend de VetConnect corriendo (módulos SP-01 a SP-07 completados). Ver la sección [Integración con backend](#-integración-con-backend-y-otras-plataformas) y el documento `INTEGRATION.md`.

---

## 🚀 Instalación paso a paso

### Paso 1 — Clonar / descomprimir el proyecto

Si recibiste el zip:

```bash
unzip vetconnect-mobile.zip
cd vetconnect-mobile
```

### Paso 2 — Instalar dependencias

```bash
npm install
```

> ⚠️ Si tenés un `package-lock.json` anterior, borrá `node_modules` y `package-lock.json` antes de correr `npm install` para evitar conflictos de versiones de `react-native-webrtc`.

### Paso 3 — Configurar variables de entorno

Copiá el archivo de ejemplo y completá con tus URLs:

```bash
cp .env.example .env
```

Editá `.env`:

```bash
# Backend REST API (Express + Prisma)
EXPO_PUBLIC_API_URL=http://localhost:3000

# WebSocket de cola de espera
EXPO_PUBLIC_WS_URL=ws://localhost:3000/ws/queue

# LiveKit (cloud o self-hosted)
EXPO_PUBLIC_LIVEKIT_URL=ws://localhost:7880

# Cloudinary (opcional, solo para subida de fotos de mascotas)
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

> 🔐 Las variables **deben** llevar el prefijo `EXPO_PUBLIC_` para que Expo las exponga al runtime de React Native.

### Paso 4 — Verificar la configuración de TypeScript

```bash
npm run typecheck
```

Si todo está OK, no aparece output. Si hay errores, revisá que la versión de Node sea 18+ y que `npm install` haya terminado sin warnings graves.

---

## ▶️ Levantar la app en desarrollo

### Opción A — Emulador Android

1. Abrí **Android Studio** → **Device Manager** → iniciá un emulador (recomendado: Pixel 7 API 34).

2. Desde la raíz del proyecto:

   ```bash
   npm run android
   ```

   Esto ejecuta `expo start --android`. La primera vez, Expo descarga el Go binary y compila la app; puede tardar 5-10 min.

3. Cuando veas la pantalla de login, está listo 🎉.

### Opción B — Dispositivo físico Android

1. Habilitá **USB debugging** en el teléfono (Ajustes → Opciones de desarrollador).
2. Conectalo por USB a la PC.
3. Verificá que `adb` lo detecta: `adb devices`.
4. Ejecutá:

   ```bash
   npm run android
   ```

> Si el backend corre en `localhost:3000` desde tu PC, el dispositivo físico NO puede alcanzarlo con `localhost`. Cambiá `EXPO_PUBLIC_API_URL` y `EXPO_PUBLIC_WS_URL` por la IP de tu PC en la red local (ej: `http://192.168.1.50:3000`). Asegurate de que el firewall permita conexiones entrantes en el puerto 3000.

### Opción C — Expo Go (desarrollo rápido, sin compilar)

> ⚠️ Expo Go **no soporta** `react-native-webrtc` (necesario para LiveKit). Solo sirve para probar auth, pets y chat. La pantalla de videollamada requiere un **build de desarrollo** (EAS dev build o `npm run android`).

```bash
npx expo start
```

Escaneá el QR con la app Expo Go (disponible en Play Store).

### Paso 5 — Probar el flujo completo

1. **Registro**: creá una cuenta de owner (`+54 11 5555-5555`, contraseña con 1 mayús, 1 núm, 1 símbolo).
2. **Agregar mascota**: tap en "+ Nueva" → completá nombre, especie, fecha de nacimiento.
3. **Chat IA**: tap en la tab "💬 Chat IA" → "+ Nueva conversación" → escribí una duda (ej: "mi perro come menos desde ayer").
4. **Probar emergencia**: escribí "mi perro no respira" — la IA debe responder con mensaje de emergencia y mostrar banner.
5. **Cola**: tab "⏳ Cola" → seleccioná mascota → escribí motivo → "Unirme a la cola". Necesitás un veterinario online en la web para que la cola avance.
6. **Videollamada**: cuando un vet tome tu entry, vas a ver el botón "Iniciar videollamada" automáticamente (vía WebSocket).

---

## 📦 Build de APK con EAS

### Configuración inicial (una sola vez)

1. Crear cuenta en [expo.dev](https://expo.dev) (gratis).

2. Iniciar sesión desde la CLI:

   ```bash
   eas login
   ```

3. Asociar el proyecto a EAS:

   ```bash
   eas init --id <tu-project-id>
   ```

   Si no tenés un project ID, EAS te ofrece crear uno automáticamente.

### Build de preview (APK para testing interno)

```bash
npm run build:preview
```

Esto compila un APK firmado con una key de debug. Cuando termina (10-20 min), EAS te devuelve una URL para descargar el APK. Instalalo en cualquier dispositivo Android sin necesidad de PC conectada.

### Build de producción (APK distribuible)

```bash
npm run build:production
```

> 📝 En el MVP académico iOS está fuera de scope (requiere Apple Developer Account paga). Si en el futuro querés build iOS, agregá un perfil `ios` en `eas.json` y solicitá acceso a EAS Build iOS.

### Instalar el APK

```bash
# Descargar el APK
eas build:view [build-id]

# Instalar en dispositivo conectado por USB
adb install ./vetconnect.apk
```

---

## 🗂️ Estructura del proyecto

```
vetconnect-mobile/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx               # Root: providers + auth guard + offline banner
│   ├── (auth)/                   # Grupo de auth (sin tabs)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (app)/                    # Grupo principal (con bottom tabs)
│   │   ├── _layout.tsx           # Tab navigation + WebSocket lifecycle
│   │   ├── index.tsx             # Home (mascotas + accesos rápidos)
│   │   ├── pets/
│   │   │   ├── index.tsx         # Lista de mascotas
│   │   │   ├── [id].tsx          # Detalle + VetCard
│   │   │   └── new.tsx           # Alta de mascota
│   │   ├── chat/
│   │   │   ├── index.tsx         # Lista de conversaciones
│   │   │   └── [conversationId].tsx  # Chat activo
│   │   ├── queue/
│   │   │   └── index.tsx         # Unirse a cola + estado en vivo
│   │   ├── call/
│   │   │   └── [entryId].tsx     # Videollamada con LiveKit
│   │   └── history/
│   │       └── index.tsx         # Historial + valoración
│   └── +not-found.tsx
├── src/
│   ├── lib/                      # Infraestructura de comunicación
│   │   ├── api.ts                # Axios + interceptores (refresh token, envelope)
│   │   ├── ws.ts                 # WebSocket client (cola de espera)
│   │   ├── livekit.ts            # LiveKit room connect / toggle / disconnect
│   │   └── secure-storage.ts     # expo-secure-store wrapper (Keystore/Keychain)
│   ├── hooks/                    # Hooks de React Query + Zustand
│   │   ├── useAuth.ts
│   │   ├── usePets.ts
│   │   ├── useChat.ts
│   │   ├── useQueue.ts
│   │   ├── useConsultations.ts
│   │   ├── useLiveKit.ts
│   │   ├── useWebSocket.ts
│   │   └── useNetwork.ts
│   ├── stores/                   # Zustand (UI state)
│   │   ├── authStore.ts          # user, isAuthenticated, sessionExpired
│   │   ├── queueStore.ts         # myEntry, wsStatus
│   │   └── callStore.ts          # estado de videollamada
│   ├── services/                 # Capa fina sobre axios → endpoints REST
│   ├── components/
│   │   ├── ui/                   # Button, Input, Card, Modal, Badge, Skeleton, EmptyState
│   │   ├── PetCard.tsx
│   │   ├── ChatBubble.tsx
│   │   ├── QueueStatus.tsx
│   │   └── VideoCallView.tsx
│   ├── theme/                    # Paleta + tokens (espejo de apps/web/tailwind.config.js)
│   ├── types/                    # Schemas Zod + tipos (réplica de packages/shared-types)
│   ├── utils/                    # format.ts, permissions.ts
│   └── types/axios.d.ts          # Augmentación para unwrap de envelope
├── assets/                       # Iconos, splash
├── app.json                      # Expo config (nombre, plugins, permisos)
├── eas.json                      # Perfiles de build (development/preview/production)
├── metro.config.js               # Metro + NativeWind + WebRTC
├── babel.config.js               # babel-preset-expo + nativewind + module-resolver
├── tailwind.config.js            # Tailwind config (paleta, font sizes)
├── tsconfig.json
├── package.json
├── .env.example
├── .easignore
├── .gitignore
├── README.md                     # Este archivo
└── INTEGRATION.md                # Documento de integración con backend y web
```

---

## 🛠️ Solución de problemas

### `Unable to resolve module 'react-native-webrtc'`

Asegurate de haber corrido `npm install` y de **no** usar Expo Go (que no lo incluye). Usá `npm run android` (dev build) o un build de EAS.

### El WebSocket no conecta (`wsStatus: closed` o `error`)

1. Verificá que `EXPO_PUBLIC_WS_URL` apunte a un backend que tenga `/ws/queue` corriendo.
2. El backend debe aceptar el query param `?token=<jwt>`. Si el token expiró, la API layer hace refresh transparente.
3. Si estás en dispositivo físico, usá la IP de tu PC (no `localhost`).

### La videollamada cae / "No se pudo conectar a la videollamada"

- Verificá que el backend tenga las variables `LIVEKIT_HOST`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` configuradas.
- LiveKit necesita un servidor TURN/STUN si estás detrás de NAT. LiveKit Cloud free tier ya lo incluye.
- En Android, asegurate de que los permisos de cámara y micrófono estén concedidos (Configuración → Apps → VetConnect → Permisos).

### "Sesión expirada" en loop

Significa que el refresh token rotativo falló (probablemente reúso detectado — seguridad del backend). Cerrá la app, volvé a abrirla y logueate nuevamente.

### `expo-secure-store` no guarda valores en web

Es esperado: en web `expo-secure-store` no está disponible y el wrapper cae a `localStorage`. Solo usar web para debug de UI; los tokens en producción van en dispositivo físico.

### `npm install` falla con conflictos de `react-native-webrtc`

```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### App se cierra al abrir la cámara en Android

Faltan permisos en `app.json` o los permisos fueron revocados. Reinstalá la app o ejecutá:

```bash
adb shell pm reset-permissions com.pinnacle.vetconnect
```

---

## 🔗 Integración con backend y otras plataformas

La app móvil es parte del **monorepo VetConnect** y se integra con:

- **Backend** (`apps/backend`): consume todos los endpoints REST de los módulos SP-01 a SP-07 + WebSocket `/ws/queue`.
- **Web** (`apps/web`): comparte el mismo design system (paleta, tokens), los mismos schemas Zod (`packages/shared-types`) y el mismo protocolo WebSocket.
- **LiveKit**: tanto el backend como la web y la móvil usan el mismo servidor LiveKit (cloud o self-hosted).
- **Cloudinary** (opcional): para subida de fotos de mascotas (compartido con web).

📄 **La documentación detallada de integración está en [`INTEGRATION.md`](./INTEGRATION.md)** — incluye:
- Tabla completa de endpoints REST consumidos.
- Protocolo de eventos WebSocket.
- Esquema de autenticación móvil (desviación intencional respecto a web).
- Elementos compartidos con la web (paleta, schemas, tipos).
- Reglas de LiveKit (room naming, TTL, tokens).

---

## 👥 Equipo — Grupo Pinnacle

- **Tobias Vera** — líder técnico backend (SP-00, SP-01, SP-03, SP-06)
- **Juan Mendoza** — mobile (SP-09) + consultas (SP-04)
- **Damian Orellana** — frontend web (SP-08)
- **Ezequiel Charca** — pets (SP-02) + medical records (SP-05)
- **Lara Bouso** — PM + coordinación

**Curso:** 6° 2a — Profesores: Camila Lambertucci, Walter Perez.
**Timeline:** 19 semanas (junio – noviembre).
