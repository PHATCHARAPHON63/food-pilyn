// ============================================
// Authentication Helpers
// ใช้ JSON Web Token (jose) สำหรับระบบ Login แบบ Credentials
// ไม่ใช้ next-auth เพื่อให้ควบคุมง่ายและเบา
// ============================================
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-change-in-production');
const TOKEN_NAME = 'admin-token';

export interface AuthPayload {
  userId: string;
  username: string;
  role: 'admin' | 'driver';
}

/**
 * สร้าง JWT Token สำหรับแอดมินที่ Login สำเร็จ
 */
export async function createToken(payload: AuthPayload) {
  return new SignJWT(payload as unknown as Record<string, string>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET);
}

/**
 * ตรวจสอบ JWT Token จาก Cookie
 */
export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthPayload;
  } catch {
    return null;
  }
}

/**
 * ดึงข้อมูลแอดมินจาก Cookie ในปัจจุบัน
 */
export async function getCurrentUser(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * ดึงข้อมูลผู้ใช้จาก NextRequest (ใช้ใน API Route)
 */
export async function getCurrentUserFromRequest(req: NextRequest): Promise<AuthPayload | null> {
  const token = req.cookies.get(TOKEN_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * ตั้งค่า Cookie สำหรับ Login
 */
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 ชั่วโมง
    path: '/',
  });
}

/**
 * ลบ Cookie สำหรับ Logout
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

/**
 * Middleware/Guard สำหรับตรวจสอบสิทธิ์แอดมิน
 */
export async function requireAdmin(req?: NextRequest) {
  const user = req ? await getCurrentUserFromRequest(req) : await getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  return user;
}
