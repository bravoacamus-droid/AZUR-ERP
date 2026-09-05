'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/misc';
import { TIPO_SOLICITUD_LABEL } from '@/lib/estados';
import { crearSolicitud, registrarProveedor, type SolicitudInput } from './actions';
import { enqueue, isOnline } from '@/lib/offline-queue';
import { VoucherUpload } from '@/components/finanzas/voucher-upload';
import { VoucherUploadMulti } from '@/components/finanzas/voucher-upload-multi';
import { GestorInput } from '@/components/finanzas/gestor-input';

type Proyecto = { id: string; nombre: string };
type Partida = { id: string; titulo: string; proyecto_id: string };

const TIPOS = ['contratistas', 'proveedores', 'caja_chica', 'servicios', 'honorarios', 'otros_gastos'] as const;
const CONSTANCIAS = [
  { value: 'factura', label: 'Factura' },
  { value: 'boleta', label: 'Boleta' },
  { value: 'rhe', label: 'RHE' },
  { value: 'evidencia', label: 'Evidencia (captura / nota de venta)' },
];

type Contraparte = { id: string; razon_social: string; tipo?: string | null; ruc_dni?: string | null; banco?: string | null; cuenta?: string | null; cci?: string | null };
type Categoria = { id: string; nombre: string; tipo_base: string };

