import nodemailer from "nodemailer";

// ─── Transport ────────────────────────────────────────────────────────────────
// Reads from environment variables. Works with any SMTP provider:
//   - Gmail:        SMTP_HOST=smtp.gmail.com, SMTP_PORT=587, use App Password
//   - Resend:       SMTP_HOST=smtp.resend.com, SMTP_USER=resend, SMTP_PASS=re_...
//   - Mailgun:      SMTP_HOST=smtp.mailgun.org
//   - Postmark:     SMTP_HOST=smtp.postmarkapp.com
//   - Brevo/Sendinblue: SMTP_HOST=smtp-relay.brevo.com
//
// Recommended for production: Resend (resend.com) — free tier = 3000 emails/month,
// dead-simple setup, great deliverability.

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465, // TLS only on port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM_ADDRESS = `RePlayr <${process.env.SMTP_FROM ?? "noreply@replayr.app"}>`;
const APP_URL      = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// ─── Verification email ───────────────────────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const transport = createTransport();

  await transport.sendMail({
    from:    FROM_ADDRESS,
    to,
    subject: "Verify your RePlayr email address",
    text:    buildVerificationText(name, verifyUrl),
    html:    buildVerificationHtml(name, verifyUrl),
  });
}

// ─── Resend verification email ────────────────────────────────────────────────

export async function sendResendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  return sendVerificationEmail(to, name, token);
}

// ─── Plain-text version ───────────────────────────────────────────────────────

function buildVerificationText(name: string, verifyUrl: string): string {
  return `Hi ${name},

Welcome to RePlayr! Please verify your email address by clicking the link below:

${verifyUrl}

This link expires in 30 minutes and can only be used once.

If you didn't create an account, you can safely ignore this email.

– The RePlayr Team`;
}

// ─── HTML version ─────────────────────────────────────────────────────────────

function buildVerificationHtml(name: string, verifyUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email — RePlayr</title>
</head>
<body style="margin:0;padding:0;background:#05070A;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="background:#05070A;min-height:100vh;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:520px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background:linear-gradient(135deg,#00F0FF,#7C3AED);
                    border-radius:14px;padding:10px 14px;display:inline-block;">
                    <span style="font-size:20px;font-weight:800;color:#fff;
                      letter-spacing:-0.03em;">Re<span style="background:linear-gradient(135deg,#00F0FF,#7C3AED);
                      -webkit-background-clip:text;">Playr</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#0B0F17;border:1px solid rgba(255,255,255,0.07);
              border-radius:20px;padding:40px 36px;">

              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;
                color:#EAF2FF;letter-spacing:-0.03em;">
                Verify your email
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:#9FB0C3;line-height:1.6;">
                Hi ${escapeHtml(name)}, thanks for signing up!<br/>
                Click the button below to activate your account.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#0891b2,#0e7490,#164e63);
                    border-radius:12px;padding:14px 32px;text-align:center;">
                    <a href="${verifyUrl}"
                      style="color:#fff;font-size:15px;font-weight:700;
                      text-decoration:none;letter-spacing:-0.01em;display:inline-block;">
                      ✓ Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:13px;color:#5C6B7A;line-height:1.6;">
                This link expires in <strong style="color:#9FB0C3;">30 minutes</strong>
                and can only be used once. If the button doesn't work, copy and paste
                this URL into your browser:
              </p>
              <p style="margin:0;font-size:12px;color:#06b6d4;word-break:break-all;">
                ${verifyUrl}
              </p>

              <!-- Divider -->
              <div style="height:1px;background:rgba(255,255,255,0.06);margin:28px 0;"></div>

              <p style="margin:0;font-size:12px;color:#5C6B7A;line-height:1.6;">
                If you didn't create a RePlayr account, you can safely ignore this email.
                Someone may have entered your address by mistake.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#3d4f66;">
                © ${new Date().getFullYear()} RePlayr — Trade Game Discs Locally
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
