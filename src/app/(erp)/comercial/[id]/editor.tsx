'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Trash2, ChevronRight, Send, Handshake, CheckCircle2, FileDown,
  MessageCircle, History, Loader2, Percent, Save, Layers, X, Undo2, Copy, BookmarkPlus, Upload,
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
import { evalFormula, esFormula } from '@/lib/formula';
import {
  agregarItem, actualizarItem, eliminarItem, guardarFormasPago,
  cambiarEstado, guardarVersion, restaurarVersion, aprobarCotizacion, guardarCabecera,
  guardarComponenteApu, eliminarComponenteApu, guardarApuComoPlantilla, revertirCambio,
  eliminarCotizacion, duplicarCotizacion, importarItemizado, parsearXlsx, type FilaImport,
} from '../actions';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = ItemCosto & { es_hoja: boolean; cotizacion_id: string };

export function CotizacionEditor({
  cot: cotProp, items, formas, versiones, medios, apu, catalogo, historial, perfilesMap, userNombre, userId, canEdit = true,
}: {
  cot: any; items: Row[]; formas: any[]; versiones: any[]; medios: any[]; apu: any[]; catalogo: any[];
  historial: any[]; perfilesMap: Record<string, string>;
  userNombre: string; userId: string; canEdit?: boolean;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  // Refresh agrupado (para que los cambios en vivo no recarguen en cada acción).
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => router.refresh(), 600);
  }, [router]);
  // Estado local de la cabecera → updates optimistas (toggles/moneda/descuento al instante).
  const [cot, setCot] = useState<any>(cotProp);
  useEffect(() => setCot(cotProp), [cotProp]);
  const [rows, setRows] = useState<Row[]>(items);
  const [tab, setTab] = useState('presupuesto');
  const [presentes, setPresentes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  // Restauración de versiones: id en curso + id recién restaurada (para "Restaurado ✓").
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [restoredId, setRestoredId] = useState<string | null>(null);
  const [showAprobar, setShowAprobar] = useState(false);
  const [showVersion, setShowVersion] = useState(false);
  const [showRechazo, setShowRechazo] = useState(false);
  const [justif, setJustif] = useState('');
  const [motivo, setMotivo] = useState('');
  const [apuItem, setApuItem] = useState<Row | null>(null);
  const [addTarget, setAddTarget] = useState<{ parent: Row | null; nivel: number } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const editable = canEdit && (cot.estado === 'borrador' || cot.estado === 'en_negociacion');

  // Navegación tipo Excel: ↑/↓/Enter mueven el foco a la misma columna de la
  // fila anterior/siguiente (por posición de celda, sirve para cualquier input).
  const onGridKey = useCallback((e: React.KeyboardEvent<HTMLTableSectionElement>) => {
    const el = e.target as HTMLElement;
    if (!(el instanceof HTMLInputElement)) return;
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter') return;
    const td = el.closest('td'); const tr = el.closest('tr');
    if (!td || !tr) return;
    const col = Array.prototype.indexOf.call(tr.children, td);
    const dir = e.key === 'ArrowUp' ? -1 : 1; // Enter y ↓ bajan
    let target = (dir === 1 ? tr.nextElementSibling : tr.previousElementSibling) as HTMLElement | null;
    while (target) {
      const input = (target.children[col] as HTMLElement | undefined)?.querySelector('input') as HTMLInputElement | null;
      if (input && !input.disabled) { e.preventDefault(); input.focus(); input.select(); return; }
      target = (dir === 1 ? target.nextElementSibling : target.previousElementSibling) as HTMLElement | null;
    }
  }, []);

  useEffect(() => setRows(items), [items]);

  // Realtime: presencia + sync de ítems
  useEffect(() => {
    const ch = supabase.channel(`cot-${cot.id}`, { config: { presence: { key: userId } } });
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState() as Record<string, { nombre: string }[]>;
      const nombres = Object.values(state).flat().map((p) => p.nombre);
      setPresentes([...new Set(nombres)]);
    })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cotizacion_items', filter: `cotizacion_id=eq.${cot.id}` }, () => debouncedRefresh())
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await ch.track({ nombre: userNombre });
      });
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [supabase, cot.id, userId, userNombre, debouncedRefresh]);

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
    const parent = addTarget.parent; const nivel = addTarget.nivel;
    setAddTarget(null);
    // Con APU de catálogo el costo lo calcula el servidor → esperamos y refrescamos.
    if (prefill?.catalogoPartidaId) {
      setBusy(true);
      await agregarItem(cot.id, parent?.id ?? null, nivel, prefill);
      router.refresh(); setBusy(false);
      return;
    }
    // Optimista: la partida aparece al instante.
    const id = globalThis.crypto.randomUUID();
    const orden = rows.filter((r) => (r.parent_id ?? null) === (parent?.id ?? null)).length + 1;
    const titulo = prefill?.titulo || (nivel === 1 ? 'Nueva partida' : nivel === 2 ? 'Nueva sub partida' : nivel === 3 ? 'Nueva actividad' : 'Nueva sub actividad');
    const nuevo = { id, cotizacion_id: cot.id, parent_id: parent?.id ?? null, nivel, orden, titulo,
      unidad: prefill?.unidad ?? null, costo_unitario: prefill?.costo_unitario ?? null,
      cantidad: prefill?.costo_unitario != null ? 1 : null, es_hoja: true, margen_pct: 0.3 } as unknown as Row;
    setRows((rs) => {
      let next = [...rs, nuevo];
      if (parent?.id) next = next.map((r) => (r.id === parent.id ? { ...r, es_hoja: false } : r));
      return next;
    });
    agregarItem(cot.id, parent?.id ?? null, nivel, prefill, id).then((r) => { if (r && r.ok === false) router.refresh(); }).catch(() => router.refresh());
  }
  function del(id: string) {
    // Borrado optimista: quita la partida y sus descendientes al instante.
    const ids = new Set<string>([id]);
    for (let changed = true; changed;) {
      changed = false;
      rows.forEach((r) => { if (r.parent_id && ids.has(r.parent_id) && !ids.has(r.id)) { ids.add(r.id); changed = true; } });
    }
    const parentId = rows.find((r) => r.id === id)?.parent_id ?? null;
    setRows((rs) => {
      let next = rs.filter((r) => !ids.has(r.id));
      if (parentId && !next.some((r) => r.parent_id === parentId)) next = next.map((r) => (r.id === parentId ? { ...r, es_hoja: true } : r));
      return next;
    });
    eliminarItem(cot.id, id).then((r) => { if (r && r.ok === false) router.refresh(); }).catch(() => router.refresh());
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
    setCot((c: any) => ({ ...c, ...patch })); // optimista: la UI cambia al instante
    await guardarCabecera(cot.id, patch);     // persiste en segundo plano (sin recargar todo)
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
              {editable ? (
                <input
                  key={cot.proyecto_nombre}
                  defaultValue={cot.proyecto_nombre}
                  title="Editar nombre de la cotización"
                  className="min-w-0 rounded border border-transparent bg-transparent px-1 text-xl font-bold hover:border-slate-300 focus:border-azur-400 focus:outline-none"
                  onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== cot.proyecto_nombre) toggleParam({ proyecto_nombre: v }); }}
                />
              ) : (
                <h1 className="text-xl font-bold">{cot.proyecto_nombre}</h1>
              )}
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
              <DropdownItem onClick={async () => { setBusy(true); const r = await duplicarCotizacion(cot.id); setBusy(false); if (r.ok && r.id) router.push(`/comercial/${r.id}`); else alert(r.error); }}>
                <Copy /> Duplicar cotización
              </DropdownItem>
              <DropdownItem onClick={async () => { setBusy(true); const r = await duplicarCotizacion(cot.id, { comoPlantilla: true }); setBusy(false); alert(r.ok ? 'Guardada como plantilla ✅' : (r.error ?? 'Error')); }}>
                <BookmarkPlus /> Guardar como plantilla
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
              {cot.estado !== 'aceptada' && (
                <DropdownItem
                  onClick={async () => {
                    if (!confirm('¿Eliminar esta cotización? Esta acción no se puede deshacer.')) return;
                    const res = await eliminarCotizacion(cot.id);
                    if (res.ok) router.push('/comercial');
                    else alert(res.error);
                  }}
                  className="text-azur-700 hover:bg-azur-50"
                >
                  <Trash2 /> Eliminar cotización
                </DropdownItem>
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
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setImportOpen(true)} disabled={busy}>
                    <Upload className="size-4" /> Importar Excel
                  </Button>
                  <Button size="sm" variant="gradient" onClick={addRoot} disabled={busy}>
                    <Plus /> Agregar partida
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <datalist id="unidades-cot">
                  {['m2', 'm3', 'm', 'und', 'glb', 'kg', 'ton', 'pto', 'p2', 'pie', 'gln', 'bls', 'rollo', 'juego', 'día', 'mes', 'hh', 'hm'].map((u) => <option key={u} value={u} />)}
                </datalist>
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
                  <tbody onKeyDown={onGridKey}>
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
                      const nivelBg = ['bg-slate-200/80', 'bg-slate-100/80', 'bg-slate-50/80', 'bg-slate-50/40'][Math.min(3, (row.nivel ?? 1) - 1)];
                      return (
                        <tr key={row.id} className={`border-b ${nivelBg} ${!hoja ? 'font-medium' : ''}`}>
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
                              <input list="unidades-cot" className="w-16 rounded border bg-white px-1 py-0.5 text-center disabled:bg-muted" defaultValue={row.unidad ?? ''} disabled={!editable}
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
                                <FormulaCellCot value={row.costo_unitario} formula={(row as any).costo_formula} disabled={!editable} onSave={(v, f) => { setLocal(row.id, { costo_unitario: v }); persist(row.id, { costo_unitario: v, costo_formula: f }); }} />
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

      {tab === 'historial' && <HistorialCambios historial={historial} perfilesMap={perfilesMap} cotizacionId={cot.id} editable={editable} />}

      {tab === 'versiones' && (
        <Card>
          <CardContent className="p-0">
            {versiones.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Sin versiones guardadas.</p>
            ) : (
              <ul className="divide-y">
                {versiones.map((v) => (
                  <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div>
                      <p className="font-medium">Versión {v.version}</p>
                      <p className="text-xs text-muted-foreground">{v.justificacion || 'Sin justificación'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{fmtDateTime(v.created_at)}</span>
                      {editable && (
                        <Button size="sm" variant="outline" disabled={restoringId !== null} onClick={async () => {
                          if (!confirm(`¿Restaurar la Versión ${v.version}? Se reemplazará la cotización actual (se guardará un respaldo automático de lo que tienes ahora).`)) return;
                          setRestoredId(null); setRestoringId(v.id);
                          const r = await restaurarVersion(cot.id, v.id);
                          if (r.ok) { setRestoringId(null); setRestoredId(v.id); router.refresh(); setTimeout(() => setRestoredId((cur) => (cur === v.id ? null : cur)), 3500); }
                          else { setRestoringId(null); alert(r.error); }
                        }}>
                          {restoringId === v.id ? <><Loader2 className="animate-spin" /> Restaurando…</>
                            : restoredId === v.id ? <><CheckCircle2 className="text-emerald-600" /> Restaurado</>
                            : <><Undo2 /> Restaurar</>}
                        </Button>
                      )}
                    </div>
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
        <p className="text-sm text-muted-foreground">Total cliente: <b>{fmtMoney(totales.total_con_descuento, cot.moneda === 'USD' ? 'USD' : 'PEN')}</b>
          {cot.moneda === 'USD' && <span> · ≈ {fmtMoney(totales.total_con_descuento * Number(cot.tipo_cambio ?? 1), 'PEN')} (T.C. {fmtNumber(Number(cot.tipo_cambio ?? 1), 3)})</span>}</p>
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
      {importOpen && (
        <ImportarModal
          cotizacionId={cot.id}
          onClose={() => setImportOpen(false)}
          onDone={() => { setImportOpen(false); router.refresh(); }}
        />
      )}
    </div>
  );
}

// ── Importar itemizado desde Excel/CSV o pegado ─────────────────────────
const CABECERAS_IMPORT = ['Nivel', 'Título', 'Unidad', 'Cantidad', 'Costo unitario', 'Margen %'];
const sinAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const numImport = (s: string): number | null => {
  const t = String(s ?? '').replace(/\s/g, '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  if (!t) return null;
  const n = Number(t);
  return isFinite(n) ? n : null;
};

// Mapea una matriz (con cabecera) a filas de importación.
function matrizAFilas(matriz: string[][]): { filas: FilaImport[]; error?: string } {
  const rows = matriz.filter((r) => r.some((c) => String(c ?? '').trim() !== ''));
  if (rows.length < 2) return { filas: [], error: 'Faltan filas de datos.' };
  const head = rows[0].map((c) => sinAcento(String(c)));
  const idx = (...alts: string[]) => head.findIndex((h) => alts.some((a) => h === a || h.includes(a)));
  const ci = {
    nivel: idx('nivel'),
    titulo: idx('titulo', 'descripcion', 'partida', 'item'),
    unidad: idx('unidad', 'und', 'um'),
    cantidad: idx('cantidad', 'cant', 'metrado'),
    costo: idx('costo unitario', 'costo', 'c.u', 'precio unitario', 'p.u', 'precio'),
    margen: idx('margen'),
  };
  if (ci.titulo < 0) return { filas: [], error: 'No se encontró la columna Título/Descripción. Usa la plantilla.' };
  const filas: FilaImport[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const titulo = String(row[ci.titulo] ?? '').trim();
    if (!titulo) continue;
    let margen = ci.margen >= 0 ? numImport(row[ci.margen]) : null;
    if (margen != null && margen > 1) margen = margen / 100; // 30 → 0.30
    filas.push({
      nivel: ci.nivel >= 0 ? (numImport(row[ci.nivel]) ?? 1) : 1,
      titulo,
      unidad: ci.unidad >= 0 ? (String(row[ci.unidad] ?? '').trim() || null) : null,
      cantidad: ci.cantidad >= 0 ? numImport(row[ci.cantidad]) : null,
      costo_unitario: ci.costo >= 0 ? numImport(row[ci.costo]) : null,
      margen_pct: margen,
    });
  }
  return { filas };
}

function ImportarModal({ cotizacionId, onClose, onDone }: { cotizacionId: string; onClose: () => void; onDone: () => void }) {
  const [texto, setTexto] = useState('');
  const [filas, setFilas] = useState<FilaImport[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const parsearTexto = (t: string) => {
    setTexto(t);
    if (!t.trim()) { setFilas([]); setMsg(null); return; }
    const sep = t.includes('\t') ? '\t' : ',';
    const matriz = t.replace(/\r/g, '').split('\n').map((l) => l.split(sep));
    const { filas, error } = matrizAFilas(matriz);
    setFilas(filas); setMsg(error ?? null);
  };

  const onArchivo = async (file: File) => {
    setMsg(null);
    if (/\.xlsx?$/i.test(file.name)) {
      setBusy(true);
      const fd = new FormData(); fd.append('file', file);
      const r = await parsearXlsx(fd);
      setBusy(false);
      if (!r.ok || !r.filas) { setMsg(r.error ?? 'No se pudo leer el Excel'); return; }
      const { filas, error } = matrizAFilas(r.filas);
      setFilas(filas); setMsg(error ?? null);
    } else {
      parsearTexto(await file.text());
    }
  };

  const descargarPlantilla = () => {
    const ejemplo = [
      CABECERAS_IMPORT.join(','),
      '1,ÁREAS INTERIORES,,,,',
      '2,Cisterna,m2,11.35,255.08,30',
      '1,Mesa de trabajo en acero inoxidable,m2,20,850,30',
    ].join('\n');
    const blob = new Blob(['﻿' + ejemplo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'plantilla-cotizacion.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const importar = async () => {
    if (!filas.length) return;
    setBusy(true);
    const r = await importarItemizado(cotizacionId, filas);
    setBusy(false);
    if (!r.ok) { setMsg(r.error ?? 'Error al importar'); return; }
    onDone();
  };

  return (
    <Modal open onClose={onClose} title="Importar itemizado desde Excel"
      description="Descarga la plantilla, complétala y pégala aquí (o sube el archivo .xlsx/.csv). Nivel 1 = partida, 2 = sub partida, etc. Las hojas llevan unidad, cantidad y costo."
      footer={<>
        <Button variant="outline" onClick={descargarPlantilla}><FileDown className="size-4" /> Plantilla</Button>
        <div className="flex-1" />
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="gradient" disabled={busy || filas.length === 0} onClick={importar}>
          {busy ? <Loader2 className="animate-spin" /> : <Upload className="size-4" />} Importar {filas.length > 0 ? `(${filas.length})` : ''}
        </Button>
      </>}>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Subir archivo (.xlsx o .csv)</label>
          <input type="file" accept=".xlsx,.xls,.csv" className="mt-1 block w-full text-sm" disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onArchivo(f); }} />
        </div>
        <div className="text-center text-xs text-muted-foreground">— o pega desde Excel —</div>
        <textarea
          className="h-40 w-full rounded-lg border bg-white p-2 font-mono text-xs"
          placeholder={CABECERAS_IMPORT.join('\t') + '\n1\tÁREAS INTERIORES\n2\tCisterna\tm2\t11.35\t255.08\t30'}
          value={texto}
          onChange={(e) => parsearTexto(e.target.value)}
        />
        {msg && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{msg}</p>}
        {filas.length > 0 && (
          <div className="rounded-lg border">
            <div className="border-b px-3 py-1.5 text-xs font-semibold text-muted-foreground">Vista previa · {filas.length} filas</div>
            <div className="max-h-40 overflow-auto">
              <table className="w-full text-xs">
                <tbody>
                  {filas.slice(0, 30).map((f, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-2 py-1 text-muted-foreground">N{f.nivel}</td>
                      <td className="px-2 py-1" style={{ paddingLeft: 8 + (Number(f.nivel) - 1) * 12 }}>{f.titulo}</td>
                      <td className="px-2 py-1 text-center">{f.unidad ?? ''}</td>
                      <td className="px-2 py-1 text-right tabular-nums">{f.cantidad ?? ''}</td>
                      <td className="px-2 py-1 text-right tabular-nums">{f.costo_unitario ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
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

function FormulaCellCot({ value, formula, onSave, disabled }: { value: any; formula?: string | null; onSave: (v: number, f: string | null) => void; disabled?: boolean }) {
  const [foco, setFoco] = useState(false);
  const display = foco ? (formula || (value ?? '')) : (value ?? '');
  return (
    <input
      className="w-20 rounded border bg-white px-1 py-0.5 text-right tabular-nums disabled:bg-muted"
      title={formula ? `Fórmula: ${formula}` : 'Puedes escribir una fórmula, ej. =40/1.18'}
      defaultValue={display as any}
      key={`${foco}-${value}-${formula ?? ''}`}
      disabled={disabled}
      onFocus={() => setFoco(true)}
      onBlur={(e) => {
        setFoco(false);
        const raw = e.target.value.trim();
        if (raw === '') return onSave(0, null);
        if (esFormula(raw)) { const r = evalFormula(raw); if (r != null) onSave(r, raw); }
        else onSave(Number(raw) || 0, null);
      }}
    />
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
  const cur = cot.moneda === 'USD' ? 'USD' : 'PEN';
  const tc = Number(cot.tipo_cambio ?? 1);
  const totalFinal = cot.descuento_activo ? totales.total_con_descuento : totales.total;
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2">Bloque de totales {cur === 'USD' && <Badge variant="info">USD · T.C. {fmtNumber(tc, 3)}</Badge>}</CardTitle></CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-1.5 text-sm">
          <Row3 label="Subtotal (con margen)" value={totales.subtotal} currency={cur} />
          {cot.mostrar_gg && <Row3 label={`Gastos generales (${fmtNumber(Number(cot.gg_pct) * 100, 0)}%)`} value={totales.gastos_generales} currency={cur} />}
          {cot.mostrar_ga && <Row3 label={`Gastos administrativos (${fmtNumber(Number(cot.ga_pct) * 100, 0)}%)`} value={totales.gastos_administrativos} currency={cur} />}
          {cot.mostrar_utilidad && <Row3 label={`Utilidad (${fmtNumber(Number(cot.utilidad_pct) * 100, 0)}%)`} value={totales.utilidad} currency={cur} />}
          <Row3 label="Costo directo" value={totales.costo_directo} bold currency={cur} />
          {cot.mostrar_igv && <Row3 label={`I.G.V. (${fmtNumber(Number(cot.igv_pct) * 100, 0)}%)`} value={totales.igv} currency={cur} />}
          <Row3 label="TOTAL" value={totales.total} bold currency={cur} />
          {cot.descuento_activo && (
            <>
              <Row3 label={`Descuento comercial (${fmtNumber(Number(cot.descuento_pct) * 100, 0)}%)`} value={-totales.descuento} currency={cur} />
              <Row3 label="TOTAL CON DESCUENTO" value={totales.total_con_descuento} bold azur currency={cur} />
            </>
          )}
          {cur === 'USD' && cot.mostrar_equiv_pen !== false && (
            <div className="mt-1 flex items-center justify-between rounded-lg bg-sky-50 px-2 py-1.5 text-xs text-sky-800">
              <span>Equivalente en soles (T.C. {fmtNumber(tc, 3)})</span>
              <span className="font-semibold tabular-nums">{fmtMoney(totalFinal * tc, 'PEN')}</span>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vista interna (oculta al cliente)</p>
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <Row3 label="Costo directo real" value={totales.costo_directo_real} currency={cur} />
            <Row3 label="Margen total" value={totales.margen_subtotal} azur currency={cur} />
          </div>
          {editable && (
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Configuración</p>
              <p className="text-xs text-muted-foreground">Controla qué conceptos ve el cliente en el PDF/Excel de la cotización. Si lo apagas, el concepto se suma pero no se muestra desglosado.</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Toggle label="Mostrar GG" v={cot.mostrar_gg} onClick={(v) => onToggle({ mostrar_gg: v })} />
                <Toggle label="Mostrar GA" v={cot.mostrar_ga} onClick={(v) => onToggle({ mostrar_ga: v })} />
                <Toggle label="Mostrar utilidad" v={cot.mostrar_utilidad} onClick={(v) => onToggle({ mostrar_utilidad: v })} />
                <Toggle label="Mostrar IGV" v={cot.mostrar_igv} onClick={(v) => onToggle({ mostrar_igv: v })} />
              </div>
              <PorcentajesControl cot={cot} onToggle={onToggle} />
              <DescuentoControl cot={cot} onToggle={onToggle} />
              <MonedaControl cot={cot} onToggle={onToggle} />
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

function PorcentajesControl({ cot, onToggle }: { cot: any; onToggle: (p: any) => void }) {
  const pct = (v: any) => Math.round(Number(v ?? 0) * 1000) / 10; // decimal -> %
  const campos: { k: string; label: string }[] = [
    { k: 'gg_pct', label: 'Gastos generales %' },
    { k: 'ga_pct', label: 'Gastos administrativos %' },
    { k: 'utilidad_pct', label: 'Utilidad %' },
    { k: 'igv_pct', label: 'IGV %' },
  ];
  return (
    <div className="mt-2 space-y-2 border-t pt-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Porcentajes del bloque de totales</p>
      <div className="grid grid-cols-2 gap-2">
        {campos.map((c) => (
          <Field key={c.k} label={c.label}>
            <Input type="number" step="0.1" defaultValue={pct(cot[c.k])} key={`${c.k}-${cot[c.k]}`}
              onBlur={(e) => { const v = Number(e.target.value) / 100; if (v !== Number(cot[c.k] ?? 0)) onToggle({ [c.k]: v }); }} />
          </Field>
        ))}
      </div>
    </div>
  );
}

function MonedaControl({ cot, onToggle }: { cot: any; onToggle: (p: any) => void }) {
  const [tc, setTc] = useState(Number(cot.tipo_cambio ?? 1));
  const esUSD = cot.moneda === 'USD';
  return (
    <div className="mt-2 space-y-2 border-t pt-2">
      <div className="flex items-end gap-2">
        <Field label="Moneda" className="flex-1">
          <Select value={esUSD ? 'USD' : 'PEN'} onChange={(e) => onToggle({ moneda: e.target.value, ...(e.target.value === 'PEN' ? { tipo_cambio: 1 } : {}) })}>
            <option value="PEN">Soles (S/)</option>
            <option value="USD">Dólares ($)</option>
          </Select>
        </Field>
        {esUSD && (
          <Field label="Tipo de cambio (S/ por $)" className="flex-1">
            <Input type="number" step="0.001" value={tc} onChange={(e) => setTc(Number(e.target.value))} onBlur={() => onToggle({ tipo_cambio: tc })} />
          </Field>
        )}
      </div>
      {esUSD && <Toggle label="Mostrar equivalente en soles" v={cot.mostrar_equiv_pen !== false} onClick={(v) => onToggle({ mostrar_equiv_pen: v })} />}
      {esUSD && <p className="text-xs text-muted-foreground">Los montos se ingresan y muestran en dólares. El tipo de cambio (lo define el usuario) convierte el total a soles al aprobar el proyecto.</p>}
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

function Row3({ label, value, bold, azur, currency }: { label: string; value: number; bold?: boolean; azur?: boolean; currency?: string }) {
  return (
    <div className={`flex items-center justify-between ${bold ? 'border-t pt-1.5 font-semibold' : ''} ${azur ? 'text-azur-600' : ''}`}>
      <span className={bold ? '' : 'text-muted-foreground'}>{label}</span>
      <span className="tabular-nums">{fmtMoney(value, currency)}</span>
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
                <option value="semanas">Semanas</option>
                <option value="meses">Meses</option>
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

const REVERSIBLES: Record<string, Set<string>> = {
  cotizaciones: new Set(['proyecto_nombre', 'asunto', 'ubicacion', 'descripcion', 'condiciones', 'servicios_incluidos', 'servicios_omitidos', 'garantia', 'garantia_activa', 'gg_pct', 'ga_pct', 'utilidad_pct', 'igv_pct', 'descuento_pct', 'descuento_activo', 'vigencia_dias', 'plazo_valor', 'plazo_tipo']),
  cotizacion_items: new Set(['titulo', 'unidad', 'cantidad', 'costo_unitario', 'margen_pct']),
};

function HistorialCambios({ historial, perfilesMap, cotizacionId, editable }: { historial: any[]; perfilesMap: Record<string, string>; cotizacionId: string; editable: boolean }) {
  const router = useRouter();
  const [filtro, setFiltro] = useState('todos');
  const [revirtiendo, setRevirtiendo] = useState<string | null>(null);

  const colorDe = (uid: string | null) => {
    if (!uid) return '#94a3b8';
    const idx = Object.keys(perfilesMap).indexOf(uid);
    return USER_COLORS[(idx >= 0 ? idx : 0) % USER_COLORS.length];
  };
  const fmtVal = (v: any) => (v === null || v === undefined || v === '' ? '—' : String(v));

  // Indica en qué elemento ocurrió el cambio (partida/sub-partida o cabecera).
  function contexto(e: any): string {
    if (e.tabla === 'cotizaciones') return 'Datos de la cotización';
    const d = e.new_data ?? e.old_data ?? {};
    const cod = d.item_codigo ? `${d.item_codigo} · ` : '';
    return `Partida: ${cod}${d.titulo ?? 'sin título'}`;
  }

  function cambios(e: any): { campo: string; key: string; antes: any; despues: any }[] {
    if (e.accion === 'INSERT') return [{ campo: '➕ creado', key: '', antes: null, despues: e.new_data?.titulo ?? e.new_data?.proyecto_nombre ?? '' }];
    if (e.accion === 'DELETE') return [{ campo: '🗑️ eliminado', key: '', antes: e.old_data?.titulo ?? '', despues: null }];
    const out: { campo: string; key: string; antes: any; despues: any }[] = [];
    const o = e.old_data ?? {}, n = e.new_data ?? {};
    for (const k of Object.keys(n)) {
      if (IGNORAR.has(k)) continue;
      if (JSON.stringify(o[k]) !== JSON.stringify(n[k])) out.push({ campo: CAMPO_LABEL[k] ?? k, key: k, antes: o[k], despues: n[k] });
    }
    return out;
  }

  async function revertir(e: any, c: { key: string; antes: any }, idx: string) {
    if (!REVERSIBLES[e.tabla]?.has(c.key)) return;
    setRevirtiendo(idx);
    const res = await revertirCambio(cotizacionId, { tabla: e.tabla, registroId: e.registro_id, campo: c.key, valor: c.antes });
    setRevirtiendo(null);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  const usuarios = Array.from(new Set(historial.map((e) => e.usuario_id).filter(Boolean)));
  const lista = filtro === 'todos' ? historial : historial.filter((e) => e.usuario_id === filtro);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">Historial de modificaciones</CardTitle>
          <p className="text-xs text-muted-foreground">Quién cambió qué y cuándo · color por usuario · valor anterior → nuevo.</p>
        </div>
        <div className="w-48">
          <Select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="todos">Todos los usuarios</option>
            {usuarios.map((u) => <option key={u} value={u}>{perfilesMap[u] ?? 'Usuario'}</option>)}
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {lista.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Sin modificaciones registradas.</p>
        ) : (
          <ul className="divide-y">
            {lista.map((e) => {
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
                    <p className="mt-0.5 text-[11px] font-medium text-azur-600/90">{contexto(e)}</p>
                    <div className="mt-0.5 space-y-0.5">
                      {cs.map((c, i) => {
                        const puedeRevertir = editable && e.accion === 'UPDATE' && REVERSIBLES[e.tabla]?.has(c.key);
                        const rid = `${e.id}-${i}`;
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <p className="flex-1">
                              <span className="font-medium text-foreground">{c.campo}</span>
                              {c.antes !== null || c.despues !== null ? (
                                <> : <span className="line-through">{fmtVal(c.antes)}</span> → <span className="text-foreground">{fmtVal(c.despues)}</span></>
                              ) : null}
                            </p>
                            {puedeRevertir && (
                              <button onClick={() => revertir(e, c, rid)} disabled={revirtiendo === rid}
                                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-azur-600 hover:bg-azur-50 disabled:opacity-50">
                                {revirtiendo === rid ? <Loader2 className="size-3 animate-spin" /> : <Undo2 className="size-3" />} Revertir
                              </button>
                            )}
                          </div>
                        );
                      })}
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
