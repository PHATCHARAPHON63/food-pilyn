// ============================================
// ตัวช่วยระบุพิกัดและแปลงที่อยู่
// ============================================
import type { GeoLocation } from '@/types';

export const DEFAULT_MAP_CENTER: GeoLocation = {
  lat: Number(process.env.NEXT_PUBLIC_STORE_LAT) || 13.7563,
  lng: Number(process.env.NEXT_PUBLIC_STORE_LNG) || 100.5018,
};

export function getGoogleMapsApiKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
}

export function geoErrorMessage(error?: GeolocationPositionError | null) {
  if (!error) return 'ไม่สามารถดึงตำแหน่งปัจจุบันได้';
  if (error.code === error.PERMISSION_DENIED) return 'กรุณาอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์';
  if (error.code === error.POSITION_UNAVAILABLE) return 'ไม่พบตำแหน่งปัจจุบัน';
  if (error.code === error.TIMEOUT) return 'หมดเวลารอตำแหน่งปัจจุบัน';
  return 'ไม่สามารถดึงตำแหน่งปัจจุบันได้';
}

export function formatLatLng(pos: GeoLocation) {
  return `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
}

/**
 * แปลงพิกัดเป็นที่อยู่ด้วย Nominatim (ใช้เมื่อไม่มี Google Maps)
 */
export async function reverseGeocodeNominatim(pos: GeoLocation): Promise<string | undefined> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.lat}&lon=${pos.lng}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return undefined;
  const data = (await res.json()) as { display_name?: string };
  return data.display_name || undefined;
}
