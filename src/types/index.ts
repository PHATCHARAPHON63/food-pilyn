// ============================================
// ไฟล์รวม TypeScript Types หลักของระบบ
// ใช้กำหนดโครงสร้างข้อมูลทั้งฝั่ง Client และ Server
// ============================================

/**
 * ตำแหน่งพิกัดบนแผนที่ (lat, lng)
 */
export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
}

/** ช่วงที่ขายเมนูหรือตัวเลือก */
export type MealPeriod = 'morning' | 'lunch' | 'both';

/**
 * ตัวเลือกของสินค้า (เช่น เลือกแกง 1 อย่าง/2 อย่าง, เลือกเผ็ด-ไม่เผ็ด)
 */
export interface ProductOption {
  _id?: string;
  name: string;              // ชื่อตัวเลือก เช่น "จำนวนแกง", "ระดับความเผ็ด"
  type: 'single' | 'multiple'; // single = เลือกได้ 1, multiple = เลือกได้หลาย
  required: boolean;         // จำเป็นต้องเลือกหรือไม่
  choices: OptionChoice[];   // รายการตัวเลือกย่อย
}

export interface OptionChoice {
  _id?: string;
  label: string;             // ชื่อที่แสดง เช่น "1 อย่าง", "2 อย่าง"
  priceAdjustment: number;   // บวก/ลบราคาเพิ่ม
  /** ช่วงขายของตัวเลือกย่อย (ถ้าไม่ระบุ ใช้ mealPeriod ของเมนู) */
  mealPeriod?: MealPeriod;
}

/**
 * สินค้า/เมนูอาหาร
 */
export interface Product {
  _id: string;
  name: string;
  description?: string;
  basePrice: number;         // ราคาฐาน
  image?: string;
  category: 'rice-curry' | 'side-dish' | 'extra' | 'other';
  /** ช่วงขายของเมนู (กับข้าว / เพิ่มเติม / อื่น ๆ) */
  mealPeriod?: MealPeriod;
  isAvailable: boolean;
  options: ProductOption[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * รายการสินค้าภายในคำสั่งซื้อ (Order Item)
 */
export interface OrderItem {
  product: Product | string; // populate หรือ ObjectId
  productName: string;       // ชื่อตอนสั่งซื้อ (snapshot)
  unitPrice: number;
  quantity: number;
  selectedChoices: {
    optionName: string;
    choiceLabels: string[];
  }[];
  subtotal: number;
}

/**
 * ข้อมูลลูกค้า
 */
export interface CustomerInfo {
  name: string;
  phone: string;
}

/**
 * สถานะคำสั่งซื้อ
 */
export type OrderStatus =
  | 'pending'      // รอรับออเดอร์
  | 'confirmed'    // ยืนยันแล้ว
  | 'preparing'    // กำลังเตรียม
  | 'out-for-delivery' // กำลังจัดส่ง
  | 'delivered'    // จัดส่งสำเร็จ
  | 'cancelled';   // ยกเลิก

/**
 * วิธีการชำระเงิน
 */
export type PaymentMethod = 'cash' | 'transfer';

/**
 * รูปแบบเงินสดที่ลูกค้าจะจ่าย
 * exact = พอดีไม่ต้องทอน, banknote = ไม่พอ จ่ายเป็นแบงค์
 */
export type CashTenderType = 'exact' | 'banknote';

/**
 * คำสั่งซื้อ
 */
export interface Order {
  _id: string;
  orderNumber: string;       // เลขออเดอร์ เช่น ORD-0001
  items: OrderItem[];
  customer: CustomerInfo;
  deliveryLocation: GeoLocation;
  paymentMethod: PaymentMethod;
  cashTenderType?: CashTenderType;
  cashBanknote?: number;     // มูลค่าแบงค์ที่จะจ่าย เช่น 100, 500, 1000
  totalAmount: number;
  status: OrderStatus;
  deliverySequence?: number; // ลำดับจัดส่งหลัง optimize route
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * ข้อมูลสำหรับแสดงบนแผนที่
 */
export interface DeliveryStop {
  order: Order;
  sequence: number;
  location: GeoLocation;
  estimatedArrival?: string;
}

/**
 * ผลลัพธ์การ Optimize เส้นทาง
 */
export interface OptimizedRoute {
  origin: GeoLocation;
  destination: GeoLocation;
  waypoints: GeoLocation[];
  stops: DeliveryStop[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  googleMapsUrl: string;
}

/**
 * ผู้ใช้งานระบบ (แอดมิน)
 */
export interface User {
  _id: string;
  username: string;
  role: 'admin' | 'driver';
  createdAt?: string;
}
