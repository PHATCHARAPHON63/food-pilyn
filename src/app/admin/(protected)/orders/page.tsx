// ============================================
// Order Management Page (Realtime Polling)
// แสดงรายการออเดอร์ทั้งหมด อัปเดตสถานะได้
// และดึงข้อมูลใหม่อัตโนมัติทุก 5 วินาที (Polling)
// ============================================
'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Radio } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import OrderStatusBadge from '@/components/order/OrderStatusBadge';
import { formatPrice, getPaymentSummary, getStatusLabel } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const STATUS_FLOW: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'out-for-delivery',
  'delivered',
  'cancelled',
];
const POLLING_INTERVAL = 5000; // 5 วินาที

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [now, setNow] = useState<number>(0);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState('');
  const previousOrderIds = useRef<Set<string>>(new Set());

  /**
   * ดึงข้อมูลออเดอร์จาก API
   * @param silent ถ้า true จะไม่แสดง loading state (ใช้ตอน polling)
   */
  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error || 'โหลดออเดอร์ไม่สำเร็จ');
        setOrders([]);
        return;
      }
      setFetchError('');
      const fetchedOrders: Order[] = data.orders || [];

      // ตรวจหาออเดอร์ใหม่ที่เพิ่งเข้ามา เพื่อแสดงแจ้งเตือน
      const currentIds = new Set(fetchedOrders.map((o) => o._id));
      if (previousOrderIds.current.size > 0) {
        const newIds = [...currentIds].filter((id) => !previousOrderIds.current.has(id));
        if (newIds.length > 0) {
          const newOrder = fetchedOrders.find((o) => o._id === newIds[0]);
          if (newOrder) {
            setNewOrderAlert(`ออเดอร์ใหม่: ${newOrder.orderNumber}`);
            // ซ่อนแจ้งเตือนหลัง 3 วินาที
            setTimeout(() => setNewOrderAlert(null), 3000);
          }
        }
      }
      previousOrderIds.current = currentIds;

      setOrders(fetchedOrders);
      setLastUpdated(new Date());
    } catch {
      setFetchError('โหลดออเดอร์ไม่สำเร็จ');
      setOrders([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // ดึงข้อมูลครั้งแรกเมื่อโหลดหน้า
    fetchOrders(false);
    setNow(Date.now());

    // ตั้งค่า Polling ทุก 5 วินาที
    const interval = setInterval(() => {
      fetchOrders(true);
    }, POLLING_INTERVAL);

    // อัปเดตเวลาปัจจุบันทุก 1 วินาที เพื่อคำนวณ "X วินาทีที่แล้ว"
    const clock = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(clock);
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const updateStatus = async (id: string, status: OrderStatus) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchOrders();
    else setFetchError('อัปเดตสถานะไม่สำเร็จ');
  };

  const secondsAgo = lastUpdated
    ? Math.floor((now - lastUpdated.getTime()) / 1000)
    : null;

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">จัดการออเดอร์</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            <span className="flex items-center gap-1">
              <Radio className="h-3.5 w-3.5" />
              Realtime Polling ทุก {POLLING_INTERVAL / 1000} วินาที
            </span>
            {secondsAgo !== null && (
              <span className="text-muted">· อัปเดตล่าสุด {secondsAgo} วินาทีที่แล้ว</span>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchOrders()} isLoading={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          รีเฟรช
        </Button>
      </div>

      {fetchError && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{fetchError}</div>
      )}

      {newOrderAlert && (
        <div className="animate-in slide-in-from-top-2 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-700">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
          {newOrderAlert}
        </div>
      )}

      <div className="grid gap-3">
        {orders.map((order) => (
          <Card key={order._id} className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-navy">{order.orderNumber}</p>
                <p className="text-sm text-muted">
                  {order.customer.name} · {order.customer.phone}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <div className="rounded-xl bg-surface p-3 text-sm">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between py-0.5">
                  <span>
                    {item.productName} x{item.quantity}
                  </span>
                  <span>{formatPrice(item.subtotal)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
                <span>รวม</span>
                <span className="text-navy">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <p className="text-navy">
                <span className="text-muted">ชำระเงิน: </span>
                {getPaymentSummary(order)}
              </p>
              {order.note && (
                <p className="rounded-lg bg-accent-soft px-3 py-2 text-navy">
                  <span className="text-muted">โน้ต: </span>
                  {order.note}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {STATUS_FLOW.map((status) => (
                <button
                  key={status}
                  onClick={() => updateStatus(order._id, status)}
                  disabled={order.status === status}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    order.status === status
                      ? 'bg-navy text-navy-foreground'
                      : 'bg-surface text-muted hover:bg-navy/10'
                  }`}
                >
                  {getStatusLabel(status)}
                </button>
              ))}
            </div>
          </Card>
        ))}
        {orders.length === 0 && <p className="py-12 text-center text-muted">ไม่มีออเดอร์</p>}
      </div>
    </div>
  );
}
