// ============================================
// Menu Card Component
// แสดงสินค้าแต่ละรายการในหน้าเลือกเมนู
// ============================================
'use client';

import { Plus } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

interface MenuCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export default function MenuCard({ product, onSelect }: MenuCardProps) {
  return (
    <Card className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-semibold text-navy">{product.name}</h3>
        {product.description && <p className="text-sm text-muted">{product.description}</p>}
        {product.options.length > 0 && (
          <p className="mt-1 text-xs text-muted">{product.options.map((opt) => opt.name).join(' · ')}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="whitespace-nowrap font-semibold text-navy">{formatPrice(product.basePrice)}</span>
        <Button onClick={() => onSelect(product)} variant="primary" size="sm">
          <Plus className="mr-1 h-4 w-4" />
          เลือก
        </Button>
      </div>
    </Card>
  );
}
