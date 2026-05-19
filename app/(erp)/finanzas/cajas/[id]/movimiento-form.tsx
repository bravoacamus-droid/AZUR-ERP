'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registrarMovimiento, type CajaActionState } from '../actions';

const selectClass =
  'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      <Plus className="h-4 w-4" />
      Registrar movimiento
    </Button>
  );
}

export function MovimientoForm({ cajaId }: { cajaId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const lastSavedRef = useRef<number | null>(null);
  const [state, formAction] = useFormState<CajaActionState, FormData>(registrarMovimiento, {
    ok: true,
  });

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
      return;
    }
    if (state.savedAt && state.savedAt !== lastSavedRef.current) {
      lastSavedRef.current = state.savedAt;
      toast.success('Movimiento registrado');
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form ref={formRef} action={formAction} className="azur-card space-y-4">
      <input type="hidden" name="caja_id" value={cajaId} />
      <h2 className="font-display text-base font-bold text-azur-ink">Nuevo movimiento</h2>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="tipo">Tipo</Label>
          <select id="tipo" name="tipo" required className={selectClass} defaultValue="entrada">
            <option value="entrada">↓ Entrada</option>
            <option value="salida">↑ Salida</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" name="fecha" type="date" required defaultValue={today} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="monto">Monto</Label>
          <Input id="monto" name="monto" type="number" step="0.01" min={0.01} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="referencia">Referencia (opcional)</Label>
          <Input id="referencia" name="referencia" placeholder="N° voucher, recibo, etc." />
        </div>
        <div className="space-y-1.5 sm:col-span-4">
          <Label htmlFor="concepto">Concepto</Label>
          <Input
            id="concepto"
            name="concepto"
            required
            minLength={3}
            placeholder="Ej. Reposición desde caja central · Pago de pasajes · Compra de materiales menores"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
