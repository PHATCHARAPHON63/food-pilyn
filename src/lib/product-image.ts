// ============================================
// รูปเมนู: ตรวจสอบ URL และชนิดไฟล์อัปโหลด
// ============================================

export const PRODUCT_IMAGE_UPLOAD_DIR = 'public/uploads/products';
export const PRODUCT_IMAGE_URL_PREFIX = '/uploads/products/';
export const MAX_PRODUCT_IMAGE_BYTES = 2 * 1024 * 1024;

export const ALLOWED_PRODUCT_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export function extensionForMime(mime: string): string | null {
  return EXT_BY_MIME[mime] ?? null;
}

/** คืนค่า URL ที่ปลอดภัย หรือ undefined ถ้าไม่ใช้ */
export function sanitizeProductImageUrl(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;

  if (raw.startsWith(PRODUCT_IMAGE_URL_PREFIX)) {
    if (raw.includes('..') || raw.includes('\\')) return undefined;
    return raw;
  }

  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}
