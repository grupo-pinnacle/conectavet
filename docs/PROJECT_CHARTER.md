# 📜 PROJECT CHARTER: CONECTAVET (VetConnect)
## Plataforma Integral de Telemedicina Veterinaria & Gestión Clínica de Alta Disponibilidad
**Document ID:** `CHARTER-CONECTAVET-2026-V2`  
**Autor:** Senior / Staff Technical Program Manager & Solutions Architect (FAANG Tier)  
**Organización:** Grupo Pinnacle / ConectaVet Team  
**Fecha de Emisión:** Septiembre 2026  
**Estado:** `APPROVED (ACTIVE GOVERNANCE CHARTER)`  
**Nivel de Estándar:** FAANG Engineering Governance (Google / Meta / Stripe / Vercel level)  

---

## 1. Resumen Ejecutivo & Mandato de Autorización

### 1.1 Mandato del Proyecto
El presente **Project Charter** otorga formalmente la autoridad al equipo de ingeniería de ConectaVet para planificar, ejecutar, asegurar y desplegar la plataforma **ConectaVet (VetConnect) v2.0**. Este documento establece los objetivos estratégicos, los límites del alcance, la estructura de gobernanza, el presupuesto operativo de infraestructura y el criterio riguroso de *Definition of Done (DoD)* bajo estándares de ingeniería de primer nivel.

### 1.2 Declaración de Propósito
ConectaVet nace para proveer una solución tecnológica escalable, resiliente y legalmente blindada para la telemedicina veterinaria en América Latina, facilitando la atención clínica primaria de animales de compañía, garantizando la validación de matrículas profesionales y asegurando la integridad de las historias clínicas conforme a la legislación vigente.

---

## 2. Justificación del Negocio & Alineación Estratégica

### 2.1 Caso de Negocio (Business Case)
El mercado veterinario en América Latina carece de plataformas telemáticas reguladas. Más del **70% de los hogares poseen mascotas**, pero la atención fuera de horarios comerciales se encuentra colapsada, empujando a los tutores a la automedicación de animales o a la consulta precaria por canales de mensajería informal (WhatsApp).
* **Riesgo Sanitario:** Pérdida de vidas animales por administración de fármacos contraindicados.
* **Riesgo Legal para Profesionales:** Ejercicio telemático sin registro auditable ni consentimiento informado.
* **Oportunidad:** Construir la plataforma de telemedicina líder que integre triaje en tiempo real, videollamadas con adaptabilidad de bitrate, recetas digitales oficiales y repositorio clínico interoperable.

### 2.2 Alineación con Normativas Sanitarias y de Privacidad (Argentina / LatAm)
- **Ley N° 25.326 de Protección de los Datos Personales:** Implementación de protocolos de *Soft-Delete* con disociación y anonimización de PII, preservando la inmutabilidad de la historia clínica médica ante auditorías judiciales.
- **Resoluciones SENASA & Colegios Médicos Veterinarios:** Procedimiento obligatorio de verificación documental y validación manual de matrículas profesionales habilitantes antes de permitir la atención a pacientes.

---

## 3. Alcance del Proyecto & Estructura de Desglose del Trabajo (WBS)

### 3.1 Matriz de Alcance: En Alcance vs. Fuera de Alcance

```mermaid
flowchart LR
    subgraph Core["🐾 ConectaVet v2.0 Scope Architecture"]
        direction TB
        ScopeIn["✅ En Alcance (In-Scope v2.0)"]
        ScopeOut["❌ Fuera de Alcance (Non-Goals)"]
    end

    ScopeIn --> A1["IAM: JWT con rotacion atomica (tokenVersion)"]
    ScopeIn --> A2["Ficha Clinica Digital de Mascotas"]
    ScopeIn --> A3["Cola Triage Inteligente y Auto-Asignacion"]
    ScopeIn --> A4["Chat en Tiempo Real Idempotente (clientMsgId)"]
    ScopeIn --> A5["Videoconsulta WebRTC LiveKit SFU"]
    ScopeIn --> A6["Receta Medica Digital con Validacion QR"]
    ScopeIn --> A7["Sala de Espera Profesional SENASA"]
    ScopeIn --> A8["AuditLog Inmutable de Acciones Admin"]
    ScopeIn --> A9["Infraestructura VPS Coolify, Traefik y Vercel"]

    ScopeOut --> B1["Despacho de Ambulancias o Rescates Fisicos"]
    ScopeOut --> B2["E-commerce y Venta de Alimentos/Insumos"]
    ScopeOut --> B3["Sustitucion de Vacunacion Obligatoria Presencial"]
    ScopeOut --> B4["Pasarela de Cobros o Split Payments v2.0"]
```

### 3.2 Desglose del Trabajo WBS (Work Breakdown Structure)

