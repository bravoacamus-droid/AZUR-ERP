'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { subirDocumentoErp, type DocActionState } from './actions';
import {
  CARPETA_LABEL,
  VISIBILIDAD_HINT,
  VISIBILIDAD_LABEL,
  type DocCarpeta,
  type DocVisibilidad,
} from '@/lib/proyectos/documentos';

type Props = {
  proyectoId: string;
  visibilidadesPermitidas: DocVisibilidad[];
};

const inputClass =
  'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      <Upload className="h-4 w-4" />
      Subir documento
    </Button>
  );
}

export function UploadForm({ proyectoId, visibilidadesPermitidas }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const lastSavedRef = useRef<number | null>(null);
  const [visibilidad, setVisibilidad] = useState<DocVisibilidad>(visibilidadesPermitidas[0] ?? 'publica');
  const [state, formAction] = useFormState<DocActionState, FormData>(subirDocumentoErp, {
    ok: true,
  });

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
      return;
    }
    if (state.savedAt && state.savedAt !== lastSavedRef.current) {
      lastSavedRef.current = state.savedAt;
      toast.success('Documento subido');
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="azur-card space-y-4">
      <input type="hidden" name="proyecto_id" value={proyectoId} />
      <h2 className="font-display text-base font-bold text-azur-ink">Subir documento</h2>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="carpeta">Carpeta</Label>
          <select id="carpeta" name="carpeta" required className={inputClass} defaultValue="general">
            {(Object.keys(CARPETA_LABEL) as DocCarpeta[]).map((c) => (
              <option key={c} value={c}>
                {CARPETA_LABEL[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="titulo">Título</Label>
          <Input id="titulo" name="titulo" required minLength={3} placeholder="Ej. Plano arq. Nivel 1" />
        </div>
      </div>

      <div>
        <Label htmlFor="descripcion">Descripción (opcional)</Label>
        <Input id="descripcion" name="descripcion" placeholder="Notas sobre el documento" />
      </div>

      <div>
        <Label htmlFor="visibilidad">Visibilidad</Label>
        <select
          id="visibilidad"
          name="visibilidad"
          required
          value={visibilidad}
          onChange={(e) => setVisibilidad(e.target.value as DocVisibilidad)}
          className={inputClass}
        >
          {visibilidadesPermitidas.map((v) => (
            <option key={v} value={v}>
              {VISIBILIDAD_LABEL[v]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-muted-foreground">{VISIBILIDAD_HINT[visibilidad]}</p>
      </div>

      <div>
        <Label htmlFor="file">Archivo (máx 50 MB)</Label>
        <input
          id="file"
          type="file"
          name="file"
          required
          className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-azur-red file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-azur-bright"
        />
      </div>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
