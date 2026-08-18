---
name: tdd
description: Desarrollo guiado por tests. Escribir el test que falla primero, luego el código mínimo que lo hace pasar, y refactorizar. Usar para cualquier lógica nueva o corrección de bug.
---

# Test-Driven Development (TDD)

Ciclo Red-Green-Refactor:

1. **Red**: escribí un test pequeño que describe el comportamiento deseado y que FALLA (porque el código no existe o está roto).
2. **Green**: escribí la implementación mínima para que el test pase. Sin sobre-ingeniería.
3. **Refactor**: mejorá el código manteniendo los tests en verde.

Principios:
- Tests rápidos y aislados; mockeá dependencias externas (BD, red, reloj).
- Un test por comportamiento; nombres que expliquen el caso.
- Si un bug se escapó, primero el test que lo demuestra, después el fix.
- Los tests son documentación viva: deben ser legibles.