```
1.0 ConectaVet Ecosistema Core
  ├── 1.1 Seguridad, IAM & Base de Datos
  │     ├── 1.1.1 Esquema PostgreSQL relacional con Prisma ORM 6
  │     ├── 1.1.2 Sincronización estricta de nombres de columnas (@map)
  │     ├── 1.1.3 Autenticación JWT con tokenVersion y cookies HttpOnly
  │     └── 1.1.4 Pipeline de Soft-Delete y anonimización de PII
  ├── 1.2 Motor de Tiempo Real & Multimedia
  │     ├── 1.2.1 Clúster Socket.io con Redis Adapter distribuido
  │     ├── 1.2.2 Deduplicación de mensajería con clientMsgId
  │     ├── 1.2.3 Señalización y emisión de tokens WebRTC LiveKit SFU
  │     └── 1.2.4 Almacenamiento S3 con verificación de Magic Bytes
  ├── 1.3 Aplicación Móvil de Tutores (React Native / Expo)
  │     ├── 1.3.1 Gestión de fichas clínicas de mascotas
  │     ├── 1.3.2 Solicitud de triaje y visualización de cola
  │     ├── 1.3.3 Chat bidireccional y visor de recetas descargables
  │     └── 1.3.4 WebView optimizado con permisos de hardware para LiveKit
  ├── 1.4 Panel Web Profesional de Veterinarios (React 19 / Vite)
  │     ├── 1.4.1 Módulo de atención telemática con controles de videollamada
  │     ├── 1.4.2 Generador de recetas médicas estructuradas con QR
  │     └── 1.4.3 Registro de evolución clínica y notas de diagnóstico
  ├── 1.5 Panel de Control & Auditoría Legal (Web Admin)
  │     ├── 1.5.1 Flujo de aprobación de matrículas profesionales
  │     ├── 1.5.2 Visor inmutable de AuditLogs
  │     └── 1.5.3 Métricas de utilización y balanceo de guardias
  └── 1.6 Despliegue Cloud & Operaciones
        ├── 1.6.1 Orquestación VPS con Coolify y Traefik Reverse Proxy
        ├── 1.6.2 Despliegue Frontend Web en CDN Edge (Vercel)
        └── 1.6.3 Compilación y empaquetado móvil vía Expo EAS
```

---

## 4. Cronograma de Hitos & Camino Crítico

```mermaid
gantt
    title Cronograma Estrategico de Hitos ConectaVet
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d

    section Hito 0 (M0)
    Cimientos y Hardening de Seguridad         :crit, done, m0, 2026-08-15, 2026-08-22
    section Hito 1 (M1)
    Core Telemedico y Video LiveKit           :done, m1, 2026-08-23, 2026-09-02
    section Hito 2 (M2)
    Cumplimiento Legal y Validacion SENASA    :done, m2, 2026-09-03, 2026-09-11
    section Hito 3 (M3)
    Quality Engineering y Testing Integral    :active, m3, 2026-09-12, 2026-09-22
    section Hito 4 (M4)
    Despliegue Productivo y Go-Live           :m4, 2026-09-23, 2026-10-05
```

| Hito | Nombre | Entregables Principales | Estado |
|---|---|---|---|
| **M0** | **Cimientos & Hardening de Seguridad** | Purgado de secretos en Git, rotación de claves, paridad `@map` Prisma, types unificados. | `COMPLETED` |
| **M1** | **Core Telemédico & Video LiveKit** | Redis Adapter activo, LiveKit Web/Mobile funcional, subida de archivos segura a S3/local. | `COMPLETED` |
| **M2** | **Cumplimiento Legal & Recetas** | Flujo Sala de Espera SENASA, Soft-Deletes probados, recetas con QR y AuditLog. | `COMPLETED` |
| **M3** | **Quality Engineering & Concurrencia** | Tests de WebSockets, cobertura backend $> 80\%$, smoke tests E2E con Playwright. | `IN PROGRESS` |
| **M4** | **Despliegue Productivo & Go-Live** | Backend en VPS Coolify con SSL Traefik, Web en Vercel, EAS Android AAB/APK y APM. | `PLANNED` |

---

## 5. Gobernanza del Equipo & Matriz de Responsabilidades (RACI)

```
+-----------------------------------------------------------------------------------------+
|                                    MATRIZ RACI                                          |
+------------------------------------+--------+--------+--------+----------+--------------+
| Módulo / Iniciativa                | Tobias |  Juan  | Damian | Ezequiel |     Lara     |
|                                    | (Tech) | (Mob.) | (Web)  |   (QA)   | (PM / Legal) |
+------------------------------------+--------+--------+--------+----------+--------------+
| Arquitectura de API & Base Datos   |  A/R   |   C    |   C    |    I     |      I       |
| Infraestructura Redis & WebSockets |  A/R   |   C    |   C    |    I     |      I       |
| App Móvil React Native (Expo)      |   C    |  A/R   |   I    |    C     |      I       |
| Frontend Web (React 19 / Vite)     |   C    |   I    |  A/R   |    C     |      I       |
| Teleconsulta LiveKit SFU           |   C    |   R    |   R    |    A     |      I       |
| Pruebas Automatizadas & QA         |   C    |   C    |   C    |   A/R    |      I       |
| Validación Legal SENASA & PII      |   C    |   I    |   I    |    I     |     A/R      |
| Despliegue VPS Coolify & EAS       |  A/R   |   R    |   R    |    C     |      I       |
+------------------------------------+--------+--------+--------+----------+--------------+
```
*Leyenda: **A** = Accountable (Aprobador final); **R** = Responsible (Ejecutor); **C** = Consulted (Consultado); **I** = Informed (Informado).*

