// ============================================
// Shop Layout
// โครงสร้างหลักสำหรับฝั่งลูกค้า (Mobile-First)
// มี Header ติดบนและพื้นที่เนื้อหา
// ============================================
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 bg-navy px-4 py-3 text-navy-foreground shadow-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              🍛
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">ร้านคุณยุ้ย</h1>
              <p className="text-xs text-white/70">สั่งง่าย ส่งไว อร่อยถึงที่</p>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
