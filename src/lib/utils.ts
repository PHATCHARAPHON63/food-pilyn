// ============================================
// Utility Functions ที่ใช้ร่วมกันทั่วโปรเจกต์
// ============================================
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * รวม className ของ Tailwind CSS ให้ไม่ซ้ำซ้อน
 * ใช้ร่วมกันระหว่าง clsx (conditional class) + tailwind-merge (merge ไม่ให้ชน)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * แปลงตัวเลขเป็นรูปแบบเงินบาทไทย
 */
export function formatPrice(amount: number) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * สร้างเลขออเดอร์แบบสุ่ม (ORD-XXXX)
 */
export function isMongoId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);
}

function cartProductId(item: { product?: unknown }) {
  if (typeof item.product === 'string') return item.product;
  if (item.product && typeof item.product === 'object' && '_id' in item.product) {
    return String((item.product as { _id: unknown })._id);
  }
  return '';
}

export function sanitizeCartItems<T extends { product?: unknown }>(items: T[]) {
  return items.filter((item) => isMongoId(cartProductId(item)));
}

export function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `ORD-${timestamp}${random}`;
}

export function isValidOrderNumber(value: unknown): value is string {
  return typeof value === 'string' && /^ORD-[A-Z0-9]{8,}$/i.test(value.trim());
}

/**
 * แปลงสถานะออเดอร์เป็นข้อความภาษาไทย
 */
export function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'รอรับออเดอร์',
    confirmed: 'ยืนยันแล้ว',
    preparing: 'กำลังเตรียม',
    'out-for-delivery': 'กำลังจัดส่ง',
    delivered: 'จัดส่งสำเร็จ',
    cancelled: 'ยกเลิก',
  };
  return map[status] || status;
}

/**
 * แปลงสถานะออเดอร์เป็นสี
 */
export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-accent-soft text-navy',
    confirmed: 'bg-navy/10 text-navy',
    preparing: 'bg-orange-100 text-orange-800',
    'out-for-delivery': 'bg-navy text-navy-foreground',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-surface text-muted';
}

/**
 * แปลงวิธีชำระเงินเป็นภาษาไทย
 */
export function getPaymentMethodLabel(method: string) {
  return method === 'cash' ? 'เงินสด' : method === 'transfer' ? 'โอนจ่าย' : method;
}

/**
 * แปลงรูปแบบเงินสดเป็นภาษาไทย
 */
export function getCashTenderLabel(tender?: string, banknote?: number, totalAmount?: number) {
  if (tender === 'exact') return 'พอดี';
  if (tender === 'banknote') {
    if (!banknote) return 'ไม่พอ จ่ายเป็นแบงค์';
    const change =
      typeof totalAmount === 'number' && banknote >= totalAmount ? banknote - totalAmount : undefined;
    if (change !== undefined) {
      return `จ่าย ${formatPrice(banknote)} ทอน ${formatPrice(change)}`;
    }
    return `จ่าย ${formatPrice(banknote)}`;
  }
  return '';
}

/**
 * สรุปวิธีชำระเงินทั้งก้อน เช่น "เงินสด · พอดี"
 */
export function getPaymentSummary(order: {
  paymentMethod: string;
  cashTenderType?: string;
  cashBanknote?: number;
  totalAmount?: number;
}) {
  const method = getPaymentMethodLabel(order.paymentMethod);
  if (order.paymentMethod !== 'cash') return method;
  const tender = getCashTenderLabel(order.cashTenderType, order.cashBanknote, order.totalAmount);
  return tender ? `${method} · ${tender}` : method;
}

/**
 * คำนวณระยะทางระหว่างพิกัดสองจุด (Haversine Formula)
 * คืนค่าเป็นเมตร
 */
export function getDistanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371e3; // รัศมีโลกเมตร
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;

  const x =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return R * y;
}
