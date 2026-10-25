// ============================================
// Admin Layout (protected routes)
// ตรวจสอบสิทธิ์แอดมิน ถ้าไม่ได้ Login ให้ redirect ไปหน้า Login
// มี Sidebar สำหรับ Desktop และ Bottom Nav สำหรับ Mobile
// ============================================
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AdminNav from '@/components/admin/AdminNav';

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminNav username={user.username} role={user.role} />
      <main className="flex-1 bg-surface p-4 pb-24 md:p-6 md:pb-6 lg:p-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
