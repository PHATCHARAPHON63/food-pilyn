// ============================================
// หน้าเลือกสินค้า (Menu Page)
// ดึงรายการเมนูจาก API แล้วแสดงการ์ดให้เลือก
// จัดเก็บรายการที่เลือกใน state และส่งไปหน้า Checkout ผ่าน URL params
// ============================================
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ChefHat, UtensilsCrossed, PlusCircle, Sun, Coffee } from 'lucide-react';
import {
  productMatchesMealSlot,
  MEAL_SLOT_LABELS,
  type MealPeriodSlot,
} from '@/lib/meal-period';
import {
  pickDefaultMealSlot,
  formatSlotWindow,
  THAILAND_TIMEZONE,
  type MealOrderingStatus,
} from '@/lib/meal-ordering-schedule';
import MenuCard from '@/components/menu/MenuCard';
import MenuSelector from '@/components/menu/MenuSelector';
import Button from '@/components/ui/Button';
import { formatPrice, generateOrderNumber, isMongoId, isValidOrderNumber, sanitizeCartItems } from '@/lib/utils';
import type { Product, OrderItem } from '@/types';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'rice-curry': <ChefHat className="h-4 w-4" />,
  'side-dish': <UtensilsCrossed className="h-4 w-4" />,
  extra: <PlusCircle className="h-4 w-4" />,
  other: <ShoppingCart className="h-4 w-4" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  'rice-curry': 'ข้าวราดแกง',
  'side-dish': 'กับข้าว',
  extra: 'เพิ่มเติม',
  other: 'เมนูแนะนำ',
};

const CATEGORY_ORDER = ['rice-curry', 'side-dish', 'extra', 'other'] as const;

