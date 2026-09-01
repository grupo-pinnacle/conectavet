# VetConnect (v2.0 - FAANG Architecture)

Plataforma de telemedicina veterinaria Full Stack, diseñada bajo estándares de ingeniería de software de primer nivel. Conecta a dueños de mascotas con médicos veterinarios certificados, permitiendo consultas en tiempo real (Chat y Video), emisión de recetas digitales, e integración de historial clínico cumpliendo normativas del SENASA y la Ley de Protección de Datos.

## 🚀 Arquitectura y Trazabilidad Legal

Toda la documentación técnica del sistema, decisiones arquitectónicas y cumplimiento normativo se encuentran consolidados en un único documento maestro:

👉 **[Ver Documentación de Arquitectura (ARCHITECTURE.md)](docs/ARCHITECTURE.md)**

### Puntos Destacados:
- **Validación Legal:** Flujo de "Sala de Espera" (Pending) para verificar matrículas veterinarias antes de operar.
- **Auditoría Estricta:** Registro inmutable de acciones (AuditLogs) para administradores.
- **Protección de Historias Clínicas (Ley 25.326):** Implementación rigurosa de *Soft-Deletes* y anonimización.
- **Tiempo Real Distribuido:** Sockets sincronizados con Redis.

---

## 💻 Requisitos previos

| Herramienta | Versión | Instalación |
|-------------|---------|-------------|
| Node.js | >= 18 | [nodejs.org](https://nodejs.org) |
| Git | >= 2.0 | [git-scm.com](https://git-scm.com) |
| Expo Go | última | App en Play Store (solo mobile) |

No es necesario instalar PostgreSQL local — la base de datos corre en **Supabase** (cloud).

---

## 🛠️ Setup Local Rápido

El proyecto está configurado para arrancar de forma inmediata mediante scripts automatizados que resuelven IPs dinámicas y adaptadores de red.

### 1. Backend y Frontend Web (Terminal 1)
`ash
# Inicia el backend (puerto 3001) y la Web (puerto 5173) simultáneamente
.\run.bat
`

### 2. Mobile App (Terminal 2)
`ash
# Inicia Expo, detecta la IP de tu PC en la red local y actualiza los entornos automáticamente
.\start.ps1
`

> **Nota:** start.ps1 inyecta automáticamente tu IP local en el backend (CORS) y en la app mobile para que puedas probar la aplicación desde tu celular conectado al mismo WiFi sin configurar Ngrok manualmente.

### 3. Sincronizar Base de Datos (Opcional)
Si hay cambios en el esquema de la base de datos (schema.prisma):
`ash
cd backend
npx prisma db push
npx prisma generate
`

---

## 🛡️ Estructura del Monorepo

\\\	ext
conectavet/
├── backend/          # API Node.js/Express + Prisma + Socket.io
├── web/              # React 18 + Vite (Dashboard Veterinarios y Admins)
├── mobile/           # React Native / Expo (App para Dueños de Mascotas)
└── docs/             # Documentación consolidada de arquitectura
\\\

---

## 👨‍💻 Equipo

- **Tobias Vera** (Backend Developer)
- **Juan Mendoza** (Mobile Developer)
- **Damian Orellana** (Web Developer)
- **Ezequiel Charca** (QA / Designer)
- **Lara Bouso** (Project Manager)

*Proyecto académico - Grupo Pinnacle - 2025*
