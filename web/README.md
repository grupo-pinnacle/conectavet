# VetConnect — Frontend Web 🖥️🐾

> Panel de administración para veterinarios y portal para clientes de VetConnect.
> **Stack:** React 19 + Vite 8 + TypeScript + TailwindCSS

---

## 🧰 Stack

| Tecnología | Versión |
|-----------|---------|
| React | 19.x |
| Vite | 8.x |
| TypeScript | 5.x |
| TailwindCSS | 3.x |
| React Router | 7.x |
| Axios | 1.x |
| Socket.io client | 4.x |
| Lucide React | (iconos) |

---

## 📁 Estructura

```
src/
├── components/
│   ├── Button.tsx          # 6 variantes, 3 tamaños
│   ├── input.tsx           # Con label, error, hint, icono
│   ├── Card.tsx            # Elevated, outlined, ghost
│   ├── Badge.tsx           # Filled, soft, outlined
│   ├── Logo.tsx            # Logo SVG + wordmark
│   ├── ProtectedRoute.tsx  # Guard por autenticación + rol
│   └── dashboard/
│       ├── HomeSection.tsx
│       ├── PetsSection.tsx
│       ├── ConsultationsSection.tsx
│       ├── HistorySection.tsx
│       ├── MessagesSection.tsx
│       ├── ProfileSection.tsx
│       └── vet/
│           ├── VetHomeSection.tsx
│           ├── PatientsSection.tsx
│           └── VetMessagesSection.tsx  # Chat + cerrar consulta
├── pages/
│   ├── LandingPage.tsx     # Landing profesional
│   ├── LoginPage.tsx       # Login con validación
│   ├── RegisterPage.tsx    # Registro con selector de rol
│   ├── DashboardPage.tsx   # Dashboard cliente (6 secciones)
│   └── VetDashboardPage.tsx # Dashboard vet (3 secciones)
├── context/AuthContext.tsx  # Estado global de auth
├── hooks/useAuth.ts
├── services/
│   ├── api.ts              # Axios con interceptores
│   └── endpoints.ts        # Funciones tipadas por recurso
├── types/index.ts          # Interfaces compartidas
└── index.css               # Tailwind + animaciones custom
```

---

## 🚀 Desarrollo

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # → dist/
```

**Requiere el backend corriendo** en `http://localhost:3001`.

---

## 🎨 Design System

Paleta unificada con la app mobile:

| Token | Color |
|-------|-------|
| Primary | `teal-700` (#0F766E) |
| Accent | `green-600` (#16A34A) |
| Surface | `slate-50` (#F8FAFC) |
| Ink | `slate-900` (#0F172A) |
| Border | `slate-200` (#E2E8F0) |
| Danger | `red-600` (#DC2626) |

Componentes: Button, Input, Card, Badge, Logo — mismos variants que mobile.
