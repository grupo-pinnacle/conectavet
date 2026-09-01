# 🏛️ Decisiones de Arquitectura (ADRs) — ConectaVet

Este registro documenta todas las decisiones arquitectónicas clave tomadas durante el diseño y evolución del sistema ConectaVet (v2.0 - FAANG Architecture).

---

## Índice de Decisiones (ADRs)

| ID | Título | Estado | Impacto |
|---|---|---|---|
| **ADR-001** | Monolito Modular vs Microservicios | Aprobado | Backend / Arquitectura |
| **ADR-002** | Prisma ORM 6 vs TypeORM / Drizzle | Aprobado | Base de Datos |
| **ADR-003** | PostgreSQL Cloud (Supabase) | Aprobado | Infraestructura |
| **ADR-004** | Autenticación JWT con Rotación & `tokenVersion` | Aprobado | Seguridad / Auth |
| **ADR-005** | Soft-Deletes & Anonimización Legal (Ley 25.326) | Aprobado | Legal / Compliance |
| **ADR-006** | Singleton de PrismaClient con Connection Pooling | Aprobado | Performance |
| **ADR-007** | Validación de Contratos con Zod | Aprobado | API Design |
| **ADR-008** | Estrategia de Tipos TypeScript Monorepo | Aprobado | Tipado / Mantenibilidad |
| **ADR-009** | Mensajería Tiempo Real con Socket.io & Redis Adapter | Aprobado | Realtime / Escalamiento |
| **ADR-010** | Almacenamiento Resiliente Multi-Cloud (S3 + Fallback Local) | Aprobado | Media / Storage |
| **ADR-011** | Notificaciones Push con Expo Push API & Bandeja In-App | Aprobado | Mobile / Push |
| **ADR-012** | Teleconsulta con WebRTC / LiveKit SFU | Aprobado | Video / Media |
| **ADR-013** | Sala de Espera Profesional para Veterinarios (SENASA) | Aprobado | Legal / Operaciones |
| **ADR-014** | Registro Inmutable de Auditoría (`AuditLog`) | Aprobado | Seguridad / Auditoría |
| **ADR-015** | TanStack React Query v5 para Caché y Sincronización Web | Aprobado | Frontend Web |
| **ADR-016** | Conexión Mobile USB Directa con ADB Reverse para Redes Corporativas | Aprobado | DevOps / DX |
| **ADR-017** | Despliegue Backend Autohosteado en Coolify (VPS) & Web en Vercel/Hostinger | Aprobado | Infraestructura / Cloud |
| **ADR-018** | Estrategia Tripartita de Distribución Android (EAS Play Store, APK Web y Local Build) | Aprobado | Mobile / Release |

---

## Detalle de Decisiones

### ADR-001: Monolito Modular vs Microservicios
- **Contexto:** Se requería definir el estilo arquitectónico del backend para soportar rápida iteración sin sacrificar orden ni modularidad.
- **Decisión:** Monolito modular basado en Domain-Driven Design (`modules/auth`, `modules/users`, `modules/pets`, `modules/consultations`, `modules/calls`, `modules/media`, `modules/notifications`).
- **Consecuencias:** Despliegue simple en un solo contenedor, latencia interna cero entre módulos y separación limpia de responsabilidades.

### ADR-004: Autenticación JWT con Rotación & `tokenVersion`
- **Contexto:** Si un token JWT es emitido y luego el usuario cambia su contraseña o es dado de baja, los tokens tradicionales permanecen válidos hasta su expiración.
- **Decisión:** Implementar un campo `tokenVersion` en el modelo `User`. Cada cambio de credenciales, logout global o baneo incrementa este contador. El middleware valida el payload JWT contra la versión activa en base de datos.
- **Consecuencias:** Revocación instantánea de sesiones sin necesidad de consultar tablas pesadas de listas negras de tokens.

