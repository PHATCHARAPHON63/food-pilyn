// ============================================
// ตั้งค่าเปิด–ปิดรับออเดอร์ตามรอบมื้อ (เวลาไทย)
// ============================================

import type { MealPeriodSlot } from '@/lib/meal-period';

export const THAILAND_TIMEZONE = 'Asia/Bangkok';
export const MEAL_ORDERING_SCHEDULE_KEY = 'meal-ordering-schedule';

export interface MealSlotSchedule {
  /** เปิดรับออเดอร์รอบนี้ (ถ้าปิด จะไม่รับไม่ว่าเวลาใด) */
  enabled: boolean;
  /** รูปแบบ HH:mm ตามเวลาไทย */
  open: string;
  close: string;
}

export interface MealOrderingSchedule {
  morning: MealSlotSchedule;
  lunch: MealSlotSchedule;
}

export const DEFAULT_MEAL_ORDERING_SCHEDULE: MealOrderingSchedule = {
  morning: { enabled: true, open: '06:00', close: '11:00' },
  lunch: { enabled: true, open: '11:00', close: '14:00' },
};

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function parseTimeToMinutes(value: string): number | null {
  const m = TIME_RE.exec(String(value).trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  return hour * 60 + minute;
}

export function normalizeTimeHm(value: unknown, fallback: string): string {
  const parsed = parseTimeToMinutes(typeof value === 'string' ? value : '');
  if (parsed === null) return fallback;
  const h = Math.floor(parsed / 60);
  const min = parsed % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function normalizeMealSlotSchedule(
  raw: unknown,
  defaults: MealSlotSchedule
): MealSlotSchedule {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    enabled: typeof row.enabled === 'boolean' ? row.enabled : defaults.enabled,
    open: normalizeTimeHm(row.open, defaults.open),
    close: normalizeTimeHm(row.close, defaults.close),
  };
}

export function normalizeMealOrderingSchedule(raw: unknown): MealOrderingSchedule {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    morning: normalizeMealSlotSchedule(row.morning, DEFAULT_MEAL_ORDERING_SCHEDULE.morning),
    lunch: normalizeMealSlotSchedule(row.lunch, DEFAULT_MEAL_ORDERING_SCHEDULE.lunch),
  };
}

export function getBangkokMinutesSinceMidnight(date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: THAILAND_TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  const h = hour === 24 ? 0 : hour;
  return h * 60 + minute;
}

export function getBangkokHour(date = new Date()): number {
  return Math.floor(getBangkokMinutesSinceMidnight(date) / 60);
}

export function formatBangkokTime(date = new Date()): string {
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: THAILAND_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/** อยู่ในช่วง [open, close) — close เป็น exclusive */
export function isMinuteWithinWindow(
  minute: number,
  openMinutes: number,
  closeMinutes: number
): boolean {
  if (openMinutes === closeMinutes) return false;
  if (openMinutes < closeMinutes) {
    return minute >= openMinutes && minute < closeMinutes;
  }
  return minute >= openMinutes || minute < closeMinutes;
}

export function isMealSlotOpen(
  schedule: MealOrderingSchedule,
  slot: MealPeriodSlot,
  date = new Date()
): boolean {
  const cfg = schedule[slot];
  if (!cfg.enabled) return false;
  const open = parseTimeToMinutes(cfg.open);
  const close = parseTimeToMinutes(cfg.close);
  if (open === null || close === null) return false;
  const now = getBangkokMinutesSinceMidnight(date);
  return isMinuteWithinWindow(now, open, close);
}

export interface MealOrderingStatus {
  schedule: MealOrderingSchedule;
  bangkokTime: string;
  open: Record<MealPeriodSlot, boolean>;
}

export function getMealOrderingStatus(
  schedule: MealOrderingSchedule,
  date = new Date()
): MealOrderingStatus {
  return {
    schedule,
    bangkokTime: formatBangkokTime(date),
    open: {
      morning: isMealSlotOpen(schedule, 'morning', date),
      lunch: isMealSlotOpen(schedule, 'lunch', date),
    },
  };
}

/** เลือกรอบเริ่มต้น: รอบที่เปิดและตรงช่วงเวลาปัจจุบัน หรือรอบที่เปิดอยู่ */
export function pickDefaultMealSlot(
  schedule: MealOrderingSchedule,
  date = new Date()
): MealPeriodSlot | null {
  const status = getMealOrderingStatus(schedule, date);
  const hour = getBangkokHour(date);
  const detected: MealPeriodSlot = hour < 11 ? 'morning' : 'lunch';
  if (status.open[detected]) return detected;
  if (status.open.morning) return 'morning';
  if (status.open.lunch) return 'lunch';
  return null;
}

export function formatSlotWindow(slot: MealSlotSchedule): string {
  return `${slot.open}–${slot.close}`;
}
