// ============================================
// หน้าแจ้งสั่งซื้อสำเร็จ
// แสดงเลขออเดอร์และข้อความยืนยัน
// ============================================
'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || '-';

  return (
    <Card className="w-full max-w-md text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-navy">สั่งซื้อสำเร็จ!</h2>
      <p className="mb-6 text-muted">ขอบคุณที่สั่งอาหารกับเรา ทางร้านจะเริ่มเตรียมอาหารให้ทันที</p>

      <div className="mb-6 rounded-xl bg-surface p-4">
        <p className="text-sm text-muted">เลขคำสั่งซื้อของคุณ</p>
        <p className="text-xl font-bold text-navy">{orderNumber}</p>
      </div>

      <Button asChild className="w-full">
        <Link href="/">กลับไปหน้าแรก</Link>
      </Button>
    </Card>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="spinner" />}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
