// ============================================
// Mongoose Model: Settings
// เก็บค่าตั้งค่าร้าน เช่น จุดเริ่มต้นจัดส่ง
// ============================================
import { Schema, model, models } from 'mongoose';
import type { GeoLocation } from '@/types';

export interface StoreSettings {
  key: string;
  location?: GeoLocation;
}

const SettingsSchema = new Schema<StoreSettings>(
  {
    key: { type: String, required: true, unique: true },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String },
    },
  },
  { timestamps: true }
);

const Settings = models.Settings || model<StoreSettings>('Settings', SettingsSchema);
export default Settings;
