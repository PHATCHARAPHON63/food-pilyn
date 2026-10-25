// ============================================
// Menu Selector Modal
// ข้าวราดแกง: เลือกจำนวนแกง แล้วเลือกจากเมนูกับข้าว (side-dish)
// เมนูอื่น: ตัวเลือกตามที่ตั้งใน product.options
// ============================================
'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import {
  WITH_RICE_CATEGORY,
  CURRY_COUNT_OPTION_NAME,
  WITH_RICE_PICKER_OPTION_NAME,
  RICE_CURRY_CATEGORY,
  parseCurrySlotCount,
} from '@/lib/rice-curry';
import type { Product, ProductOption, OptionChoice, OrderItem } from '@/types';

interface MenuSelectorProps {
  product: Product | null;
  onClose: () => void;
  onAdd: (item: OrderItem) => void;
}

export default function MenuSelector({ product, onClose, onAdd }: MenuSelectorProps) {
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [selectedCurryIds, setSelectedCurryIds] = useState<string[]>([]);
  const [withRiceMenu, setWithRiceMenu] = useState<Product[]>([]);
  const [withRiceLoading, setWithRiceLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const isRiceCurry = product?.category === RICE_CURRY_CATEGORY;

  const currentProductId = product?._id;
  const [lastResetKey, setLastResetKey] = useState(currentProductId || '');
  if (currentProductId && currentProductId !== lastResetKey) {
    setLastResetKey(currentProductId);
    setSelected({});
    setSelectedCurryIds([]);
    setQuantity(1);
  }

  useEffect(() => {
    if (!product || !isRiceCurry) {
      setWithRiceMenu([]);
      return;
    }
    setWithRiceLoading(true);
    fetch(`/api/products?category=${WITH_RICE_CATEGORY}`)
      .then((res) => res.json())
      .then((data) => {
        setWithRiceMenu((data.products || []).filter((p: Product) => p.isAvailable));
      })
      .catch(() => setWithRiceMenu([]))
      .finally(() => setWithRiceLoading(false));
  }, [product, isRiceCurry, currentProductId]);

  const countOption = useMemo(() => {
    if (!product || !isRiceCurry) return null;
    return product.options.find((o) => o.name === CURRY_COUNT_OPTION_NAME) ?? null;
  }, [product, isRiceCurry]);

  const countOptionKey = countOption ? countOption._id || countOption.name : '';

  const currySlots = useMemo(() => {
    if (!countOption || !countOptionKey) return 0;
    const chosenId = (selected[countOptionKey] || [])[0];
    if (!chosenId) return 0;
    const choice = countOption.choices.find((c) => (c._id || c.label) === chosenId);
    return choice ? parseCurrySlotCount(choice.label) : 0;
  }, [countOption, countOptionKey, selected]);

  // เมื่อเปลี่ยนจำนวนแกง ตัดรายการแกงที่เลือกเกิน
  useEffect(() => {
    if (currySlots > 0 && selectedCurryIds.length > currySlots) {
      setSelectedCurryIds((prev) => prev.slice(0, currySlots));
    }
  }, [currySlots, selectedCurryIds.length]);

  const staticOptions = useMemo(() => {
    if (!product) return [];
    if (!isRiceCurry) return product.options;
    return product.options.filter((o) => o.name !== CURRY_COUNT_OPTION_NAME);
  }, [product, isRiceCurry]);

  const totalPrice = useMemo(() => {
    if (!product) return 0;
    let adjustment = 0;
    product.options.forEach((option) => {
      const key = option._id || option.name;
      const chosenIds = selected[key] || [];
      option.choices.forEach((choice) => {
        if (chosenIds.includes(choice._id || choice.label)) {
          adjustment += choice.priceAdjustment;
        }
      });
    });
    return (product.basePrice + adjustment) * quantity;
  }, [product, selected, quantity]);

  const curryPickerValid =
    !isRiceCurry || (currySlots > 0 && selectedCurryIds.length === currySlots && withRiceMenu.length > 0);

  const isValid = useMemo(() => {
    if (!product) return false;
    if (isRiceCurry) {
      if (!countOption || currySlots === 0) return false;
      if (!curryPickerValid) return false;
    }
    return staticOptions.every((option) => {
      if (!option.required) return true;
      const key = option._id || option.name;
      const chosen = selected[key] || [];
      if (option.type === 'single' && option.choices.some((c) => c.label === 'ไม่ใส่')) {
        return chosen.length > 0;
      }
      return chosen.length > 0;
    });
  }, [product, isRiceCurry, countOption, currySlots, curryPickerValid, staticOptions, selected]);

  if (!product) return null;

  const toggleChoice = (option: ProductOption, choice: OptionChoice) => {
    const key = option._id || option.name;
    const choiceId = choice._id || choice.label;
    const current = selected[key] || [];

    if (option.type === 'single') {
      setSelected({ ...selected, [key]: [choiceId] });
      return;
    }

    const next = current.includes(choiceId)
      ? current.filter((id) => id !== choiceId)
      : [...current, choiceId];
    setSelected({ ...selected, [key]: next });
  };

  const toggleCurry = (curryId: string) => {
    setSelectedCurryIds((prev) => {
      if (prev.includes(curryId)) {
        return prev.filter((id) => id !== curryId);
      }
      if (currySlots > 0 && prev.length >= currySlots) {
        return prev;
      }
      return [...prev, curryId];
    });
  };

  const handleAdd = () => {
    const selectedChoices: OrderItem['selectedChoices'] = [];
    product.options.forEach((option) => {
      const key = option._id || option.name;
      const chosenIds = selected[key] || [];
      const choiceLabels = option.choices
        .filter((c) => chosenIds.includes(c._id || c.label))
        .map((c) => c.label);
      if (choiceLabels.length > 0) {
        selectedChoices.push({ optionName: option.name, choiceLabels });
      }
    });

    if (isRiceCurry && selectedCurryIds.length > 0) {
      const labels = selectedCurryIds
        .map((id) => withRiceMenu.find((c) => c._id === id)?.name)
        .filter(Boolean) as string[];
      selectedChoices.push({
        optionName: WITH_RICE_PICKER_OPTION_NAME,
        choiceLabels: labels,
      });
    }

    onAdd({
      product: product._id,
      productName: product.name,
      unitPrice: totalPrice / quantity,
      quantity,
      selectedChoices,
      subtotal: totalPrice,
    });

    setSelected({});
    setSelectedCurryIds([]);
    setQuantity(1);
    onClose();
  };

  const renderOptionBlock = (option: ProductOption) => (
    <div key={option._id || option.name}>
      <div className="mb-2 flex items-center gap-2">
        <span className="font-medium text-navy">{option.name}</span>
        {option.required && <span className="text-xs text-red-500">*จำเป็น</span>}
      </div>
      <div className="space-y-2">
        {option.choices.map((choice) => {
          const choiceId = choice._id || choice.label;
          const isSelected = (selected[option._id || option.name] || []).includes(choiceId);
          return (
            <label
              key={choiceId}
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-colors ${
                isSelected ? 'border-accent bg-accent-soft' : 'border-border hover:bg-surface'
              }`}
            >
              <span className="text-navy">{choice.label}</span>
              <div className="flex items-center gap-3">
                {choice.priceAdjustment !== 0 && (
                  <span className="text-xs text-muted">
                    {choice.priceAdjustment > 0 ? '+' : ''}
                    {formatPrice(choice.priceAdjustment)}
                  </span>
                )}
                <input
                  type={option.type === 'single' ? 'radio' : 'checkbox'}
                  name={option._id || option.name}
                  checked={isSelected}
                  onChange={() => toggleChoice(option, choice)}
                  className="h-5 w-5 accent-accent"
                />
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-navy">{product.name}</h3>
            {isRiceCurry && <p className="text-xs text-muted">เลือกจากเมนูกับข้าวที่จะราดลงบนข้าว</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-surface">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
          {isRiceCurry && countOption && renderOptionBlock(countOption)}

          {isRiceCurry && currySlots > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="font-medium text-navy">{WITH_RICE_PICKER_OPTION_NAME}</span>
                <span className="text-xs text-red-500">*จำเป็น</span>
                <span className="text-xs text-muted">
                  ({selectedCurryIds.length}/{currySlots})
                </span>
              </div>
              {withRiceLoading && <p className="text-sm text-muted">กำลังโหลดเมนูกับข้าว...</p>}
              {!withRiceLoading && withRiceMenu.length === 0 && (
                <p className="rounded-xl border border-dashed border-border p-3 text-sm text-muted">
                  ยังไม่มีเมนูกับข้าว — แอดมินเพิ่มเมนูหมวด「กับข้าว」ก่อน
                </p>
              )}
              <div className="space-y-2">
                {withRiceMenu.map((item) => {
                  const isSelected = selectedCurryIds.includes(item._id);
                  const atLimit = !isSelected && selectedCurryIds.length >= currySlots;
                  return (
                    <label
                      key={item._id}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-colors ${
                        isSelected ? 'border-accent bg-accent-soft' : 'border-border hover:bg-surface'
                      } ${atLimit ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      <span className="text-navy">{item.name}</span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCurry(item._id)}
                        className="h-5 w-5 accent-accent"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {staticOptions.map((option) => renderOptionBlock(option))}

          <div>
            <span className="font-medium text-navy">จำนวน</span>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-lg font-bold text-navy"
              >
                −
              </button>
              <span className="w-8 text-center text-lg font-semibold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-lg font-bold text-navy"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <div className="mb-3 flex items-center justify-between text-lg font-bold">
            <span className="text-navy">รวม</span>
            <span className="text-navy">{formatPrice(totalPrice)}</span>
          </div>
          <Button onClick={handleAdd} disabled={!isValid} variant="secondary" className="w-full">
            เพิ่มลงตะกร้า
          </Button>
        </div>
      </div>
    </div>
  );
}
