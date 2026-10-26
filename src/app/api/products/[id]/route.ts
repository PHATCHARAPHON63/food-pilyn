// ============================================
// API: /api/products/[id]
// PATCH แก้ไขสินค้า
// DELETE ลบสินค้า
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/auth';
import { sanitizeProductImageUrl } from '@/lib/product-image';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await connectDB();
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (error) {
    console.error('GET product error:', error);
    return NextResponse.json({ error: 'ดึงข้อมูลไม่สำเร็จ' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = {};
    const allowed = [
      'name',
      'description',
      'basePrice',
      'image',
      'category',
      'mealPeriod',
      'isAvailable',
      'options',
    ] as const;
    for (const key of allowed) {
      if (!(key in body)) continue;
      if (key === 'image') {
        if (body.image === null || body.image === '') {
          update[key] = null;
        } else {
          update[key] = sanitizeProductImageUrl(body.image);
        }
      } else {
        update[key] = body[key];
      }
    }

    await connectDB();
    const product = await Product.findByIdAndUpdate(id, update, { new: true });
    if (!product) {
      return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }
    console.error('PATCH product error:', error);
    return NextResponse.json({ error: 'แก้ไขสินค้าไม่สำเร็จ' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    await connectDB();
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }
    console.error('DELETE product error:', error);
    return NextResponse.json({ error: 'ลบสินค้าไม่สำเร็จ' }, { status: 500 });
  }
}
