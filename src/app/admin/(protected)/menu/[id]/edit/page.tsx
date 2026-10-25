// ============================================
// แก้ไขเมนู (หน้าเต็ม)
// ============================================
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProductForm from '@/components/admin/ProductForm';
import type { Product } from '@/types';

export default function EditMenuPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then((data) => setProduct(data.product))
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted">ไม่พบเมนูนี้</p>
        <Link href="/admin/menu" className="mt-2 inline-block text-accent underline">
          กลับไปจัดการเมนู
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return <ProductForm initial={product} title="แก้ไขเมนู" />;
}
