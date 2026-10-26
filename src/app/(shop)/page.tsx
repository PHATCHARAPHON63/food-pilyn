// ============================================
// หน้าเลือกสินค้า — เลือกรอบส่งก่อน แล้วแสดงเมนูตามช่วงขาย
// ============================================
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ChefHat, UtensilsCrossed, PlusCircle, Sun, Coffee, ArrowLeft } from 'lucide-react';
import {
  productMatchesMealSlot,
  MEAL_SLOT_LABELS,
  type MealPeriodSlot,
} from '@/lib/meal-period';
import {
  formatSlotWindow,
  THAILAND_TIMEZONE,
  type MealOrderingStatus,
} from '@/lib/meal-ordering-schedule';
import MenuCard from '@/components/menu/MenuCard';
import MenuSelector from '@/components/menu/MenuSelector';
import Button from '@/components/ui/Button';
import { formatPrice, generateOrderNumber, isMongoId, isValidOrderNumber, sanitizeCartItems } from '@/lib/utils';
import type { Product, OrderItem } from '@/types';

const ROUND_CONFIRMED_KEY = 'mealRoundConfirmed';

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

const PREVIEW_SLOTS: { id: MealPeriodSlot; icon: typeof Coffee }[] = [
  { id: 'morning', icon: Coffee },
  { id: 'lunch', icon: Sun },
];

function groupProductsForSlot(products: Product[], slot: MealPeriodSlot): Record<string, Product[]> {
  const acc: Record<string, Product[]> = {};
  for (const product of products) {
    if ((product.category as string) === 'drink') continue;
    if (!product.isAvailable) continue;
    if (!productMatchesMealSlot(product, slot)) continue;
    const key = product.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(product);
  }
  return acc;
}

