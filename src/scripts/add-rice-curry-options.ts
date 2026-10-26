// ============================================
// สร้างเมนู「ข้าวราดแกง」ใหม่ 1 รายการ (มีตัวเลือกจำนวนแกง)
// ไม่แก้ไข ไม่ลบ เมนูอื่นในระบบ
// รัน: npm run add-rice-curry-options
// ============================================
import 'dotenv/config';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { CURRY_COUNT_OPTION_NAME, RICE_CURRY_CATEGORY } from '@/lib/rice-curry';

const RICE_CURRY_MENU_NAME = 'ข้าวราดแกง';

const NEW_RICE_CURRY_MENU = {
  name: RICE_CURRY_MENU_NAME,
  description: 'ข้าวสวยร้อน ๆ เลือกจำนวนแกง แล้วเลือกกับข้าวจากเมนูกับข้าว',
  basePrice: 35,
  category: RICE_CURRY_CATEGORY,
  mealPeriod: 'both' as const,
  isAvailable: true,
  options: [
    {
      name: CURRY_COUNT_OPTION_NAME,
      type: 'single' as const,
      required: true,
      choices: [
        { label: '1 อย่าง', priceAdjustment: 0 },
        { label: '2 อย่าง', priceAdjustment: 15 },
        { label: '3 อย่าง', priceAdjustment: 30 },
      ],
    },
  ],
};

async function main() {
  await connectDB();

  const exists = await Product.findOne({ name: RICE_CURRY_MENU_NAME });
  if (exists) {
    console.log(`มีเมนู「${RICE_CURRY_MENU_NAME}」อยู่แล้ว (id: ${exists._id})`);
    console.log('ไม่แก้ข้อมูลเดิม — ถ้าต้องการสร้างใหม่ ลบหรือเปลี่ยนชื่อเมนูเดิมในแอดมินก่อน');
    process.exit(0);
  }

  const created = await Product.create(NEW_RICE_CURRY_MENU);
  console.log(`สร้างเมนู「${RICE_CURRY_MENU_NAME}」แล้ว (id: ${created._id})`);
  console.log(`  หมวด: ข้าวราดแกง · ราคาฐาน ${NEW_RICE_CURRY_MENU.basePrice} บาท`);
  console.log(`  ตัวเลือก: ${CURRY_COUNT_OPTION_NAME} (1 / 2 / 3 อย่าง)`);
  console.log('  ลูกค้ากดเลือกเมนูนี้ → เลือกจำนวนแกง → เลือกกับข้าวจากหมวดกับข้าว');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
