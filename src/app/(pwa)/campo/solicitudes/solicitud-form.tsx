'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/misc';
import { TIPO_SOLICITUD_LABEL } from '@/lib/estados';
import { crearSolicitud, type SolicitudInput } from './actions';
import { enqueue, isOnline } from '@/lib/offline-queue';

type Proyecto = { id: string; nombre: string };
type Partida = { id: string; titulo: string; proyecto_id: string };

const TIPOS = ['contratistas', 'proveedores', 'caja_chica', 'servicios', 'honorarios'] as const;
const CONSTANCIAS = [
  { value: 'factura', label: 'Factura' },
  { value: 'boleta', label: 'Boleta' },
  { value: 'rhe', label: 'RHE' },
];

export function SolicitudForm({
  proyectos,
  partidas,
}: {
  proyectos: Proyecto[];
  partidas: Partida[];
}) {
  const router = useRouter();
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]>('contratistas');
  const [proyectoId, setProyectoId] = useState(proyectos[0]?.id ?? '');
  const [partidaPpto, setPartidaPpto] = useState('');
  const [beneficiario, setBeneficiario] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [categoria, setCategoria] = useState('');
  const [monto, setMonto] = useState('');
  const [constancia, setConstancia] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ctaBancaria, setCtaBancaria] = useState('');
  const [rucDni, setRucDni] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [moneda, setMoneda] = useState('PEN');
  const [tieneDetraccion, setTieneDetraccion] = useState(false);
  const [detraccion, setDetraccion] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const partidasProyecto = partidas.filter((p) => p.proyecto_id === proyectoId);

  async function onSubmit() {
    setMsg(null);
    if (!monto || Number(monto) <= 0) {
      setMsg({ type: 'err', text: 'Ingresa un monto válido.' });
      return;
    }
    setLoading(true);
    const payload: SolicitudInput = {
      tipo,
      proyecto_id: proyectoId || null,
      partida_ppto: partidaPpto || null,
      beneficiario_nombre: beneficiario || null,
      especialidad: especialidad || null,
      categoria_etapa: categoria || null,
      monto: Number(monto),
      constancia: (constancia || null) as SolicitudInput['constancia'],
      descripcion: descripcion || null,
      cta_bancaria: ctaBancaria || null,
      ruc_dni: rucDni || null,
      razon_social: razonSocial || null,
      moneda: moneda as 'PEN' | 'USD',
      detraccion_monto: tieneDetraccion ? Number(detraccion) || 0 : 0,
    };
    function limpiar() {
      setPartidaPpto(''); setBeneficiario(''); setEspecialidad(''); setCategoria('');
      setMonto(''); setConstancia(''); setDescripcion(''); setCtaBancaria('');
      setRucDni(''); setRazonSocial(''); setMoneda('PEN'); setTieneDetraccion(false); setDetraccion('');
    }

    if (!isOnline()) {
      enqueue('solicitud', payload);
      setLoading(false);
      setMsg({ type: 'ok', text: 'Sin conexión: guardada y se enviará al reconectar 📴' });
      limpiar();
      return;
    }

    try {
      const res = await crearSolicitud(payload);
      setLoading(false);
      if (res.ok) {
        setMsg({ type: 'ok', text: 'Solicitud enviada ✅' });
        limpiar();
        router.refresh();
      } else {
        setMsg({ type: 'err', text: res.error ?? 'No se pudo enviar.' });
      }
    } catch {
      enqueue('solicitud', payload);
      setLoading(false);
      setMsg({ type: 'ok', text: 'Guardada offline, se enviará al reconectar 📴' });
      limpiar();
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Receipt className="size-5 text-azur-600" />
        <p className="font-semibold">Nueva solicitud de pago</p>
      </div>

      <Field label="Tipo" required>
        <Select value={tipo} onChange={(e) => setTipo(e.target.value as (typeof TIPOS)[number])}>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {TIPO_SOLICITUD_LABEL[t]}
            </option>
          ))}
        </Select>
      </Field>

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

      <Field label="Partida presupuestal">
        <Select value={partidaPpto} onChange={(e) => setPartidaPpto(e.target.value)}>
          <option value="">— Opcional —</option>
          {partidasProyecto.map((p) => (
            <option key={p.id} value={p.titulo}>
              {p.titulo}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Beneficiario">
        <Input value={beneficiario} onChange={(e) => setBeneficiario(e.target.value)} placeholder="Nombre del beneficiario" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Especialidad">
          <Input value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} />
        </Field>
        <Field label="Categoría / etapa">
          <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Monto (S/)" required>
          <Input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0.00"
          />
        </Field>
        <Field label="Constancia">
          <Select value={constancia} onChange={(e) => setConstancia(e.target.value)}>
            <option value="">— Ninguna —</option>
            {CONSTANCIAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Descripción">
        <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </Field>

      <Field label="Cuenta bancaria">
        <Input value={ctaBancaria} inputMode="numeric" maxLength={20} onChange={(e) => setCtaBancaria(e.target.value.replace(/\D/g, ''))} placeholder="N° de cuenta / CCI" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="RUC / DNI">
          <Input value={rucDni} onChange={(e) => setRucDni(e.target.value.replace(/\D/g, ''))} inputMode="numeric" maxLength={11} />
        </Field>
        <Field label="Moneda">
          <Select value={moneda} onChange={(e) => setMoneda(e.target.value)}>
            <option value="PEN">Soles (S/)</option>
            <option value="USD">Dólares ($)</option>
          </Select>
        </Field>
      </div>

      <Field label="Razón social">
        <Input value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-azur-600" checked={tieneDetraccion} onChange={(e) => setTieneDetraccion(e.target.checked)} />
        Este pago tiene detracción
      </label>
      {tieneDetraccion && (
        <Field label="Monto de detracción (S/)">
          <Input type="number" inputMode="decimal" value={detraccion} onChange={(e) => setDetraccion(e.target.value)} placeholder="0.00" />
        </Field>
      )}

      <Button variant="gradient" size="lg" className="w-full" disabled={loading} onClick={onSubmit}>
        {loading && <Loader2 className="animate-spin" />} Enviar solicitud
      </Button>

      {msg && (
        <p className={`text-center text-sm ${msg.type === 'ok' ? 'text-emerald-600' : 'text-azur-600'}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
