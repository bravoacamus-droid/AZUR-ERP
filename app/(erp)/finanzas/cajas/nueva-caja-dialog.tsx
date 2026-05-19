'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { Plus, Wallet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { crearCaja, type CajaActionState } from './actions';

type Proyecto = { id: string; codigo: string; nombre: string };

const selectClass =
  'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full">
      <Plus className="h-4 w-4" />
      Crear caja
    </Button>
  );
}

export function NuevaCajaDialog({ proyectos }: { proyectos: Proyecto[] }) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<'central' | 'proyecto'>('central');
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const lastSavedRef = useRef<number | null>(null);
  const [state, formAction] = useFormState<CajaActionState, FormData>(crearCaja, { ok: true });

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
      return;
    }
    if (state.savedAt && state.savedAt !== lastSavedRef.current) {
      lastSavedRef.current = state.savedAt;
      toast.success('Caja creada');
      formRef.current?.reset();
      setTipo('central');
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Nueva caja
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-azur-red" />
            Crear nueva caja
          </DialogTitle>
          <DialogDescription>
            Caja central para la empresa o caja chica de un proyecto específico.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tipo">Tipo</Label>
            <select
              id="tipo"
              name="tipo"
              required
              value={tipo}
              onChange={(e) => setTipo(e.target.value as 'central' | 'proyecto')}
              className={selectClass}
            >
              <option value="central">Caja central</option>
              <option value="proyecto">Caja chica de proyecto</option>
            </select>
          </div>

          {tipo === 'proyecto' && (
            <div className="space-y-1.5">
              <Label htmlFor="proyecto_id">Proyecto</Label>
              <select id="proyecto_id" name="proyecto_id" required={tipo === 'proyecto'} className={selectClass}>
                <option value="">— Selecciona proyecto —</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} · {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              name="nombre"
              required
              minLength={3}
              placeholder={tipo === 'central' ? 'Caja central · BCP' : 'Caja chica · PRY-2026-0001'}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="moneda">Moneda</Label>
              <select id="moneda" name="moneda" defaultValue="PEN" className={selectClass}>
                <option value="PEN">PEN — Soles</option>
                <option value="USD">USD — Dólares</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="saldo_inicial">Saldo inicial</Label>
              <Input
                id="saldo_inicial"
                name="saldo_inicial"
                type="number"
                step="0.01"
                min={0}
                defaultValue={0}
              />
            </div>
          </div>

          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  );
}
