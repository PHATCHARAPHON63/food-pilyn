// ============================================
// API: /api/settings/store-location
// GET ดึงจุดเริ่มต้นร้าน (แอดมินที่ล็อกอิน)
// PUT บันทึกจุดปักหมุดร้าน
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Settings from '@/models/Settings';
import { getCurrentUserFromRequest, requireAdmin } from '@/lib/auth';
import { parseGeoLocation, STORE_LOCATION_KEY } from '@/lib/store-location';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }

    await connectDB();
    const settings = await Settings.findOne({ key: STORE_LOCATION_KEY });
    const location = parseGeoLocation(settings?.location);
    return NextResponse.json({ location });
  } catch (error) {
    console.error('GET store location error:', error);
    return NextResponse.json({ error: 'ดึงตำแหน่งร้านไม่สำเร็จ' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const location = parseGeoLocation(body.location ?? body);
    if (!location) {
      return NextResponse.json({ error: 'กรุณาปักหมุดตำแหน่งร้าน' }, { status: 400 });
    }

    await connectDB();
    const settings = await Settings.findOneAndUpdate(
      { key: STORE_LOCATION_KEY },
      { key: STORE_LOCATION_KEY, location },
      { upsert: true, new: true }
    );

    return NextResponse.json({ location: parseGeoLocation(settings.location) });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 });
    }
    console.error('PUT store location error:', error);
    return NextResponse.json({ error: 'บันทึกตำแหน่งร้านไม่สำเร็จ' }, { status: 500 });
  }
}
