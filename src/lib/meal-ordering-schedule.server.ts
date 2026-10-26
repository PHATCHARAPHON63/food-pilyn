// ============================================
// โหลดตั้งค่ารอบมื้อจาก DB (ใช้ฝั่งเซิร์ฟเวอร์เท่านั้น)
// ============================================
import connectDB from '@/lib/db';
import Settings from '@/models/Settings';
import {
  MEAL_ORDERING_SCHEDULE_KEY,
  normalizeMealOrderingSchedule,
  type MealOrderingSchedule,
} from '@/lib/meal-ordering-schedule';

export async function loadMealOrderingSchedule(): Promise<MealOrderingSchedule> {
  await connectDB();
  const doc = await Settings.findOne({ key: MEAL_ORDERING_SCHEDULE_KEY });
  return normalizeMealOrderingSchedule(doc?.mealOrderingSchedule);
}
