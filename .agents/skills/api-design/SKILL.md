---
name: api-design
description: Diseñar APIs HTTP coherente, versionada y segura. Usar al crear rutas, contratos de request/response o cambiar el backend.
---

# API Design

- **Recursos y sustantivos**: `/consultations`, `/pets`; acciones via método o sub-recurso (`/consultations/:id/messages`).
- **Versionado**: prefijá `/api/v1` y evitá romper contratos; los cambios incompatibles son nueva versión.
- **Respuestas envoltorio**: `{ success, data, message, errors }` consistente en toda la API.
- **Códigos**: 200 ok, 201 creado, 400 entrada inválida, 401 no auth, 403 sin permiso, 404 no existe, 409 conflicto, 429 rate limit, 500 inesperado.
- **Authz**: validá ownership en el servidor, no confíes en el cliente (evitá IDOR).
- **Paginación**: `page/limit` para listas chicas; cursor keyset para listas grandes.
- **Rate limit** y **CORS** explícitos por entorno.
- **Documentación**: el contrato debe ser evidente desde los tests de integración.