---

## 6. Recursos, Infraestructura & Presupuesto Operativo

El sistema prioriza una arquitectura de **bajo costo recurrente y alto rendimiento**, utilizando servicios autohospedados modernos combinados con capas gratuitas o eficientes de servicios cloud:

| Capa | Proveedor / Tecnología | Propósito | Costo Estimado |
|---|---|---|---|
| **Cómputo Backend** | VPS Ubuntu 24.04 (Hostinger / Hetzner) | Host de Coolify, ConectaVet API (Docker) y Redis Server | \$8 - \$15 USD / mes |
| **Base de Datos** | Supabase Managed PostgreSQL | Base de datos relacional con backups diarios y réplicas | \$0 - \$25 USD / mes |
| **Frontend Web** | Vercel Edge Network | Despliegue SPA global con CDN, HTTPS automático y compresión | \$0 (Hobby / Pro) |
| **Media WebRTC** | LiveKit Cloud / LiveKit Self-hosted | Servidor SFU para videollamadas de baja latencia | Free tier / \$10 USD |
| **Almacenamiento** | Amazon S3 / Cloudinary (con fallback local) | Almacenamiento seguro de adjuntos médicos y avatares | \$1 - \$5 USD / mes |
| **Distribución Mobile** | Expo Application Services (EAS) | Compilación en la nube de binarios Android (AAB/APK) | Free tier |

---

## 7. Matriz de Gestión de Riesgos & Amenazas

| ID | Riesgo Identificado | Severidad | Probabilidad | Estrategia de Mitigación / Contingencia |
|---|---|---|---|---|
| **R-01** | **Fuga de credenciales en commits de Git** | P0 (Crítico) | Alta | Purgar el árbol de Git mediante `git-filter-repo` y rotar todas las llaves (`JWT_SECRET`, Supabase, LiveKit). |
| **R-02** | **Desincronización de columnas Prisma vs SQL** | P0 (Crítico) | Media | Mapeo explícito `@map` en `schema.prisma` y verificación en CI (`prisma migrate status`). |
| **R-03** | **Degradación de llamada en conexiones 4G débiles** | P1 (Alto) | Alta | Implementar simulcast y streaming adaptativo en LiveKit; fallback a chat con imágenes. |
| **R-04** | **Rechazo de app en Google Play Store** | P1 (Alto) | Media | Ajuste estricto de políticas de privacidad para apps de salud y justificación de permisos en `app.json`. |
| **R-05** | **Agotamiento del pool de conexiones PostgreSQL** | P2 (Medio) | Baja | Singleton `PrismaClient` con pool acotado (`limit=20`) y Supabase Connection Pooler habilitado. |

---

## 8. Criterio de "Listo para Producción" (Definition of Done - DoD)

Para que cualquier componente o versión de ConectaVet sea promovido a Producción bajo estándar FAANG, debe cumplir:
1. **Compilación Limpia:** `npx tsc --noEmit` ejecuta con **0 errores** en `backend`, `web` y `mobile`.
2. **Linting Estricto:** Cero advertencias (`warnings`) sin justificar en pipelines de análisis estático.
3. **Tests Automatizados:** $100\%$ de la suite de Jest en backend ejecutada en verde ($> 150\text{ pruebas}$).
4. **Zero-Secrets:** Ningún archivo `.env` o credencial privada presente en el repositorio.
5. **Auditoría de Accesibilidad:** Cumplimiento de WCAG 2.1 AA en todas las vistas críticas de tutores y veterinarios.
6. **Resiliencia de Red:** Reconexión automática de WebSockets validada ante cortes abruptos de conexión.
7. **Documentación Viva:** Documentos técnicos actualizados reflejando el código fuente en el mismo pull request.

---

## 9. Aprobación y Firmas de Autorización

| Nombre | Rol | Estado | Fecha |
|---|---|---|---|
| **Tobias Vera** | Lead Backend Engineer & Tech Lead | `APPROVED` | 2026-09-12 |
| **Juan Mendoza** | Lead Mobile Developer | `APPROVED` | 2026-09-12 |
| **Damian Orellana** | Lead Web Frontend Developer | `APPROVED` | 2026-09-12 |
| **Ezequiel Charca** | QA Engineer & Product Designer | `APPROVED` | 2026-09-12 |
| **Lara Bouso** | Project Manager & Legal Operations | `APPROVED` | 2026-09-12 |
