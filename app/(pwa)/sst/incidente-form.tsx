'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registrarIncidente, type SstActionState } from './actions';

type Proyecto = { id: string; codigo: string; nombre: string };

const inputClass =
  'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

const textareaClass =
  'flex w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" loading={pending} className="w-full">
      Reportar incidente
    </Button>
  );
}

export function IncidenteForm({ proyectos }: { proyectos: Proyecto[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const lastSavedRef = useRef<number | null>(null);
  const [state, formAction] = useFormState<SstActionState, FormData>(registrarIncidente, {
    ok: true,
  });

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
      return;
    }
    if (state.savedAt && state.savedAt !== lastSavedRef.current) {
      lastSavedRef.current = state.savedAt;
      toast.success('Incidente reportado — gracias por reportarlo');
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="azur-card space-y-3 border-destructive/30 bg-destructive/5"
    >
      <div className="flex items-center gap-2">
        <AlertOctagon className="h-5 w-5 text-destructive" />
        <h2 className="font-display text-base font-bold text-destructive">Reportar incidente</h2>
      </div>
      <div className="space-y-2">
        <Label htmlFor="inc_proy">Proyecto</Label>
        <select name="proyecto_id" id="inc_proy" required className={inputClass}>
          {proyectos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codigo} · {p.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="severidad">Severidad</Label>
          <select
            name="severidad"
            id="severidad"
            required
            className={inputClass}
            defaultValue="leve"
          >
            <option value="leve">Leve</option>
            <option value="moderado">Moderado</option>
            <option value="grave">Grave</option>
            <option value="critico">Crítico</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="involucrados">Involucrados</Label>
          <Input name="involucrados" id="involucrados" placeholder="Nombres" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="inc_desc">Descripción *</Label>
        <textarea
          name="descripcion"
          id="inc_desc"
          required
          minLength={5}
          rows={3}
          placeholder="Mínimo 5 caracteres"
          className={textareaClass}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="acciones">Acciones inmediatas tomadas</Label>
        <textarea name="acciones" id="acciones" rows={2} className={textareaClass} />
      </div>
      <SubmitButton />
    </form>
  );
}
