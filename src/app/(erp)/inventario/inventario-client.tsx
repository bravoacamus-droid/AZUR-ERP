'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowLeftRight, PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field, EmptyState } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { fmtNumber, fmtDateTime } from '@/lib/format';
import { crearItem, registrarMovimiento } from './actions';

export interface ItemRow {
  id: string;
  codigo: string | null;
  nombre: string;
  unidad: string | null;
  stock: number;
  tipo: string;
}

export interface ProyectoOpt {
  id: string;
  nombre: string;
  codigo: string | null;
}

export interface MovimientoRow {
  id: string;
  tipo: string;
  cantidad: number;
  created_at: string;
  item: { codigo: string | null; nombre: string; unidad: string | null } | null;
  proyecto: { nombre: string; codigo: string | null } | null;
}

const TIPO_ITEM_LABEL: Record<string, string> = {
  herramienta: 'Herramienta',
  material: 'Material',
  consumible: 'Consumible',
};

const TIPO_ITEM_VARIANT: Record<string, 'info' | 'warning' | 'muted'> = {
  herramienta: 'info',
  material: 'warning',
  consumible: 'muted',
};

const TIPO_MOV_LABEL: Record<string, string> = {
  ingreso: 'Ingreso',
  salida: 'Salida',
  devolucion: 'Devolución',
};

const TIPO_MOV_VARIANT: Record<string, 'success' | 'danger' | 'info'> = {
  ingreso: 'success',
  salida: 'danger',
  devolucion: 'info',
};

