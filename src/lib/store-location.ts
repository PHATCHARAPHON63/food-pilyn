// ============================================
// จุดเริ่มต้นร้านสำหรับคำนวณเส้นทางจัดส่ง
// ============================================
import type { GeoLocation } from '@/types';

export const STORE_LOCATION_KEY = 'store-location';
export const STORE_LOCATION_CACHE_KEY = 'admin-store-location';

export function parseGeoLocation(raw: unknown): GeoLocation | null {
  if (!raw || typeof raw !== 'object') return null;
  const loc = raw as Record<string, unknown>;
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return {
    lat,
    lng,
    address: typeof loc.address === 'string' && loc.address.trim() ? loc.address.trim() : undefined,
  };
}

export function readStoreLocationCache(): GeoLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = window.localStorage.getItem(STORE_LOCATION_CACHE_KEY);
    return saved ? parseGeoLocation(JSON.parse(saved)) : null;
  } catch {
    return null;
  }
}

export function writeStoreLocationCache(location: GeoLocation) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORE_LOCATION_CACHE_KEY, JSON.stringify(location));
}
