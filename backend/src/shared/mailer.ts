import nodemailer from 'nodemailer';

// Sender de emails. Si no hay SMTP configurado (dev/test), se limita a
// loguear el contenido en vez de romper el flujo (dev mode).
const SMTP = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM ?? 'no-reply@vetconnect.com',
};

function getTransporter() {
  if (!SMTP.host || !SMTP.user) return null;
  return nodemailer.createTransport({
    host: SMTP.host,
    port: SMTP.port,
    secure: SMTP.port === 465,
    auth: { user: SMTP.user, pass: SMTP.pass },
  });
}

export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    // Modo dev: no hay SMTP → solo registramos el link para poder probar a mano.
    // eslint-disable-next-line no-console
    console.log(`[mail:dev] to=${to} subject="${subject}"\n${html}`);
    return;
  }
  await transporter.sendMail({ from: SMTP.from, to, subject, html });
}
