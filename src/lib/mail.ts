import nodemailer, { type Transporter } from "nodemailer";
import { getSettings } from "@/lib/settings";

let cachedTransporter: { key: string; t: Transporter } | null = null;

function transporterKey(s: {
  smtpHost: string | null;
  smtpPort: number | null;
  smtpSecure: boolean;
  smtpUser: string | null;
  smtpPass: string | null;
}) {
  return [s.smtpHost, s.smtpPort, s.smtpSecure, s.smtpUser, s.smtpPass].join("|");
}

async function getTransporter() {
  const s = await getSettings();
  if (!s.emailEnabled || !s.smtpHost || !s.smtpPort) return null;
  const key = transporterKey(s);
  if (cachedTransporter && cachedTransporter.key === key) return cachedTransporter.t;
  const t = nodemailer.createTransport({
    host: s.smtpHost,
    port: s.smtpPort,
    secure: s.smtpSecure,
    auth: s.smtpUser && s.smtpPass ? { user: s.smtpUser, pass: s.smtpPass } : undefined,
  });
  cachedTransporter = { key, t };
  return t;
}

export type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendMail(payload: MailPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const s = await getSettings();
    const t = await getTransporter();
    if (!t) return { ok: false, error: "Email not configured" };
    const from = s.emailFromAddress
      ? `"${s.emailFromName}" <${s.emailFromAddress}>`
      : s.emailFromName;
    await t.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text ?? payload.html.replace(/<[^>]+>/g, ""),
    });
    return { ok: true };
  } catch (err) {
    console.error("[mail] send failed", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function testMail(to: string) {
  const s = await getSettings();
  return sendMail({
    to,
    subject: `[${s.institutionName}] Praxis360 test email`,
    html: `<div style="font-family:system-ui;padding:16px">
      <h2 style="margin:0 0 8px">Test email from Praxis360</h2>
      <p>If you can read this, your SMTP settings are working correctly.</p>
      <p style="color:#666;font-size:12px">Sent from ${s.institutionName}.</p>
    </div>`,
  });
}

export function renderNotificationEmail(opts: {
  institutionName: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  recipientName?: string;
}) {
  const cta = opts.actionUrl
    ? `<p style="margin:20px 0"><a href="${opts.actionUrl}" style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">${opts.actionLabel ?? "Open in Praxis360"}</a></p>`
    : "";
  return `<div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;background:#f4f5f7;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #e5e7eb">
      <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;font-weight:600">${opts.institutionName}</div>
      <h2 style="margin:8px 0 12px;font-size:18px;color:#111827">${opts.title}</h2>
      ${opts.recipientName ? `<p style="margin:0 0 8px;color:#374151">Hi ${opts.recipientName.split(" ")[0]},</p>` : ""}
      <p style="margin:0;color:#374151;line-height:1.5">${opts.message}</p>
      ${cta}
      <p style="margin:24px 0 0;color:#9ca3af;font-size:12px">You received this because you have an active Praxis360 account. You can turn off notifications from your profile.</p>
    </div>
  </div>`;
}
