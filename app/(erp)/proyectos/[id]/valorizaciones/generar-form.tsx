'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generarValorizacion, type GenerarValState } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      <Plus className="h-4 w-4" />
      Generar valorización
    </Button>
  );
}

export function GenerarForm({ proyectoId }: { proyectoId: string }) {
  const [state, formAction] = useFormState<GenerarValState, FormData>(generarValorizacion, {
    ok: true,
  });

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  // Default: quincena actual
  const today = new Date();
  const day = today.getDate();
  const inicio = new Date(today.getFullYear(), today.getMonth(), day <= 15 ? 1 : 16);
  const fin = new Date(today.getFullYear(), today.getMonth(), day <= 15 ? 15 : 0);
  if (day > 15) fin.setMonth(today.getMonth() + 1, 0); // último día del mes

  const iso = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-3 sm:items-end">
      <input type="hidden" name="proyecto_id" value={proyectoId} />
      <div>
        <Label htmlFor="periodo_inicio">Periodo inicio</Label>
        <Input id="periodo_inicio" name="periodo_inicio" type="date" required defaultValue={iso(inicio)} />
      </div>
      <div>
        <Label htmlFor="periodo_fin">Periodo fin</Label>
        <Input id="periodo_fin" name="periodo_fin" type="date" required defaultValue={iso(fin)} />
      </div>
      <SubmitButton />
    </form>
  );
}
