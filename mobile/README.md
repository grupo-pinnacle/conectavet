# VetConnect Mobile 📱🐾

> App móvil de **VetConnect** — plataforma de telesalud veterinaria del Grupo Pinnacle.
> Esta app es para **dueños de mascotas (CLIENT)** construida con **React Native + Expo**.

---

## ✨ Características (MVP)

- ✅ **Registro y login** con JWT rotativo y almacenamiento seguro
- ✅ **CRUD de mascotas** + subida de fotos a Cloudinary
- ✅ **Chat con veterinario** durante consulta activa
- ✅ **Solicitar consulta** simple (sin cola automática)
- ✅ **Historial de consultas** con diagnóstico, tratamiento y valoración
- ✅ **VetCard** — perfil digital de la mascota
- ✅ **Manejo de conectividad** — banner offline

---

## 🧰 Stack

| Capa | Tecnología |
|------|------------|
| Framework | React Native + Expo SDK 51 |
| Navegación | Expo Router (file-based) |
| Estilos | NativeWind v4 (Tailwind) |
| Server state | TanStack React Query 5.x |
| UI state | Zustand 4.x |
| HTTP | Axios con interceptores de refresh |
| Secure storage | expo-secure-store |
| Imágenes | expo-image-picker + Cloudinary |

---

## 🚀 Desarrollo

```bash
cd mobile
npm install
npx expo start       # QR con Expo Go
npx expo start --tunnel  # Si no funciona en la misma red
```

**Requiere el backend** corriendo en `http://localhost:3001`.

Configurar IP en `.env`:
```
EXPO_PUBLIC_API_URL=http://192.168.1.x:3001
```

---

## 📁 Estructura

```
mobile/
├── app/                          # Expo Router (file-based)
│   ├── _layout.tsx               # Root: providers, auth guard
│   ├── (auth)/                   # Login + Register
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (app)/                    # App principal con tabs
│   │   ├── _layout.tsx           # Tab: Inicio, Mascotas, Consultas, Chat, Perfil
│   │   ├── index.tsx             # Home con accesos rápidos
│   │   ├── pets/                 # CRUD mascotas
│   │   ├── chat/                 # Chat con veterinario
│   │   ├── queue/                # Solicitar consulta
│   │   └── history/              # Historial + valoración
│   └── +not-found.tsx
├── src/
│   ├── components/               # UI components compartidos
│   ├── hooks/                    # Custom hooks
│   ├── stores/                   # Zustand stores
│   ├── services/                 # API layer
│   ├── theme/                    # Tokens (misma paleta que web)
│   ├── types/                    # Zod schemas + types
│   └── utils/                    # Helpers
└── assets/
```

---

## 🎨 Design System

Misma paleta que la web:

| Token | Color |
|-------|-------|
| Primary | `teal-700` (#0F766E) |
| Accent | `green-600` (#16A34A) |
| Surface | `slate-50` (#F8FAFC) |
| Ink | `slate-900` (#0F172A) |
| Danger | `red-600` (#DC2626) |

Componentes: Button (6 variants), Input, Card (3 variants), Badge (3 variants), Modal, Skeleton, EmptyState, Avatar.

---

## 👥 Equipo

**Grupo Pinnacle** — 6° 2da · Desarrollo de Apps
- **Juan Mendoza** — Mobile Developer
- **Tobias Vera** — Backend + integración
