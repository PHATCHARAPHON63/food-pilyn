// ============================================
// API: /api/upload/product-image
// อัปโหลดรูปเมนู (แอดมิน) → Cloudinary
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { uploadMenuImage } from '@/lib/cloudinary.server';
import {
  ALLOWED_PRODUCT_IMAGE_TYPES,
} from '@/lib/product-image';
import {
  MAX_MENU_IMAGE_UPLOAD_BYTES,
  MenuImageTooLargeError,
  optimizeMenuImageForUpload,
} from '@/lib/optimize-menu-image.server';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'กรุณาเลือกไฟล์รูป' }, { status: 400 });
    }

    if (!ALLOWED_PRODUCT_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'รองรับเฉพาะ JPG, PNG, WebP หรือ GIF' },
        { status: 400 }
      );
    }

    if (file.size > MAX_MENU_IMAGE_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'ไฟล์ต้นทางใหญ่เกินไป (สูงสุด 12 MB) — ระบบจะย่อให้อัตโนมัติ' },
        { status: 400 }
      );
    }

    const raw = Buffer.from(await file.arrayBuffer());
    const buffer = await optimizeMenuImageForUpload(raw, file.type);
    const url = await uploadMenuImage(buffer);

    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }
    if (error instanceof MenuImageTooLargeError) {
      return NextResponse.json(
        { error: 'ย่อรูปแล้วยังใหญ่เกิน 2 MB กรุณาใช้รูปที่เล็กลงหรือครอปก่อนอัปโหลด' },
        { status: 400 }
      );
    }
    console.error('POST product-image upload error:', error);
    return NextResponse.json({ error: 'อัปโหลดรูปไม่สำเร็จ' }, { status: 500 });
  }
}
