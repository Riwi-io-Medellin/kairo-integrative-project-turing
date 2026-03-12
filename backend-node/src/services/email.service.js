import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtpEmail(email, code, userName = '') {
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Kairo <noreply@kairo.app>',
    to: [email],
    subject: 'Tu código de verificación - Kairo',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
        <h2 style="color:#5405a3">Hola${userName ? `, ${userName}` : ''}!</h2>
        <p>Tu código de verificación es:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#261339;margin:24px 0">${code}</div>
        <p style="color:#666">Este código expira en 15 minutos.</p>
      </div>
    `,
  });
  if (error) throw new Error(error.message);
}
