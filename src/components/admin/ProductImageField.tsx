// ============================================
// อัปโหลด / ลิงก์รูปเมนู (แอดมิน)
// ============================================
'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Link2, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ProductMenuImage from '@/components/menu/ProductMenuImage';
import { MAX_PRODUCT_IMAGE_BYTES, sanitizeProductImageUrl } from '@/lib/product-image';

interface ProductImageFieldProps {
  value?: string;
  productName: string;
  onChange: (url: string | undefined) => void;
}

export default function ProductImageField({ value, productName, onChange }: ProductImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [urlDraft, setUrlDraft] = useState('');

  const uploadFile = async (file: File) => {
    setUploadError('');
    if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
      setUploadError('ขนาดรูปต้องไม่เกิน 2 MB');
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/upload/product-image', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'อัปโหลดไม่สำเร็จ');
      onChange(data.url);
      setUrlDraft('');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const applyUrl = () => {
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    const safe = sanitizeProductImageUrl(trimmed);
    if (!safe) {
      setUploadError('ลิงก์รูปไม่ถูกต้อง (ใช้ https:// หรืออัปโหลดจากเครื่อง)');
      return;
    }
    onChange(safe);
    setUrlDraft('');
    setUploadError('');
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-navy">รูปเมนู</label>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <ProductMenuImage src={value} alt={productName || 'เมนู'} className="h-28 w-28" sizes="112px" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadFile(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="mr-1.5 h-4 w-4" />
              {uploading ? 'กำลังอัปโหลด…' : 'เลือกรูปจากเครื่อง'}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={() => onChange(undefined)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                ลบรูป
              </Button>
            )}
          </div>
          <p className="text-xs text-muted">
            อัปโหลดจะเก็บที่ Cloudinary · JPG, PNG, WebP หรือ GIF สูงสุด 2 MB
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="หรือวางลิงก์รูป (https://…)"
              className="min-w-0 flex-1"
            />
            <Button type="button" variant="secondary" size="sm" onClick={applyUrl} disabled={!urlDraft.trim()}>
              <Link2 className="mr-1.5 h-4 w-4" />
              ใช้ลิงก์
            </Button>
          </div>
          {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
        </div>
      </div>
    </div>
  );
}
