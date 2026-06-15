'use client';

import { useRef, useState, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MessageSquare, Eye, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/misc';
import { Tabs } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { fmtDateTime } from '@/lib/format';

type Proyecto = { id: string; nombre: string };
type Charla = { id: string; tema: string; asistentes: string | null; created_at: string };
type Observacion = { id: string; tipo: string; descripcion: string; created_at: string };
type Incidente = { id: string; descripcion: string; gravedad: string | null; created_at: string };

type Msg = { type: 'ok' | 'err'; text: string } | null;

async function subirFoto(file: File, proyectoId: string): Promise<string | null> {
  const supabase = createClient();
  const safeName = file.name.replace(/[^\w.\-]/g, '_');
  const path = `${proyectoId || 'sst'}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from('evidencias').upload(path, file, { upsert: false });
  if (error) return null;
  const {
    data: { publicUrl },
  } = supabase.storage.from('evidencias').getPublicUrl(path);
  return publicUrl;
}

function FotoInput({ inputRef, onChange }: { inputRef: RefObject<HTMLInputElement>; onChange: (f: File | null) => void }) {
  return (
    <Field label="Foto (opcional)">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-azur-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-azur-600"
      />
    </Field>
  );
}

export function SstPanel({
  proyectos,
  charlas,
  observaciones,
  incidentes,
}: {
  proyectos: Proyecto[];
  charlas: Charla[];
  observaciones: Observacion[];
  incidentes: Incidente[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState('charla');
  const [proyectoId, setProyectoId] = useState(proyectos[0]?.id ?? '');

  // charla
  const [tema, setTema] = useState('');
  const [asistentes, setAsistentes] = useState('');
  // observacion
  const [obsTipo, setObsTipo] = useState('acto');
  const [obsDesc, setObsDesc] = useState('');
  const obsFotoRef = useRef<HTMLInputElement>(null);
  const [obsFoto, setObsFoto] = useState<File | null>(null);
  // incidente
  const [incDesc, setIncDesc] = useState('');
  const [incGravedad, setIncGravedad] = useState('leve');
  const incFotoRef = useRef<HTMLInputElement>(null);
  const [incFoto, setIncFoto] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  function reset() {
    router.refresh();
  }

  async function guardarCharla() {
    setMsg(null);
    if (!tema.trim()) return setMsg({ type: 'err', text: 'Ingresa el tema.' });
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from('sst_charlas').insert({
      tema: tema.trim(),
      asistentes: asistentes || null,
      proyecto_id: proyectoId || null,
      created_by: user?.id ?? null,
    });
    setLoading(false);
    if (error) return setMsg({ type: 'err', text: 'No se pudo registrar.' });
    setMsg({ type: 'ok', text: 'Charla registrada ✅' });
    setTema('');
    setAsistentes('');
    reset();
  }

  async function guardarObservacion() {
    setMsg(null);
    if (!obsDesc.trim()) return setMsg({ type: 'err', text: 'Ingresa la descripción.' });
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let foto_url: string | null = null;
    if (obsFoto) foto_url = await subirFoto(obsFoto, proyectoId);
    const { error } = await supabase.from('sst_observaciones').insert({
      tipo: obsTipo,
      descripcion: obsDesc.trim(),
      foto_url,
      proyecto_id: proyectoId || null,
      created_by: user?.id ?? null,
    });
    setLoading(false);
    if (error) return setMsg({ type: 'err', text: 'No se pudo registrar.' });
    setMsg({ type: 'ok', text: 'Observación registrada ✅' });
    setObsDesc('');
    setObsFoto(null);
    if (obsFotoRef.current) obsFotoRef.current.value = '';
    reset();
  }

  async function guardarIncidente() {
    setMsg(null);
    if (!incDesc.trim()) return setMsg({ type: 'err', text: 'Ingresa la descripción.' });
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let foto_url: string | null = null;
    if (incFoto) foto_url = await subirFoto(incFoto, proyectoId);
    const { error } = await supabase.from('sst_incidentes').insert({
      descripcion: incDesc.trim(),
      gravedad: incGravedad,
      foto_url,
      proyecto_id: proyectoId || null,
      created_by: user?.id ?? null,
    });
    setLoading(false);
    if (error) return setMsg({ type: 'err', text: 'No se pudo registrar.' });
    setMsg({ type: 'ok', text: 'Incidente registrado ✅' });
    setIncDesc('');
    setIncFoto(null);
    if (incFotoRef.current) incFotoRef.current.value = '';
    reset();
  }

  return (
    <div className="space-y-4">
      <Tabs
        value={tab}
        onChange={(v) => {
          setTab(v);
          setMsg(null);
        }}
        tabs={[
          { value: 'charla', label: 'Charla 5 min' },
          { value: 'observacion', label: 'Observación' },
          { value: 'incidente', label: 'Incidente' },
        ]}
      />

      <Field label="Proyecto">
        <Select value={proyectoId} onChange={(e) => setProyectoId(e.target.value)}>
          <option value="">Sin proyecto</option>
          {proyectos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </Select>
      </Field>

      {tab === 'charla' && (
        <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-azur-600" />
            <p className="font-semibold">Charla de 5 minutos</p>
          </div>
          <Field label="Tema" required>
            <Input value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Tema de la charla" />
          </Field>
          <Field label="Asistentes">
            <Textarea
              value={asistentes}
              onChange={(e) => setAsistentes(e.target.value)}
              placeholder="Nombres de los asistentes"
            />
          </Field>
          <Button variant="gradient" size="lg" className="w-full" disabled={loading} onClick={guardarCharla}>
            {loading && <Loader2 className="animate-spin" />} Registrar charla
          </Button>
        </div>
      )}

      {tab === 'observacion' && (
        <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Eye className="size-5 text-azur-600" />
            <p className="font-semibold">Observación</p>
          </div>
          <Field label="Tipo" required>
            <Select value={obsTipo} onChange={(e) => setObsTipo(e.target.value)}>
              <option value="acto">Acto inseguro</option>
              <option value="condicion">Condición insegura</option>
            </Select>
          </Field>
          <Field label="Descripción" required>
            <Textarea value={obsDesc} onChange={(e) => setObsDesc(e.target.value)} />
          </Field>
          <FotoInput inputRef={obsFotoRef} onChange={setObsFoto} />
          <Button variant="gradient" size="lg" className="w-full" disabled={loading} onClick={guardarObservacion}>
            {loading && <Loader2 className="animate-spin" />} Registrar observación
          </Button>
        </div>
      )}

      {tab === 'incidente' && (
        <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-azur-600" />
            <p className="font-semibold">Incidente</p>
          </div>
          <Field label="Descripción" required>
            <Textarea value={incDesc} onChange={(e) => setIncDesc(e.target.value)} />
          </Field>
          <Field label="Gravedad" required>
            <Select value={incGravedad} onChange={(e) => setIncGravedad(e.target.value)}>
              <option value="leve">Leve</option>
              <option value="grave">Grave</option>
            </Select>
          </Field>
          <FotoInput inputRef={incFotoRef} onChange={setIncFoto} />
          <Button variant="gradient" size="lg" className="w-full" disabled={loading} onClick={guardarIncidente}>
            {loading && <Loader2 className="animate-spin" />} Registrar incidente
          </Button>
        </div>
      )}

      {msg && (
        <p className={`text-center text-sm ${msg.type === 'ok' ? 'text-emerald-600' : 'text-azur-600'}`}>
          {msg.text}
        </p>
      )}

      <div className="rounded-2xl border bg-white p-4">
        <p className="mb-2 text-sm font-semibold">
          {tab === 'charla' ? 'Últimas charlas' : tab === 'observacion' ? 'Últimas observaciones' : 'Últimos incidentes'}
        </p>
        <ul className="divide-y">
          {tab === 'charla' &&
            (charlas.length === 0 ? (
              <li className="py-4 text-center text-sm text-muted-foreground">Sin registros.</li>
            ) : (
              charlas.map((c) => (
                <li key={c.id} className="py-2.5 text-sm">
                  <p className="font-medium">{c.tema}</p>
                  <p className="text-xs text-muted-foreground">{fmtDateTime(c.created_at)}</p>
                </li>
              ))
            ))}
          {tab === 'observacion' &&
            (observaciones.length === 0 ? (
              <li className="py-4 text-center text-sm text-muted-foreground">Sin registros.</li>
            ) : (
              observaciones.map((o) => (
                <li key={o.id} className="flex items-start justify-between gap-2 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.descripcion}</p>
                    <p className="text-xs text-muted-foreground">{fmtDateTime(o.created_at)}</p>
                  </div>
                  <Badge variant={o.tipo === 'acto' ? 'warning' : 'info'}>
                    {o.tipo === 'acto' ? 'Acto' : 'Condición'}
                  </Badge>
                </li>
              ))
            ))}
          {tab === 'incidente' &&
            (incidentes.length === 0 ? (
              <li className="py-4 text-center text-sm text-muted-foreground">Sin registros.</li>
            ) : (
              incidentes.map((inc) => (
                <li key={inc.id} className="flex items-start justify-between gap-2 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{inc.descripcion}</p>
                    <p className="text-xs text-muted-foreground">{fmtDateTime(inc.created_at)}</p>
                  </div>
                  <Badge variant={inc.gravedad === 'grave' ? 'danger' : 'muted'}>
                    {inc.gravedad === 'grave' ? 'Grave' : 'Leve'}
                  </Badge>
                </li>
              ))
            ))}
        </ul>
      </div>
    </div>
  );
}
