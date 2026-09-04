/**
 * BUG-09 Cerco — el prop `style` de Button llega al layout.
 * Sin infra de component-tests en mobile: test de contrato estático sobre el
 * fuente (misma técnica que petWeightI18n/homeGreetingGate). Falla si el
 * `style` vuelve a caerse del wrapper (el Cancelar de alta y otros 6 sitios
 * perderían flex/márgenes en silencio).
 */
import * as fs from 'fs';
import * as path from 'path';

const BUTTON_FILE = path.join(process.cwd(), 'src', 'components', 'ui', 'Button.tsx');

describe('BUG-09 Cerco — Button aplica `style` en el wrapper', () => {
  const src = fs.readFileSync(BUTTON_FILE, 'utf8');

  it('feliz: el wrapper Animated.View incluye el `style` del caller al final', () => {
    expect(src).toMatch(/<Animated\.View style=\{\[animStyle, fullWidth && \{ alignSelf: 'stretch' \}, style\]\}>/);
  });

  it('inválido-antes: el objeto interno del Pressable sigue intacto (no se parte en dos fuentes)', () => {
    expect(src).toContain('backgroundColor: variantStyle.bg');
    expect(src).toContain('minWidth: size ===');
    // El `style` del caller va al wrapper, no duplicado dentro del Pressable:
    // Desde el elemento JSX <Pressable (no desde `PressableProps` del interface):
    const pressableBlock = src.slice(src.indexOf('<Pressable\n'), src.indexOf('{...rest}'));
    expect(pressableBlock).not.toMatch(/,\s*style\s*[,}]/);
  });

  it('borde: contrato y diseño intactos (ghost transparente, prop tipado ViewStyle)', () => {
    expect(src).toContain("ghost: { bg: 'transparent', text: c.ink, border: 'transparent'");
    expect(src).toContain('style?: StyleProp<ViewStyle>');
  });

  it('frontera: los callers declaran su intent y el wrapper lo honra (flujo extremo a extremo)', () => {
    // Productor: alta de mascota declara la proporción 1:2 de la fila.
    const newPet = fs.readFileSync(path.join(process.cwd(), 'app', '(app)', 'pets', 'new.tsx'), 'utf8');
    expect(newPet).toContain('style={{ flex: 1 }}>Cancelar</Button>');
    expect(newPet).toContain('style={{ flex: 2 }}');
    // Productor: footer del modal de calificación declara 1:1 (ambos <Button> con flex:1).
    const history = fs.readFileSync(path.join(process.cwd(), 'app', '(app)', 'history', 'index.tsx'), 'utf8');
    const historyButtons = history.match(/<Button[\s\S]*?<\/Button>/g) ?? [];
    expect(historyButtons).toHaveLength(2);
    expect(historyButtons.filter((b) => b.includes('style={{ flex: 1 }}'))).toHaveLength(2);
    // Consumidor: el wrapper aplica cualquier `style` recibido al final (gana ante conflictos).
    expect(src).toMatch(/fullWidth && \{ alignSelf: 'stretch' \}, style\]\}>/);
  });
});
