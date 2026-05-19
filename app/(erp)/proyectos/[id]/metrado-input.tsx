'use client';

import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Check, Loader2 } from 'lucide-react';
import { actualizarMetradoEjecutado } from './actions';

type Props = {
  partidaId: string;
  proyectoId: string;
  inicial: number;
  max: number;
};

export function MetradoInput({ partidaId, proyectoId, inicial, max }: Props) {
  const [valor, setValor] = useState(inicial);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const initialRef = useRef(inicial);

  async function save() {
    if (valor === initialRef.current) return;
    const fd = new FormData();
    fd.set('partida_id', partidaId);
    fd.set('proyecto_id', proyectoId);
    fd.set('metrado_ejecutado', String(valor));
    startTransition(async () => {
      try {
        await actualizarMetradoEjecutado(fd);
        initialRef.current = valor;
        setSavedAt(Date.now());
        toast.success('Metrado actualizado');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al guardar';
        toast.error(msg);
        setValor(initialRef.current);
      }
    });
  }

  return (
    <div className="relative inline-flex items-center justify-end">
      <input
        type="number"
        step="0.0001"
        min={0}
        max={max}
        value={valor}
        disabled={pending}
        onChange={(e) => setValor(Number(e.target.value))}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="h-9 w-28 rounded-xl border border-input bg-background px-3 text-right font-mono text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40 disabled:opacity-50"
      />
      {pending && (
        <Loader2 className="absolute right-2 h-3.5 w-3.5 animate-spin text-azur-red" />
      )}
      {!pending && savedAt && Date.now() - savedAt < 2000 && (
        <Check className="absolute right-2 h-3.5 w-3.5 text-success" />
      )}
    </div>
  );
}
