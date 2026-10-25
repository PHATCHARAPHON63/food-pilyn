// ============================================
// Mongoose Model: Product
// สำหรับเก็บข้อมูลเมนูอาหารและตัวเลือกแบบ Dynamic
// ============================================
import { Schema, model, models } from 'mongoose';
import type { Product, ProductOption, OptionChoice } from '@/types';

const OptionChoiceSchema = new Schema<OptionChoice>(
  {
    label: { type: String, required: true },
    priceAdjustment: { type: Number, default: 0 },
  },
  { _id: true }
);

const ProductOptionSchema = new Schema<ProductOption>(
  {
    name: { type: String, required: true },      // เช่น "จำนวนแกง"
    type: { type: String, enum: ['single', 'multiple'], default: 'single' },
    required: { type: Boolean, default: true },
    choices: [OptionChoiceSchema],
  },
  { _id: true }
);

const ProductSchema = new Schema<Product>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    basePrice: { type: Number, required: true, min: 0 },
    image: { type: String },
    category: {
      type: String,
      enum: ['rice-curry', 'side-dish', 'other'],
      default: 'rice-curry',
    },
    isAvailable: { type: Boolean, default: true },
    options: [ProductOptionSchema],
  },
  { timestamps: true }
);

const ProductModel = models.Product || model<Product>('Product', ProductSchema);
export default ProductModel;
