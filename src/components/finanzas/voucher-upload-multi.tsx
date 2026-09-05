'use client';

import { useState } from 'react';
import { Upload, Loader2, X, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { optimizarImagen } from '@/lib/img';

// Sube VARIOS sustentos (PDF/fotos) al bucket 'vouchers' y devuelve sus URLs.
// David pidió poder adjuntar más de una foto en el gasto de caja chica.
export function VoucherUploadMulti({
  value,
  onChange,
  carpeta = 'sustentos',
  max = 8,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  carpeta?: string;
  max?: number;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const libres = max - value.length;
    if (libres <= 0) { setError(`Máximo ${max} archivos.`); return; }
    setSubiendo(true);
    setError(null);
    const nuevas: string[] = [];
    try {
      const supabase = createClient();
      for (const original of files.slice(0, libres)) {
        const file = await optimizarImagen(original); // imágenes→JPEG comprimido; PDFs igual
        const path = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${file.name.replace(/[^\w.\-]/g, '_')}`;
        const { error: upErr } = await supabase.storage.from('vouchers').upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        nuevas.push(supabase.storage.from('vouchers').getPublicUrl(path).data.publicUrl);
      }
      onChange([...value, ...nuevas]);
      if (files.length > libres) setError(`Solo se subieron ${libres}; el máximo es ${max}.`);
    } catch {
      setError('No se pudo subir alguno de los archivos.');
      if (nuevas.length) onChange([...value, ...nuevas]);
    } finally {
      setSubiendo(false);
      e.target.value = '';
    }
  }

  const quitar = (u: string) => onChange(value.filter((x) => x !== u));

  return (
    <div className="space-y-2">
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed bg-secondary/40 px-3 py-2.5 text-sm hover:bg-secondary">
        {subiendo ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {subiendo ? 'Subiendo…' : value.length ? `Agregar otra foto (${value.length}/${max})` : 'Adjuntar sustento (puedes elegir varias fotos)'}
        <input type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={onFiles} disabled={subiendo} />
      </label>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((u, i) => (
            <div key={u} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {/\.(pdf)$/i.test(u) ? (
                <a href={u} target="_blank" rel="noreferrer" className="flex size-16 flex-col items-center justify-center rounded-lg border bg-secondary/40 text-[10px] text-azur-600">
                  <FileText className="size-5" /> PDF
                </a>
              ) : (
                <a href={u} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt={`Sustento ${i + 1}`} className="size-16 rounded-lg border object-cover" />
                </a>
              )}
              <button
                type="button"
                onClick={() => quitar(u)}
                title="Quitar"
                className="absolute -right-1.5 -top-1.5 rounded-full bg-azur-600 p-0.5 text-white shadow"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-azur-700">{error}</p>}
    </div>
  );
}
