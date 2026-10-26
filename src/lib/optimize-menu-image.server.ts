// ============================================
// ย่อ/บีบอัดรูปเมนูก่อนอัปโหลด (ฝั่งเซิร์ฟเวอร์)
// ============================================
import sharp from 'sharp';
import { MAX_PRODUCT_IMAGE_BYTES } from '@/lib/product-image';

/** รับไฟล์ต้นทางได้ใหญ่กว่านี้ แล้วบีบให้ไม่เกิน MAX_PRODUCT_IMAGE_BYTES */
export const MAX_MENU_IMAGE_UPLOAD_BYTES = 12 * 1024 * 1024;

const MAX_EDGE_PX = 1200;
const QUALITY_STEPS = [82, 74, 66, 58, 50, 42] as const;
const EDGE_STEPS = [MAX_EDGE_PX, 1000, 800, 640, 480] as const;

export class MenuImageTooLargeError extends Error {
  constructor() {
    super('IMAGE_TOO_LARGE');
    this.name = 'MenuImageTooLargeError';
  }
}

export async function optimizeMenuImageForUpload(
  input: Buffer,
  _mime: string
): Promise<Buffer> {
  for (const edge of EDGE_STEPS) {
    for (const quality of QUALITY_STEPS) {
      const out = await sharp(input, { animated: false })
        .rotate()
        .resize(edge, edge, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 4 })
        .toBuffer();

      if (out.length <= MAX_PRODUCT_IMAGE_BYTES) {
        return out;
      }
    }
  }

  throw new MenuImageTooLargeError();
}
