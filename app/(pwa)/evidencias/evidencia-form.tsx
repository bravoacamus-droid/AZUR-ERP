'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';
import { Camera, Crosshair, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGeolocation } from '@/hooks/use-geolocation';
import { subirEvidencia, type SubirEvidenciaState } from './actions';

type Proyecto = { id: string; codigo: string; nombre: string };

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" loading={pending} disabled={disabled} className="w-full">
      <Upload className="h-4 w-4" />
      Subir evidencia
    </Button>
  );
}

export function EvidenciaForm({ proyectos }: { proyectos: Proyecto[] }) {
  const [state, formAction] = useFormState<SubirEvidenciaState, FormData>(subirEvidencia, {
    ok: true,
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { request, fix, loading: gpsLoading } = useGeolocation();

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok && state.error === undefined && file) {
      // success
      toast.success('Evidencia subida');
      setFile(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  async function handleFile(f: File) {
    setCompressing(true);
    try {
      const compressed = await imageCompression(f, {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/jpeg',
      });
      setFile(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch (err) {
      const e = err as Error;
      toast.error(`Error comprimiendo: ${e.message}`);
      setFile(f);
      setPreview(URL.createObjectURL(f));
    } finally {
      setCompressing(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    if (!file) {
      toast.error('Captura o adjunta una foto');
      return;
    }
    formData.set('file', file);
    if (fix) {
      formData.set('latitud', String(fix.latitud));
      formData.set('longitud', String(fix.longitud));
    }
    return formAction(formData);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="azur-card space-y-3">
        <Label htmlFor="proyecto_id">Proyecto</Label>
        <select
          id="proyecto_id"
          name="proyecto_id"
          required
          className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40"
        >
          {proyectos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codigo} · {p.nombre}
            </option>
          ))}
        </select>

        <div className="space-y-1.5">
          <Label htmlFor="titulo">Título</Label>
          <Input id="titulo" name="titulo" placeholder="Ej. Vaciado de losa col. C-3" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="descripcion">Descripción</Label>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={2}
            placeholder="Notas adicionales (opcional)"
            className="flex w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40"
          />
        </div>
      </div>

      {/* GPS */}
      <div className="azur-card space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-azur-ink">Geoetiquetado</p>
          <Button
            type="button"
            variant={fix ? 'secondary' : 'outline'}
            size="sm"
            loading={gpsLoading}
            onClick={() => request().catch(() => {})}
          >
            <Crosshair className="h-3.5 w-3.5" />
            {fix ? 'OK' : 'Obtener GPS'}
          </Button>
        </div>
        {fix && (
          <p className="font-mono text-xs text-success">
            {fix.latitud.toFixed(6)}, {fix.longitud.toFixed(6)} (±{Math.round(fix.precision_metros)} m)
          </p>
        )}
      </div>

      {/* Captura */}
      <div className="azur-card space-y-3">
        <Label htmlFor="file">Foto</Label>

        {preview ? (
          <div className="relative">
            <img src={preview} alt="Vista previa" className="w-full rounded-xl object-cover" />
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreview(null);
                if (fileRef.current) fileRef.current.value = '';
              }}
              className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-azur-ink/70 text-white"
            >
              <X className="h-4 w-4" />
            </button>
            {file && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                {(file.size / 1024).toFixed(0)} KB · comprimida a 1920px max
              </p>
            )}
          </div>
        ) : (
          <label className="grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-azur-coral/60 bg-azur-coral/5 p-8 text-center transition-colors hover:border-azur-red">
            <Camera className="mb-2 h-10 w-10 text-azur-red" />
            <p className="text-sm font-semibold text-azur-ink">
              {compressing ? 'Procesando…' : 'Tocar para capturar'}
            </p>
            <p className="text-xs text-muted-foreground">Abre la cámara del celular</p>
            <input
              ref={fileRef}
              id="file"
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </label>
        )}
      </div>

      <SubmitButton disabled={!file} />
    </form>
  );
}
