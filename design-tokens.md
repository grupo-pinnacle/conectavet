# design-tokens.md — Sistema de diseño reconstruido (ConectaVet)

> **Fuente:** extracción analítica de los frames PNG de `Prototipado/` (Figma no exportó Variables; los SVG eran ráster empaquetado). Se muestrearon los píxeles reales de los frames con `sharp` para obtener la paleta de marca.
> **Estado:** ✅ **VALIDADO POR EL HUMANO (27-ago-2026).** Web sigue el Figma 1:1; mobile reusa estos tokens con layout propio.
> **Precisión:** los colores de marca (azul/texto/fondo) son **medidos**, no adivinados. Los tonos secundarios (hover/disabled/surface) son **inferencias T3-ish** coherentes y deben ajustarse al ojo contra el PNG.

---

## 1. Paleta extraída (medida de los PNG)

| Token | Hex medido | RGB | Uso |
|-------|-----------|-----|-----|
| `brand` (primary) | `#1C60F0` | 28,96,240 | Botones primarios, activos, links, acentos. Variaciones observadas: `#044CF4`, `#0C4CD4`, `#245CCC`. |
| `brand-strong` | `#0C4CD4` | 12,76,212 | Hover/pressed del primario. |
| `ink` (texto) | `#080808` | 8,8,8 | Texto principal (casi negro). |
| `ink-soft` | `#475569` | 71,85,105 | Texto secundario/muted (slate-600, inferido). |
| `bg` | `#FFFFFF` | 255,255,255 | Fondo de página (77–91% de cada frame). |
| `surface` | `#F8FAFC` | 248,250,252 | Tarjetas/inputs (slate-50, inferido). |
| `border` | `#E2E8F0` | 226,232,240 | Bordes sutiles (slate-200, inferido de los bordes de frame). |
| `accent-warm` | `#C28E52` | 194,142,82 | Acento cálido de contenido/ilustraciones de mascotas (ámbar). No es color de UI; usarlo solo en media/fotos. |

> Nota: el anterior análisis del `Group 1.svg` sugirió "naranja" como marca. Era engañoso: el naranja era una **imagen dentro** del frame. El color de marca real (botones/header) es **azul eléctrico**.

---

## 2. Tipografía (sugerida — NO medida)

Figma no exportó fuentes y el texto de los frames está rasterizado, así que la familia es inferencia por el estilo visual (sans geométrica moderna, limpia, tipo Inter/Plus Jakarta Sans). Proponer y que el humano confirme:

| Token | Familia propuesta | Uso |
|-------|------------------|-----|
| `font-body` | `Inter`, system-ui, sans-serif | Texto general |
| `font-heading` | `Inter` (600/700) | Títulos, pesos 600–800 |
| `font-mono` | `ui-monospace, SFMono` | Datos técnicos (no prioritario) |

Escala base (inferida de un frame ~1500px de ancho mostrando ~3 niveles jerárquicos):

| Token | Tamaño | Line-height |
|-------|--------|-------------|
| `text-xs` | 12px | 16px |
| `text-sm` | 14px | 20px |
| `text-base` | 16px | 24px |
| `text-lg` | 18px | 28px |
| `text-xl` | 22px | 30px |
| `text-2xl` | 28px | 36px |
| `text-3xl` | 34px | 42px |

---

## 3. Radios, sombras y espaciado (inferidos)

Del `Group 1.svg` (vectorial real) se vieron rectángulos con bordes suaves y un círculo (avatar). Propuesta:

| Token | Valor | Uso |
|-------|-------|-----|
| `radius-sm` | 8px | chips, inputs pequeños |
| `radius-md` | 12px | tarjetas, botones |
| `radius-lg` | 16px | tarjetas grandes, modales |
| `radius-full` | 9999px | avatares, pills, FAB |
| `shadow-card` | `0 1px 3px rgba(8,8,8,.08), 0 1px 2px rgba(8,8,8,.04)` | tarjetas |
| `shadow-pop` | `0 8px 24px rgba(28,96,240,.18)` | botón primario / popovers |

Espaciado base 4px: `4 / 8 / 12 / 16 / 24 / 32 / 48`.

---

## 4. Importación prevista (T3)

- `apps/web/src/styles/tokens.css`:
```css
:root{
  --brand:#1C60F0; --brand-strong:#0C4CD4;
  --ink:#080808; --ink-soft:#475569;
  --bg:#FFFFFF; --surface:#F8FAFC; --border:#E2E8F0;
  --accent-warm:#C28E52;
  --radius-sm:8px; --radius-md:12px; --radius-lg:16px; --radius-full:9999px;
}
```
- `apps/web/tailwind.config.ts` → `theme.extend.colors` mapea a estas vars.
- `apps/mobile/src/theme` → mismos valores en objeto JS (reusa, no redefine).

---

## 5. Pendiente de validación humana

~~1. ¿Familia tipográfica correcta? (Inter / otra)~~ → **Confirmado: Inter**
~~2. ¿El azul `#1C60F0` es el exacto o querés un tonalidad específica (más cobalto / más cyan)?~~ → **Confirmado: #1C60F0**
~~3. Confirmar `accent-warm` solo para media, no para UI.~~ → **Confirmado**
~~4. Escala de tipografía ajustada al gusto.~~ → **Confirmada (escala §2)**
