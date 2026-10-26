// ============================================
// API: /api/products
// GET ดึงรายการสินค้าทั้งหมด
// POST สร้างสินค้าใหม่ (ต้องเป็นแอดมิน)
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/auth';
import { sanitizeProductImageUrl } from '@/lib/product-image';
import { sanitizeMenuColor } from '@/lib/menu-color';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const category = req.nextUrl.searchParams.get('category');
    const mealPeriod = req.nextUrl.searchParams.get('mealPeriod');
    const filter: Record<string, unknown> = category ? { category } : {};
    if (mealPeriod === 'morning' || mealPeriod === 'lunch') {
      filter.$or = [
        { mealPeriod: mealPeriod },
        { mealPeriod: 'both' },
        { mealPeriod: { $exists: false } },
      ];
    }
    const products = await Product.find(filter).sort({ category: 1, createdAt: -1 });
    return NextResponse.json({ products });
  } catch (error) {
    console.error('GET products error:', error);
    return NextResponse.json({ error: 'ดึงข้อมูลไม่สำเร็จ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const name = String(body.name || '').trim();
    const basePrice = Number(body.basePrice);
    if (!name || !Number.isFinite(basePrice) || basePrice < 0) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อเมนูและราคาที่ถูกต้อง' }, { status: 400 });
    }

    await connectDB();
    const product = await Product.create({
      name,
      description: body.description,
      basePrice,
      image: sanitizeProductImageUrl(body.image),
      color: sanitizeMenuColor(body.color),
      category: body.category,
      mealPeriod: body.mealPeriod || 'both',
      isAvailable: body.isAvailable !== false,
      options: Array.isArray(body.options) ? body.options : [],
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }
    console.error('POST products error:', error);
    return NextResponse.json({ error: 'สร้างสินค้าไม่สำเร็จ' }, { status: 500 });
  }
}
