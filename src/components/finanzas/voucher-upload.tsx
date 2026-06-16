'use client';

import { useState } from 'react';
import { Upload, Loader2, CheckCircle2, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Sube un voucher (PDF/foto) al bucket 'vouchers' y devuelve la URL pública.
export function VoucherUpload({
  value,
  onChange,
  carpeta = 'vouchers',
}: {
  value: string;
  onChange: (url: string) => void;
  carpeta?: string;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    setError(null);
    try {
      const supabase = createClient();
      const path = `${carpeta}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, '_')}`;
      const { error: upErr } = await supabase.storage.from('vouchers').upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('vouchers').getPublicUrl(path);
      onChange(data.publicUrl);
    } catch {
      setError('No se pudo subir el archivo.');
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed bg-secondary/40 px-3 py-2.5 text-sm hover:bg-secondary">
        {subiendo ? <Loader2 className="size-4 animate-spin" /> : value ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Upload className="size-4" />}
        {subiendo ? 'Subiendo…' : value ? 'Voucher adjunto · cambiar' : 'Adjuntar voucher (PDF/foto)'}
        <input type="file" accept="image/*,application/pdf" capture="environment" className="hidden" onChange={onFile} disabled={subiendo} />
      </label>
      {value && (
        <a href={value} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-azur-600 hover:underline">
          <FileText className="size-3.5" /> Ver comprobante
        </a>
      )}
      {error && <p className="text-xs text-azur-700">{error}</p>}
    </div>
  );
}
