'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { agregarCuentaBancaria, eliminarCuentaBancaria } from '@/app/(erp)/catalogos/actions';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Gestiona múltiples cuentas bancarias de un proveedor/contratista o cliente.
export function CuentasBancarias({ contraparteId, clienteId }: { contraparteId?: string; clienteId?: string }) {
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ banco: '', cuenta: '', cci: '', moneda: 'PEN', es_detraccion: false });

  const cargar = useCallback(async () => {
    const supabase = createClient();
    let q = supabase.from('cuentas_bancarias').select('*');
    q = contraparteId ? q.eq('contraparte_id', contraparteId) : q.eq('cliente_id', clienteId!);
    const { data } = await q.order('created_at');
    setCuentas(data ?? []);
  }, [contraparteId, clienteId]);

  useEffect(() => { void cargar(); }, [cargar]);

  async function agregar() {
    if (!f.banco.trim()) return;
    setBusy(true);
    await agregarCuentaBancaria({ contraparte_id: contraparteId, cliente_id: clienteId, ...f });
    setF({ banco: '', cuenta: '', cci: '', moneda: 'PEN', es_detraccion: false });
    await cargar();
    setBusy(false);
  }
  async function borrar(id: string) { setBusy(true); await eliminarCuentaBancaria(id); await cargar(); setBusy(false); }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cuentas bancarias adicionales</p>
      {cuentas.length === 0 && <p className="text-xs text-muted-foreground">Aún no hay cuentas adicionales registradas.</p>}
      {cuentas.map((c) => (
        <div key={c.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
          <div>
            <p className="font-medium">{c.banco} <span className="text-xs font-normal text-muted-foreground">({c.moneda})</span> {c.es_detraccion && <Badge variant="warning" className="ml-1">Detracción</Badge>}</p>
            <p className="text-xs text-muted-foreground tabular-nums">{c.cuenta ?? '—'}{c.cci ? ` · CCI ${c.cci}` : ''}</p>
          </div>
          <button type="button" onClick={() => borrar(c.id)} disabled={busy} className="text-muted-foreground hover:text-azur-600"><Trash2 className="size-4" /></button>
        </div>
      ))}
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-dashed p-2">
        <Input placeholder="Banco" value={f.banco} onChange={(e) => setF({ ...f, banco: e.target.value })} />
        <Select value={f.moneda} onChange={(e) => setF({ ...f, moneda: e.target.value })}><option value="PEN">Soles</option><option value="USD">Dólares</option></Select>
        <Input placeholder="N° de cuenta" value={f.cuenta} onChange={(e) => setF({ ...f, cuenta: e.target.value })} />
        <Input placeholder="CCI" value={f.cci} onChange={(e) => setF({ ...f, cci: e.target.value })} />
        <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-azur-600" checked={f.es_detraccion} onChange={(e) => setF({ ...f, es_detraccion: e.target.checked })} /> Cuenta de detracción</label>
        <div className="col-span-2 flex justify-end">
          <Button type="button" size="sm" variant="outline" disabled={busy || !f.banco.trim()} onClick={agregar}>{busy ? <Loader2 className="animate-spin" /> : <Plus />} Agregar cuenta</Button>
        </div>
      </div>
    </div>
  );
}
