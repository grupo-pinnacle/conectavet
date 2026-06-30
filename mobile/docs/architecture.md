# Arquitectura — VetConnect Mobile

## Diagrama de capas

```
┌────────────────────────────────────────────────────────────┐
│                       Expo Router (app/)                    │
│                  Pantallas + navegación                     │
└────────────────────────────┬───────────────────────────────┘
                             │ usa
                             ▼
┌────────────────────────────────────────────────────────────┐
│                       src/hooks/                            │
│   useAuth, usePets, useChat, useQueue, useLiveKit,          │
│   useConsultations, useWebSocket, useNetwork                │
│                                                              │
│   (combinan React Query + Zustand + ciclo de vida)          │
└──────┬──────────────┬──────────────┬────────────────────────┘
       │              │              │
       ▼              ▼              ▼
┌──────────┐  ┌──────────────┐  ┌──────────────────┐
│ services │  │   stores/    │  │     lib/         │
│ (axios   │  │ (Zustand)    │  │ api, ws,         │
│  wrappers│  │              │  │ livekit,         │
│  por     │  │ authStore    │  │ secure-storage   │
│  módulo) │  │ queueStore   │  │                  │
│          │  │ callStore    │  │                  │
└────┬─────┘  └──────────────┘  └────────┬─────────┘
     │                                   │
     └───────────────┬───────────────────┘
                     ▼
            ┌─────────────────┐
            │   src/types/    │
            │  Zod schemas +  │
            │  TS types       │
            │  (réplica de    │
            │  shared-types)  │
            └─────────────────┘
```

## Principios

1. **Separación estricta de capas**: las pantallas solo consumen hooks. Los hooks combinan React Query (server state), Zustand (UI state) y lib (clients). Los servicios solo saben de endpoints REST.

2. **Unidireccionalidad del estado**: las mutaciones REST invalidan queries → React Query refetch → UI re-renderiza. WebSocket events actualizan el `queueStore` directamente → UI re-renderiza.

3. **Fail-fast con toast**: ningún error de API se muestra crudo al usuario. El interceptor Axios normaliza todo a `ApiError` y los hooks muestran Toast.

4. **Reconexión transparente**: WebSocket y React Query reconectan solos. El usuario solo ve el banner "Sin conexión" cuando NetInfo reporta offline real.

5. **Hooks siempre corren**: en pantallas con branches condicionales (como `call/[entryId].tsx`), los hooks se llaman antes de cualquier return para respetar las Rules of Hooks.

## Convenciones

- **Archivos**: `kebab-case.ts` (regla del Prompt Maestro §5).
- **Componentes**: `PascalCase.tsx`.
- **Hooks**: `use<Recurso>.ts` en `src/hooks/`.
- **Stores**: `<recurso>Store.ts` en `src/stores/`.
- **Imports**: alias `@/` para `src/`, `@app/` para `app/`.
- **Sin `any`**: TypeScript strict. Cuando es estrictamente necesario, `unknown` + type guard.
- **Sin `console.log`**: ESLint warn. Solo `console.warn`/`console.error` en lib con mensajes sin PII.

## Testing

- Tests unitarios de hooks críticos: pendiente para SP-11.
- Tests e2e con Detox: opcional, si hay tiempo (spec SP-09 §Tests mínimos).
- Cobertura objetivo: 70% en hooks, 90% en `src/lib/`.

## Build & deploy

- **Dev**: `npm run android` (Expo dev client + emulador/dispositivo).
- **Preview APK**: `npm run build:preview` → EAS Build → distribute internal.
- **Production APK**: `npm run build:production` → EAS Build → distribute.
- **OTA updates**: configurables vía `expo-updates` (no habilitado en MVP).

Ver `README.md` para instrucciones detalladas y `INTEGRATION.md` para el contrato con backend y web.