export default function MenuPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [mealOrdering, setMealOrdering] = useState<MealOrderingStatus | null>(null);
  const [preorderSlot, setPreorderSlot] = useState<MealPeriodSlot | null>(null);
  const [roundConfirmed, setRoundConfirmed] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('cart');
      const parsed = saved ? JSON.parse(saved) : [];
      setCart(sanitizeCartItems(Array.isArray(parsed) ? parsed : []));
    } catch {
      setCart([]);
    }

    const savedSlot = sessionStorage.getItem('mealPeriodSlot');
    const confirmed = sessionStorage.getItem(ROUND_CONFIRMED_KEY) === '1';
    if (confirmed && (savedSlot === 'morning' || savedSlot === 'lunch')) {
      setPreorderSlot(savedSlot);
      setRoundConfirmed(true);
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
    if (preorderSlot && roundConfirmed) {
      sessionStorage.setItem('mealPeriodSlot', preorderSlot);
      sessionStorage.setItem(ROUND_CONFIRMED_KEY, '1');
    }
  }, [preorderSlot, roundConfirmed]);

  useEffect(() => {
    fetch('/api/settings/meal-ordering')
      .then((res) => res.json())
      .then((data: MealOrderingStatus) => {
        if (data?.schedule) setMealOrdering(data);
      })
      .catch(() => {});
  }, []);

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

  useEffect(() => {
    if (!cartReady || !preorderSlot || products.length === 0) return;
    setCart((prev) =>
      prev.filter((item) => {
        const id = typeof item.product === 'string' ? item.product : '';
        const product = products.find((p) => p._id === id);
        return product && productMatchesMealSlot(product, preorderSlot);
      })
    );
  }, [preorderSlot, products, cartReady]);

  const confirmRound = (slot: MealPeriodSlot) => {
    setPreorderSlot(slot);
    setRoundConfirmed(true);
    setSelectedProduct(null);
  };

  const backToRoundPicker = () => {
    setRoundConfirmed(false);
    setPreorderSlot(null);
    setSelectedProduct(null);
    setCart([]);
    sessionStorage.removeItem('cart');
    sessionStorage.removeItem(ROUND_CONFIRMED_KEY);
    sessionStorage.removeItem('mealPeriodSlot');
  };

  const addToCart = (item: OrderItem) => {
    setCart((prev) => [...prev, item]);
  };

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.subtotal, 0), [cart]);

  const groupedProducts = useMemo(() => {
    if (!preorderSlot) return {};
    return groupProductsForSlot(products, preorderSlot);
  }, [products, preorderSlot]);

  const previewBySlot = useMemo(
    () => ({
      morning: groupProductsForSlot(products, 'morning'),
      lunch: groupProductsForSlot(products, 'lunch'),
    }),
    [products]
  );

  const orderedCategories = useMemo(
    () => CATEGORY_ORDER.filter((cat) => (groupedProducts[cat]?.length ?? 0) > 0),
    [groupedProducts]
  );

  const goToCheckout = () => {
    if (!preorderSlot || cart.length === 0) return;
    sessionStorage.setItem('cart', JSON.stringify(cart));
    sessionStorage.setItem('mealPeriodSlot', preorderSlot);
    sessionStorage.setItem(ROUND_CONFIRMED_KEY, '1');
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

  if (!roundConfirmed || !preorderSlot) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-10 pt-4">
        <div className="mb-4 rounded-2xl bg-navy px-4 py-4 text-navy-foreground shadow-md sm:p-5">
          <h1 className="text-lg font-bold sm:text-xl">สั่งอาหารวันนี้</h1>
          <p className="mt-1 text-xs text-white/85 sm:text-sm">
            ดูรายการเมนูด้านล่างได้เลย — กดเลือกรอบรับเพื่อเริ่มสั่ง
          </p>
          {mealOrdering && (
            <p className="mt-1 text-[11px] text-white/70 sm:text-xs">
              เวลาไทย {mealOrdering.bangkokTime} ({THAILAND_TIMEZONE})
            </p>
          )}
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {PREVIEW_SLOTS.map(({ id, icon: Icon }) => {
              const windowLabel = mealOrdering
                ? formatSlotWindow(mealOrdering.schedule[id])
                : id === 'morning'
                  ? '06:00–11:00'
                  : '11:00–14:00';
              const count = CATEGORY_ORDER.reduce(
                (n, cat) => n + (previewBySlot[id][cat]?.length ?? 0),
                0
              );
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => confirmRound(id)}
                  className="rounded-xl bg-accent px-4 py-3 text-left text-accent-foreground transition-opacity hover:opacity-95"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Icon className="h-4 w-4" />
                    สั่ง{MEAL_SLOT_LABELS[id]}
                  </span>
                  <span className="mt-1 block text-xs opacity-90">
                    จัดส่งประมาณ {windowLabel} น. · {count} เมนู
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {loadError && <div className="py-8 text-center text-red-600">{loadError}</div>}

        <div className="space-y-8">
          {PREVIEW_SLOTS.map(({ id, icon: Icon }) => {
            const grouped = previewBySlot[id];
            const categories = CATEGORY_ORDER.filter((cat) => (grouped[cat]?.length ?? 0) > 0);
            if (categories.length === 0) return null;
            const windowLabel = mealOrdering
              ? formatSlotWindow(mealOrdering.schedule[id])
              : id === 'morning'
                ? '06:00–11:00'
                : '11:00–14:00';
            return (
              <section key={id}>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-border pb-2">
                  <div className="flex items-center gap-2 text-lg font-semibold text-navy">
                    <Icon className="h-5 w-5 text-accent" />
                    เมนู{MEAL_SLOT_LABELS[id]}
                  </div>
                  <p className="text-xs text-muted">รอบจัดส่งประมาณ {windowLabel} น.</p>
                </div>
                <div className="space-y-5">
                  {categories.map((category) => (
                    <div key={category}>
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-navy">
                        <span className="text-accent">{CATEGORY_ICONS[category]}</span>
                        {CATEGORY_LABELS[category]}
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {(grouped[category] || []).map((product) => (
                          <MenuCard key={`${id}-${product._id}`} product={product} preview />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {!loadError && products.length === 0 && (
          <div className="py-12 text-center text-muted">ยังไม่มีเมนูในระบบ</div>
        )}
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-3xl px-4 pt-4 ${cart.length > 0 ? 'pb-28' : 'pb-8'}`}>
      <div className="mb-4 rounded-2xl bg-navy px-4 py-3 text-navy-foreground shadow-md sm:mb-6 sm:p-5">
        <button
          type="button"
          onClick={backToRoundPicker}
          className="mb-2 flex items-center gap-1 text-xs text-white/75 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          เปลี่ยนรอบรับ
        </button>
        <h2 className="text-lg font-bold sm:text-xl">สั่งอาหาร · {MEAL_SLOT_LABELS[preorderSlot]}</h2>
        <p className="text-xs text-white/80 sm:text-sm">แสดงเมนูตามช่วงขายของรอบที่เลือก</p>
        {mealOrdering && (
          <p className="mt-2 rounded-lg bg-white/10 px-3 py-2 text-[11px] text-white/85 sm:text-xs">
            รอบจัดส่งโดยประมาณ {formatSlotWindow(mealOrdering.schedule[preorderSlot])} น.
          </p>
        )}
      </div>

      <div className="space-y-6">
        {orderedCategories.map((category) => {
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
      {!loadError && orderedCategories.length === 0 && products.length > 0 && (
        <div className="py-12 text-center text-muted">
          ไม่มีเมนูสำหรับ{MEAL_SLOT_LABELS[preorderSlot]} — ลองเปลี่ยนรอบรับ
        </div>
      )}
      {!loadError && products.length === 0 && (
        <div className="py-12 text-center text-muted">ยังไม่มีเมนูในระบบ</div>
      )}

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 isolate transform-gpu border-t border-border bg-card px-4 py-2.5 shadow-[0_-8px_24px_rgba(11,31,58,0.12)]">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} รายการ · {MEAL_SLOT_LABELS[preorderSlot]}
              </p>
              <p className="text-base font-bold text-navy sm:text-lg">{formatPrice(total)}</p>
            </div>
            <Button onClick={goToCheckout} size="md" variant="secondary">
              สั่งอาหาร
            </Button>
          </div>
        </div>
      )}

      <MenuSelector
        product={selectedProduct}
        mealPeriodSlot={preorderSlot}
        onClose={() => setSelectedProduct(null)}
        onAdd={addToCart}
      />
    </div>
  );
}
