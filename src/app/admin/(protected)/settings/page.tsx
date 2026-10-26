// ============================================
// ตั้งค่ารอบเปิดรับออเดอร์ (เช้า / กลางวัน) — เวลาไทย
// ============================================
'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Clock, Coffee, Mail, Sun } from 'lucide-react';
import type { OrderEmailNotifySettings } from '@/lib/order-email-notify';
import {
  DEFAULT_MEAL_ORDERING_SCHEDULE,
  THAILAND_TIMEZONE,
  type MealOrderingSchedule,
  type MealOrderingStatus,
  type MealSlotSchedule,
} from '@/lib/meal-ordering-schedule';
import { MEAL_SLOT_LABELS, type MealPeriodSlot } from '@/lib/meal-period';

const SLOT_META: { id: MealPeriodSlot; icon: typeof Coffee }[] = [
  { id: 'morning', icon: Coffee },
  { id: 'lunch', icon: Sun },
];

function SlotEditor({
  slot,
  value,
  isOpen,
  onChange,
}: {
  slot: MealPeriodSlot;
  value: MealSlotSchedule;
  isOpen: boolean;
  onChange: (next: MealSlotSchedule) => void;
}) {
  const Icon = SLOT_META.find((s) => s.id === slot)!.icon;
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold text-navy">
          <Icon className="h-5 w-5 text-accent" />
          {MEAL_SLOT_LABELS[slot]}
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isOpen ? 'bg-green-100 text-green-800' : 'bg-muted/20 text-muted'
          }`}
        >
          {isOpen ? 'เปิดรับออเดอร์อยู่' : 'ปิดรับออเดอร์'}
        </span>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
          className="h-4 w-4 rounded border-border accent-accent"
        />
        เปิดใช้รอบนี้
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block text-muted">เริ่มรับ (เวลาไทย)</span>
          <input
            type="time"
            value={value.open}
            onChange={(e) => onChange({ ...value, open: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">ปิดรับ (เวลาไทย)</span>
          <input
            type="time"
            value={value.close}
            onChange={(e) => onChange({ ...value, close: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>
      <p className="text-xs text-muted">
        ลูกค้าสั่งได้ในช่วง {value.open}–{value.close} (ก่อนถึงเวลาปิด 1 นาที) ตาม {THAILAND_TIMEZONE}
      </p>
    </Card>
  );
}

export default function AdminSettingsPage() {
  const [schedule, setSchedule] = useState<MealOrderingSchedule>(DEFAULT_MEAL_ORDERING_SCHEDULE);
  const [live, setLive] = useState<MealOrderingStatus | null>(null);
  const [emailNotify, setEmailNotify] = useState<OrderEmailNotifySettings>({
    enabled: false,
    recipients: [],
  });
  const [recipientsText, setRecipientsText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [message, setMessage] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  const load = () =>
    fetch('/api/settings/meal-ordering')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'โหลดไม่สำเร็จ');
        setSchedule(data.schedule);
        setLive(data);
      });

  const loadEmail = () =>
    fetch('/api/settings/order-email')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'โหลดอีเมลไม่สำเร็จ');
        const settings = data.settings as OrderEmailNotifySettings;
        setEmailNotify(settings);
        setRecipientsText(settings.recipients.join('\n'));
      });

  useEffect(() => {
    Promise.all([load(), loadEmail()])
      .catch(() => setError('โหลดตั้งค่าไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      void load().catch(() => {});
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const saveEmail = async () => {
    setSavingEmail(true);
    setEmailMessage('');
    setEmailError('');
    const recipients = recipientsText
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const res = await fetch('/api/settings/order-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: { ...emailNotify, recipients },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'บันทึกไม่สำเร็จ');
      setEmailNotify(data.settings);
      setRecipientsText(data.settings.recipients.join('\n'));
      setEmailMessage('บันทึกการแจ้งเตือนอีเมลแล้ว');
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSavingEmail(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/settings/meal-ordering', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'บันทึกไม่สำเร็จ');
      setSchedule(data.schedule);
      setLive(data);
      setMessage('บันทึกแล้ว');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-navy">ตั้งค่ารอบรับออเดอร์</h1>
        <p className="text-muted">
          กำหนดเวลาเปิด–ปิดรอบเช้าและกลางวัน ระบบใช้เวลาไทย ({THAILAND_TIMEZONE}) เท่านั้น
        </p>
        {live && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-navy">
            <Clock className="h-4 w-4 text-accent" />
            เวลาปัจจุบันในไทย: <strong>{live.bangkokTime}</strong>
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {SLOT_META.map(({ id }) => (
          <SlotEditor
            key={id}
            slot={id}
            value={schedule[id]}
            isOpen={live?.open[id] ?? false}
            onChange={(next) => setSchedule((prev) => ({ ...prev, [id]: next }))}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? 'กำลังบันทึก…' : 'บันทึกรอบมื้อ'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setSchedule(DEFAULT_MEAL_ORDERING_SCHEDULE)}
        >
          คืนค่าเริ่มต้น
        </Button>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center gap-2 font-semibold text-navy">
          <Mail className="h-5 w-5 text-accent" />
          แจ้งเตือนออเดอร์ทางอีเมล
        </div>
        <p className="text-sm text-muted">
          เมื่อมีออเดอร์ใหม่ ระบบจะส่งอีเมลจากบัญชีร้านไปยังรายชื่อด้านล่าง
        </p>
        {emailError && <p className="text-sm text-red-600">{emailError}</p>}
        {emailMessage && <p className="text-sm text-green-700">{emailMessage}</p>}
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={emailNotify.enabled}
            onChange={(e) => setEmailNotify((prev) => ({ ...prev, enabled: e.target.checked }))}
            className="h-4 w-4 rounded border-border accent-accent"
          />
          เปิดแจ้งเตือนอีเมลเมื่อมีออเดอร์ใหม่
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">อีเมลผู้รับ (หนึ่งบรรทัดต่อหนึ่งคน)</span>
          <textarea
            value={recipientsText}
            onChange={(e) => setRecipientsText(e.target.value)}
            rows={4}
            placeholder={'admin@example.com\nkitchen@example.com'}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono"
          />
        </label>
        <Button onClick={saveEmail} disabled={savingEmail}>
          {savingEmail ? 'กำลังบันทึก…' : 'บันทึกอีเมลแจ้งเตือน'}
        </Button>
      </Card>
    </div>
  );
}