export function SolicitudForm({
  proyectos,
  partidas,
  contrapartes = [],
  categorias = [],
  perfiles = [],
}: {
  proyectos: Proyecto[];
  partidas: Partida[];
  contrapartes?: Contraparte[];
  categorias?: Categoria[];
  perfiles?: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]>('contratistas');
  const [categoriaSel, setCategoriaSel] = useState('');
  const [proyectoId, setProyectoId] = useState(proyectos[0]?.id ?? '');
  const [contraparteId, setContraparteId] = useState('');
  const [prov, setProv] = useState({ open: false, razon_social: '', ruc_dni: '', banco: '', cuenta: '', cci: '' });
  const [provBusy, setProvBusy] = useState(false);
  const [provMsg, setProvMsg] = useState<string | null>(null);
  async function enviarProveedor() {
    if (!prov.razon_social.trim()) return;
    setProvBusy(true); setProvMsg(null);
    const r = await registrarProveedor({ razon_social: prov.razon_social, ruc_dni: prov.ruc_dni || null, banco: prov.banco || null, cuenta: prov.cuenta || null, cci: prov.cci || null });
    setProvBusy(false);
    if (!r.ok) { setProvMsg(r.error ?? 'Error'); return; }
    setProv({ open: false, razon_social: '', ruc_dni: '', banco: '', cuenta: '', cci: '' });
    setProvMsg('Proveedor enviado a validación del administrador ✅');
  }
  const [partidaPpto, setPartidaPpto] = useState('');
  const [beneficiario, setBeneficiario] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [categoria, setCategoria] = useState('');
  const [monto, setMonto] = useState('');
  const [constancia, setConstancia] = useState('');
  const [sustento, setSustento] = useState('');
  const [pagadoCaja, setPagadoCaja] = useState(false);
  const [fechaGasto, setFechaGasto] = useState(new Date().toISOString().slice(0, 10));
  const [gestor, setGestor] = useState('');
  const [sustentos, setSustentos] = useState<string[]>([]);
  const [numComprobante, setNumComprobante] = useState('');
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
  // Filtra el maestro según el tipo elegido: contratistas→contratista/ambos,
  // proveedores→proveedor/ambos; caja chica/servicios/honorarios: sin restricción.
  const contrapartesFiltradas = contrapartes.filter((c) => {
    if (tipo === 'contratistas') return c.tipo === 'contratista' || c.tipo === 'ambos';
    if (tipo === 'proveedores') return c.tipo === 'proveedor' || c.tipo === 'ambos';
    return true;
  });
  // Si al cambiar el tipo el proveedor elegido ya no aplica, se limpia.
  useEffect(() => {
    if (contraparteId && !contrapartesFiltradas.some((c) => c.id === contraparteId)) setContraparteId('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  function elegirProveedor(id: string) {
    setContraparteId(id);
    const c = contrapartes.find((x) => x.id === id);
    if (c) {
      setBeneficiario(c.razon_social);
      setRazonSocial(c.razon_social);
      setRucDni(c.ruc_dni ?? '');
      setCtaBancaria(c.cci || c.cuenta || '');
    }
  }

  async function onSubmit() {
    setMsg(null);
    if (!monto || Number(monto) <= 0) {
      setMsg({ type: 'err', text: 'Ingresa un monto válido.' });
      return;
    }
    if (pagadoCaja && sustentos.length === 0) {
      setMsg({ type: 'err', text: 'Adjunta al menos una foto del sustento.' });
      return;
    }
    if (pagadoCaja && !descripcion.trim()) {
      setMsg({ type: 'err', text: 'Ingresa la descripción del gasto.' });
      return;
    }
    setLoading(true);
    const payload: SolicitudInput = {
      // En modo caja chica la categoría queda como 'Otros gastos' (no puede ser
      // 'caja_chica', que es la reposición y no suma al proyecto).
      tipo: pagadoCaja ? 'otros_gastos' : tipo,
      proyecto_id: proyectoId || null,
      partida_ppto: partidaPpto || null,
      beneficiario_nombre: beneficiario || null,
      especialidad: especialidad || null,
      categoria_etapa: categoria || null,
      monto: Number(monto),
      categoria: categoriaSel || null,
      constancia: (constancia || null) as SolicitudInput['constancia'],
      sustento_url: sustento || null,
      descripcion: descripcion || null,
      cta_bancaria: ctaBancaria || null,
      ruc_dni: rucDni || null,
      razon_social: razonSocial || null,
      contraparte_id: contraparteId || null,
      moneda: moneda as 'PEN' | 'USD',
      detraccion_monto: tieneDetraccion ? Number(detraccion) || 0 : 0,
      pagado_caja_chica: pagadoCaja,
      fecha_gasto: pagadoCaja ? fechaGasto : null,
      gestor: gestor || null,
      sustento_urls: pagadoCaja ? sustentos : undefined,
      num_comprobante: numComprobante || null,
    };
    function limpiar() {
      setPartidaPpto(''); setBeneficiario(''); setEspecialidad(''); setCategoria(''); setCategoriaSel('');
      setMonto(''); setConstancia(''); setSustento(''); setDescripcion(''); setCtaBancaria('');
      setRucDni(''); setRazonSocial(''); setContraparteId(''); setMoneda('PEN'); setTieneDetraccion(false); setDetraccion(''); setPagadoCaja(false);
      setGestor(''); setSustentos([]); setNumComprobante(''); setFechaGasto(new Date().toISOString().slice(0, 10));
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

      {/* Check al inicio: al marcarlo el formulario se reduce a lo esencial (pedido de David) */}
      <label className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
        <input type="checkbox" className="mt-0.5 size-4 accent-azur-600" checked={pagadoCaja} onChange={(e) => setPagadoCaja(e.target.checked)} />
        <span>
          <span className="font-medium">Gasto ya pagado desde caja chica</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">Flujo corto: el Jefe de Proyectos aprueba y Administración valida el sustento; el gasto suma al proyecto sin pasar por programar/pagar.</span>
        </span>
      </label>

      {pagadoCaja && (
        <>
          <Field label="Proyecto" required>
            <Select value={proyectoId} onChange={(e) => setProyectoId(e.target.value)}>
              <option value="">Sin proyecto</option>
              {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha del gasto" required>
              <Input type="date" value={fechaGasto} onChange={(e) => setFechaGasto(e.target.value)} />
            </Field>
            <Field label="Monto (S/)" required>
              <Input type="number" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />
            </Field>
          </div>

          <Field label="Gestor">
            <GestorInput value={gestor} onChange={setGestor} perfiles={perfiles} />
          </Field>

          <Field label="Descripción" required>
            <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="¿En qué se gastó?" />
          </Field>

          <Field label="N° de Factura / RHE">
            <Input value={numComprobante} onChange={(e) => setNumComprobante(e.target.value)} placeholder="Ej. F001-00123" />
          </Field>

          <Field label="Sustento" hint="Puedes adjuntar varias fotos (o PDF)">
            <VoucherUploadMulti value={sustentos} onChange={setSustentos} carpeta="sustentos" />
          </Field>
        </>
      )}

      {!pagadoCaja && (
        <>
      <Field label="Tipo / categoría" required>
        <Select
          value={categoriaSel ? `cat:${categorias.find((c) => c.nombre === categoriaSel)?.id ?? ''}` : `base:${tipo}`}
          onChange={(e) => { const v = e.target.value; if (v.startsWith('base:')) { setTipo(v.slice(5) as (typeof TIPOS)[number]); setCategoriaSel(''); } else { const c = categorias.find((x) => x.id === v.slice(4)); if (c) { setTipo(c.tipo_base as (typeof TIPOS)[number]); setCategoriaSel(c.nombre); } } }}
        >
          <optgroup label="Tipos base">
            {TIPOS.map((t) => <option key={t} value={`base:${t}`}>{TIPO_SOLICITUD_LABEL[t]}</option>)}
          </optgroup>
          {categorias.length > 0 && <optgroup label="Categorías">{categorias.map((c) => <option key={c.id} value={`cat:${c.id}`}>{c.nombre}</option>)}</optgroup>}
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

      {contrapartesFiltradas.length > 0 && (
        <Field label="Proveedor del maestro" hint="Se filtra según el tipo elegido arriba">
          <Select value={contraparteId} onChange={(e) => elegirProveedor(e.target.value)}>
            <option value="">— Elegir del maestro (o escribir abajo) —</option>
            {contrapartesFiltradas.map((c) => <option key={c.id} value={c.id}>{c.razon_social}{c.ruc_dni ? ` · ${c.ruc_dni}` : ''}</option>)}
          </Select>
        </Field>
      )}

      <div className="rounded-xl border border-dashed p-2">
        <button type="button" onClick={() => setProv((p) => ({ ...p, open: !p.open }))} className="text-xs font-medium text-azur-600">
          {prov.open ? '− Cerrar' : '+ Registrar proveedor nuevo (lo valida el administrador)'}
        </button>
        {prov.open && (
          <div className="mt-2 space-y-2">
            <Input placeholder="Razón social *" value={prov.razon_social} onChange={(e) => setProv((p) => ({ ...p, razon_social: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="RUC / DNI" value={prov.ruc_dni} onChange={(e) => setProv((p) => ({ ...p, ruc_dni: e.target.value }))} />
              <Input placeholder="Banco" value={prov.banco} onChange={(e) => setProv((p) => ({ ...p, banco: e.target.value }))} />
              <Input placeholder="Cuenta" value={prov.cuenta} onChange={(e) => setProv((p) => ({ ...p, cuenta: e.target.value }))} />
              <Input placeholder="CCI" value={prov.cci} onChange={(e) => setProv((p) => ({ ...p, cci: e.target.value }))} />
            </div>
            <Button type="button" size="sm" variant="outline" disabled={provBusy} onClick={enviarProveedor}>{provBusy && <Loader2 className="animate-spin" />} Enviar a validación</Button>
          </div>
        )}
        {provMsg && <p className="mt-1 text-xs text-muted-foreground">{provMsg}</p>}
      </div>

      <Field label="Beneficiario">
        <Input value={beneficiario} onChange={(e) => { setBeneficiario(e.target.value); if (contraparteId) setContraparteId(''); }} placeholder="Nombre del beneficiario" />
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

      <Field label="Sustento (foto o PDF)" hint="Factura, boleta, RH, nota de venta o captura Yape/Plin">
        <VoucherUpload value={sustento} onChange={setSustento} carpeta="sustentos" />
      </Field>

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

        </>
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
