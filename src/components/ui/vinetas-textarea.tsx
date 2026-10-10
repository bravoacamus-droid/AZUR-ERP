'use client';

import * as React from 'react';
import { List } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { VINETA, esVineta } from '@/lib/vinetas';

// Textarea con viñetas editables: Enter continúa la viñeta de la línea actual,
// Enter sobre una viñeta vacía la quita (como en Word) y el botón "Viñeta"
// pone o quita la viñeta de las líneas seleccionadas. Las viñetas son texto
// normal: se pueden borrar con la tecla de retroceso.
export function VinetasTextarea({
  value, onChange, placeholder, rows = 4, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  const ref = React.useRef<HTMLTextAreaElement | null>(null);

  const cursor = (pos: number) => requestAnimationFrame(() => {
    if (ref.current) { ref.current.selectionStart = ref.current.selectionEnd = pos; ref.current.focus(); }
  });

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter' || e.shiftKey) return;
    const el = e.currentTarget;
    const ini = el.selectionStart ?? value.length;
    const fin = el.selectionEnd ?? value.length;
    const inicioLinea = value.lastIndexOf('\n', ini - 1) + 1;
    const linea = value.slice(inicioLinea, ini);
    if (!esVineta(linea)) return; // línea sin viñeta: salto de línea normal
    e.preventDefault();
    if (!linea.replace(/^\s*[•·\-*–○◦●▪]\s*/, '').trim()) {
      // viñeta vacía → se quita y queda una línea libre
      onChange(value.slice(0, inicioLinea) + value.slice(fin));
      cursor(inicioLinea);
      return;
    }
    onChange(value.slice(0, ini) + '\n' + VINETA + value.slice(fin));
    cursor(ini + 1 + VINETA.length);
  }

  function alternarVineta() {
    const el = ref.current;
    const ini = el?.selectionStart ?? value.length;
    const fin = el?.selectionEnd ?? ini;
    const desde = value.lastIndexOf('\n', ini - 1) + 1;
    const hastaRaw = value.indexOf('\n', fin);
    const hasta = hastaRaw === -1 ? value.length : hastaRaw;
    const lineas = value.slice(desde, hasta).split('\n');
    const todas = lineas.every((l) => esVineta(l));
    const nuevas = lineas.map((l) => (todas ? l.replace(/^\s*[•·\-*–○◦●▪]\s+/, '') : esVineta(l) ? l : VINETA + l));
    const bloque = nuevas.join('\n');
    onChange(value.slice(0, desde) + bloque + value.slice(hasta));
    cursor(desde + bloque.length);
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">Enter continúa la viñeta · bórrala para escribir un título o texto libre</span>
        <button type="button" disabled={disabled} onClick={alternarVineta}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50">
          <List className="size-3.5" /> Viñeta
        </button>
      </div>
      <Textarea ref={ref} rows={rows} value={value} disabled={disabled} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} />
    </div>
  );
}
