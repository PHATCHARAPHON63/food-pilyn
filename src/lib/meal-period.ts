// ============================================
// ช่วงมื้ออาหาร: เช้า / กลางวัน
// ============================================

import type { MealPeriod } from '@/types';

export type MealPeriodSlot = 'morning' | 'lunch';

export const MEAL_PERIOD_LABELS: Record<MealPeriod, string> = {
  morning: 'เฉพาะเช้า',
  lunch: 'เฉพาะกลางวัน',
  both: 'เช้าและกลางวัน',
};

export const MEAL_SLOT_LABELS: Record<MealPeriodSlot, string> = {
  morning: 'มื้อเช้า',
  lunch: 'มื้อกลางวัน',
};

/** กำหนดมื้อจากเวลาปัจจุบัน (ก่อน 11:00 = เช้า) */
export function detectMealPeriodSlot(date = new Date()): MealPeriodSlot {
  return date.getHours() < 11 ? 'morning' : 'lunch';
}

export function normalizeMealPeriod(value: unknown): MealPeriod {
  if (value === 'morning' || value === 'lunch' || value === 'both') return value;
  return 'both';
}

export function productMatchesMealSlot(
  product: { mealPeriod?: MealPeriod | string },
  slot: MealPeriodSlot
): boolean {
  const mp = normalizeMealPeriod(product.mealPeriod);
  return mp === 'both' || mp === slot;
}

export function choiceMatchesMealSlot(
  choice: { mealPeriod?: MealPeriod | string },
  productMealPeriod: MealPeriod | undefined,
  slot: MealPeriodSlot
): boolean {
  const mp = choice.mealPeriod
    ? normalizeMealPeriod(choice.mealPeriod)
    : normalizeMealPeriod(productMealPeriod);
  return mp === 'both' || mp === slot;
}
