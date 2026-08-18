---
name: frontend-design
description: Criterios de UI/UX y calidad de código para web y mobile. Usar al crear pantallas, componentes o flujos de usuario.
---

# Frontend Design

Accesibilidad (a11y):
- Foco visible, orden de tabulación lógico, `aria-*` donde aplique.
- Contraste suficiente; no dependas solo del color.
- Textos alternativos en imágenes, labels en inputs.

Estados:
- Siempre loading, empty y error states explícitos y accionables.
- Feedback inmediato en acciones (loading en botones, toasts).

Patrones:
- Separá estado (hooks/store) de presentación (componente tonto).
- Componentes pequeños y reutilizables; tokens de tema (color/tipografía/espaciado), no valores hardcodeados.
- Optimistic UI solo con rollback ante fallo.
- Deep links y rutas bien definidas; navegación predecible.

Calidad:
- TypeScript estricto; sin `any` en bordes públicos.
- Sin código muerto ni pantallas duplicadas.
