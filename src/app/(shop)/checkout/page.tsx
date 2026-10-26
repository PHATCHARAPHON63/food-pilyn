// ============================================
// หน้า Checkout และฟอร์มข้อมูลจัดส่ง
// แสดงสรุปรายการอาหาร ให้กรอกชื่อ/เบอร์โทร
// ปักหมุดบนแผนที่เลือกจุดจัดส่ง และเลือกวิธีชำระเงิน
// ============================================
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Phone, User, CreditCard, Banknote, ArrowLeft, StickyNote } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import GoogleMapPicker from '@/components/map/GoogleMapPicker';
import { formatPrice, generateOrderNumber, isValidOrderNumber, sanitizeCartItems } from '@/lib/utils';
import type { CashTenderType, OrderItem, GeoLocation, PaymentMethod } from '@/types';
import type { MealPeriodSlot } from '@/lib/meal-period';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orderNumber, setOrderNumber] = useState('');
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState<GeoLocation | undefined>();
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [cashTender, setCashTender] = useState<CashTenderType>('exact');
  const [cashBanknote, setCashBanknote] = useState<number | undefined>();
  const [payInput, setPayInput] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mealPeriodSlot, setMealPeriodSlot] = useState<MealPeriodSlot | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('cart');
      const parsed = saved ? JSON.parse(saved) : [];
      const valid = sanitizeCartItems(Array.isArray(parsed) ? parsed : []);
      setCart(valid);
      if (valid.length > 0) sessionStorage.setItem('cart', JSON.stringify(valid));
      else sessionStorage.removeItem('cart');
    } catch {
      setCart([]);
    }
    const existing = sessionStorage.getItem('orderNumber');
    const next = isValidOrderNumber(existing) ? existing : generateOrderNumber();
    sessionStorage.setItem('orderNumber', next);
    setOrderNumber(next);
    const slot = sessionStorage.getItem('mealPeriodSlot');
    if (slot === 'morning' || slot === 'lunch') setMealPeriodSlot(slot);
    setReady(true);
  }, []);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.subtotal, 0), [cart]);
  const changeAmount =
    payment === 'cash' && cashTender === 'banknote' && cashBanknote && cashBanknote >= total
      ? cashBanknote - total
      : 0;
  const cashReady =
    payment !== 'cash' ||
    cashTender === 'exact' ||
    (cashTender === 'banknote' && !!cashBanknote && cashBanknote >= total);

  const isValid = Boolean(name.trim() && phone.trim() && location && cashReady);

  const parseBaht = (raw: string) => {
    const cleaned = raw.replace(/[^\d]/g, '');
    if (!cleaned) return undefined;
    return Number(cleaned);
  };

  const clearPayAmount = () => {
    setCashBanknote(undefined);
    setPayInput('');
  };

  const selectPayment = (method: PaymentMethod) => {
    setPayment(method);
    if (method !== 'cash') {
      setCashTender('exact');
      clearPayAmount();
    }
  };

  const selectCashTender = (tender: CashTenderType) => {
    setPayment('cash');
    setCashTender(tender);
    if (tender === 'exact') clearPayAmount();
  };

  const onPayInputChange = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, '');
    setPayInput(digits);
    setCashBanknote(parseBaht(digits));
  };

  const submitOrder = async () => {
    if (!isValid) return;
    if (!mealPeriodSlot) {
      setError('รอบมื้อไม่ถูกต้อง กรุณากลับไปเลือกเมนูใหม่');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const statusRes = await fetch('/api/settings/meal-ordering');
      const statusData = await statusRes.json();
      if (!statusRes.ok || !statusData.open?.[mealPeriodSlot]) {
        throw new Error('ขณะนี้ปิดรับออเดอร์รอบนี้แล้ว กรุณากลับไปเลือกเมนู');
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumber || generateOrderNumber(),
          mealPeriodSlot,
          items: cart,
          customer: { name, phone },
          deliveryLocation: location,
          paymentMethod: payment,
          cashTenderType: payment === 'cash' ? cashTender : undefined,
          cashBanknote: payment === 'cash' && cashTender === 'banknote' ? cashBanknote : undefined,
          totalAmount: total,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'บันทึกออเดอร์ไม่สำเร็จ');

      // ล้างตะกร้าและแสดงหน้าสำเร็จ
      sessionStorage.removeItem('cart');
      sessionStorage.removeItem('orderNumber');
      sessionStorage.removeItem('mealPeriodSlot');
      router.push(`/checkout/success?order=${data.order.orderNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="mb-2 text-xl font-bold text-navy">ยังไม่มีรายการในตะกร้า</h2>
        <p className="mb-6 text-muted">เลือกเมนูอาหารก่อน แล้วกลับมาชำระเงินที่นี่</p>
        <Button asChild>
          <Link href="/">กลับไปเลือกเมนู</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-4">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-muted hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปเลือกเมนู
      </button>

      <h2 className="mb-4 text-xl font-bold text-navy">สรุปคำสั่งซื้อ</h2>

      {/* รายการอาหาร */}
      <Card className="mb-4">
        <h3 className="mb-3 font-semibold text-navy">รายการที่สั่ง</h3>
        <div className="divide-y divide-border">
          {cart.map((item, idx) => (
            <div key={idx} className="flex justify-between py-3">
              <div>
                <p className="font-medium text-navy">
                  {item.productName} x{item.quantity}
                </p>
                {(item.selectedChoices ?? []).map((choice, cIdx) => (
                  <p key={cIdx} className="text-xs text-muted">
                    {choice.optionName}: {choice.choiceLabels.join(', ')}
                  </p>
                ))}
              </div>
              <span className="font-medium text-navy">{formatPrice(item.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-base font-semibold text-navy">รวมทั้งหมด</span>
          <span className="text-xl font-bold text-navy">{formatPrice(total)}</span>
        </div>
      </Card>

      {/* ข้อมูลลูกค้า */}
      <Card className="mb-4">
        <h3 className="mb-3 font-semibold text-navy">ข้อมูลการจัดส่ง</h3>
        <div className="space-y-3">
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ชื่อ-นามสกุล"
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="เบอร์โทรศัพท์"
              inputMode="tel"
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* ปักหมุดแผนที่ */}
      <Card className="mb-4">
        <div className="mb-3 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-navy">เลือกจุดรับอาหาร</h3>
        </div>
        <GoogleMapPicker value={location} onChange={setLocation} />
      </Card>

      {/* วิธีชำระเงิน */}
      <Card className="mb-4">
        <h3 className="mb-3 font-semibold text-navy">วิธีการชำระเงิน</h3>
        <div className="space-y-2">
          <div
            className={`rounded-xl border p-3 ${
              payment === 'cash' ? 'border-accent bg-accent-soft' : 'border-border'
            }`}
          >
            <label className="flex cursor-pointer items-center justify-between">
              <div className="flex items-center gap-3">
                <Banknote className="h-5 w-5 text-navy" />
                <span className="font-medium text-navy">เงินสด</span>
              </div>
              <input
                type="radio"
                name="payment"
                value="cash"
                checked={payment === 'cash'}
                onChange={() => selectPayment('cash')}
                className="h-5 w-5 accent-accent"
              />
            </label>

            {payment === 'cash' && (
              <div className="mt-3 space-y-2 border-t border-accent/30 pt-3">
                <label className="flex cursor-pointer items-center justify-between rounded-lg bg-card/80 px-3 py-2">
                  <span className="text-sm font-medium text-navy">พอดี</span>
                  <input
                    type="radio"
                    name="cashTender"
                    value="exact"
                    checked={cashTender === 'exact'}
                    onChange={() => selectCashTender('exact')}
                    className="h-4 w-4 accent-accent"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between rounded-lg bg-card/80 px-3 py-2">
                  <span className="text-sm font-medium text-navy">ไม่พอ จ่ายเป็นแบงค์</span>
                  <input
                    type="radio"
                    name="cashTender"
                    value="banknote"
                    checked={cashTender === 'banknote'}
                    onChange={() => selectCashTender('banknote')}
                    className="h-4 w-4 accent-accent"
                  />
                </label>

                {cashTender === 'banknote' && (
                  <div className="space-y-3 rounded-lg bg-card px-3 py-3">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="mb-1 block text-xs text-muted">จำนวนเงินที่จะจ่าย</span>
                        <div className="relative">
                          <Input
                            value={payInput}
                            onChange={(e) => onPayInputChange(e.target.value)}
                            inputMode="numeric"
                            className="pr-12"
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                            บาท
                          </span>
                        </div>
                      </label>
                      <div>
                        <span className="mb-1 block text-xs text-muted">ต้องทอน</span>
                        <div className="relative">
                          <Input
                            value={
                              cashBanknote !== undefined && cashBanknote >= total
                                ? String(changeAmount)
                                : ''
                            }
                            readOnly
                            tabIndex={-1}
                            className="pr-12 bg-surface"
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                            บาท
                          </span>
                        </div>
                      </div>
                    </div>
                    {cashBanknote !== undefined && cashBanknote < total && (
                      <p className="text-xs text-red-600">
                        จำนวนที่จ่ายต้องไม่น้อยกว่ายอดสั่งซื้อ {formatPrice(total)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <label
            className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 ${
              payment === 'transfer' ? 'border-accent bg-accent-soft' : 'border-border'
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-navy" />
              <span className="font-medium text-navy">โอนจ่าย</span>
            </div>
            <input
              type="radio"
              name="payment"
              value="transfer"
              checked={payment === 'transfer'}
              onChange={() => selectPayment('transfer')}
              className="h-5 w-5 accent-accent"
            />
          </label>
        </div>
      </Card>

      {/* โน้ตถึงร้าน */}
      <Card className="mb-4">
        <div className="mb-3 flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-navy">โน้ตถึงร้าน</h3>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={300}
          className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-base text-navy shadow-sm placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <p className="mt-1 text-right text-xs text-muted">{note.length}/300</p>
      </Card>

      {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {/* ปุ่มยืนยันลอยด้านล่าง */}
      <div className="fixed bottom-0 left-0 right-0 z-50 isolate transform-gpu border-t border-border bg-card px-4 py-2.5 shadow-[0_-8px_24px_rgba(11,31,58,0.12)]">
        {error && <p className="mb-2 text-center text-sm text-red-600">{error}</p>}
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="hidden sm:block">
            <p className="text-xs text-muted">ยอดรวม</p>
            <p className="text-xl font-bold text-navy">{formatPrice(total)}</p>
          </div>
          <Button
            onClick={submitOrder}
            disabled={!isValid || submitting}
            isLoading={submitting}
            size="md"
            variant="secondary"
            className="w-full sm:w-auto sm:h-12"
          >
            ยืนยันคำสั่งซื้อ
          </Button>
        </div>
      </div>
    </div>
  );
}
