// ============================================
// OSRM: คำนวณเส้นทางหลายจุดโดยไม่ต้องใช้ Google Maps Key
// ============================================
import type { GeoLocation, Order } from '@/types';

export interface OsrmTripResult {
  orderedOrders: Order[];
  path: GeoLocation[];
  distanceMeters: number;
  durationSeconds: number;
}

interface OsrmTripResponse {
  code?: string;
  waypoints?: { waypoint_index?: number }[];
  trips?: {
    distance: number;
    duration: number;
    geometry?: { coordinates?: [number, number][] };
  }[];
}

export async function fetchOsrmTrip(origin: GeoLocation, orders: Order[]): Promise<OsrmTripResult | null> {
  if (orders.length === 0) return null;

  const points = [origin, ...orders.map((order) => order.deliveryLocation)];
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
  const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&roundtrip=true&overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as OsrmTripResponse;
  if (data.code !== 'Ok' || !data.trips?.[0] || !data.waypoints) return null;

  const trip = data.trips[0];
  const visitOrder = data.waypoints
    .map((wp, inputIdx) => ({ inputIdx, tripIdx: wp.waypoint_index ?? inputIdx }))
    .filter((item) => item.inputIdx > 0)
    .sort((a, b) => a.tripIdx - b.tripIdx)
    .map((item) => item.inputIdx - 1);

  const orderedOrders = visitOrder.map((orderIdx, seq) => ({
    ...orders[orderIdx],
    deliverySequence: seq + 1,
  }));

  const path = (trip.geometry?.coordinates || []).map(([lng, lat]) => ({ lat, lng }));

  return {
    orderedOrders,
    path: path.length > 0 ? path : [...points, origin],
    distanceMeters: trip.distance,
    durationSeconds: trip.duration,
  };
}
