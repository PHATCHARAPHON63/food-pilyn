// ============================================
// ข้าวราดแกง: เลือกกับข้าวจากเมนูหมวด side-dish (ผูกกันเสมอ)
// ============================================

export const WITH_RICE_CATEGORY = 'side-dish' as const;
export const RICE_CURRY_CATEGORY = 'rice-curry' as const;
export const CURRY_COUNT_OPTION_NAME = 'จำนวนแกง';
export const WITH_RICE_PICKER_OPTION_NAME = 'กับข้าวที่เลือก';

/** @deprecated ใช้ WITH_RICE_CATEGORY */
export const CURRY_CATEGORY = WITH_RICE_CATEGORY;

/** @deprecated ใช้ WITH_RICE_PICKER_OPTION_NAME */
export const CURRY_PICKER_OPTION_NAME = WITH_RICE_PICKER_OPTION_NAME;

/** แปลง "1 อย่าง" / "2 อย่าง" เป็นจำนวนที่ต้องเลือก */
export function parseCurrySlotCount(label: string): number {
  const match = label.match(/(\d+)/);
  return match ? Number(match[1]) : 1;
}
