'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/misc';

type Proyecto = { id: string; nombre: string };
type Partida = { id: string; titulo: string; proyecto_id: string };

export function EvidenciaForm({
  proyectos,
  partidas,
}: {
  proyectos: Proyecto[];
  partidas: Partida[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [proyectoId, setProyectoId] = useState(proyectos[0]?.id ?? '');
  const [partidaId, setPartidaId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const partidasProyecto = partidas.filter((p) => p.proyecto_id === proyectoId);

  function onFile(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function onSubmit() {
    setMsg(null);
    if (!proyectoId) {
      setMsg({ type: 'err', text: 'Selecciona un proyecto.' });
      return;
    }
    if (!file) {
      setMsg({ type: 'err', text: 'Toma o selecciona una foto.' });
      return;
    }
    setLoading(true);
    const supabase = createClient();

    const pos = await new Promise<GeolocationPosition | null>((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve(p),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const safeName = file.name.replace(/[^\w.\-]/g, '_');
    const path = `${proyectoId}/${Date.now()}-${safeName}`;

    const { error: upErr } = await supabase.storage.from('evidencias').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (upErr) {
      setLoading(false);
      setMsg({ type: 'err', text: 'No se pudo subir la foto.' });
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('evidencias').getPublicUrl(path);

    const { error } = await supabase.from('evidencias').insert({
      url: publicUrl,
      proyecto_id: proyectoId,
      proyecto_item_id: partidaId || null,
      descripcion: descripcion || null,
      lat: pos?.coords.latitude ?? null,
      lng: pos?.coords.longitude ?? null,
      created_by: user?.id ?? null,
    });

    setLoading(false);
    if (error) {
      setMsg({ type: 'err', text: 'Foto subida pero no se pudo registrar.' });
      return;
    }
    setMsg({ type: 'ok', text: `Evidencia registrada${pos ? ' con GPS' : ' (sin GPS)'} ✅` });
    setDescripcion('');
    setPartidaId('');
    onFile(null);
    if (fileRef.current) fileRef.current.value = '';
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Camera className="size-5 text-azur-600" />
        <p className="font-semibold">Nueva evidencia</p>
      </div>

      <Field label="Proyecto" required>
        <Select value={proyectoId} onChange={(e) => setProyectoId(e.target.value)}>
          {proyectos.length === 0 && <option value="">Sin proyectos</option>}
          {proyectos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Partida">
        <Select value={partidaId} onChange={(e) => setPartidaId(e.target.value)}>
          <option value="">— Opcional —</option>
          {partidasProyecto.map((p) => (
            <option key={p.id} value={p.id}>
              {p.titulo}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Foto" required>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-azur-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-azur-600"
        />
      </Field>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Vista previa" className="max-h-52 w-full rounded-xl object-cover" />
      )}

      <Field label="Descripción">
        <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </Field>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="size-3.5" /> Se intentará capturar la ubicación GPS.
      </p>

      <Button variant="gradient" size="lg" className="w-full" disabled={loading} onClick={onSubmit}>
        {loading && <Loader2 className="animate-spin" />} Subir evidencia
      </Button>

      {msg && (
        <p className={`text-center text-sm ${msg.type === 'ok' ? 'text-emerald-600' : 'text-azur-600'}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
