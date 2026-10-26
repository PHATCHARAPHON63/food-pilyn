// ============================================
// API: /api/settings/order-email
// GET/PUT ผู้รับแจ้งเตือนออเดอร์ทางอีเมล (แอดมิน)
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Settings from '@/models/Settings';
import { requireAdmin } from '@/lib/auth';
import { isSmtpConfigured } from '@/lib/mailer.server';
import {
  ORDER_EMAIL_NOTIFY_KEY,
  normalizeOrderEmailNotifySettings,
  type OrderEmailNotifySettings,
} from '@/lib/order-email-notify';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectDB();
    const doc = await Settings.findOne({ key: ORDER_EMAIL_NOTIFY_KEY });
    const settings = normalizeOrderEmailNotifySettings(doc?.orderEmailNotify);
    return NextResponse.json({
      settings,
      smtpConfigured: isSmtpConfigured(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }
    console.error('GET order-email error:', error);
    return NextResponse.json({ error: 'ดึงตั้งค่าอีเมลไม่สำเร็จ' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const settings: OrderEmailNotifySettings = normalizeOrderEmailNotifySettings(body.settings ?? body);

    await connectDB();
    await Settings.findOneAndUpdate(
      { key: ORDER_EMAIL_NOTIFY_KEY },
      { key: ORDER_EMAIL_NOTIFY_KEY, orderEmailNotify: settings },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      settings,
      smtpConfigured: isSmtpConfigured(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }
    console.error('PUT order-email error:', error);
    return NextResponse.json({ error: 'บันทึกตั้งค่าอีเมลไม่สำเร็จ' }, { status: 500 });
  }
}