export function InventarioClient({
  items,
  proyectos,
  movimientos,
  canEdit = true,
}: {
  items: ItemRow[];
  proyectos: ProyectoOpt[];
  movimientos: MovimientoRow[];
  canEdit?: boolean;
}) {
  const [openItem, setOpenItem] = React.useState(false);
  const [openMov, setOpenMov] = React.useState(false);

  return (
    <>
      {canEdit && (
      <div className="flex flex-wrap gap-2">
        <Button variant="gradient" onClick={() => setOpenMov(true)}>
          <ArrowLeftRight /> Registrar movimiento
        </Button>
        <Button variant="outline" onClick={() => setOpenItem(true)}>
          <Plus /> Nuevo ítem
        </Button>
      </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ítems de almacén</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState
              icon={<PackageOpen className="size-8" />}
              titulo="Sin ítems"
              descripcion="Registra el primer ítem del almacén."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-mono text-xs">{it.codigo}</TableCell>
                    <TableCell className="font-medium">{it.nombre}</TableCell>
                    <TableCell>
                      <Badge variant={TIPO_ITEM_VARIANT[it.tipo] ?? 'muted'}>
                        {TIPO_ITEM_LABEL[it.tipo] ?? it.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{it.unidad}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {fmtNumber(it.stock)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Movimientos recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {movimientos.length === 0 ? (
            <EmptyState titulo="Sin movimientos" descripcion="Aún no se registran movimientos de almacén." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ítem</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>Proyecto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {fmtDateTime(m.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={TIPO_MOV_VARIANT[m.tipo] ?? 'muted'}>
                        {TIPO_MOV_LABEL[m.tipo] ?? m.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{m.item?.nombre ?? '—'}</span>
                      {m.item?.codigo && (
                        <span className="ml-1 font-mono text-xs text-muted-foreground">{m.item.codigo}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtNumber(m.cantidad)} {m.item?.unidad ?? ''}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.proyecto ? m.proyecto.nombre : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NuevoItemModal open={openItem} onClose={() => setOpenItem(false)} />
      <MovimientoModal open={openMov} onClose={() => setOpenMov(false)} items={items} proyectos={proyectos} />
    </>
  );
}

function NuevoItemModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    codigo: '',
    nombre: '',
    unidad: '',
    tipo: 'material' as 'herramienta' | 'material' | 'consumible',
    stock: '0',
  });

  React.useEffect(() => {
    if (open) {
      setForm({ codigo: '', nombre: '', unidad: '', tipo: 'material', stock: '0' });
      setError(null);
    }
  }, [open]);

  async function submit() {
    setLoading(true);
    setError(null);
    const res = await crearItem({
      codigo: form.codigo,
      nombre: form.nombre,
      unidad: form.unidad,
      tipo: form.tipo,
      stock: Number(form.stock),
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Error');
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo ítem de almacén"
      description="Registra una herramienta, material o consumible."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="gradient" onClick={submit} disabled={loading}>
            {loading ? 'Guardando…' : 'Crear ítem'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Código" required>
          <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="INV-001" />
        </Field>
        <Field label="Tipo" required>
          <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as typeof form.tipo })}>
            <option value="herramienta">Herramienta</option>
            <option value="material">Material</option>
            <option value="consumible">Consumible</option>
          </Select>
        </Field>
        <Field label="Nombre" required className="sm:col-span-2">
          <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Taladro percutor" />
        </Field>
        <Field label="Unidad" required>
          <Input value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} placeholder="und / kg / m" />
        </Field>
        <Field label="Stock inicial">
          <Input type="number" min={0} step="any" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        </Field>
      </div>
      {error && <p className="mt-3 text-sm text-azur-600">{error}</p>}
    </Modal>
  );
}

function MovimientoModal({
  open,
  onClose,
  items,
  proyectos,
}: {
  open: boolean;
  onClose: () => void;
  items: ItemRow[];
  proyectos: ProyectoOpt[];
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    item_id: '',
    tipo: 'ingreso' as 'ingreso' | 'salida' | 'devolucion',
    cantidad: '',
    proyecto_id: '',
  });

  const requiereProyecto = form.tipo !== 'ingreso';

  React.useEffect(() => {
    if (open) {
      setForm({ item_id: items[0]?.id ?? '', tipo: 'ingreso', cantidad: '', proyecto_id: '' });
      setError(null);
    }
  }, [open, items]);

  // Si cambia a ingreso, limpiar proyecto (CHECK: ingreso ⇒ proyecto_id NULL).
  React.useEffect(() => {
    if (!requiereProyecto && form.proyecto_id) setForm((f) => ({ ...f, proyecto_id: '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiereProyecto]);

  async function submit() {
    setLoading(true);
    setError(null);
    const res = await registrarMovimiento({
      item_id: form.item_id,
      tipo: form.tipo,
      cantidad: Number(form.cantidad),
      proyecto_id: requiereProyecto ? form.proyecto_id : '',
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Error');
      return;
    }
    onClose();
    router.refresh();
  }

  const disabled =
    loading || !form.item_id || !form.cantidad || (requiereProyecto && !form.proyecto_id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar movimiento"
      description="Ingreso, salida o devolución de almacén."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="gradient" onClick={submit} disabled={disabled}>
            {loading ? 'Guardando…' : 'Registrar'}
          </Button>
        </>
      }
    >
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Primero registra al menos un ítem de almacén.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipo de movimiento" required>
            <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as typeof form.tipo })}>
              <option value="ingreso">Ingreso</option>
              <option value="salida">Salida</option>
              <option value="devolucion">Devolución</option>
            </Select>
          </Field>
          <Field label="Ítem" required>
            <Select value={form.item_id} onChange={(e) => setForm({ ...form, item_id: e.target.value })}>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.codigo} — {it.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Cantidad" required>
            <Input
              type="number"
              min={0}
              step="any"
              value={form.cantidad}
              onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
            />
          </Field>
          {requiereProyecto && (
            <Field label="Proyecto" required hint="Obligatorio para salidas y devoluciones.">
              <Select value={form.proyecto_id} onChange={(e) => setForm({ ...form, proyecto_id: e.target.value })}>
                <option value="">Seleccionar…</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo ? `${p.codigo} — ` : ''}{p.nombre}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {!requiereProyecto && (
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Los ingresos no se asocian a un proyecto (entran al stock general).
            </p>
          )}
        </div>
      )}
      {error && <p className="mt-3 text-sm text-azur-600">{error}</p>}
    </Modal>
  );
}
