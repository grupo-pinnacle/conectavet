const fs = require('fs');
const glob = require('glob');

// Replaces all weird characters that resulted from utf-8 mismatch
const replacements = {
  'invÃ¡lidas': 'inválidas',
  'tenÃ©s': 'tenés',
  'iniciÃ¡': 'iniciá',
  'sesiÃ³n': 'sesión',
  'verificaciÃ³n': 'verificación',
  'vÃ¡lido': 'válido',
  'envÃ­o': 'envío',
  'pÃºblico': 'público',
  'aprobaciÃ³n': 'aprobación',
  'vÃ­a': 'vía',
  'VerificÃ¡': 'Verificá',
  'ConfirmÃ¡': 'Confirmá',
  'aquÃ­': 'aquí',
  'invÃ¡lido': 'inválido',
  'SesiÃ³n': 'Sesión',
  'IniciÃ³': 'Inició',
  'crÃ­tica': 'crítica',
  'dÃ­as': 'días',
  'expiraciÃ³n': 'expiración',
  'contraseÃ±a': 'contraseña',
  'enumeraciÃ³n': 'enumeración',
  'RestablecÃ­': 'Restablecí',
  'ignorÃ¡': 'ignorá',
  'estÃ¡n': 'están',
  'podÃ©s': 'podés',
  'ReintentÃ¡': 'Reintentá',
  'invÃ¡lida': 'inválida',
  'Sesin': 'Sesión',
  'Iniciǭ': 'Iniciá',
  'crtica': 'crítica',
  'das': 'días',
  'expiracin': 'expiración',
  'invǭlida': 'inválida',
  'invǭlido': 'inválido',
  'estǭn': 'están',
  'podǸs': 'podés',
  'Reintentǭ': 'Reintentá',
  'participǭs': 'participás',
  'estǭ': 'está',
  'aǧn': 'aún',
  'Configurǭ': 'Configurá',
  'mǭs': 'más',
  'ǟ': 'á', // Catchall fallback
};

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Specific regex replacements for weird sequences seen in powershell outputs
  content = content.replace(/invǟlidas/g, 'inválidas');
  content = content.replace(/tenǟs/g, 'tenés');
  content = content.replace(/iniciǟ/g, 'iniciá');
  content = content.replace(/sesiǟn/g, 'sesión');
  content = content.replace(/verificaciǟn/g, 'verificación');
  content = content.replace(/vǟlido/g, 'válido');
  content = content.replace(/envǟo/g, 'envío');
  content = content.replace(/pǟblico/g, 'público');
  content = content.replace(/aprobaciǟn/g, 'aprobación');
  content = content.replace(/vǟa/g, 'vía');
  content = content.replace(/Verificǟ/g, 'Verificá');
  content = content.replace(/Confirmǟ/g, 'Confirmá');
  content = content.replace(/aquǟ/g, 'aquí');
  content = content.replace(/contraseǟa/g, 'contraseña');
  content = content.replace(/enumeraciǟn/g, 'enumeración');
  content = content.replace(/Restablecǟ/g, 'Restablecí');
  content = content.replace(/ignorǟ/g, 'ignorá');

  for (const [bad, good] of Object.entries(replacements)) {
    content = content.split(bad).join(good);
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed:', file);
  }
}

fixFile('web/src/pages/VetDashboardPage.tsx');
fixFile('web/src/components/call/CallRoom.tsx');




