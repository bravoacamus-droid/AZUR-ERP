'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Trash2, ChevronRight, Send, Handshake, CheckCircle2, FileDown,
  MessageCircle, History, Loader2, Percent, Save, Layers, X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Avatar, Field } from '@/components/ui/misc';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { Modal } from '@/components/ui/dialog';
import { Tabs } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { fmtMoney, fmtNumber, fmtDateTime } from '@/lib/format';
import { ESTADO_COTIZACION } from '@/lib/estados';
import {
  armarArbol, renumerar, calcularCostosMargen, calcularTotales,
  type ItemCosto, type NodoArbol,
} from '@/lib/calc';
import {
  agregarItem, actualizarItem, eliminarItem, guardarFormasPago,
  cambiarEstado, guardarVersion, aprobarCotizacion, guardarCabecera,
  guardarComponenteApu, eliminarComponenteApu, guardarApuComoPlantilla,
} from '../actions';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = ItemCosto & { es_hoja: boolean; cotizacion_id: string };

export function CotizacionEditor({
  cot, items, formas, versiones, medios, apu, catalogo, historial, perfilesMap, userNombre, userId,
}: {
  cot: any; items: Row[]; formas: any[]; versiones: any[]; medios: any[]; apu: any[]; catalogo: any[];
  historial: any[]; perfilesMap: Record<string, string>;
  userNombre: string; userId: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[]>(items);
  const [tab, setTab] = useState('presupuesto');
  const [presentes, setPresentes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [showAprobar, setShowAprobar] = useState(false);
  const [showVersion, setShowVersion] = useState(false);
  const [showRechazo, setShowRechazo] = useState(false);
  const [justif, setJustif] = useState('');
  const [motivo, setMotivo] = useState('');
  const [apuItem, setApuItem] = useState<Row | null>(null);
  const [addTarget, setAddTarget] = useState<{ parent: Row | null; nivel: number } | null>(null);
  const editable = cot.estado === 'borrador' || cot.estado === 'en_negociacion';

  useEffect(() => setRows(items), [items]);

  // Realtime: presencia + sync de ítems
  useEffect(() => {
    const ch = supabase.channel(`cot-${cot.id}`, { config: { presence: { key: userId } } });
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState() as Record<string, { nombre: string }[]>;
      const nombres = Object.values(state).flat().map((p) => p.nombre);
      setPresentes([...new Set(nombres)]);
    })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cotizacion_items', filter: `cotizacion_id=eq.${cot.id}` }, () => router.refresh())
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await ch.track({ nombre: userNombre });
      });
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [supabase, cot.id, userId, userNombre, router]);

  // Árbol + cálculos
  const { flat, calc, codigos, totales } = useMemo(() => {
    const arbol = armarArbol(rows as any);
    const codigos = renumerar(arbol as any);
    const calc = calcularCostosMargen(arbol as any);
    const totales = calcularTotales(calc, arbol as any, {
      gg_pct: Number(cot.gg_pct), ga_pct: Number(cot.ga_pct), utilidad_pct: Number(cot.utilidad_pct),
      igv_pct: Number(cot.igv_pct), descuento_pct: Number(cot.descuento_pct), descuento_activo: cot.descuento_activo,
    });
    const flat: { row: Row; depth: number }[] = [];
    const walk = (nodos: NodoArbol<any>[], depth: number) => {
      nodos.forEach((n) => {
        flat.push({ row: n.data, depth });
        walk(n.hijos, depth + 1);
      });
    };
    walk(arbol as any, 0);
    return { flat, calc, codigos, totales };
  }, [rows, cot]);

  const setLocal = (id: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const persist = useCallback(async (id: string, patch: Record<string, unknown>) => {
    await actualizarItem(cot.id, id, patch);
  }, [cot.id]);

  function addRoot() {
    setAddTarget({ parent: null, nivel: 1 });
  }
  function addChild(parent: Row) {
    setAddTarget({ parent, nivel: Math.min(4, parent.nivel + 1) });
  }
  async function confirmAdd(prefill?: { titulo?: string; unidad?: string | null; costo_unitario?: number | null; catalogoPartidaId?: string }) {
    if (!addTarget) return;
    setBusy(true);
    await agregarItem(cot.id, addTarget.parent?.id ?? null, addTarget.nivel, prefill);
    setAddTarget(null);
    router.refresh();
    setBusy(false);
  }
  async function del(id: string) {
    setBusy(true);
    await eliminarItem(cot.id, id);
    router.refresh();
    setBusy(false);
  }
  async function setEstado(estado: any, m?: string) {
    setBusy(true);
    await cambiarEstado(cot.id, estado, m);
    router.refresh();
    setBusy(false);
  }
  async function doAprobar() {
    setBusy(true);
    const res = await aprobarCotizacion(cot.id);
    setBusy(false);
    setShowAprobar(false);
    if (res.ok && res.id) router.push(`/proyectos/${res.id}`);
    else alert(res.error);
  }
  async function doVersion() {
    setBusy(true);
    await guardarVersion(cot.id, justif);
    setJustif('');
    setShowVersion(false);
    router.refresh();
    setBusy(false);
  }
  async function toggleParam(patch: Record<string, unknown>) {
    await guardarCabecera(cot.id, patch);
    router.refresh();
  }

  const est = ESTADO_COTIZACION[cot.estado] ?? { label: cot.estado, variant: 'muted' as const };
  const waText = encodeURIComponent(
    `*AZUR Constructora* — Cotización ${cot.codigo}\nProyecto: ${cot.proyecto_nombre}\nTotal: ${fmtMoney(totales.total_con_descuento)}\nVer PDF: ${typeof window !== 'undefined' ? window.location.origin : ''}/comercial/${cot.id}/pdf`,
  );

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{cot.proyecto_nombre}</h1>
              <Badge variant={est.variant}>{est.label}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {cot.codigo} · {cot.cliente?.razon_social} · {cot.linea?.nombre} · v{cot.version}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {presentes.length > 0 && (
              <div className="flex items-center -space-x-2">
                {presentes.slice(0, 4).map((n) => (
                  <Avatar key={n} nombre={n} className="size-8 ring-2 ring-white" />
                ))}
                <span className="ml-3 text-xs text-muted-foreground">{presentes.length} en línea</span>
              </div>
            )}
            <Dropdown
              trigger={<Button variant="outline">Acciones</Button>}
            >
              {cot.estado === 'borrador' && (
                <DropdownItem onClick={() => setEstado('enviada')}>
                  <Send /> Marcar como enviada
                </DropdownItem>
              )}
              {(cot.estado === 'enviada' || cot.estado === 'borrador') && (
                <DropdownItem onClick={() => setEstado('en_negociacion')}>
                  <Handshake /> Pasar a negociación
                </DropdownItem>
              )}
              <DropdownItem onClick={() => setShowVersion(true)}>
                <History /> Guardar versión
              </DropdownItem>
              <a href={`/comercial/${cot.id}/pdf`} target="_blank" rel="noreferrer">
                <DropdownItem>
                  <FileDown /> Generar PDF (cliente)
                </DropdownItem>
              </a>
              <a href={`/comercial/${cot.id}/excel`}>
                <DropdownItem>
                  <FileDown /> Descargar Excel (interno)
                </DropdownItem>
              </a>
              <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noreferrer">
                <DropdownItem>
                  <MessageCircle /> Enviar por WhatsApp
                </DropdownItem>
              </a>
              {cot.estado !== 'aceptada' && cot.estado !== 'rechazada' && (
                <>
                  <DropdownItem onClick={() => setShowAprobar(true)} className="text-emerald-700 hover:bg-emerald-50">
                    <CheckCircle2 /> Aprobar → crear proyecto
                  </DropdownItem>
                  <DropdownItem onClick={() => setShowRechazo(true)} className="text-azur-700 hover:bg-azur-50">
                    <Trash2 /> Rechazar
                  </DropdownItem>
                </>
              )}
            </Dropdown>
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'presupuesto', label: 'Presupuesto (APU)' },
          { value: 'pago', label: 'Condiciones y pago' },
          { value: 'historial', label: 'Historial de modificaciones' },
          { value: 'versiones', label: `Versiones (${versiones.length})` },
        ]}
      />

      {tab === 'presupuesto' && (
        <>
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Cuadro de costos y margen</CardTitle>
              {editable && (
                <Button size="sm" variant="gradient" onClick={addRoot} disabled={busy}>
                  <Plus /> Agregar partida
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-2 py-2 text-left">Ítem</th>
                      <th className="min-w-[200px] px-2 py-2 text-left">Título</th>
                      <th className="px-2 py-2">Und</th>
                      <th className="px-2 py-2">Cant</th>
                      <th className="px-2 py-2">C. Unit</th>
                      <th className="px-2 py-2 text-right">Subtotal</th>
                      <th className="bg-azur-50/50 px-2 py-2">% Marg</th>
                      <th className="bg-azur-50/50 px-2 py-2">P. Unit</th>
                      <th className="bg-azur-50/50 px-2 py-2 text-right">Precio</th>
                      {editable && <th className="px-2 py-2" />}
                    </tr>
                  </thead>
                  <tbody>
                    {flat.length === 0 && (
                      <tr>
                        <td colSpan={editable ? 10 : 9} className="py-10 text-center text-muted-foreground">
                          Sin partidas. Agrega la primera partida general.
                        </td>
                      </tr>
                    )}
                    {flat.map(({ row, depth }) => {
                      const c = calc.get(row.id);
                      const hoja = row.es_hoja;
                      return (
                        <tr key={row.id} className={`border-b ${!hoja ? 'bg-muted/30 font-medium' : ''}`}>
                          <td className="whitespace-nowrap px-2 py-1.5 text-xs text-muted-foreground">
                            {codigos.get(row.id)}
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="flex items-center" style={{ paddingLeft: depth * 14 }}>
                              {!hoja && <ChevronRight className="size-3 shrink-0 text-muted-foreground" />}
                              <input
                                className="w-full bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-azur-300 rounded px-1"
                                defaultValue={row.titulo}
                                disabled={!editable}
                                onBlur={(e) => e.target.value !== row.titulo && persist(row.id, { titulo: e.target.value })}
                              />
                            </div>
                          </td>
                          {/* costos: solo hoja captura */}
                          <td className="px-1 py-1.5">
                            {hoja ? (
                              <input className="w-14 rounded border bg-white px-1 py-0.5 text-center disabled:bg-muted" defaultValue={row.unidad ?? ''} disabled={!editable}
                                onBlur={(e) => persist(row.id, { unidad: e.target.value })} />
                            ) : null}
                          </td>
                          <td className="px-1 py-1.5">
                            {hoja ? (
                              <NumCell value={row.cantidad} disabled={!editable} onSave={(v) => { setLocal(row.id, { cantidad: v }); persist(row.id, { cantidad: v }); }} />
                            ) : null}
                          </td>
                          <td className="px-1 py-1.5">
                            {hoja ? (
                              (row as any).tiene_apu ? (
                                <span className="block w-20 rounded bg-azur-50 px-1 py-0.5 text-right text-xs tabular-nums text-azur-700" title="Calculado por APU">{fmtNumber(Number(row.costo_unitario ?? 0))}</span>
                              ) : (
                                <NumCell value={row.costo_unitario} disabled={!editable} onSave={(v) => { setLocal(row.id, { costo_unitario: v }); persist(row.id, { costo_unitario: v }); }} />
                              )
                            ) : null}
                          </td>
                          <td className="px-2 py-1.5 text-right tabular-nums">{fmtNumber(c?.costo_subtotal ?? 0)}</td>
                          {/* margen */}
                          <td className="bg-azur-50/30 px-1 py-1.5">
                            {hoja ? (
                              <NumCell value={row.margen_pct} pct disabled={!editable} onSave={(v) => { setLocal(row.id, { margen_pct: v }); persist(row.id, { margen_pct: v }); }} />
                            ) : null}
                          </td>
                          <td className="bg-azur-50/30 px-2 py-1.5 text-center tabular-nums text-xs">
                            {hoja ? fmtNumber(c?.precio_unitario ?? 0) : ''}
                          </td>
                          <td className="bg-azur-50/30 px-2 py-1.5 text-right font-medium tabular-nums">
                            {fmtNumber(c?.margen_subtotal ?? 0)}
                          </td>
                          {editable && (
                            <td className="px-1 py-1.5">
                              <div className="flex items-center gap-0.5">
                                {hoja && (
                                  <button title="Detallar APU" onClick={() => setApuItem(row)} className={`rounded p-1 hover:bg-secondary ${(row as any).tiene_apu ? 'text-azur-600' : 'text-muted-foreground'}`}>
                                    <Layers className="size-3.5" />
                                  </button>
                                )}
                                {row.nivel < 4 && (
                                  <button title="Agregar hijo" onClick={() => addChild(row)} className="rounded p-1 hover:bg-secondary">
                                    <Plus className="size-3.5 text-muted-foreground" />
                                  </button>
                                )}
                                <button title="Eliminar" onClick={() => del(row.id)} className="rounded p-1 hover:bg-azur-50">
                                  <Trash2 className="size-3.5 text-azur-600" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <TotalesPanel cot={cot} totales={totales} onToggle={toggleParam} editable={editable} />
        </>
      )}

      {tab === 'pago' && (
        <CondicionesPago cot={cot} formas={formas} medios={medios} onSave={async (f: any) => { await guardarFormasPago(cot.id, f); router.refresh(); }} onCab={toggleParam} editable={editable} />
      )}

      {tab === 'historial' && <HistorialCambios historial={historial} perfilesMap={perfilesMap} />}

      {tab === 'versiones' && (
        <Card>
          <CardContent className="p-0">
            {versiones.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Sin versiones guardadas.</p>
            ) : (
              <ul className="divide-y">
                {versiones.map((v) => (
                  <li key={v.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium">Versión {v.version}</p>
                      <p className="text-xs text-muted-foreground">{v.justificacion || 'Sin justificación'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString('es-PE')}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modales */}
      <Modal open={showAprobar} onClose={() => setShowAprobar(false)} title="Aprobar cotización"
        description="Se creará el proyecto con el presupuesto SIN margen (costo), el cronograma de cobros y la caja chica."
        footer={<>
          <Button variant="outline" onClick={() => setShowAprobar(false)}>Cancelar</Button>
          <Button variant="gradient" onClick={doAprobar} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Aprobar y crear proyecto</Button>
        </>}>
        <p className="text-sm text-muted-foreground">Total cliente: <b>{fmtMoney(totales.total_con_descuento)}</b></p>
      </Modal>

      <Modal open={showVersion} onClose={() => setShowVersion(false)} title="Guardar versión de negociación"
        footer={<>
          <Button variant="outline" onClick={() => setShowVersion(false)}>Cancelar</Button>
          <Button variant="gradient" onClick={doVersion} disabled={busy}><Save /> Guardar</Button>
        </>}>
        <Field label="Justificación del cambio">
          <Input value={justif} onChange={(e) => setJustif(e.target.value)} placeholder="Ej. Descuento solicitado por el cliente" />
        </Field>
      </Modal>

      <Modal open={showRechazo} onClose={() => setShowRechazo(false)} title="Rechazar cotización"
        footer={<>
          <Button variant="outline" onClick={() => setShowRechazo(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={() => { setEstado('rechazada', motivo); setShowRechazo(false); }}>Rechazar</Button>
        </>}>
        <Field label="Motivo del rechazo">
          <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </Field>
      </Modal>

      {apuItem && (
        <ApuModal
          cotizacionId={cot.id}
          item={apuItem}
          componentes={apu.filter((c) => c.cotizacion_item_id === apuItem.id)}
          editable={editable}
          onClose={() => setApuItem(null)}
          onChanged={() => router.refresh()}
        />
      )}

      {addTarget && (
        <CatalogoPicker
          nivel={addTarget.nivel}
          catalogo={catalogo}
          busy={busy}
          onClose={() => setAddTarget(null)}
          onPick={confirmAdd}
        />
      )}
    </div>
  );
}

const NIVEL_LABEL = ['', 'partida', 'sub partida', 'actividad', 'sub actividad'];

function CatalogoPicker({ nivel, catalogo, busy, onClose, onPick }: {
  nivel: number; catalogo: any[]; busy: boolean;
  onClose: () => void; onPick: (prefill?: { titulo?: string; unidad?: string | null; costo_unitario?: number | null; catalogoPartidaId?: string }) => void;
}) {
  const [q, setQ] = useState('');
  const filtrados = q.trim()
    ? catalogo.filter((c) => `${c.codigo ?? ''} ${c.descripcion}`.toLowerCase().includes(q.toLowerCase().trim()))
    : catalogo;

  return (
    <Modal open onClose={onClose} className="sm:max-w-2xl"
      title={`Agregar ${NIVEL_LABEL[nivel]}`}
      description="Elige una partida del catálogo (precio referencial, editable) o créala en blanco.">
      <div className="space-y-3">
        <Button variant="outline" className="w-full" disabled={busy} onClick={() => onPick(undefined)}>
          <Plus /> Crear en blanco
        </Button>
        <div className="relative">
          <input
            className="h-10 w-full rounded-lg border border-input bg-white pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Buscar en catálogo por código o descripción…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <ChevronRight className="absolute left-3 top-1/2 size-4 -translate-y-1/2 rotate-90 text-muted-foreground" />
        </div>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {filtrados.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Sin coincidencias en el catálogo.</p>}
          {filtrados.map((c) => (
            <button
              key={c.id}
              disabled={busy}
              onClick={() => onPick({ titulo: c.descripcion, unidad: c.unidad, costo_unitario: Number(c.costo_referencial ?? 0), catalogoPartidaId: c.id })}
              className="flex w-full items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2 text-left transition-colors hover:border-azur-300 hover:bg-azur-50 disabled:opacity-60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.descripcion} {c.tiene_apu && <Badge variant="info" className="ml-1 align-middle">APU</Badge>}</p>
                <p className="text-xs text-muted-foreground">{c.codigo ?? 's/código'} {c.unidad ? `· ${c.unidad}` : ''}</p>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums text-azur-600">{fmtMoney(Number(c.costo_referencial ?? 0))}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

const APU_TIPOS = [
  { v: 'mano_obra', l: 'Mano de obra' },
  { v: 'materiales', l: 'Materiales' },
  { v: 'equipos', l: 'Equipos / herramientas' },
  { v: 'subcontratos', l: 'Subcontratos' },
  { v: 'gastos_generales', l: 'Gastos generales' },
];

function ApuModal({ cotizacionId, item, componentes, editable, onClose, onChanged }: {
  cotizacionId: string; item: Row; componentes: any[]; editable: boolean; onClose: () => void; onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [nuevo, setNuevo] = useState({ tipo: 'materiales', descripcion: '', unidad: '', cuadrilla: '', rendimiento: '', cantidad: '', precio: '' });
  const cu = componentes.reduce((a, c) => a + Number(c.cantidad) * Number(c.precio), 0);

  async function agregar() {
    if (!nuevo.descripcion) return;
    setBusy(true);
    await guardarComponenteApu(cotizacionId, item.id, {
      tipo: nuevo.tipo, descripcion: nuevo.descripcion, unidad: nuevo.unidad,
      cuadrilla: nuevo.cuadrilla ? Number(nuevo.cuadrilla) : undefined,
      rendimiento: nuevo.rendimiento ? Number(nuevo.rendimiento) : undefined,
      cantidad: Number(nuevo.cantidad || 0), precio: Number(nuevo.precio || 0),
    });
    setNuevo({ tipo: nuevo.tipo, descripcion: '', unidad: '', cuadrilla: '', rendimiento: '', cantidad: '', precio: '' });
    setBusy(false);
    onChanged();
  }
  async function eliminar(id: string) {
    setBusy(true);
    await eliminarComponenteApu(cotizacionId, item.id, id);
    setBusy(false);
    onChanged();
  }

  const porTipo = (t: string) => componentes.filter((c) => c.tipo === t);

  async function guardarPlantilla() {
    if (componentes.length === 0) return;
    const codigo = window.prompt('Código para la partida del catálogo (opcional):', '') ?? '';
    setBusy(true);
    const res = await guardarApuComoPlantilla(cotizacionId, item.id, { codigo });
    setBusy(false);
    alert(res.ok ? 'Guardada como plantilla en el catálogo ✅' : (res.error ?? 'Error'));
  }

  return (
    <Modal open onClose={onClose} className="sm:max-w-3xl"
      title={`APU · ${item.titulo}`}
      description="Desglose del costo unitario por componentes. El C.U. de la partida se calcula automáticamente."
      footer={<>
        {editable && componentes.length > 0 && <Button variant="outline" onClick={guardarPlantilla} disabled={busy}>Guardar como plantilla</Button>}
        <Button variant="gradient" onClick={onClose}>Listo · C.U. = {fmtNumber(cu)}</Button>
      </>}>
      <div className="space-y-4">
        {APU_TIPOS.map((t) => {
          const comps = porTipo(t.v);
          const sub = comps.reduce((a, c) => a + Number(c.cantidad) * Number(c.precio), 0);
          if (comps.length === 0) return null;
          return (
            <div key={t.v}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-azur-600">{t.l} · {fmtNumber(sub)}</p>
              <div className="space-y-1">
                {comps.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm">
                    <span className="flex-1">{c.descripcion} {c.unidad && <span className="text-muted-foreground">({c.unidad})</span>}</span>
                    <span className="tabular-nums text-muted-foreground">{fmtNumber(Number(c.cantidad), 2)} × {fmtNumber(Number(c.precio))}</span>
                    <span className="w-20 text-right font-medium tabular-nums">{fmtNumber(Number(c.cantidad) * Number(c.precio))}</span>
                    {editable && <button onClick={() => eliminar(c.id)} className="text-azur-600"><X className="size-4" /></button>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {componentes.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay componentes. Agrega el primero abajo.</p>}

        {editable && (
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Agregar componente</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="col-span-2 sm:col-span-1">
                <Select value={nuevo.tipo} onChange={(e) => setNuevo((n) => ({ ...n, tipo: e.target.value }))}>
                  {APU_TIPOS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                </Select>
              </div>
              <Input className="col-span-2" placeholder="Descripción (insumo / MO)" value={nuevo.descripcion} onChange={(e) => setNuevo((n) => ({ ...n, descripcion: e.target.value }))} />
              <Input placeholder="Unidad" value={nuevo.unidad} onChange={(e) => setNuevo((n) => ({ ...n, unidad: e.target.value }))} />
              <Input type="number" placeholder="Cantidad/und" value={nuevo.cantidad} onChange={(e) => setNuevo((n) => ({ ...n, cantidad: e.target.value }))} />
              <Input type="number" placeholder="Precio" value={nuevo.precio} onChange={(e) => setNuevo((n) => ({ ...n, precio: e.target.value }))} />
              <Input type="number" placeholder="Cuadrilla (opc)" value={nuevo.cuadrilla} onChange={(e) => setNuevo((n) => ({ ...n, cuadrilla: e.target.value }))} />
              <Input type="number" placeholder="Rendimiento (opc)" value={nuevo.rendimiento} onChange={(e) => setNuevo((n) => ({ ...n, rendimiento: e.target.value }))} />
              <Button variant="gradient" disabled={busy || !nuevo.descripcion} onClick={agregar}><Plus /> Agregar</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function NumCell({ value, onSave, disabled, pct }: { value: any; onSave: (v: number) => void; disabled?: boolean; pct?: boolean }) {
  const display = pct ? (value != null ? Number(value) * 100 : '') : (value ?? '');
  return (
    <input
      type="number"
      step="any"
      className="w-20 rounded border bg-white px-1 py-0.5 text-right tabular-nums disabled:bg-muted"
      defaultValue={display as any}
      disabled={disabled}
      onBlur={(e) => {
        const raw = e.target.value === '' ? 0 : Number(e.target.value);
        onSave(pct ? raw / 100 : raw);
      }}
    />
  );
}

function TotalesPanel({ cot, totales, onToggle, editable }: { cot: any; totales: any; onToggle: (p: any) => void; editable: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Bloque de totales</CardTitle></CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-1.5 text-sm">
          <Row3 label="Subtotal (con margen)" value={totales.subtotal} />
          {cot.mostrar_gg && <Row3 label={`Gastos generales (${fmtNumber(Number(cot.gg_pct) * 100, 0)}%)`} value={totales.gastos_generales} />}
          {cot.mostrar_ga && <Row3 label={`Gastos administrativos (${fmtNumber(Number(cot.ga_pct) * 100, 0)}%)`} value={totales.gastos_administrativos} />}
          {cot.mostrar_utilidad && <Row3 label={`Utilidad (${fmtNumber(Number(cot.utilidad_pct) * 100, 0)}%)`} value={totales.utilidad} />}
          <Row3 label="Costo directo" value={totales.costo_directo} bold />
          {cot.mostrar_igv && <Row3 label={`I.G.V. (${fmtNumber(Number(cot.igv_pct) * 100, 0)}%)`} value={totales.igv} />}
          <Row3 label="TOTAL" value={totales.total} bold />
          {cot.descuento_activo && (
            <>
              <Row3 label={`Descuento comercial (${fmtNumber(Number(cot.descuento_pct) * 100, 0)}%)`} value={-totales.descuento} />
              <Row3 label="TOTAL CON DESCUENTO" value={totales.total_con_descuento} bold azur />
            </>
          )}
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vista interna (oculta al cliente)</p>
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <Row3 label="Costo directo real" value={totales.costo_directo_real} />
            <Row3 label="Margen total" value={totales.margen_subtotal} azur />
          </div>
          {editable && (
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Configuración</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Toggle label="Mostrar GG" v={cot.mostrar_gg} onClick={(v) => onToggle({ mostrar_gg: v })} />
                <Toggle label="Mostrar GA" v={cot.mostrar_ga} onClick={(v) => onToggle({ mostrar_ga: v })} />
                <Toggle label="Mostrar utilidad" v={cot.mostrar_utilidad} onClick={(v) => onToggle({ mostrar_utilidad: v })} />
                <Toggle label="Mostrar IGV" v={cot.mostrar_igv} onClick={(v) => onToggle({ mostrar_igv: v })} />
              </div>
              <DescuentoControl cot={cot} onToggle={onToggle} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DescuentoControl({ cot, onToggle }: { cot: any; onToggle: (p: any) => void }) {
  const [pct, setPct] = useState(Number(cot.descuento_pct) * 100);
  return (
    <div className="mt-2 border-t pt-2">
      {!cot.descuento_activo ? (
        <Button size="sm" variant="outline" onClick={() => onToggle({ descuento_activo: true })}>
          <Percent /> Agregar descuento comercial
        </Button>
      ) : (
        <div className="flex items-end gap-2">
          <Field label="Descuento %" className="flex-1">
            <Input type="number" value={pct} onChange={(e) => setPct(Number(e.target.value))}
              onBlur={() => onToggle({ descuento_pct: pct / 100 })} />
          </Field>
          <Button size="sm" variant="ghost" onClick={() => onToggle({ descuento_activo: false, descuento_pct: 0 })}>Quitar</Button>
        </div>
      )}
    </div>
  );
}

function Toggle({ label, v, onClick }: { label: string; v: boolean; onClick: (v: boolean) => void }) {
  return (
    <button onClick={() => onClick(!v)} className={`flex items-center justify-between rounded border px-2 py-1.5 text-xs ${v ? 'border-azur-200 bg-azur-50 text-azur-700' : 'text-muted-foreground'}`}>
      {label} <span>{v ? 'Sí' : 'No'}</span>
    </button>
  );
}

function Row3({ label, value, bold, azur }: { label: string; value: number; bold?: boolean; azur?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? 'border-t pt-1.5 font-semibold' : ''} ${azur ? 'text-azur-600' : ''}`}>
      <span className={bold ? '' : 'text-muted-foreground'}>{label}</span>
      <span className="tabular-nums">{fmtMoney(value)}</span>
    </div>
  );
}

function CondicionesPago({ cot, formas, medios, onSave, onCab, editable }: any) {
  const [items, setItems] = useState<{ concepto: string; porcentaje: number; es_adelanto: boolean }[]>(
    formas.length ? formas.map((f: any) => ({ concepto: f.concepto, porcentaje: Number(f.porcentaje), es_adelanto: f.es_adelanto })) : [
      { concepto: 'Pago de adelanto', porcentaje: 0.2, es_adelanto: true },
      { concepto: 'Valorizaciones semanales', porcentaje: 0.8, es_adelanto: false },
    ],
  );
  const suma = items.reduce((a, f) => a + f.porcentaje, 0);
  return (
   <div className="space-y-4">
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Forma de pago y adelanto</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={f.concepto} disabled={!editable} onChange={(e) => setItems((it) => it.map((x, j) => j === i ? { ...x, concepto: e.target.value } : x))} />
              <Input type="number" className="w-24" disabled={!editable} value={Math.round(f.porcentaje * 100)}
                onChange={(e) => setItems((it) => it.map((x, j) => j === i ? { ...x, porcentaje: Number(e.target.value) / 100 } : x))} />
              <span className="text-sm text-muted-foreground">%</span>
              {editable && <Button size="icon" variant="ghost" onClick={() => setItems((it) => it.filter((_, j) => j !== i))}><Trash2 className="text-azur-600" /></Button>}
            </div>
          ))}
          <div className={`text-sm ${suma > 1.0001 ? 'text-azur-600' : 'text-muted-foreground'}`}>Suma: {fmtNumber(suma * 100, 0)}% {suma > 1.0001 && '(supera 100%)'}</div>
          {editable && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setItems((it) => [...it, { concepto: 'Pago', porcentaje: 0, es_adelanto: false }])}><Plus /> Agregar pago</Button>
              <Button size="sm" variant="gradient" disabled={suma > 1.0001} onClick={() => onSave(items)}><Save /> Guardar</Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Plazo y condiciones</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end gap-2">
            <Field label="Plazo de ejecución" className="flex-1">
              <Input type="number" defaultValue={cot.plazo_valor ?? ''} disabled={!editable} onBlur={(e) => onCab({ plazo_valor: Number(e.target.value) })} />
            </Field>
            <Field label="Tipo" className="flex-1">
              <Select defaultValue={cot.plazo_tipo} disabled={!editable} onChange={(e) => onCab({ plazo_tipo: e.target.value })}>
                <option value="calendario">Días calendario</option>
                <option value="util">Días útiles</option>
              </Select>
            </Field>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Medios de pago</p>
            <div className="space-y-1.5">
              {medios.map((m: any) => (
                <div key={m.id} className="rounded-lg border p-2 text-xs">
                  <p className="font-medium">{m.banco}{m.es_detraccion && <Badge variant="warning" className="ml-2">Detracción</Badge>}</p>
                  <p className="text-muted-foreground">{m.titular} · {m.cuenta_soles}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <CondicionesEditor cot={cot} onCab={onCab} editable={editable} />
   </div>
  );
}

// Paleta de colores por usuario para el changelog
const USER_COLORS = ['#E20627', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const CAMPO_LABEL: Record<string, string> = {
  titulo: 'Título', unidad: 'Unidad', cantidad: 'Cantidad', costo_unitario: 'Costo unitario',
  margen_pct: '% Margen', es_hoja: 'Es hoja', descuento_pct: '% Descuento', descuento_activo: 'Descuento activo',
  gg_pct: '% GG', ga_pct: '% GA', utilidad_pct: '% Utilidad', igv_pct: '% IGV', estado: 'Estado',
  proyecto_nombre: 'Nombre proyecto', condiciones: 'Condiciones', servicios_incluidos: 'Servicios incluidos',
  servicios_omitidos: 'Servicios omitidos', garantia: 'Garantía', garantia_activa: 'Garantía activa', version: 'Versión',
};
const IGNORAR = new Set(['updated_at', 'created_at', 'id', 'cotizacion_id', 'parent_id', 'correlativo', 'orden', 'codigo']);

function HistorialCambios({ historial, perfilesMap }: { historial: any[]; perfilesMap: Record<string, string> }) {
  const colorDe = (uid: string | null) => {
    if (!uid) return '#94a3b8';
    const keys = Object.keys(perfilesMap);
    const idx = keys.indexOf(uid);
    return USER_COLORS[(idx >= 0 ? idx : 0) % USER_COLORS.length];
  };
  const fmtVal = (v: any) => (v === null || v === undefined || v === '' ? '—' : String(v));

  function cambios(e: any): { campo: string; antes: any; despues: any }[] {
    if (e.accion === 'INSERT') return [{ campo: '➕ creado', antes: null, despues: e.new_data?.titulo ?? e.new_data?.proyecto_nombre ?? '' }];
    if (e.accion === 'DELETE') return [{ campo: '🗑️ eliminado', antes: e.old_data?.titulo ?? '', despues: null }];
    const out: { campo: string; antes: any; despues: any }[] = [];
    const o = e.old_data ?? {}, n = e.new_data ?? {};
    for (const k of Object.keys(n)) {
      if (IGNORAR.has(k)) continue;
      if (JSON.stringify(o[k]) !== JSON.stringify(n[k])) out.push({ campo: CAMPO_LABEL[k] ?? k, antes: o[k], despues: n[k] });
    }
    return out;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Historial de modificaciones</CardTitle>
        <p className="text-xs text-muted-foreground">Quién cambió qué, cuándo. Color por usuario · valor anterior → nuevo.</p>
      </CardHeader>
      <CardContent className="p-0">
        {historial.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Sin modificaciones registradas todavía.</p>
        ) : (
          <ul className="divide-y">
            {historial.map((e) => {
              const cs = cambios(e);
              if (cs.length === 0) return null;
              const color = colorDe(e.usuario_id);
              const nombre = e.usuario_id ? (perfilesMap[e.usuario_id] ?? 'Usuario') : 'Sistema';
              return (
                <li key={e.id} className="flex gap-3 px-4 py-2.5">
                  <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium" style={{ color }}>{nombre}</span>
                      <span className="text-[11px] text-muted-foreground">{fmtDateTime(e.created_at)}</span>
                    </div>
                    <div className="mt-0.5 space-y-0.5">
                      {cs.map((c, i) => (
                        <p key={i} className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{c.campo}</span>
                          {c.antes !== null || c.despues !== null ? (
                            <> : <span className="line-through">{fmtVal(c.antes)}</span> → <span className="text-foreground">{fmtVal(c.despues)}</span></>
                          ) : null}
                        </p>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function CondicionesEditor({ cot, onCab, editable }: any) {
  const campos = [
    { k: 'condiciones', label: 'Condiciones generales' },
    { k: 'servicios_incluidos', label: 'Servicios incluidos' },
    { k: 'servicios_omitidos', label: 'Servicios omitidos' },
  ];
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Condiciones, servicios y garantía</CardTitle></CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        {campos.map((c) => (
          <Field key={c.k} label={c.label} className={c.k === 'condiciones' ? 'lg:col-span-2' : ''}>
            <Textarea rows={4} defaultValue={cot[c.k] ?? ''} disabled={!editable}
              onBlur={(e) => e.target.value !== (cot[c.k] ?? '') && onCab({ [c.k]: e.target.value })}
              placeholder={`Texto de ${c.label.toLowerCase()} (editable, se precarga desde la plantilla)`} />
          </Field>
        ))}
        <div className="lg:col-span-2">
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-foreground/90">Garantía</label>
            {editable && (
              <button onClick={() => onCab({ garantia_activa: !cot.garantia_activa })}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cot.garantia_activa ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                {cot.garantia_activa ? 'Incluida ✓' : 'Oculta'}
              </button>
            )}
          </div>
          <Textarea rows={3} defaultValue={cot.garantia ?? ''} disabled={!editable}
            onBlur={(e) => e.target.value !== (cot.garantia ?? '') && onCab({ garantia: e.target.value })} />
        </div>
        <p className="text-xs text-muted-foreground lg:col-span-2">Los cambios se guardan automáticamente al salir de cada campo. Se reflejan en el PDF (la garantía solo si está incluida).</p>
      </CardContent>
    </Card>
  );
}
