// ============================================
// Mongoose Model: Settings
// เก็บค่าตั้งค่าร้าน เช่น จุดเริ่มต้นจัดส่ง
// ============================================
import { Schema, model, models } from 'mongoose';
import type { GeoLocation } from '@/types';
import type { MealOrderingSchedule } from '@/lib/meal-ordering-schedule';
import type { OrderEmailNotifySettings } from '@/lib/order-email-notify';

export interface StoreSettings {
  key: string;
  location?: GeoLocation;
  mealOrderingSchedule?: MealOrderingSchedule;
  orderEmailNotify?: OrderEmailNotifySettings;
}

const SettingsSchema = new Schema<StoreSettings>(
  {
    key: { type: String, required: true, unique: true },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String },
    },
    mealOrderingSchedule: {
      morning: {
        enabled: { type: Boolean },
        open: { type: String },
        close: { type: String },
      },
      lunch: {
        enabled: { type: Boolean },
        open: { type: String },
        close: { type: String },
      },
    },
    orderEmailNotify: {
      enabled: { type: Boolean, default: false },
      recipients: [{ type: String }],
    },
  },
  { timestamps: true }
);

const Settings = models.Settings || model<StoreSettings>('Settings', SettingsSchema);
export default Settings;
