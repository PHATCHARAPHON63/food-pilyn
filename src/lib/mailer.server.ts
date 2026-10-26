// ============================================
// SMTP Office 365 (ฝั่งเซิร์ฟเวอร์เท่านั้น) — แจ้งเตือนออเดอร์
// ============================================
import nodemailer from 'nodemailer';
import type Transporter from 'nodemailer/lib/mailer';

const SMTP_HOST = 'smtp.office365.com';
const SMTP_PORT = 587;
const SMTP_USER = 'allsolution@tlogical.com';
const SMTP_PASS = 'Y2GqrhqdH0ZUMp9';
const SMTP_FROM = SMTP_USER;

/** ลิงก์ในอีเมล (แก้เป็นโดเมนจริงเมื่อ deploy) */
export const DEFAULT_APP_URL = 'http://localhost:3000';

let transporter: Transporter | null = null;

export function isSmtpConfigured(): boolean {
  return true;
}

function getTransporter(): Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    requireTLS: true,
  });

  return transporter;
}

export function getSmtpFromAddress(): string {
  return SMTP_FROM;
}

export async function sendMail(options: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const transport = getTransporter();
  await transport.sendMail({
    from: getSmtpFromAddress(),
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}
