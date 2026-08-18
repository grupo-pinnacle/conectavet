---
name: error-handling
description: Diseñar manejo de errores robusto y predecible en backend y frontend. Usar al tocar servicios, controladores, validaciones o UI.
---

# Error Handling

Backend:
- Errores operacionales como excepciones tipadas (`AppError` con `statusCode`), no strings sueltos.
- Validad entrada en el borde (zod/esquemas) y devolvé 400 claros; no dejes que falle adentro.
- Nunca expongas stacks ni datos internos al cliente. Mensajes genéricos para el usuario, detalle en el log.
- Errores esperados (recurso no encontrado, sin permiso) devuelven 404/403, no 500.

Frontend:
- Try/catch en efectos async; estados de loading/error/empty explícitos.
- Mostrá mensajes accionables, no técnicos.
- No dejes pantallas en blanco ante un fallo: siempre un empty/error state.

Transversal:
- Idempotencia en operaciones sensibles (pagos, envíos).
- Logs estructurados con contexto (userId, requestId) para debug.
