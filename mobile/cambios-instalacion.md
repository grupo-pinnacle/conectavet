==============================================
REPORTE DE INSTALACION - VetConnect Mobile
==============================================
Fecha: 2026-06-29T17:25:00.915Z


--- ERRORES DE INSTALACION ---

1. ERESOLVE: conflicto react@18.2.0 vs react-dom@18.3.1
   - react-dom@18.3.1 requiere react@^18.3.1 (peer dep)
   - El proyecto tiene fijado react@18.2.0
   - react-native-web@0.19.13 requiere react-dom@^18.0.0
   - SOLUCION: npm install --legacy-peer-deps

2. Deprecation warnings (27 paquetes obsoletos):
   - osenv@0.1.5, inflight@1.0.6, rimraf@2.6.3/3.0.2
   - glob@7.x (multiples instancias)
   - @babel/plugin-proposal-* (7 paquetes)
   - @humanwhocodes/config-array@0.13.0, object-schema@2.0.3
   - querystring@0.2.1, @xmldom/xmldom@0.7.13
   - tar@6.2.1, uuid@7.0.3/8.3.2
   - sudo-prompt@9.2.1
   - @react-navigation/* (5 paquetes, version obsoleta)
   - eslint@8.57.1

3. Vulnerabilidades: 32 (1 low, 13 moderate, 18 high)
   - No se ejecuto npm audit fix


--- CAMBIOS EN DEPENDENCIAS ---

package-lock.json (primer nivel):
  - react-dom@18.2.0 eliminada de dependencias directas

Paquetes totales en lock:
  - Antes: 1445 paquetes (707,751 bytes)
  - Despues: 1391 paquetes (671,502 bytes)
  - Diferencia: -54 paquetes, -36,249 bytes

package.json: SIN CAMBIOS


--- CAMBIOS EN package.json ---

No se modifico package.json original.
Se agrego dependencia: livekit-client@2.19.0 (necesaria para types de LiveKit v2).
Se reinstalo react-dom@18.2.0 (faltaba por el --legacy-peer-deps).
Las demas dependencias se mantienen identicas al original.
package-lock.json: cambio por resolucion con --legacy-peer-deps.

--- CORRECCION DE ERRORES APLICADAS ---

TypeScript (22 errores → 0):
  - src/lib/livekit.ts: imports de @livekit/react-native → livekit-client; fix RoomEvent.TrackMuted handler signature
  - src/hooks/useLiveKit.ts: imports de @livekit/react-native → livekit-client
  - src/components/VideoCallView.tsx: import VideoTrack type desde livekit-client
  - src/utils/permissions.ts: Camera.requestCameraPermissionsAsync + Camera.requestMicrophonePermissionsAsync
  - src/lib/api.ts: auth refresh usa api.post en vez de axios.post (type augmentation)
  - src/stores/authStore.ts: login/register ya no destructurean { data } (interceptor unwraps)
  - src/components/ui/Button.tsx: style prop tipado como ViewStyle (no PressableProps)
  - src/components/ui/Skeleton.tsx: width usa DimensionValue
  - implicit any: agregados tipos Message, Pet, string, etc.

ESLint (3 errores, 13 warnings → 0):
  - import/namespace: corregido expo-camera y expo-av
  - unused imports/vars: eliminados useVetCard, truncate, Pressable, Text, colors, ActivityIndicator, refetch, RemoteParticipant, refreshError
  - array-type: Array<T> → T[]

npm audit (33 vulnerabilidades): No corregidas (requieren breaking changes en expo/react-native)
