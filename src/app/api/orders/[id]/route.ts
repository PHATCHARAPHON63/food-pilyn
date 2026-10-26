// ============================================
// API: /api/orders/[id]
// PATCH อัปเดตสถานะออเดอร์ · DELETE ซ่อนออเดอร์ (soft delete)
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { requireAdmin } from '@/lib/auth';
import type { OrderStatus } from '@/types';
import { ACTIVE_ORDER_FILTER } from '@/lib/order-query';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const allowed: OrderStatus[] = [
      'pending',
      'confirmed',
      'preparing',
      'out-for-delivery',
      'delivered',
      'cancelled',
    ];
    const status = body.status as OrderStatus;
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 });
    }

    await connectDB();
    const order = await Order.findOneAndUpdate(
      { _id: id, ...ACTIVE_ORDER_FILTER },
      { status },
      { new: true }
    );
    if (!order) {
      return NextResponse.json({ error: 'ไม่พบออเดอร์' }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }
    console.error('PATCH order error:', error);
    return NextResponse.json({ error: 'อัปเดตสถานะไม่สำเร็จ' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    await connectDB();
    const order = await Order.findOneAndUpdate(
      { _id: id, ...ACTIVE_ORDER_FILTER },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!order) {
      return NextResponse.json({ error: 'ไม่พบออเดอร์' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }
    console.error('DELETE order error:', error);
    return NextResponse.json({ error: 'ซ่อนออเดอร์ไม่สำเร็จ' }, { status: 500 });
  }
}
