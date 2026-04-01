import nodemailer from "nodemailer";

// ─── Env validation ───────────────────────────────────────────────────────────

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? "noreply@replayr.app";

  const missing: string[] = [];
  if (!host) missing.push("SMTP_HOST");
  if (!user) missing.push("SMTP_USER");
  if (!pass) missing.push("SMTP_PASS");

  if (missing.length > 0) {
    throw new Error(
      `[email-sender] Missing env vars: ${missing.join(", ")}. ` +
      `Add them in Vercel → Project → Settings → Environment Variables.`
    );
  }

  return { host: host!, port, user: user!, pass: pass!, from };
}

const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// ─── Core send — returns success/failure, never throws ───────────────────────

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {

  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  // Step 1 — validate env vars
  let config: SmtpConfig;
  try {
    config = getSmtpConfig();
  } catch (err: any) {
    console.error("[email-sender] CONFIG ERROR:", err.message);
    return { success: false, error: err.message };
  }

  console.log(`[email-sender] Sending to=${to} via ${config.host}:${config.port} user=${config.user}`);
  console.log(`[email-sender] Verify URL: ${verifyUrl}`);

  // Step 2 — create transport
  const transport = nodemailer.createTransport({
    host:   config.host,
    port:   config.port,
    secure: config.port === 465,
    auth:   { user: config.user, pass: config.pass },
    connectionTimeout: 10_000,
    greetingTimeout:   10_000,
    socketTimeout:     15_000,
  });

  // Step 3 — verify SMTP connection
  try {
    await transport.verify();
    console.log("[email-sender] SMTP connection OK");
  } catch (err: any) {
    console.error("[email-sender] SMTP CONNECT FAILED:", err.message);
    return { success: false, error: `SMTP connection failed: ${err.message}` };
  }

  // Step 4 — send
  try {
    const info = await transport.sendMail({
      from:    `RePlayr <${config.from}>`,
      to,
      subject: "Verify your RePlayr email address",
      text:    buildText(name, verifyUrl),
      html:    buildHtml(name, verifyUrl),
    });
    console.log(`[email-sender] Sent OK — messageId=${info.messageId} accepted=${JSON.stringify(info.accepted)}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error("[email-sender] SEND FAILED:", err.message);
    console.error("[email-sender] Full error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return { success: false, error: `Send failed: ${err.message}` };
  }
}

// ─── Text template ────────────────────────────────────────────────────────────

function buildText(name: string, verifyUrl: string): string {
  return `Hi ${name},

Welcome to RePlayr! Please verify your email address by clicking the link below:

${verifyUrl}

This link expires in 30 minutes and can only be used once.

If you didn't create an account, you can safely ignore this email.

– The RePlayr Team`;
}

// ─── HTML template ────────────────────────────────────────────────────────────

function buildHtml(name: string, verifyUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email — RePlayr</title>
</head>
<body style="margin:0;padding:0;background:#05070A;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#05070A;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;width:100%;">
        <tr>
          <td align="center" style="padding-bottom:32px;">
            <span style="display:inline-block;background:linear-gradient(135deg,#00F0FF,#7C3AED);border-radius:14px;padding:10px 18px;font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.03em;">
              RePlayr
            </span>
          </td>
        </tr>
        <tr>
          <td style="background:#0B0F17;border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:40px 36px;">
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#EAF2FF;letter-spacing:-0.03em;">Verify your email</h1>
            <p style="margin:0 0 28px;font-size:15px;color:#9FB0C3;line-height:1.6;">
              Hi ${escapeHtml(name)}, thanks for signing up!<br/>Click the button below to activate your account.
            </p>
            <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
              <tr>
                <td style="background:linear-gradient(135deg,#0891b2,#0e7490,#164e63);border-radius:12px;">
                  <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">
                    Verify Email Address
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 12px;font-size:13px;color:#5C6B7A;line-height:1.6;">
              This link expires in <strong style="color:#9FB0C3;">30 minutes</strong> and can only be used once.
              If the button doesn't work, copy and paste this URL into your browser:
            </p>
            <p style="margin:0;font-size:12px;color:#06b6d4;word-break:break-all;">${verifyUrl}</p>
            <div style="height:1px;background:rgba(255,255,255,0.06);margin:28px 0;"></div>
            <p style="margin:0;font-size:12px;color:#5C6B7A;">If you didn't create a RePlayr account, you can safely ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:24px;">
            <p style="margin:0;font-size:12px;color:#3d4f66;">© ${new Date().getFullYear()} RePlayr — Trade Game Discs Locally</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
