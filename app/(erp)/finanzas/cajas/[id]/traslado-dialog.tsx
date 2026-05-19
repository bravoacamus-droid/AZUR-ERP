'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { ArrowRightLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trasladarEntreCajas, type CajaActionState } from '../actions';

type CajaDestino = {
  id: string;
  nombre: string;
  tipo: string;
  moneda: string;
  saldo_actual: number;
};

type Props = {
  cajaOrigenId: string;
  cajaOrigenNombre: string;
  cajaOrigenMoneda: string;
  saldoOrigen: number;
  cajasDestino: CajaDestino[]; // pre-filtradas por la misma moneda y excluye la origen
};

const selectClass =
  'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} disabled={disabled} className="w-full">
      <ArrowRightLeft className="h-4 w-4" />
      Ejecutar traslado
    </Button>
  );
}

export function TrasladoDialog({
  cajaOrigenId,
  cajaOrigenNombre,
  cajaOrigenMoneda,
  saldoOrigen,
  cajasDestino,
}: Props) {
  const [open, setOpen] = useState(false);
  const [monto, setMonto] = useState<number>(0);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const lastSavedRef = useRef<number | null>(null);
  const [state, formAction] = useFormState<CajaActionState, FormData>(
    trasladarEntreCajas,
    { ok: true },
  );

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
      return;
    }
    if (state.savedAt && state.savedAt !== lastSavedRef.current) {
      lastSavedRef.current = state.savedAt;
      toast.success('Traslado registrado · 2 movimientos correlacionados');
      formRef.current?.reset();
      setMonto(0);
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  const fmt = (n: number) =>
    cajaOrigenMoneda === 'USD'
      ? `$ ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

  const sinFondos = monto > saldoOrigen;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" disabled={cajasDestino.length === 0}>
          <ArrowRightLeft className="h-4 w-4" />
          Trasladar a otra caja
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-azur-red" />
            Traslado entre cajas
          </DialogTitle>
          <DialogDescription>
            Una sola operación que crea automáticamente la <strong>salida</strong> en{' '}
            {cajaOrigenNombre} y la <strong>entrada</strong> en la caja destino, con referencia
            común para trazabilidad.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="caja_origen" value={cajaOrigenId} />

          <div className="rounded-xl bg-muted/40 p-3 text-xs">
            <p className="font-semibold text-azur-ink">Origen: {cajaOrigenNombre}</p>
            <p className="text-muted-foreground">
              Saldo disponible: <span className="font-mono font-bold text-azur-red">{fmt(saldoOrigen)}</span>
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="caja_destino">Caja destino</Label>
            <select id="caja_destino" name="caja_destino" required className={selectClass}>
              <option value="">— Selecciona destino —</option>
              {cajasDestino.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} · {c.tipo === 'central' ? 'Central' : 'Proyecto'} · saldo {fmt(c.saldo_actual)}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              Solo cajas en {cajaOrigenMoneda}. Si necesitas trasladar a otra moneda, usa un movimiento manual.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="monto">Monto</Label>
              <Input
                id="monto"
                name="monto"
                type="number"
                step="0.01"
                min={0.01}
                max={saldoOrigen}
                required
                value={monto || ''}
                onChange={(e) => setMonto(Number(e.target.value))}
              />
              {sinFondos && (
                <p className="text-[11px] text-destructive">⚠ Excede el saldo disponible</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" name="fecha" type="date" required defaultValue={today} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="concepto">Concepto / motivo</Label>
            <Input
              id="concepto"
              name="concepto"
              required
              minLength={3}
              placeholder="Ej. Reposición semanal a caja chica del proyecto"
            />
          </div>

          <SubmitButton disabled={sinFondos || monto <= 0} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
