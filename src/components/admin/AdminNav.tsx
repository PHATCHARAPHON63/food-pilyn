// ============================================
// Admin Navigation
// มี Sidebar สำหรับ Desktop และ Bottom Navigation สำหรับ Mobile
// ============================================
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Map, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminNavProps {
  username: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'แอดมิน',
  driver: 'คนขับ',
};


const navItems = [
  { href: '/admin', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'ออเดอร์', icon: ClipboardList },
  { href: '/admin/menu', label: 'เมนู', icon: UtensilsCrossed },
  { href: '/admin/delivery', label: 'จัดส่ง', icon: Map },
  { href: '/admin/settings', label: 'ตั้งค่า', icon: Settings },
];

export default function AdminNav({ username, role }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 flex-col bg-navy text-navy-foreground md:flex">
        <div className="flex items-center gap-3 border-b border-white/10 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">🍛</div>
          <div>
            <p className="font-bold">Admin Panel</p>
            <p className="text-xs text-white/70">{username} · {ROLE_LABELS[role] || role}</p>
          </div>
        </div>
        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                      active ? 'bg-accent text-accent-foreground' : 'text-white/75 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-white/10 p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-300 hover:bg-white/10 hover:text-red-200"
          >
            <LogOut className="h-5 w-5" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Bottom Nav Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-navy text-navy-foreground md:hidden">
        <ul className="flex items-center justify-around px-1 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-medium',
                    active ? 'text-accent' : 'text-white/60'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={logout}
              className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-medium text-red-300"
            >
              <LogOut className="h-5 w-5" />
              ออก
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
