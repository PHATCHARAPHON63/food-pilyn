// ============================================
// MongoDB Connection Handler
// ใช้ Mongoose เชื่อมต่อกับ MongoDB พร้อมจัดการ Connection Pool
// รองรับ Next.js Dev Hot Reload โดยไม่เปิด connection ซ้ำ
// ============================================
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/food-ordering';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

/**
 * เก็บ connection ใน global cache เพื่อป้องกันการเปิดหลาย connection
 * ในขณะ development (Next.js hot reload)
 */
let cached = (global as { mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }).mongoose;

if (!cached) {
  cached = { conn: null, promise: null };
  (global as { mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }).mongoose = cached;
}

export async function connectDB() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached!.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default connectDB;
