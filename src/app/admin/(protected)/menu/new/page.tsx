// ============================================
// เพิ่มเมนูใหม่ (หน้าเต็ม)
// ============================================
'use client';

import ProductForm from '@/components/admin/ProductForm';
import type { Product } from '@/types';

const EMPTY_PRODUCT: Product = {
  _id: '',
  name: '',
  description: '',
  basePrice: 0,
  category: 'rice-curry',
  mealPeriod: 'both',
  isAvailable: true,
  options: [],
};

export default function NewMenuPage() {
  return <ProductForm initial={EMPTY_PRODUCT} title="เพิ่มเมนู" />;
}
