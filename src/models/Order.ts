// ============================================
// Mongoose Model: Order
// สำหรับเก็บข้อมูลคำสั่งซื้อ ลูกค้า พิกัดจัดส่ง และสถานะ
// ============================================
import { Schema, model, models } from 'mongoose';
import type { Order, OrderItem } from '@/types';

const SelectedChoiceSchema = new Schema(
  {
    optionName: { type: String, required: true },
    choiceLabels: [{ type: String }],
  },
  { _id: false }
);

const OrderItemSchema = new Schema<OrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    selectedChoices: [SelectedChoiceSchema],
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const GeoLocationSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String },
  },
  { _id: false }
);

const OrderSchema = new Schema<Order>(
  {
    orderNumber: { type: String, required: true, unique: true },
    items: [OrderItemSchema],
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
    },
    deliveryLocation: { type: GeoLocationSchema, required: true },
    paymentMethod: { type: String, enum: ['cash', 'transfer'], required: true },
    cashTenderType: { type: String, enum: ['exact', 'banknote'] },
    cashBanknote: { type: Number, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    deliverySequence: { type: Number },
    note: { type: String },
  },
  { timestamps: true }
);

const OrderModel = models.Order || model<Order>('Order', OrderSchema);
export default OrderModel;
