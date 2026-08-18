---
name: systematic-debugging
description: Metodología para diagnosticar y corregir bugs de forma disciplinada, sin adivinar. Usar ante cualquier reporte de error, regresión o comportamiento inesperado.
---

# Systematic Debugging

Procedé en orden, sin saltarte pasos:

1. **Reproducir**: conseguí un paso a paso mínimo y fiable que dispare el problema. Sin reproducción no hay fix.
2. **Observar**: reuní evidencia real (logs, errores de consola, respuestas de red, estado de la BD, salida de `tsc`). No asumir la causa.
3. **Formular hipótesis**: listá las causas posibles ordenadas por probabilidad. Una sola hipótesis a la vez.
4. **Aislar**: acotá el alcance (¿es frontend, backend, red, datos?). Comentá o desactivá partes para encontrar el límite exacto del fallo.
5. **Verificar el fix**: el mismo paso que lo reproducía debe quedar en verde. Correr el typecheck/tests afectados.
6. **No recaer**: si el fix es un parche, dejá registrado por qué existe y la deuda técnica resultante.

Reglas de oro:
- Nunca edites a ciegas esperando que funcione. Cada cambio debe tener una razón.
- Preferí la causa raíz sobre el síntoma.
- Si no podés reproducir en el entorno, dicho explícitamente antes de tocar código.
