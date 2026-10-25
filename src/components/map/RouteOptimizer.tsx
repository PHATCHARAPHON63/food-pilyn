// ============================================
// Route Optimizer สำหรับแอดมิน
// คำนวณลำดับการจัดส่งแบบ Multi-stop โดยใช้
// 1) Nearest Neighbor Heuristic (ทันที)
// 2) OSRM Trip API (เส้นทางจริงบนถนน)
// และสร้างลิงก์เปิด Google Maps นำทางบนมือถือ
// ============================================
'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Navigation, Route, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { getDistanceMeters, getPaymentSummary, cn } from '@/lib/utils';
import { fetchOsrmTrip } from '@/lib/osrm';
import type { GeoLocation, Order } from '@/types';

const DeliveryMap = dynamic(() => import('./DeliveryMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[24rem] items-center justify-center rounded-2xl bg-surface">
      <div className="spinner" />
    </div>
  ),
});

interface RouteOptimizerProps {
  origin: GeoLocation;
  orders: Order[];
  className?: string;
}

function nearestNeighborRoute(origin: GeoLocation, orders: Order[]): Order[] {
  const remaining = [...orders];
  const route: Order[] = [];
  let current = origin;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    remaining.forEach((order, idx) => {
      const dist = getDistanceMeters(current, order.deliveryLocation);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = idx;
      }
    });

    const nextOrder = remaining.splice(nearestIdx, 1)[0];
    route.push(nextOrder);
    current = nextOrder.deliveryLocation;
  }

  return route.map((order, idx) => ({ ...order, deliverySequence: idx + 1 }));
}

function pathDistanceMeters(path: GeoLocation[]) {
  let total = 0;
  for (let i = 1; i < path.length; i += 1) {
    total += getDistanceMeters(path[i - 1], path[i]);
  }
  return total;
}

export default function RouteOptimizer({ origin, orders, className }: RouteOptimizerProps) {
  const initialOptimized = useMemo(() => nearestNeighborRoute(origin, orders), [origin, orders]);
  const ordersKey = orders.map((order) => order._id).join(',');
  const originKey = `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}`;
  const comboKey = `${ordersKey}|${originKey}`;
  const [routeKey, setRouteKey] = useState(comboKey);
  const [optimized, setOptimized] = useState<Order[]>(initialOptimized);
  const [routePath, setRoutePath] = useState<GeoLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ distance: '', duration: '', optimized: false });
  const [error, setError] = useState('');

  if (routeKey !== comboKey) {
    setRouteKey(comboKey);
    setOptimized(initialOptimized);
    setRoutePath([]);
    setSummary({ distance: '', duration: '', optimized: false });
  }

  const calculateRoute = async () => {
    if (orders.length === 0) return;
    setLoading(true);
    setError('');

    const nn = nearestNeighborRoute(origin, orders);
    const fallbackPath = [origin, ...nn.map((order) => order.deliveryLocation), origin];
    const fallbackDistance = pathDistanceMeters(fallbackPath);
    const fallbackDuration = Math.ceil(fallbackDistance / 6.94);

    try {
      const osrm = await fetchOsrmTrip(origin, orders);
      if (osrm) {
        setOptimized(osrm.orderedOrders);
        setRoutePath(osrm.path);
        setSummary({
          distance: `${(osrm.distanceMeters / 1000).toFixed(1)} กม.`,
          duration: `${Math.ceil(osrm.durationSeconds / 60)} นาที`,
          optimized: true,
        });
        return;
      }

      setOptimized(nn);
      setRoutePath(fallbackPath);
      setSummary({
        distance: `${(fallbackDistance / 1000).toFixed(1)} กม.`,
        duration: `${fallbackDuration} นาที`,
        optimized: false,
      });
    } catch (err) {
      setOptimized(nn);
      setRoutePath(fallbackPath);
      setSummary({
        distance: `${(fallbackDistance / 1000).toFixed(1)} กม.`,
        duration: `${fallbackDuration} นาที`,
        optimized: false,
      });
      setError(err instanceof Error ? err.message : 'ใช้เส้นทางประมาณการแทน');
    } finally {
      setLoading(false);
    }
  };

  const buildNavigationUrl = () => {
    if (optimized.length === 0) return '#';

    const originParam = `${origin.lat},${origin.lng}`;
    const waypointsParam = optimized
      .map((order) => `${order.deliveryLocation.lat},${order.deliveryLocation.lng}`)
      .join('|');

    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      originParam
    )}&destination=${encodeURIComponent(originParam)}&waypoints=${encodeURIComponent(
      waypointsParam
    )}&travelmode=driving`;
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-navy">วางแผนเส้นทางจัดส่ง</h2>
          <p className="text-sm text-muted">
            ออเดอร์ {orders.length} จุด · กดคำนวณเส้นทางเพื่อจัดลำดับและวาดเส้นทาง
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={calculateRoute} isLoading={loading} disabled={orders.length === 0}>
            <Route className="mr-2 h-4 w-4" />
            คำนวณเส้นทาง
          </Button>
          <Button variant="outline" asChild disabled={optimized.length === 0}>
            <a
              href={optimized.length === 0 ? undefined : buildNavigationUrl()}
              target="_blank"
              rel="noreferrer"
              aria-disabled={optimized.length === 0}
              className={optimized.length === 0 ? 'pointer-events-none' : undefined}
            >
              <Navigation className="mr-2 h-4 w-4" />
              นำทาง
            </a>
          </Button>
        </div>
      </Card>

      {summary.distance && (
        <Card className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft">
              <MapPin className="h-5 w-5 text-navy" />
            </div>
            <div>
              <p className="text-xs text-muted">จำนวนจุดส่ง</p>
              <p className="font-semibold">{optimized.length} จุด</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft">
              <Clock className="h-5 w-5 text-navy" />
            </div>
            <div>
              <p className="text-xs text-muted">ประมาณการเวลา</p>
              <p className="font-semibold">{summary.duration}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft">
              <Route className="h-5 w-5 text-navy" />
            </div>
            <div>
              <p className="text-xs text-muted">ระยะทางรวม</p>
              <p className="font-semibold">{summary.distance}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted">สถานะ</p>
              <p className="font-semibold">{summary.optimized ? 'จัดเส้นทางแล้ว' : 'ประมาณการ'}</p>
            </div>
          </div>
        </Card>
      )}

      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="h-[28rem] md:h-[32rem]">
        <DeliveryMap origin={origin} orders={orders} optimizedSequence={optimized} routePath={routePath} className="h-full" />
      </div>

      <Card>
        <h3 className="mb-3 font-semibold text-navy">ลำดับการจัดส่ง</h3>
        <div className="divide-y divide-border">
          {optimized.map((order, idx) => (
            <div key={order._id} className="flex items-center gap-3 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-navy-foreground">
                {idx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-navy">
                  {order.orderNumber} · {order.customer.name}
                </p>
                <p className="truncate text-sm text-muted">
                  {order.deliveryLocation.address || `${order.deliveryLocation.lat.toFixed(4)}, ${order.deliveryLocation.lng.toFixed(4)}`}
                </p>
                <p className="truncate text-xs text-navy">
                  {getPaymentSummary(order)}
                  {order.note ? ` · ${order.note}` : ''}
                </p>
              </div>
              <div className="text-right text-sm font-medium text-navy">
                {order.items.reduce((sum, item) => sum + item.quantity, 0)} รายการ
              </div>
            </div>
          ))}
          {optimized.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">ยังไม่มีออเดอร์สำหรับรอบจัดส่งนี้</p>
          )}
        </div>
      </Card>
    </div>
  );
}
