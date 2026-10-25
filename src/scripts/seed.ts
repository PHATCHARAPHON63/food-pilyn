// ============================================
// Seed Script
// รัน: npx tsx src/scripts/seed.ts
// เมนูตั้งต้น ร้านคุณยุ้ย โรงเรียนคำเขื่อนแก้วอุปถัมภ์ (ข้ามรายการที่ชื่อซ้ำ)
// ============================================
import 'dotenv/config';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Product from '@/models/Product';
import type { Product as ProductType } from '@/types';

const SPICE_OPTION = {
  name: 'ระดับความเผ็ด',
  type: 'single' as const,
  required: true,
  choices: [
    { label: 'ไม่เผ็ด', priceAdjustment: 0 },
    { label: 'เผ็ดน้อย', priceAdjustment: 0 },
    { label: 'เผ็ดมาก', priceAdjustment: 0 },
  ],
};

const RICE_CURRY_OPTIONS = [
  {
    name: 'จำนวนแกง',
    type: 'single' as const,
    required: true,
    choices: [
      { label: '1 อย่าง', priceAdjustment: 0 },
      { label: '2 อย่าง', priceAdjustment: 15 },
      { label: '3 อย่าง', priceAdjustment: 30 },
    ],
  },
];

function withRice(
  name: string,
  basePrice: number,
  options: ProductType['options'] = [],
  description = 'เสิร์ฟพร้อมข้าวสวย'
): Omit<ProductType, '_id'> {
  return {
    name,
    description,
    basePrice,
    category: 'side-dish',
    mealPeriod: 'both',
    isAvailable: true,
    options,
  };
}

function recommended(
  name: string,
  basePrice: number,
  description = 'เมนูแนะนำ'
): Omit<ProductType, '_id'> {
  return {
    name,
    description,
    basePrice,
    category: 'other',
    mealPeriod: 'both',
    isAvailable: true,
    options: [],
  };
}

function extraItem(
  name: string,
  basePrice: number,
  description = 'รายการเพิ่มเติม'
): Omit<ProductType, '_id'> {
  return {
    name,
    description,
    basePrice,
    category: 'extra',
    mealPeriod: 'both',
    isAvailable: true,
    options: [],
  };
}

/** เมนูตั้งต้นตามป้ายร้านคุณยุ้ย — กับข้าวใช้กับข้าวราดแกง */
const SAMPLE_MENUS: Omit<ProductType, '_id'>[] = [
  {
    name: 'ข้าวราดแกง',
    description: 'ข้าวสวยร้อน ๆ เลือกกับข้าวราดตามใจ',
    basePrice: 35,
    category: 'rice-curry',
    mealPeriod: 'both',
    isAvailable: true,
    options: RICE_CURRY_OPTIONS,
  },

  extraItem('ข้าวเปล่า', 5, 'เพิ่มข้าวสวย'),
  extraItem('ไข่ดาว', 10),

  recommended('ข้าวมันไก่ต้ม', 45),
  recommended('ข้าวมันไก่ย่าง', 45),
  recommended('ข้าวหมูแดง หมูกรอบ', 50),
  recommended('ข้าวขาหมู', 50),

  withRice('กระเพราปลาหมึก', 40, [SPICE_OPTION]),
  withRice('กระเพราหมูสับ', 40, [SPICE_OPTION]),
  withRice('กระเพราเครื่องใน', 40, [SPICE_OPTION]),
  withRice('แกงเขียวหวาน', 40),
  withRice('แกงพะแนงหมู', 40),
  withRice('ผัดผักหมูกรอบ', 40),
  withRice('ไข่ตุ๋น', 35),
  withRice('ต้มยำไก่', 40),
  withRice('ผัดเต้าหู้ลูกชิ้น', 35),
  withRice('คะน้าหมูกรอบ', 40),
  withRice('ยำไก่แซ่บ', 40),
  withRice('หนังไก่ทรงเครื่อง', 35),
  withRice('ลาบหมู', 40, [SPICE_OPTION]),
];

/**
 * เมนูที่ตัดออก — ไม่เหมาะกับร้านข้าวใน รร.
 */
const REMOVED_MENU_NAMES = [
  'แกงเขียวหวานไก่',
  'แกงเผ็ดหมู',
  'แกงจืดเต้าหู้หมูสับ',
  'ผัดฉ่าหมู',
  'ผัดพริกแกงหมู',
  'ผัดคะน้าหมู',
  'ไข่เจียว',
  'หมูทอดกระเทียม',
  'ผัดกะเพราหมูสับ',
  'ผัดกะเพราไก่สับ',
  'ข้าวผัดหมู',
  'ผัดซีอิ๊วหมู',
  'ราดหน้าหมู',
  'แกงส้มชะอมกุ้ง',
  'ปลาทอดน้ำปลา',
  'ไก่ผัดขิง',
  'ผัดกะเพราทะเล',
  'ข้าวผัดกะเพรา',
  'ส้มตำไทย',
  'ไข่ดาว',
  'ไข่เจียว + ข้าว',
  'น้ำเปล่า',
  'น้ำแข็งใส',
  'โค้ก',
  'สไปรท์',
  'ชาเย็น',
  'กาแฟเย็น',
];

async function migrateCurryToWithRice() {
  const legacy = await Product.find({ category: 'curry' });
  let merged = 0;
  let removed = 0;

  for (const item of legacy) {
    const duplicate = await Product.findOne({ name: item.name, category: 'side-dish' });
    if (duplicate) {
      await Product.deleteOne({ _id: item._id });
      removed += 1;
    } else {
      item.category = 'side-dish';
      if (!item.description || item.description === 'ราดข้าว') {
        item.description = 'เสิร์ฟพร้อมข้าวสวย';
      }
      if (item.basePrice === 0) {
        item.basePrice = 35;
      }
      await item.save();
      merged += 1;
    }
  }

  if (merged + removed > 0) {
    console.log(`🔄 ย้ายเมนู curry → กับข้าว: รวม ${merged}, ลบซ้ำ ${removed}`);
  }
}

async function seed() {
  await connectDB();

  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existingAdmin = await User.findOne({ username: adminUsername });
  if (!existingAdmin) {
    await User.create({ username: adminUsername, password: adminPassword, role: 'admin' });
    console.log(`✅ สร้างแอดมิน: ${adminUsername}`);
  } else {
    console.log(`ℹ️ แอดมิน ${adminUsername} มีอยู่แล้ว`);
  }

  await migrateCurryToWithRice();

  const removedDrinks = await Product.deleteMany({ category: 'drink' });
  if (removedDrinks.deletedCount > 0) {
    console.log(`🗑️ ลบเมนูเครื่องดื่ม ${removedDrinks.deletedCount} รายการ`);
  }

  const removedOther = await Product.deleteMany({ name: { $in: REMOVED_MENU_NAMES } });
  if (removedOther.deletedCount > 0) {
    console.log(`🗑️ ลบเมนูที่ไม่ขายใน รร. ${removedOther.deletedCount} รายการ`);
  }

  let created = 0;
  let skipped = 0;

  for (const menu of SAMPLE_MENUS) {
    const exists = await Product.findOne({ name: menu.name });
    if (exists) {
      skipped += 1;
      continue;
    }
    await Product.create(menu);
    created += 1;
    console.log(`  + ${menu.name}`);
  }

  console.log(`\n✅ เมนู: เพิ่ม ${created} รายการ, ข้าม (มีอยู่แล้ว) ${skipped} รายการ`);

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
