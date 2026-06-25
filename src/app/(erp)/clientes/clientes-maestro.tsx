'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Upload, Pencil, Loader2, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/dialog';
import { Field, EmptyState } from '@/components/ui/misc';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { soloDigitos } from '@/lib/utils';
import { guardarCliente, importarClientes } from '../catalogos/actions';

/* eslint-disable @typescript-eslint/no-explicit-any */
const VACIO = { id: undefined as string | undefined, razon_social: '', tipo_doc: 'RUC', ruc_dni: '', contacto_nombre: '', contacto_email: '', contacto_telefono: '', ubicacion: '', origen: '', banco: '', cuenta: '', cci: '', cuenta_detraccion: '', lat: null as number | null, lng: null as number | null };

export function ClientesMaestro({ clientes, countCot, countProy }: { clientes: any[]; countCot: Record<string, number>; countProy: Record<string, number> }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<typeof VACIO | null>(null);
  const [imp, setImp] = useState(false);
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [impMsg, setImpMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return clientes;
    return clientes.filter((c) => `${c.razon_social} ${c.ruc_dni ?? ''} ${c.contacto_nombre ?? ''}`.toLowerCase().includes(s));
  }, [q, clientes]);

  async function guardar() {
    if (!edit) return;
    setBusy(true); setError(null);
    const res = await guardarCliente(edit as any);
    setBusy(false);
    if (!res.ok) { setError(res.error ?? 'Error'); return; }
    setEdit(null); router.refresh();
  }

  async function importar() {
    setBusy(true); setImpMsg(null);
    const res = await importarClientes(raw);
    setBusy(false);
    if (!res.ok) { setImpMsg(res.error ?? 'Error'); return; }
    setImpMsg(`Importados ${res.insertados ?? 0} · duplicados ${res.duplicados ?? 0}`);
    setRaw(''); router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por razón social, RUC o contacto…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setImp(true); setImpMsg(null); }}><Upload /> Importar</Button>
          <Button variant="gradient" onClick={() => { setEdit({ ...VACIO }); setError(null); }}><Plus /> Nuevo cliente</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-6"><EmptyState icon={<Building2 className="size-10" />} titulo="Sin clientes" descripcion="Registra tu cartera o impórtala desde Excel." /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Razón social</TableHead><TableHead>RUC/DNI</TableHead><TableHead>Contacto</TableHead><TableHead>Origen</TableHead><TableHead>Cotiz.</TableHead><TableHead>Proy.</TableHead><TableHead></TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.razon_social}</TableCell>
                    <TableCell className="text-muted-foreground">{c.ruc_dni ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{c.contacto_nombre ?? '—'}{c.contacto_telefono ? ` · ${c.contacto_telefono}` : ''}</TableCell>
                    <TableCell>{c.origen ? <Badge variant="outline">{c.origen}</Badge> : '—'}</TableCell>
                    <TableCell>{countCot[c.id] ?? 0}</TableCell>
                    <TableCell>{countProy[c.id] ?? 0}</TableCell>
                    <TableCell><Button size="icon" variant="ghost" onClick={() => { setEdit({ id: c.id, razon_social: c.razon_social, tipo_doc: c.tipo_doc ?? 'RUC', ruc_dni: c.ruc_dni ?? '', contacto_nombre: c.contacto_nombre ?? '', contacto_email: c.contacto_email ?? '', contacto_telefono: c.contacto_telefono ?? '', ubicacion: c.ubicacion ?? '', origen: c.origen ?? '', banco: (c as any).banco ?? '', cuenta: (c as any).cuenta ?? '', cci: (c as any).cci ?? '', cuenta_detraccion: (c as any).cuenta_detraccion ?? '', lat: c.lat ?? null, lng: c.lng ?? null }); setError(null); }}><Pencil className="size-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Editar cliente' : 'Nuevo cliente'}
        footer={<><Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button><Button variant="gradient" disabled={busy || !edit?.razon_social} onClick={guardar}>{busy ? <Loader2 className="animate-spin" /> : null} Guardar</Button></>}>
        {edit && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Razón social" required className="sm:col-span-2"><Input value={edit.razon_social} onChange={(e) => setEdit({ ...edit, razon_social: e.target.value })} /></Field>
            <Field label="Tipo doc"><Select value={edit.tipo_doc} onChange={(e) => setEdit({ ...edit, tipo_doc: e.target.value })}><option>RUC</option><option>DNI</option><option>CE</option></Select></Field>
            <Field label="RUC / DNI" hint={edit.tipo_doc === 'RUC' ? '11 dígitos' : edit.tipo_doc === 'DNI' ? '8 dígitos' : ''}>
              <Input inputMode="numeric" maxLength={edit.tipo_doc === 'DNI' ? 8 : 11} value={edit.ruc_dni} onChange={(e) => setEdit({ ...edit, ruc_dni: soloDigitos(e.target.value) })} />
            </Field>
            <Field label="Contacto"><Input value={edit.contacto_nombre} onChange={(e) => setEdit({ ...edit, contacto_nombre: e.target.value })} /></Field>
            <Field label="Teléfono"><Input inputMode="tel" maxLength={15} value={edit.contacto_telefono} onChange={(e) => setEdit({ ...edit, contacto_telefono: soloDigitos(e.target.value) })} /></Field>
            <Field label="Email"><Input type="email" value={edit.contacto_email} onChange={(e) => setEdit({ ...edit, contacto_email: e.target.value })} /></Field>
            <Field label="Origen"><Select value={edit.origen} onChange={(e) => setEdit({ ...edit, origen: e.target.value })}><option value="">—</option><option value="directo">Contacto directo</option><option value="recomendacion">Recomendación</option><option value="oficina">Visita a oficina</option><option value="llamada">Llamada/reunión</option></Select></Field>
            <Field label="Ubicación (referencial)" hint="Dirección o referencia en texto libre." className="sm:col-span-2"><Input value={edit.ubicacion} onChange={(e) => setEdit({ ...edit, ubicacion: e.target.value })} /></Field>
            <Field label="Banco"><Input value={edit.banco} onChange={(e) => setEdit({ ...edit, banco: e.target.value })} /></Field>
            <Field label="Cuenta"><Input value={edit.cuenta} onChange={(e) => setEdit({ ...edit, cuenta: e.target.value })} /></Field>
            <Field label="CCI"><Input value={edit.cci} onChange={(e) => setEdit({ ...edit, cci: e.target.value })} /></Field>
            <Field label="Cuenta de detracción"><Input value={edit.cuenta_detraccion} onChange={(e) => setEdit({ ...edit, cuenta_detraccion: e.target.value })} placeholder="Banco de la Nación" /></Field>
            {error && <p className="text-sm text-azur-700 sm:col-span-2">{error}</p>}
          </div>
        )}
      </Modal>

      <Modal open={imp} onClose={() => setImp(false)} title="Importación masiva de clientes"
        description="Pega filas (una por línea): Razón social, RUC/DNI, Contacto — separadas por tab, coma o punto y coma. Detecta duplicados por RUC."
        footer={<><Button variant="outline" onClick={() => setImp(false)}>Cerrar</Button><Button variant="gradient" disabled={busy || !raw.trim()} onClick={importar}>{busy ? <Loader2 className="animate-spin" /> : <Upload />} Importar</Button></>}>
        <Textarea rows={8} value={raw} onChange={(e) => setRaw(e.target.value)} placeholder={'ADECCO PERU S.A.\t20382984537\tÁrea de Infraestructura\nMERCER PERÚ S.A.C.\t20509998881\tFacilities'} />
        {impMsg && <p className="mt-2 text-sm text-emerald-600">{impMsg}</p>}
      </Modal>
    </div>
  );
}
