// ============================================
// ตัวกรองออเดอร์ที่ยังไม่ถูกลบ (soft delete)
// ============================================

/** MongoDB: deletedAt เป็น null หรือไม่มีฟิลด์ */
export const ACTIVE_ORDER_FILTER = { deletedAt: null };
