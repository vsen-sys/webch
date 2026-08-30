// ====================================
// WEBCH - ENVIO DE EMAIL (CODIGO DE VERIFICACAO)
// Usa nodemailer + SMTP do Gmail (config backend/.env)
// ====================================
const nodemailer = require('nodemailer');

let transporter = null;

function init(cfg) {
  if (!cfg.smtpPass) {
    console.log('[EMAIL] SMTP_PASS nao configurado (backend/.env). Codigos serao mostrados no log.');
    return;
  }
  transporter = nodemailer.createTransport({
    host: cfg.smtpHost || 'smtp.gmail.com',
    port: Number(cfg.smtpPort || 587),
    secure: false,
    auth: {
      user: cfg.smtpUser,
      pass: cfg.smtpPass
    }
  });
}

async function sendVerificationCode(email, code, nome) {
  const destinatario = email;
  if (!transporter) {
    console.log(`[EMAIL][CADASTRO] Codigo para ${destinatario}: ${code}`);
    return { ok: true, simulado: true };
  }
  try {
    await transporter.sendMail({
      from: `"WEBCH" <${process.env.SMTP_FROM || email}>`,
      to: destinatario,
      subject: 'WEBCH - Codigo de verificacao',
      html: `
        <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#f0f0f0;padding:30px">
          <div style="max-width:480px;margin:0 auto;border:1px solid #333;border-radius:8px;overflow:hidden">
            <div style="background:#000;padding:16px 24px;border-bottom:1px solid #333">
              <span style="font-size:22px;font-weight:bold;letter-spacing:3px">WEBCH</span>
              <span style="float:right;color:#bbb;font-size:12px">CENTRAL DE CHEATS</span>
            </div>
            <div style="padding:28px 24px;text-align:center">
              <p style="color:#ccc">Ola ${nome || 'usuario'}, use o codigo abaixo para confirmar sua conta:</p>
              <div style="margin:24px 0;background:#111;border:1px solid #444;border-radius:6px;padding:18px;font-size:34px;letter-spacing:10px;font-weight:bold">${code}</div>
              <p style="color:#888;font-size:13px">O codigo expira em 10 minutos. Nao compartilhe com ninguem.</p>
            </div>
            <div style="background:#000;padding:12px 24px;border-top:1px solid #333;color:#666;font-size:11px;text-align:center">
              WEBCH - Todos os direitos reservados
            </div>
          </div>
        </div>
      `
    });
    return { ok: true };
  } catch (error) {
    console.error('[EMAIL] Erro ao enviar:', error.message);
    return { ok: false, message: 'Erro ao enviar e-mail. Tente novamente.' };
  }
}

module.exports = { init, sendVerificationCode };