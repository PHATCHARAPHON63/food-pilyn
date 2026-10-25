// ============================================
// Admin root layout — login อยู่นอก (protected) เพื่อไม่ให้ redirect loop
// ============================================
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
