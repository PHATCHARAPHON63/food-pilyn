// ============================================
// API: /api/orders
// GET ดึงรายการออเดอร์ (แอดมิน) รองรับ query ?status=...
// POST สร้างออเดอร์ใหม่ (ลูกค้า)
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { generateOrderNumber, isMongoId, isValidOrderNumber } from '@/lib/utils';

function sanitizeItems(raw: unknown) {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const items = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null;
    const row = item as Record<string, unknown>;
    const product =
      typeof row.product === 'string'
        ? row.product
        : row.product && typeof row.product === 'object' && '_id' in (row.product as object)
          ? String((row.product as { _id: unknown })._id)
          : '';
    const productName = String(row.productName || '').trim();
    const unitPrice = Number(row.unitPrice);
    const quantity = Math.max(1, Math.floor(Number(row.quantity) || 1));
    const subtotal = Number(row.subtotal);
    if (
      !isMongoId(product) ||
      !productName ||
      !Number.isFinite(unitPrice) ||
      !Number.isFinite(subtotal)
    ) {
      return null;
    }

    const selectedChoices = Array.isArray(row.selectedChoices)
      ? row.selectedChoices.map((choice) => {
          const c = (choice || {}) as { optionName?: string; choiceLabels?: unknown };
          return {
            optionName: String(c.optionName || ''),
            choiceLabels: Array.isArray(c.choiceLabels) ? c.choiceLabels.map(String) : [],
          };
        })
      : [];

    items.push({ product, productName, unitPrice, quantity, selectedChoices, subtotal });
  }

  return items;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');

    await connectDB();

    const query: Record<string, unknown> = {};
    if (statusParam) {
      query.status = { $in: statusParam.split(',') };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('GET orders error:', error);
    return NextResponse.json({ error: 'ดึงออเดอร์ไม่สำเร็จ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = sanitizeItems(body.items);
    if (!items) {
      return NextResponse.json({ error: 'รายการอาหารไม่ถูกต้อง กรุณาเลือกเมนูใหม่' }, { status: 400 });
    }

    const name = String(body.customer?.name || '').trim();
    const phone = String(body.customer?.phone || '').trim();
    if (!name || !phone) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อและเบอร์โทร' }, { status: 400 });
    }

    const loc = body.deliveryLocation;
    if (
      !loc ||
      typeof loc.lat !== 'number' ||
      typeof loc.lng !== 'number' ||
      !Number.isFinite(loc.lat) ||
      !Number.isFinite(loc.lng)
    ) {
      return NextResponse.json({ error: 'กรุณาปักหมุดจุดรับอาหาร' }, { status: 400 });
    }

    const paymentMethod = body.paymentMethod === 'transfer' ? 'transfer' : 'cash';
    const cashTenderType =
      paymentMethod === 'cash' && (body.cashTenderType === 'exact' || body.cashTenderType === 'banknote')
        ? body.cashTenderType
        : undefined;
    const cashBanknote =
      cashTenderType === 'banknote' && typeof body.cashBanknote === 'number' && Number.isFinite(body.cashBanknote)
        ? body.cashBanknote
        : undefined;

    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
    if (cashTenderType === 'banknote' && (cashBanknote === undefined || cashBanknote < totalAmount)) {
      return NextResponse.json({ error: 'จำนวนเงินที่จ่ายต้องไม่น้อยกว่ายอดสั่งซื้อ' }, { status: 400 });
    }

    const orderNumber = isValidOrderNumber(body.orderNumber)
      ? body.orderNumber.trim()
      : generateOrderNumber();

    await connectDB();
    const order = await Order.create({
      orderNumber,
      items,
      customer: { name, phone },
      deliveryLocation: {
        lat: loc.lat,
        lng: loc.lng,
        address: typeof loc.address === 'string' ? loc.address : undefined,
      },
      paymentMethod,
      cashTenderType,
      cashBanknote,
      totalAmount,
      note: typeof body.note === 'string' ? body.note.trim().slice(0, 300) : undefined,
      status: 'pending',
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json({ error: 'เลขออเดอร์ซ้ำ กรุณาลองอีกครั้ง' }, { status: 409 });
    }
    console.error('POST order error:', error);
    return NextResponse.json({ error: 'บันทึกออเดอร์ไม่สำเร็จ' }, { status: 500 });
  }
}
