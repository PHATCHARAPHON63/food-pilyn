// ============================================
// Reusable Button Component
// รองรับหลากหลาย variant ตาม Corporate Identity ขาว-น้ำเงินเข้ม (60-30-10)
// และรองรับ asChild เพื่อ render เป็น <a> หรือ element อื่น
// ============================================
'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef, isValidElement, cloneElement, ReactElement, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, asChild, ...props }, ref) => {
    const classes = cn(
      'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-60 active:scale-[0.98]',
      {
        primary: 'bg-navy text-navy-foreground shadow-sm hover:bg-navy-hover',
        secondary: 'bg-accent text-accent-foreground shadow-sm hover:bg-accent-hover',
        outline: 'border-2 border-navy text-navy hover:bg-navy/5',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        ghost: 'text-muted hover:bg-surface',
      }[variant],
      {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      }[size],
      className
    );

    if (asChild && isValidElement<HTMLElement>(children)) {
      const child = children as ReactElement<{ className?: string; children?: ReactNode }>;
      return cloneElement(child, {
        className: cn(classes, child.props.className),
        ref,
        ...props,
      } as Record<string, unknown>);
    }

    return (
      <button ref={ref} disabled={disabled || isLoading} className={classes} {...props}>
        {isLoading && (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
export default Button;