export default function MenuPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [mealOrdering, setMealOrdering] = useState<MealOrderingStatus | null>(null);
  const [mealSlot, setMealSlot] = useState<MealPeriodSlot>('morning');

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('cart');
      const parsed = saved ? JSON.parse(saved) : [];
      setCart(sanitizeCartItems(Array.isArray(parsed) ? parsed : []));
    } catch {
      setCart([]);
    }
    setCartReady(true);
  }, []);

  useEffect(() => {
    if (!cartReady) return;
    if (cart.length > 0) {
      sessionStorage.setItem('cart', JSON.stringify(cart));
    } else {
      sessionStorage.removeItem('cart');
    }
  }, [cart, cartReady]);

  useEffect(() => {
    const refreshOrdering = () =>
      fetch('/api/settings/meal-ordering')
        .then((res) => res.json())
        .then((data: MealOrderingStatus) => {
          if (!data?.schedule) return;
          setMealOrdering(data);
          setMealSlot((prev) => {
            if (data.open[prev]) return prev;
            const picked = pickDefaultMealSlot(data.schedule);
            return picked ?? prev;
          });
        })
        .catch(() => {});

    void refreshOrdering();
    const timer = window.setInterval(refreshOrdering, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (mealOrdering?.open[mealSlot]) {
      sessionStorage.setItem('mealPeriodSlot', mealSlot);
    }
  }, [mealSlot, mealOrdering]);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        const list = data.products || [];
        setProducts(list);
        if (!data.products) setLoadError(data.error || 'โหลดเมนูไม่สำเร็จ');
        const ids = new Set(list.map((p: Product) => p._id));
        setCart((prev) =>
          prev.filter((item) => {
            const id = typeof item.product === 'string' ? item.product : '';
            return isMongoId(id) && ids.has(id);
          })
        );
        setLoading(false);
      })
      .catch(() => {
        setLoadError('โหลดเมนูไม่สำเร็จ');
        setLoading(false);
      });
  }, []);

  const addToCart = (item: OrderItem) => {
    setCart((prev) => [...prev, item]);
  };

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.subtotal, 0), [cart]);

  const groupedProducts = useMemo(() => {
    const acc: Record<string, Product[]> = {};
    for (const product of products) {
      if ((product.category as string) === 'drink') continue;
      if (!productMatchesMealSlot(product, mealSlot)) continue;
      const key = product.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(product);
    }
    return acc;
  }, [products, mealSlot]);

  const orderedCategories = useMemo(
    () => CATEGORY_ORDER.filter((cat) => (groupedProducts[cat]?.length ?? 0) > 0),
    [groupedProducts]
  );

  const slotOpen = mealOrdering?.open[mealSlot] ?? true;
  const anySlotOpen = mealOrdering
    ? mealOrdering.open.morning || mealOrdering.open.lunch
    : true;

  const goToCheckout = () => {
    if (cart.length === 0 || !slotOpen) return;
    sessionStorage.setItem('cart', JSON.stringify(cart));
    sessionStorage.setItem('mealPeriodSlot', mealSlot);
    if (!isValidOrderNumber(sessionStorage.getItem('orderNumber'))) {
      sessionStorage.setItem('orderNumber', generateOrderNumber());
    }
    router.push('/checkout');
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-3xl px-4 pt-4 ${cart.length > 0 ? 'pb-28' : 'pb-8'}`}>
      {/* Hero */}
      <div className="mb-4 rounded-2xl bg-navy px-4 py-3 text-navy-foreground shadow-md sm:mb-6 sm:p-5">
        <div className="mb-2 hidden h-1 w-12 rounded-full bg-accent sm:block" />
        <h2 className="text-lg font-bold sm:text-xl">สั่งอาหารวันนี้</h2>
        <p className="text-xs text-white/80 sm:text-sm">เลือกเมนูโปรดและปักหมุดจุดรับอาหารของคุณ</p>
        {mealOrdering && (
          <p className="mt-1 text-[11px] text-white/70 sm:text-xs">
            เวลาไทย {mealOrdering.bangkokTime} ({THAILAND_TIMEZONE})
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              { id: 'morning' as const, icon: Coffee },
              { id: 'lunch' as const, icon: Sun },
            ] as const
          ).map(({ id, icon: Icon }) => {
            const open = mealOrdering?.open[id] ?? true;
            const windowLabel = mealOrdering
              ? formatSlotWindow(mealOrdering.schedule[id])
              : '';
            return (
              <button
                key={id}
                type="button"
                disabled={!open}
                onClick={() => open && setMealSlot(id)}
                title={
                  open
                    ? windowLabel
                      ? `รับออเดอร์ ${windowLabel}`
                      : undefined
                    : `ปิดรับออเดอร์${windowLabel ? ` (${windowLabel})` : ''}`
                }
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                  mealSlot === id
                    ? 'bg-accent text-navy'
                    : open
                      ? 'bg-white/15 text-white hover:bg-white/25'
                      : 'cursor-not-allowed bg-white/10 text-white/40'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {MEAL_SLOT_LABELS[id]}
              </button>
            );
          })}
        </div>
        {mealOrdering && !anySlotOpen && (
          <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs text-white/90">
            ขณะนี้ปิดรับออเดอร์ทุกรอบ — เช้า {formatSlotWindow(mealOrdering.schedule.morning)} · กลางวัน{' '}
            {formatSlotWindow(mealOrdering.schedule.lunch)}
          </p>
        )}
        {mealOrdering && anySlotOpen && !slotOpen && (
          <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs text-white/90">
            รอบ{MEAL_SLOT_LABELS[mealSlot]}ปิดรับออเดอร์แล้ว ({formatSlotWindow(mealOrdering.schedule[mealSlot])})
          </p>
        )}
      </div>

      {/* รายการเมนูแยกตามหมวดหมู่ */}
      <div className="space-y-6">
        {slotOpen &&
        orderedCategories.map((category) => {
          const items = groupedProducts[category] || [];
          const available = items.filter((p) => p.isAvailable);
          if (available.length === 0) return null;
          return (
            <section key={category}>
              <div className="mb-3 flex items-center gap-2 text-lg font-semibold text-navy">
                <span className="text-accent">{CATEGORY_ICONS[category]}</span>
                {CATEGORY_LABELS[category] || category}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {available.map((product) => (
                  <MenuCard key={product._id} product={product} onSelect={setSelectedProduct} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {loadError && <div className="py-12 text-center text-red-600">{loadError}</div>}
      {!loadError && !anySlotOpen && mealOrdering && (
        <div className="py-12 text-center text-muted">ยังไม่เปิดรับออเดอร์ในเวลานี้ กรุณากลับมาใหม่ตามเวลาที่กำหนด</div>
      )}
      {!loadError && anySlotOpen && products.length === 0 && (
        <div className="py-12 text-center text-muted">ยังไม่มีเมนูในระบบ</div>
      )}

      {/* ตะกร้าลอยด้านล่าง */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 isolate transform-gpu border-t border-border bg-card px-4 py-2.5 shadow-[0_-8px_24px_rgba(11,31,58,0.12)]">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted">{cart.reduce((sum, i) => sum + i.quantity, 0)} รายการ</p>
              <p className="text-base font-bold text-navy sm:text-lg">{formatPrice(total)}</p>
            </div>
            <Button onClick={goToCheckout} size="md" variant="secondary" disabled={!slotOpen}>
              สั่งอาหาร
            </Button>
          </div>
        </div>
      )}

      <MenuSelector
        product={selectedProduct}
        mealPeriodSlot={mealSlot}
        onClose={() => setSelectedProduct(null)}
        onAdd={addToCart}
      />
    </div>
  );
}
