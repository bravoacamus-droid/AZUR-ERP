'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowDownUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/misc';

type Item = { id: string; nombre: string; unidad: string | null };
type Proyecto = { id: string; nombre: string };

export function MovimientoForm({ items, proyectos }: { items: Item[]; proyectos: Proyecto[] }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<'salida' | 'devolucion'>('salida');
  const [itemId, setItemId] = useState(items[0]?.id ?? '');
  const [proyectoId, setProyectoId] = useState(proyectos[0]?.id ?? '');
  const [cantidad, setCantidad] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function onSubmit() {
    setMsg(null);
    if (!itemId) return setMsg({ type: 'err', text: 'Selecciona un ítem.' });
    if (!proyectoId) return setMsg({ type: 'err', text: 'Selecciona un proyecto.' });
    const qty = Number(cantidad);
    if (!qty || qty <= 0) return setMsg({ type: 'err', text: 'Ingresa una cantidad válida.' });

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('movimientos_almacen').insert({
      tipo,
      item_id: itemId,
      proyecto_id: proyectoId,
      cantidad: qty,
      created_by: user?.id ?? null,
    });

    setLoading(false);
    if (error) return setMsg({ type: 'err', text: 'No se pudo registrar el movimiento.' });
    setMsg({ type: 'ok', text: 'Movimiento registrado ✅' });
    setCantidad('');
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <ArrowDownUp className="size-5 text-azur-600" />
        <p className="font-semibold">Registrar movimiento</p>
      </div>

      <Field label="Tipo" required>
        <Select value={tipo} onChange={(e) => setTipo(e.target.value as 'salida' | 'devolucion')}>
          <option value="salida">Salida</option>
          <option value="devolucion">Devolución</option>
        </Select>
      </Field>

      <Field label="Ítem" required>
        <Select value={itemId} onChange={(e) => setItemId(e.target.value)}>
          {items.length === 0 && <option value="">Sin ítems</option>}
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nombre}
              {i.unidad ? ` (${i.unidad})` : ''}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Proyecto" required hint="Salida y devolución requieren proyecto.">
        <Select value={proyectoId} onChange={(e) => setProyectoId(e.target.value)}>
          {proyectos.length === 0 && <option value="">Sin proyectos</option>}
          {proyectos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Cantidad" required>
        <Input
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          placeholder="0"
        />
      </Field>

      <Button variant="gradient" size="lg" className="w-full" disabled={loading} onClick={onSubmit}>
        {loading && <Loader2 className="animate-spin" />} Registrar
      </Button>

      {msg && (
        <p className={`text-center text-sm ${msg.type === 'ok' ? 'text-emerald-600' : 'text-azur-600'}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
