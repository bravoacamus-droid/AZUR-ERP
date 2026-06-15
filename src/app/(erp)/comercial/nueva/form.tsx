'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/misc';
import { Modal } from '@/components/ui/dialog';
import { crearCotizacion } from '../actions';
import { guardarCliente } from '../../catalogos/actions';

interface Opt {
  id: string;
  nombre?: string;
  codigo?: string;
  razon_social?: string;
}

export function NuevaCotizacionForm({
  lineas,
  clientes,
  plantillas,
}: {
  lineas: Opt[];
  clientes: Opt[];
  plantillas: Opt[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listaClientes, setListaClientes] = useState(clientes);
  const [nuevoCli, setNuevoCli] = useState<null | { razon_social: string; ruc_dni: string; contacto_nombre: string; origen: string }>(null);
  const [cliBusy, setCliBusy] = useState(false);
  const [form, setForm] = useState({
    origen: 'directo',
    cliente_id: clientes[0]?.id ?? '',
    linea_id: lineas[0]?.id ?? '',
    tipo_cotizacion: 'unica',
    tipo_proyecto: 'grande',
    proyecto_nombre: '',
    asunto: '',
    ubicacion: '',
    vigencia_dias: 7,
    plantilla_id: '',
  });

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setError(null);
    setLoading(true);
    const res = await crearCotizacion({
      ...form,
      tipo_cotizacion: form.tipo_cotizacion as 'unica' | 'programada' | 'recurrencia',
      tipo_proyecto: form.tipo_proyecto as 'grande' | 'chico',
      origen: form.origen as 'directo' | 'recomendacion' | 'oficina' | 'llamada',
    });
    if (!res.ok || !res.id) {
      setError(res.error ?? 'No se pudo crear');
      setLoading(false);
      return;
    }
    router.push(`/comercial/${res.id}`);
  }

  async function crearCli() {
    if (!nuevoCli?.razon_social) return;
    setCliBusy(true);
    const res = await guardarCliente({
      razon_social: nuevoCli.razon_social, tipo_doc: 'RUC', ruc_dni: nuevoCli.ruc_dni,
      contacto_nombre: nuevoCli.contacto_nombre, origen: nuevoCli.origen as never,
    });
    setCliBusy(false);
    if (res.ok && res.id) {
      setListaClientes((l) => [...l, { id: res.id!, razon_social: nuevoCli.razon_social }]);
      set('cliente_id', res.id);
      setNuevoCli(null);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Origen del lead" required>
            <Select value={form.origen} onChange={(e) => set('origen', e.target.value)}>
              <option value="directo">Contacto directo</option>
              <option value="recomendacion">Recomendación de tercero</option>
              <option value="oficina">Visita a oficina</option>
              <option value="llamada">Llamada o reunión</option>
            </Select>
          </Field>
          <Field label="Cliente" required>
            <div className="flex gap-2">
              <Select value={form.cliente_id} onChange={(e) => set('cliente_id', e.target.value)} className="flex-1">
                {listaClientes.length === 0 && <option value="">— sin clientes —</option>}
                {listaClientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razon_social}
                  </option>
                ))}
              </Select>
              <Button type="button" variant="outline" size="icon" title="Nuevo cliente" onClick={() => setNuevoCli({ razon_social: '', ruc_dni: '', contacto_nombre: '', origen: 'directo' })}>
                <Plus />
              </Button>
            </div>
          </Field>
          <Field label="Línea de negocio" required>
            <Select value={form.linea_id} onChange={(e) => set('linea_id', e.target.value)}>
              {lineas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tipo de cotización" required>
            <Select
              value={form.tipo_cotizacion}
              onChange={(e) => {
                const v = e.target.value;
                set('tipo_cotizacion', v);
                set('tipo_proyecto', v === 'unica' ? 'grande' : 'chico');
              }}
            >
              <option value="unica">Única de obra (Grande)</option>
              <option value="programada">Programada de mantenimiento (Chico)</option>
              <option value="recurrencia">Recurrencia variable (Chico)</option>
            </Select>
          </Field>
        </div>

        <Field label="Nombre del proyecto" required>
          <Input
            value={form.proyecto_nombre}
            onChange={(e) => set('proyecto_nombre', e.target.value)}
            placeholder="Ej. Instalación de viniles y laminados"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Asunto">
            <Input value={form.asunto} onChange={(e) => set('asunto', e.target.value)} />
          </Field>
          <Field label="Ubicación">
            <Input value={form.ubicacion} onChange={(e) => set('ubicacion', e.target.value)} />
          </Field>
          <Field label="Vigencia (días)">
            <Input
              type="number"
              value={form.vigencia_dias}
              onChange={(e) => set('vigencia_dias', Number(e.target.value))}
            />
          </Field>
          <Field label="Plantilla de condiciones">
            <Select value={form.plantilla_id} onChange={(e) => set('plantilla_id', e.target.value)}>
              <option value="">Página en blanco</option>
              {plantillas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {error && <p className="rounded-lg bg-azur-50 px-3 py-2 text-sm text-azur-700">{error}</p>}

        <div className="flex justify-end">
          <Button variant="gradient" onClick={submit} disabled={loading || !form.proyecto_nombre || !form.cliente_id}>
            {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />} Crear y armar presupuesto
          </Button>
        </div>
      </CardContent>

      <Modal open={!!nuevoCli} onClose={() => setNuevoCli(null)} title="Nuevo cliente"
        footer={<><Button variant="outline" onClick={() => setNuevoCli(null)}>Cancelar</Button><Button variant="gradient" disabled={cliBusy || !nuevoCli?.razon_social} onClick={crearCli}>{cliBusy ? <Loader2 className="animate-spin" /> : null} Crear</Button></>}>
        {nuevoCli && (
          <div className="space-y-3">
            <Field label="Razón social" required><Input value={nuevoCli.razon_social} onChange={(e) => setNuevoCli({ ...nuevoCli, razon_social: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="RUC / DNI"><Input value={nuevoCli.ruc_dni} onChange={(e) => setNuevoCli({ ...nuevoCli, ruc_dni: e.target.value })} /></Field>
              <Field label="Contacto"><Input value={nuevoCli.contacto_nombre} onChange={(e) => setNuevoCli({ ...nuevoCli, contacto_nombre: e.target.value })} /></Field>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}
