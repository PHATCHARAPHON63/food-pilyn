// ============================================
// Menu Management Page
// รายการเมนู — เพิ่ม/แก้ไขไปที่หน้าแยก
// ============================================
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Edit3 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

const CATEGORY_LABELS: Record<Product['category'], string> = {
  'rice-curry': 'ข้าวราดแกง',
  'side-dish': 'กับข้าว',
  other: 'เมนูแนะนำ',
};

export default function AdminMenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'โหลดเมนูไม่สำเร็จ');
        setProducts([]);
        return;
      }
      setProducts(
        (data.products || []).filter((p: Product) => (p.category as string) !== 'drink')
      );
    } catch {
      setError('โหลดเมนูไม่สำเร็จ');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, []);

  const deleteProduct = async (id: string) => {
    if (!confirm('ต้องการลบเมนูนี้หรือไม่?')) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) fetchProducts();
    else setError('ลบเมนูไม่สำเร็จ');
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 md:pb-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">จัดการเมนู</h1>
        <Button asChild>
          <Link href="/admin/menu/new">
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มเมนู
          </Link>
        </Button>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="grid gap-3">
        {products.map((product) => (
          <Card key={product._id} className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-navy">{product.name}</p>
              <p className="text-sm text-muted">
                {CATEGORY_LABELS[product.category]} · {formatPrice(product.basePrice)}
                {product.category === 'rice-curry' && ` · ${product.options.length} ตัวเลือก`}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/admin/menu/${product._id}/edit`}
                className="rounded-lg p-2 text-navy hover:bg-accent-soft"
                aria-label="แก้ไข"
              >
                <Edit3 className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => deleteProduct(product._id)}
                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                aria-label="ลบ"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
