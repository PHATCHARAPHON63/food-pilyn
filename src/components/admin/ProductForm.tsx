// ============================================
// ฟอร์มเพิ่ม/แก้ไขเมนู (ใช้ในหน้าเต็ม ไม่ใช่ modal)
// ============================================
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { Product, ProductOption, OptionChoice, MealPeriod } from '@/types';
import { MEAL_PERIOD_LABELS } from '@/lib/meal-period';

function createEmptyOption(): ProductOption {
  return {
    name: '',
    type: 'single',
    required: true,
    choices: [{ label: '', priceAdjustment: 0 }],
  };
}

interface ProductFormProps {
  initial: Product;
  title: string;
}

export default function ProductForm({ initial, title }: ProductFormProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<Product>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const saveProduct = async () => {
    if (!editing.name.trim()) {
      setError('กรุณากรอกชื่อเมนู');
      return;
    }
    if (!Number.isFinite(editing.basePrice) || editing.basePrice < 0) {
      setError('กรุณากรอกราคาที่ถูกต้อง');
      return;
    }

    setSaving(true);
    setError('');
    const method = editing._id ? 'PATCH' : 'POST';
    const url = editing._id ? `/api/products/${editing._id}` : '/api/products';

    const payload = {
      name: editing.name.trim(),
      description: editing.description,
      basePrice: editing.basePrice,
      image: editing.image,
      category: editing.category,
      mealPeriod: editing.mealPeriod || 'both',
      isAvailable: editing.isAvailable,
      options: editing.options,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'บันทึกไม่สำเร็จ');
        return;
      }
      router.push('/admin/menu');
      router.refresh();
    } catch {
      setError('บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const addOption = () => {
    setEditing({ ...editing, options: [...editing.options, createEmptyOption()] });
  };

  const removeOption = (idx: number) => {
    setEditing({ ...editing, options: editing.options.filter((_, i) => i !== idx) });
  };

  const updateOption = (idx: number, patch: Partial<ProductOption>) => {
    const next = [...editing.options];
    next[idx] = { ...next[idx], ...patch };
    setEditing({ ...editing, options: next });
  };

  const updateChoice = (optIdx: number, choiceIdx: number, patch: Partial<OptionChoice>) => {
    const nextOptions = [...editing.options];
    const nextChoices = [...nextOptions[optIdx].choices];
    nextChoices[choiceIdx] = { ...nextChoices[choiceIdx], ...patch };
    nextOptions[optIdx] = { ...nextOptions[optIdx], choices: nextChoices };
    setEditing({ ...editing, options: nextOptions });
  };

  const addChoice = (optIdx: number) => {
    const nextOptions = [...editing.options];
    nextOptions[optIdx] = {
      ...nextOptions[optIdx],
      choices: [...nextOptions[optIdx].choices, { label: '', priceAdjustment: 0 }],
    };
    setEditing({ ...editing, options: nextOptions });
  };

  const removeChoice = (optIdx: number, choiceIdx: number) => {
    const nextOptions = [...editing.options];
    nextOptions[optIdx] = {
      ...nextOptions[optIdx],
      choices: nextOptions[optIdx].choices.filter((_, i) => i !== choiceIdx),
    };
    setEditing({ ...editing, options: nextOptions });
  };

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/menu"
          className="rounded-lg p-2 text-navy hover:bg-accent-soft"
          aria-label="กลับ"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">ชื่อเมนู</label>
            <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">ราคาฐาน</label>
            <Input
              type="number"
              value={editing.basePrice}
              onChange={(e) => setEditing({ ...editing, basePrice: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-navy">หมวดหมู่</label>
          <select
            value={editing.category}
            onChange={(e) => setEditing({ ...editing, category: e.target.value as Product['category'] })}
            className="w-full rounded-xl border border-border bg-card p-3 text-navy"
          >
            <option value="rice-curry">ข้าวราดแกง (ชุดข้าว — ลูกค้าเลือกจากเมนูกับข้าว)</option>
            <option value="side-dish">กับข้าว (แสดงในหน้าสั่ง + เป็นตัวเลือกตอนราดข้าว)</option>
            <option value="extra">เพิ่มเติม (ข้าวเปล่า ไข่ดาว — หน้าสั่ง + เลือกเสริมตอนสั่งเมนู)</option>
            <option value="other">อื่น ๆ</option>
          </select>
        </div>

        {(editing.category === 'side-dish' ||
          editing.category === 'extra' ||
          editing.category === 'other' ||
          editing.category === 'rice-curry') && (
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">ช่วงขาย</label>
            <select
              value={editing.mealPeriod || 'both'}
              onChange={(e) =>
                setEditing({ ...editing, mealPeriod: e.target.value as MealPeriod })
              }
              className="w-full rounded-xl border border-border bg-card p-3 text-navy"
            >
              <option value="both">{MEAL_PERIOD_LABELS.both}</option>
              <option value="morning">{MEAL_PERIOD_LABELS.morning}</option>
              <option value="lunch">{MEAL_PERIOD_LABELS.lunch}</option>
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-navy">คำอธิบาย</label>
          <Input
            value={editing.description || ''}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="available"
            checked={editing.isAvailable}
            onChange={(e) => setEditing({ ...editing, isAvailable: e.target.checked })}
            className="h-5 w-5 accent-accent"
          />
          <label htmlFor="available" className="text-sm text-navy">
            เปิดขาย
          </label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-navy">ตัวเลือก (Options)</h3>
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <Plus className="mr-1 h-4 w-4" />
              เพิ่มตัวเลือก
            </Button>
          </div>
          <p className="text-sm text-muted">
            ข้าวราดแกง: ตั้งตัวเลือกชื่อ「จำนวนแกง」(1/2/3 อย่าง) — กับข้าวดึงจากหมวด「กับข้าว」 เพิ่มเติมดึงจากหมวด「เพิ่มเติม」
            ตั้งช่วงขายที่ตัวเลือกย่อยได้ถ้าขายไม่ตลอดทั้งเมนู
          </p>

          {editing.options.map((option, optIdx) => (
            <div key={optIdx} className="rounded-xl border border-border p-3">
              <div className="mb-2 grid gap-2 sm:grid-cols-3">
                <Input
                  value={option.name}
                  onChange={(e) => updateOption(optIdx, { name: e.target.value })}
                  placeholder="ชื่อตัวเลือก เช่น ประเภทข้าว"
                />
                <select
                  value={option.type}
                  onChange={(e) => updateOption(optIdx, { type: e.target.value as ProductOption['type'] })}
                  className="rounded-xl border border-border bg-card p-2 text-navy"
                >
                  <option value="single">เลือกได้ 1 อย่าง</option>
                  <option value="multiple">เลือกได้หลายอย่าง</option>
                </select>
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={option.required}
                      onChange={(e) => updateOption(optIdx, { required: e.target.checked })}
                      className="h-4 w-4 accent-accent"
                    />
                    บังคับเลือก
                  </label>
                  <button
                    type="button"
                    onClick={() => removeOption(optIdx)}
                    className="rounded p-1 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 pl-2">
                {option.choices.map((choice, cIdx) => (
                  <div key={cIdx} className="flex flex-wrap gap-2 sm:flex-nowrap">
                    <Input
                      value={choice.label}
                      onChange={(e) => updateChoice(optIdx, cIdx, { label: e.target.value })}
                      placeholder="ชื่อตัวเลือกย่อย"
                      className="min-w-0 flex-1"
                    />
                    <Input
                      type="number"
                      value={choice.priceAdjustment}
                      onChange={(e) => updateChoice(optIdx, cIdx, { priceAdjustment: Number(e.target.value) })}
                      placeholder="+/- ราคา"
                      className="w-24 sm:w-28"
                    />
                    <select
                      value={choice.mealPeriod || 'inherit'}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateChoice(optIdx, cIdx, {
                          mealPeriod: v === 'inherit' ? undefined : (v as MealPeriod),
                        });
                      }}
                      className="w-full rounded-xl border border-border bg-card p-2 text-sm text-navy sm:w-40"
                      title="ช่วงขายตัวเลือก"
                    >
                      <option value="inherit">ช่วงขายตามเมนู</option>
                      <option value="both">{MEAL_PERIOD_LABELS.both}</option>
                      <option value="morning">{MEAL_PERIOD_LABELS.morning}</option>
                      <option value="lunch">{MEAL_PERIOD_LABELS.lunch}</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeChoice(optIdx, cIdx)}
                      className="rounded p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button type="button" variant="ghost" size="sm" onClick={() => addChoice(optIdx)}>
                  <Plus className="mr-1 h-4 w-4" />
                  เพิ่มตัวเลือกย่อย
                </Button>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 border-t border-border pt-4">
          <Button onClick={saveProduct} className="flex-1" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/menu">ยกเลิก</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
