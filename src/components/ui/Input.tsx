// ============================================
// Reusable Input Component
// ออกแบบ Mobile-First ติดขอบมน ขนาดใหญ่พอสำหรับการแตะบนมือถือ
// ============================================
'use client';

import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-12 w-full rounded-xl border border-border bg-card px-4 text-base text-navy shadow-sm transition-colors',
        'placeholder:text-muted',
        'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30',
        'disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60',
        className
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';
export default Input;