### ADR-005: Soft-Deletes & Anonimización Legal (Ley 25.326)
- **Contexto:** La normativa sanitaria veterinaria y la Ley de Protección de Datos Personales prohíben la destrucción de registros médicos de pacientes, pero exigen el derecho al olvido para los usuarios.
- **Decisión:** Cuando un usuario solicita la baja, se ejecuta una anonimización de sus datos de contacto (email, teléfono, nombre), marcando `deletedAt = now()`. El historial clínico y las consultas de sus mascotas persisten inalterables vinculadas al ID anonimizado.
- **Consecuencias:** Cumplimiento legal pleno ante inspecciones judiciales y del SENASA.

### ADR-009: Mensajería Tiempo Real con Socket.io & Redis Adapter
- **Contexto:** Necesidad de chat en vivo y notificaciones globales con capacidad de escalar a múltiples nodos backend.
- **Decisión:** Integrar Socket.io acoplado con `@socket.io/redis-adapter` en clúster Redis.
- **Consecuencias:** Comunicación bidireccional instantánea con broadcast sincronizado entre todas las instancias del servidor.

### ADR-012: Teleconsulta con WebRTC / LiveKit SFU
- **Contexto:** Se requería soporte de videollamadas de alta fidelidad entre el panel Web de veterinarios y la aplicación móvil de tutores.
- **Decisión:** Utilizar LiveKit SFU (Selective Forwarding Unit) con tokens de acceso criptográficos generados por el backend y componentes WebRTC nativos/WebView.
- **Consecuencias:** Transmisión de video fluida con adaptación automática de bitrate ante conexiones móviles inestables.

### ADR-013: Sala de Espera Profesional para Veterinarios
- **Contexto:** Prevenir el ejercicio ilegal de la profesión veterinaria en la plataforma.
- **Decisión:** Nuevas cuentas con rol `VET` inician en estado `PENDING`. El acceso a la sala de atención y chat queda inhabilitado hasta que un Administrador valida la matrícula profesional y activa la cuenta a `APPROVED`.
- **Consecuencias:** Garantía de calidad médica y blindaje legal para la empresa.

### ADR-014: Registro Inmutable de Auditoría (`AuditLog`)
- **Contexto:** Trazabilidad estricta de acciones sensibles (aprobación de médicos, reseteo de usuarios, modificaciones de roles, bajas).
- **Decisión:** Crear tabla `AuditLog` no modificable donde se almacenan todas las mutaciones administrativas con IP y UserAgent.
- **Consecuencias:** Capacidad de auditoría forense en tiempo real.

### ADR-017: Despliegue Backend Autohosteado en Coolify (VPS) & Web en Vercel/Hostinger
- **Contexto:** Minimizar costos recurrentes en dólares sin perder las comodidades de una plataforma moderna (CI/CD, certificados SSL automáticos, gestión de variables de entorno y servicios auxiliares).
- **Decisión:** Desplegar el Backend Node.js y la instancia de Redis sobre un servidor VPS propio utilizando **Coolify**, y el Frontend Web SPA sobre **Vercel** (o Hosting Web estático de **Hostinger**).
- **Consecuencias:** Costo predecible y bajo (servidor VPS fijo de ~$4-8 USD/mes), control total sobre la infraestructura de WebSockets persistentes (Traefik) y CDN global para la Web.

### ADR-018: Estrategia Tripartita de Distribución Android
- **Contexto:** La publicación inicial en Google Play Store requiere un proceso de validación y pago de cuenta de desarrollador, mientras que las pruebas piloto requieren distribución rápida.
- **Decisión:** Soportar 3 vías de entrega: (1) EAS Build a Google Play Store (`.aab`) para lanzamiento masivo, (2) Generación directa de `.apk` descargable desde la web oficial para fase beta y tutores iniciales, y (3) Compilación nativa local con Gradle sin dependencia de cloud build.
- **Consecuencias:** Flexibilidad total para iniciar operaciones inmediatamente sin bloqueos burocráticos.

---
