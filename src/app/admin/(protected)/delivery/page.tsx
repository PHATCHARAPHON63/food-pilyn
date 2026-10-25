// ============================================
// Delivery & Route Optimization Page
// แสดงแผนที่ จุดจัดส่ง และ Route Optimizer
// กรองออเดอร์ที่กำลังจัดส่ง/เตรียมเสร็จแล้ว
// ============================================
'use client';

import { useEffect, useRef, useState } from 'react';
import RouteOptimizer from '@/components/map/RouteOptimizer';
import GoogleMapPicker from '@/components/map/GoogleMapPicker';
import Card from '@/components/ui/Card';
import { MapPin } from 'lucide-react';
import {
  readStoreLocationCache,
  writeStoreLocationCache,
} from '@/lib/store-location';
import type { Order, GeoLocation } from '@/types';

export default function AdminDeliveryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [origin, setOrigin] = useState<GeoLocation | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimer = useRef<number>(0);

  useEffect(() => {
    const cached = readStoreLocationCache();
    if (cached) setOrigin(cached);

    const loadOrders = fetch('/api/orders?status=pending,confirmed,preparing,out-for-delivery')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'โหลดออเดอร์ไม่สำเร็จ');
          setOrders([]);
          return;
        }
        setOrders(data.orders || []);
      })
      .catch(() => {
        setError('โหลดออเดอร์ไม่สำเร็จ');
        setOrders([]);
      });

    const loadOrigin = fetch('/api/settings/store-location')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) return;
        if (data.location) {
          setOrigin(data.location);
          writeStoreLocationCache(data.location);
        }
      })
      .catch(() => {
        // ใช้ตำแหน่งที่บันทึกในเครื่องถ้าโหลดจากเซิร์ฟเวอร์ไม่สำเร็จ
      });

    Promise.all([loadOrders, loadOrigin]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(saveTimer.current);
  }, []);

  const persistOrigin = (location: GeoLocation) => {
    setOrigin(location);
    writeStoreLocationCache(location);
    setSaveState('saving');
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void fetch('/api/settings/store-location', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || 'บันทึกตำแหน่งร้านไม่สำเร็จ');
          if (data.location) {
            setOrigin(data.location);
            writeStoreLocationCache(data.location);
          }
          setSaveState('saved');
        })
        .catch(() => setSaveState('error'));
    }, 400);
  };

  return (
    <div className="space-y-4 pb-24 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-navy">แผนที่และเส้นทางจัดส่ง</h1>
        <p className="text-muted">ปักหมุดร้านเป็นจุดเริ่มต้น แล้ววางแผนเส้นทางจัดส่งหลายจุด</p>
      </div>

      <Card className="space-y-3">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted">จุดเริ่มต้น (ร้าน)</p>
            <p className="font-medium text-navy">
              {origin?.address || (origin ? `${origin.lat.toFixed(6)}, ${origin.lng.toFixed(6)}` : 'ยังไม่ได้ปักหมุดร้าน')}
            </p>
            <p className="mt-1 text-xs text-muted">
              {saveState === 'saving' && 'กำลังบันทึกตำแหน่งร้าน...'}
              {saveState === 'saved' && 'บันทึกตำแหน่งร้านแล้ว'}
              {saveState === 'error' && 'บันทึกตำแหน่งร้านไม่สำเร็จ ลองปักหมุดอีกครั้ง'}
              {saveState === 'idle' && 'แตะแผนที่หรือกดตำแหน่งฉันเพื่อปักหมุดร้าน'}
            </p>
          </div>
        </div>
        <GoogleMapPicker
          value={origin}
          onChange={persistOrigin}
          hint="แตะแผนที่เพื่อปักหมุดตำแหน่งร้าน"
        />
      </Card>

      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="spinner" />
        </div>
      ) : origin ? (
        <RouteOptimizer origin={origin} orders={orders} />
      ) : (
        <Card>
          <p className="py-6 text-center text-sm text-muted">ปักหมุดร้านก่อน เพื่อคำนวณเส้นทางจากจุดเริ่มต้นที่ถูกต้อง</p>
        </Card>
      )}
    </div>
  );
}
