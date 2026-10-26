// ============================================
// สีประจำเมนู (hex) — ใช้ตกแต่งการ์ด
// ============================================
import type { CSSProperties } from 'react';

export const MENU_COLOR_PRESETS: { label: string; value: string }[] = [
  { label: 'ทอง', value: '#c9a227' },
  { label: 'แดง', value: '#c0392b' },
  { label: 'ส้ม', value: '#e67e22' },
  { label: 'เขียว', value: '#27ae60' },
  { label: 'ฟ้า', value: '#2980b9' },
  { label: 'ม่วง', value: '#8e44ad' },
  { label: 'ชมพู', value: '#d63384' },
  { label: 'น้ำตาล', value: '#795548' },
  { label: 'เทา', value: '#607d8b' },
  { label: 'น้ำเงินเข้ม', value: '#0b1f3a' },
];

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function expandHex(hex: string): string {
  if (hex.length === 4) {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return hex.toLowerCase();
}

export function sanitizeMenuColor(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;
  const withHash = raw.startsWith('#') ? raw : `#${raw}`;
  if (!HEX_RE.test(withHash)) return undefined;
  return expandHex(withHash);
}

export function menuColorCardStyle(color?: string | null): CSSProperties | undefined {
  const hex = sanitizeMenuColor(color);
  if (!hex) return undefined;
  return {
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
    borderLeftColor: hex,
    backgroundColor: `color-mix(in srgb, ${hex} 14%, white)`,
  };
}
