// ============================================
// แจ้งแอดมินทางอีเมลเมื่อมีออเดอร์ใหม่
// ============================================
import connectDB from '@/lib/db';
import Settings from '@/models/Settings';
import { MEAL_SLOT_LABELS, type MealPeriodSlot } from '@/lib/meal-period';
import { DEFAULT_APP_URL, isSmtpConfigured, sendMail } from '@/lib/mailer.server';
import {
  ORDER_EMAIL_NOTIFY_KEY,
  normalizeOrderEmailNotifySettings,
} from '@/lib/order-email-notify';
import { formatPrice, getPaymentSummary } from '@/lib/utils';

export type NewOrderNotifyPayload = {
  orderNumber: string;
  customer: { name: string; phone: string };
  items: Array<{ productName: string; quantity: number }>;
  totalAmount: number;
  paymentMethod: string;
  cashTenderType?: string;
  cashBanknote?: number;
  note?: string;
  mealPeriodSlot?: MealPeriodSlot;
};

function getAdminOrdersUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    DEFAULT_APP_URL;
  return `${base.replace(/\/$/, '')}/admin/orders`;
}

function buildOrderEmail(order: NewOrderNotifyPayload): { subject: string; text: string; html: string } {
  const itemLines = order.items.map((i) => `  • ${i.productName} ×${i.quantity}`).join('\n');
  const payment = getPaymentSummary({
    paymentMethod: order.paymentMethod,
    cashTenderType: order.cashTenderType,
    cashBanknote: order.cashBanknote,
    totalAmount: order.totalAmount,
  });
  const round = order.mealPeriodSlot ? MEAL_SLOT_LABELS[order.mealPeriodSlot] : null;
  const adminUrl = getAdminOrdersUrl();

  const subject = `[ออเดอร์ใหม่] ${order.orderNumber} — ${order.customer.name}`;

  const text = [
    `ออเดอร์ใหม่ ${order.orderNumber}`,
    '',
    `ลูกค้า: ${order.customer.name}`,
    `โทร: ${order.customer.phone}`,
    round ? `รอบ: ${round}` : null,
    '',
    'รายการ:',
    itemLines || '  -',
    '',
    `ยอด: ${formatPrice(order.totalAmount)}`,
    `ชำระ: ${payment}`,
    order.note?.trim() ? `หมายเหตุ: ${order.note.trim()}` : null,
    '',
    `เปิดแอดมิน: ${adminUrl}`,
  ]
    .filter((line) => line !== null)
    .join('\n');

  const html = `
    <h2>ออเดอร์ใหม่ ${order.orderNumber}</h2>
    <p><strong>ลูกค้า:</strong> ${escapeHtml(order.customer.name)}<br/>
    <strong>โทร:</strong> ${escapeHtml(order.customer.phone)}${round ? `<br/><strong>รอบ:</strong> ${escapeHtml(round)}` : ''}</p>
    <p><strong>รายการ</strong></p>
    <ul>${order.items.map((i) => `<li>${escapeHtml(i.productName)} ×${i.quantity}</li>`).join('')}</ul>
    <p><strong>ยอด:</strong> ${escapeHtml(formatPrice(order.totalAmount))}<br/>
    <strong>ชำระ:</strong> ${escapeHtml(payment)}</p>
    ${order.note?.trim() ? `<p><strong>หมายเหตุ:</strong> ${escapeHtml(order.note.trim())}</p>` : ''}
    <p><a href="${escapeHtml(adminUrl)}">เปิดหน้าจัดการออเดอร์</a></p>
  `;

  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadNotifySettings() {
  await connectDB();
  const doc = await Settings.findOne({ key: ORDER_EMAIL_NOTIFY_KEY });
  return normalizeOrderEmailNotifySettings(doc?.orderEmailNotify);
}

/** ไม่ throw — ใช้หลังบันทึกออเดอร์สำเร็จ */
export async function notifyAdminsNewOrderEmail(order: NewOrderNotifyPayload): Promise<void> {
  if (!isSmtpConfigured()) return;

  try {
    const settings = await loadNotifySettings();
    if (!settings.enabled || settings.recipients.length === 0) return;

    const { subject, text, html } = buildOrderEmail(order);
    await sendMail({
      to: settings.recipients,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error('Email new order notify failed:', error);
  }
}
