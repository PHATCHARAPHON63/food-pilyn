// ============================================
// รูปเมนู — แสดงรูปหรือ placeholder
// ============================================
'use client';

import Image from 'next/image';
import { UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductMenuImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export default function ProductMenuImage({
  src,
  alt,
  className,
  sizes = '96px',
  priority,
}: ProductMenuImageProps) {
  const box = cn(
    'relative shrink-0 overflow-hidden rounded-xl bg-accent-soft',
    className ?? 'h-20 w-20'
  );

  if (!src?.trim()) {
    return (
      <div className={cn(box, 'flex items-center justify-center text-accent')}>
        <UtensilsCrossed className="h-8 w-8 opacity-70" aria-hidden />
      </div>
    );
  }

  return (
    <div className={box}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes={sizes}
        priority={priority}
      />
    </div>
  );
}
