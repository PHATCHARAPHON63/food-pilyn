// ============================================
// API: /api/settings/meal-ordering
// GET ดึงตารางเปิดรับออเดอร์ + สถานะรอบปัจจุบัน (เวลาไทย)
// PUT บันทึกตาราง (แอดมิน)
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Settings from '@/models/Settings';
import { requireAdmin } from '@/lib/auth';
import {
  MEAL_ORDERING_SCHEDULE_KEY,
  normalizeMealOrderingSchedule,
  getMealOrderingStatus,
} from '@/lib/meal-ordering-schedule';

export async function GET() {
  try {
    await connectDB();
    const doc = await Settings.findOne({ key: MEAL_ORDERING_SCHEDULE_KEY });
    const schedule = normalizeMealOrderingSchedule(doc?.mealOrderingSchedule);
    const status = getMealOrderingStatus(schedule);
    return NextResponse.json(status);
  } catch (error) {
    console.error('GET meal-ordering error:', error);
    return NextResponse.json({ error: 'ดึงตั้งค่ารอบมื้อไม่สำเร็จ' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const schedule = normalizeMealOrderingSchedule(body.schedule ?? body);

    await connectDB();
    await Settings.findOneAndUpdate(
      { key: MEAL_ORDERING_SCHEDULE_KEY },
      { key: MEAL_ORDERING_SCHEDULE_KEY, mealOrderingSchedule: schedule },
      { upsert: true, new: true }
    );

    const status = getMealOrderingStatus(schedule);
    return NextResponse.json(status);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }
    console.error('PUT meal-ordering error:', error);
    return NextResponse.json({ error: 'บันทึกตั้งค่ารอบมื้อไม่สำเร็จ' }, { status: 500 });
  }
}
