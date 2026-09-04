/**
 * BUG-10 Cerco — arranque sin cable: detección LAN robusta + USB intacto.
 * Sin framework de tests para ps1: contrato estático sobre el script
 * (misma técnica que homeGreetingGate). No ejecuta nada.
 */
import * as fs from 'fs';
import * as path from 'path';

const PS1 = path.join(process.cwd(), 'start.ps1');

describe('BUG-10 Cerco — start.ps1 permite LAN sin cable', () => {
  const src = fs.readFileSync(PS1, 'utf8');

  it('feliz: rama LAN con detección robusta (ruta default, sin virtuales, 10/172/192)', () => {
    expect(src).toContain("Get-NetRoute -DestinationPrefix '0.0.0.0/0'");
    expect(src).toMatch(/vEthernet\|VirtualBox\|VMware\|WSL/);
    expect(src).toContain('172\\.');
  });

  it('frontera: contrato con Expo/Metro intacto (puertos, QR, EXPO_PUBLIC_*, flags)', () => {
    // USB-first + reverse + --localhost se conservan byte a byte en espíritu:
    expect(src).toContain('reverse tcp:8081 tcp:8081');
    expect(src).toContain('reverse tcp:3001 tcp:3001');
    expect(src).toContain('exp://${ip}:${port}');
    expect(src).toContain('$env:EXPO_PUBLIC_API_URL = "http://${ip}:3001"');
    // --lan solo cuando NO hay USB ni túnel (nunca pisa el flujo por cable):
    expect(src).toMatch(/if \(-not \$useADB -and -not \$Tunnel\) \{ \$expoArgs \+= "--lan" \}/);
  });

  it('borde: modos USB_TETHERING/LOCALHOST de fallback siguen existiendo', () => {
    expect(src).toContain('$mode = "USB TETHERING"');
    expect(src).toContain('$mode = "LOCALHOST"');
    expect(src).toContain('param(');
  });
});
