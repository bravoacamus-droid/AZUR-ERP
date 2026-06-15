import { fmtMoney } from '@/lib/format';
import {
  type DashboardProyecto,
  saludGlobal,
  SALUD_COLOR,
  SALUD_LABEL,
} from '@/lib/salud';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// Dashboard estrella (Sección 6.1): una sola barra con tres tramos superpuestos
// — PROYECTADO (referencia), PAGOS/ABONOS y GASTO.
export function BarraTresTramos({ p }: { p: DashboardProyecto }) {
  const max = Math.max(p.proyectado, p.pagos, p.gasto, 1);
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
  const salud = saludGlobal(p);
  const saludVariant = salud === 'ok' ? 'success' : salud === 'advertencia' ? 'warning' : 'danger';

  return (
    <Link
      href={`/proyectos/${p.proyecto_id}`}
      className="block rounded-xl border bg-white p-4 transition-shadow hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{p.nombre}</p>
          <p className="text-xs text-muted-foreground">{p.codigo}</p>
        </div>
        <Badge variant={saludVariant as never}>{SALUD_LABEL[salud]}</Badge>
      </div>

      <div className="space-y-2">
        {/* Proyectado (referencia, fondo) */}
        <Bar label="Proyectado" value={p.proyectado} width="100%" color="#cbd5e1" />
        {/* Pagos / abonos */}
        <Bar label="Pagos / abonos" value={p.pagos} width={pct(p.pagos)} color="#0ea5e9" />
        {/* Gasto */}
        <Bar label="Gasto" value={p.gasto} width={pct(p.gasto)} color={SALUD_COLOR[salud]} />
      </div>
    </Link>
  );
}

function Bar({ label, value, width, color }: { label: string; value: number; width: string; color: string }) {
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{fmtMoney(value)}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full transition-all" style={{ width, backgroundColor: color }} />
      </div>
    </div>
  );
}
