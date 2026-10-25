# ระบบสั่งอาหารและจัดการเส้นทางการจัดส่ง

โปรเจกต์ Next.js 16 (App Router + React Server Components) สำหรับร้านข้าวแกง/อาหารตามสั่ง รองรับการสั่งอาหารผ่านมือถือ และระบบจัดการออเดอร์ + วางแผนเส้นทางจัดส่งแบบหลายจุดสำหรับแอดมิน

## Technology Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** MongoDB + Mongoose
- **Styling:** Tailwind CSS v4 (Mobile-First)
- **Map & Routing:** Google Maps API (@react-google-maps/api + Directions API)
- **Auth:** JWT (jose) + Cookie HttpOnly
- **Language:** TypeScript

## โครงสร้างโปรเจกต์

```
food-ordering-master/
├── .env.local.example          # ตัวอย่างค่าคอนฟิกสภาพแวดล้อม
├── src/
│   ├── app/
│   │   ├── (shop)/             # ฝั่งลูกค้า
│   │   │   ├── page.tsx        # หน้าเลือกเมนู
│   │   │   └── checkout/
│   │   │       ├── page.tsx    # หน้า Checkout + ปักหมุดแผนที่
│   │   │       └── success/
│   │   │           └── page.tsx
│   │   ├── admin/              # ฝั่งแอดมิน
│   │   │   ├── login/
│   │   │   ├── page.tsx        # Dashboard
│   │   │   ├── menu/
│   │   │   ├── orders/
│   │   │   └── delivery/       # Route Optimization + แผนที่
│   │   └── api/                # API Routes
│   │       ├── auth/
│   │       ├── orders/
│   │       └── products/
│   ├── components/
│   │   ├── admin/
│   │   ├── map/                # GoogleMapPicker, DeliveryMap, RouteOptimizer
│   │   ├── menu/               # MenuCard, MenuSelector
│   │   ├── order/
│   │   └── ui/                 # Button, Input, Card
│   ├── hooks/
│   ├── lib/                    # db.ts, auth.ts, utils.ts
│   ├── models/                 # Mongoose Models
│   ├── scripts/
│   │   └── seed.ts             # Seed แอดมิน + เมนูตัวอย่าง
│   └── types/
│       └── index.ts            # TypeScript Types
├── next.config.ts
├── package.json
└── tsconfig.json
```

## เริ่มต้นใช้งาน

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. ตั้งค่าสภาพแวดล้อม

```bash
cp .env.local.example .env.local
```

แก้ไข `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/food-ordering
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
JWT_SECRET=your_secret_at_least_32_chars
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
NEXT_PUBLIC_STORE_LAT=13.7563
NEXT_PUBLIC_STORE_LNG=100.5018
```

> **หมายเหตุ:** `GOOGLE_MAPS_API_KEY` ใช้ฝั่ง Server (ถ้ามี) และ `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` ใช้ฝั่ง Client สำหรับโหลดแผนที่

### 3. Seed ข้อมูลเริ่มต้น

```bash
npm run seed
```

จะสร้าง:
- แอดมิน (`ADMIN_USERNAME` / `ADMIN_PASSWORD`)
- เมนูตัวอย่าง เช่น ข้าวราดแกง 1/2/3 อย่าง, ผัดกะเพรา, น้ำเปล่า

### 4. รัน Development Server

```bash
npm run dev
```

เปิดเบราว์เซอร์:
- ฝั่งลูกค้า: http://localhost:3000
- ฝั่งแอดมิน: http://localhost:3000/admin

## คำแนะนำการตั้งค่า Google Maps API

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้างโปรเจกต์ใหม่ (หรือเลือกโปรเจกต์ที่มีอยู่)
3. เปิดใช้งาน APIs ต่อไปนี้:
   - **Maps JavaScript API** — แสดงแผนที่บนเว็บ
   - **Places API** — ค้นหาสถานที่ (optional)
   - **Directions API** — คำนวณเส้นทางหลายจุด (Route Optimization)
4. ไปที่ **Credentials** → **Create Credentials** → **API Key**
5. (แนะนำ) จำกัด API Key ด้วย:
   - **HTTP referrers** เฉพาะโดเมนร้านค้า (เช่น `localhost:3000/*`, `https://yourdomain.com/*`)
   - **API restrictions** เฉพาะ Maps JavaScript API, Directions API, Places API
6. นำ API Key มาใส่ใน `.env.local` ทั้ง `GOOGLE_MAPS_API_KEY` และ `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## การทำงานของระบบ Route Optimization

1. แอดมินเปิดหน้า **จัดส่ง (`/admin/delivery`)**
2. ระบบดึงออเดอร์ที่สถานะ `preparing` หรือ `out-for-delivery`
3. แสดงจุดบนแผนที่และเรียงลำดับเบื้องต้นด้วย **Nearest Neighbor** จากจุดร้าน
4. กดปุ่ม **คำนวณเส้นทาง** → เรียก Google Directions API พร้อม `optimizeWaypoints: true`
5. Google ส่งลำดับจุดที่ประหยัดเวลา/ระยะทางกลับมา ระบบอัปเดตลำดับการจัดส่ง
6. กดปุ่ม **นำทาง** → เปิดลิงก์ Google Maps App พร้อม Waypoints ที่เรียงลำดับแล้ว

## โครงสร้าง Database Schema (MongoDB)

### User
```js
{
  username: String (unique),
  password: String (hashed),
  role: 'admin' | 'driver',
  createdAt: Date,
  updatedAt: Date
}
```

### Product
```js
{
  name: String,
  description: String,
  basePrice: Number,
  image: String,
  category: 'rice-curry' | 'side-dish' | 'drink' | 'other',
  isAvailable: Boolean,
  options: [{
    name: String,
    type: 'single' | 'multiple',
    required: Boolean,
    choices: [{
      label: String,
      priceAdjustment: Number
    }]
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Order
```js
{
  orderNumber: String (unique),
  items: [{
    product: ObjectId (ref: Product),
    productName: String,
    unitPrice: Number,
    quantity: Number,
    selectedChoices: [{
      optionName: String,
      choiceLabels: [String]
    }],
    subtotal: Number
  }],
  customer: {
    name: String,
    phone: String
  },
  deliveryLocation: {
    lat: Number,
    lng: Number,
    address: String
  },
  paymentMethod: 'cash' | 'transfer',
  totalAmount: Number,
  status: 'pending' | 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled',
  deliverySequence: Number,
  note: String,
  createdAt: Date,
  updatedAt: Date
}
```

## หมายเหติสำคัญ

- ระบบชำระเงินเป็นเพียงตัวเลือก (`cash` / `transfer`) ไม่ได้เชื่อมต่อ Payment Gateway
- สำหรับ Production ควรใช้ HTTPS และตั้งค่า Cookie `secure: true`
- ควร Backup MongoDB เป็นประจำ
