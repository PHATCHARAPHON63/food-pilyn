// ============================================
// ตั้งค่าแจ้งเตือนออเดอร์ทางอีเมล (เก็บใน Settings)
// ============================================

export const ORDER_EMAIL_NOTIFY_KEY = 'order-email-notify';

export type OrderEmailNotifySettings = {
  enabled: boolean;
  /** อีเมลผู้รับแจ้งเตือน */
  recipients: string[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidNotifyEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 254 && EMAIL_RE.test(trimmed);
}

export function normalizeOrderEmailNotifySettings(raw: unknown): OrderEmailNotifySettings {
  if (!raw || typeof raw !== 'object') {
    return { enabled: false, recipients: [] };
  }
  const row = raw as { enabled?: unknown; recipients?: unknown };
  const enabled = row.enabled === true;
  const list = Array.isArray(row.recipients) ? row.recipients : [];
  const recipients = [...new Set(list.map((e) => String(e).trim().toLowerCase()).filter(isValidNotifyEmail))];
  return { enabled, recipients };
}
