// ============================================
// Admin Dashboard
// แสดงสถิติออเดอร์วันนี้ ออเดอร์ล่าสุด และลิงก์ด่วน
// ============================================
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Card from '@/components/ui/Card';
import OrderStatusBadge from '@/components/order/OrderStatusBadge';
import { formatPrice } from '@/lib/utils';
import type { OrderItem } from '@/types';
import { ClipboardList, DollarSign, Package, UtensilsCrossed } from 'lucide-react';

// หน้า Dashboard ต้องการข้อมูลสดจาก DB + Cookie จึงไม่ควร Static Generation
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  await connectDB();

  // ดึงออเดอร์วันนี้
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todayOrders = await Order.find({ createdAt: { $gte: startOfDay, $lte: endOfDay } }).sort({ createdAt: -1 });
  const totalSales = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingCount = todayOrders.filter((o) => o.status === 'pending').length;
  const productCount = await Product.countDocuments();

  const stats = [
    { label: 'ออเดอร์วันนี้', value: todayOrders.length, icon: ClipboardList },
    { label: 'ยอดขายรวม', value: formatPrice(totalSales), icon: DollarSign },
    { label: 'รอรับออเดอร์', value: pendingCount, icon: Package },
    { label: 'จำนวนเมนู', value: productCount, icon: UtensilsCrossed },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-navy">แดชบอร์ด</h1>
        <p className="text-muted">สวัสดี {user?.username} นี่คือภาพรวมวันนี้</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="flex flex-col items-center justify-center gap-1 p-4 text-center">
              <Icon className="h-6 w-6 text-accent" />
              <p className="text-2xl font-bold text-navy">{stat.value}</p>
              <p className="text-xs text-muted">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy">ออเดอร์ล่าสุด</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-navy hover:text-accent">
            ดูทั้งหมด
          </Link>
        </div>
        <div className="divide-y divide-border">
          {todayOrders.slice(0, 5).map((order) => (
            <div key={order._id.toString()} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-navy">{order.orderNumber}</p>
                <p className="text-sm text-muted">
                  {order.customer.name} · {order.items.reduce((sum: number, i: OrderItem) => sum + i.quantity, 0)} รายการ
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-navy">{formatPrice(order.totalAmount)}</p>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
          ))}
          {todayOrders.length === 0 && <p className="py-6 text-center text-sm text-muted">ยังไม่มีออเดอร์วันนี้</p>}
        </div>
      </Card>
    </div>
  );
}
