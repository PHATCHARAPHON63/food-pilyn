// ============================================
// หน้าเลือกสินค้า (Menu Page)
// ดึงรายการเมนูจาก API แล้วแสดงการ์ดให้เลือก
// จัดเก็บรายการที่เลือกใน state และส่งไปหน้า Checkout ผ่าน URL params
// ============================================
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ChefHat, UtensilsCrossed } from 'lucide-react';
import MenuCard from '@/components/menu/MenuCard';
import MenuSelector from '@/components/menu/MenuSelector';
import Button from '@/components/ui/Button';
import { formatPrice, generateOrderNumber, isMongoId, isValidOrderNumber, sanitizeCartItems } from '@/lib/utils';
import type { Product, OrderItem } from '@/types';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'rice-curry': <ChefHat className="h-4 w-4" />,
  'side-dish': <UtensilsCrossed className="h-4 w-4" />,
  other: <ShoppingCart className="h-4 w-4" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  'rice-curry': 'ข้าวราดแกง',
  'side-dish': 'กับข้าว',
  other: 'เมนูแนะนำ',
};

export default function MenuPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [loadError, setLoadError] = useState('');

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
    return products.reduce<Record<string, Product[]>>((acc, product) => {
      if ((product.category as string) === 'drink') return acc;
      const key = product.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(product);
      return acc;
    }, {});
  }, [products]);

  const goToCheckout = () => {
    if (cart.length === 0) return;
    sessionStorage.setItem('cart', JSON.stringify(cart));
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
      </div>

      {/* รายการเมนูแยกตามหมวดหมู่ */}
      <div className="space-y-6">
        {Object.entries(groupedProducts).map(([category, items]) => {
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
      {!loadError && products.length === 0 && (
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
            <Button onClick={goToCheckout} size="md" variant="secondary">
              สั่งอาหาร
            </Button>
          </div>
        </div>
      )}

      <MenuSelector
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAdd={addToCart}
      />
    </div>
  );
}
