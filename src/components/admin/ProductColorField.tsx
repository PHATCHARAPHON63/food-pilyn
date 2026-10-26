// ============================================
// เลือกสีประจำเมนู (แอดมิน)
// ============================================
'use client';

import { MENU_COLOR_PRESETS, sanitizeMenuColor } from '@/lib/menu-color';
import { cn } from '@/lib/utils';

interface ProductColorFieldProps {
  value?: string;
  onChange: (color: string | undefined) => void;
}

export default function ProductColorField({ value, onChange }: ProductColorFieldProps) {
  const active = sanitizeMenuColor(value);
  const pickerValue = active ?? '#c9a227';

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-navy">สีการ์ดเมนู</label>
      <p className="text-xs text-muted">แสดงเป็นแถบสีและพื้นหลังอ่อนบนหน้าสั่งอาหาร (ไม่บังคับ)</p>

      <div className="flex flex-wrap gap-2">
        {MENU_COLOR_PRESETS.map((preset) => {
          const selected = active === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              title={preset.label}
              onClick={() => onChange(preset.value)}
              className={cn(
                'h-9 w-9 rounded-full border-2 transition-transform hover:scale-105',
                selected ? 'border-navy ring-2 ring-navy/20' : 'border-white shadow-sm'
              )}
              style={{ backgroundColor: preset.value }}
              aria-label={preset.label}
            />
          );
        })}
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className={cn(
            'rounded-full border border-border px-3 text-xs font-medium text-muted hover:bg-surface',
            !active && 'ring-2 ring-navy/15'
          )}
        >
          ไม่ใช้สี
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="color"
          value={pickerValue}
          onChange={(e) => {
            const next = sanitizeMenuColor(e.target.value);
            if (next) onChange(next);
          }}
          className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-card p-1"
          aria-label="เลือกสีเอง"
        />
        <span className="text-sm text-muted">{active ? active : '—'}</span>
        {active && (
          <div
            className="h-10 flex-1 min-w-[120px] max-w-xs rounded-xl border border-border"
            style={{
              borderLeftWidth: 4,
              borderLeftColor: active,
              backgroundColor: `color-mix(in srgb, ${active} 14%, white)`,
            }}
          />
        )}
      </div>
    </div>
  );
}
