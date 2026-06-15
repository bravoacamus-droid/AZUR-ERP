import { createClient } from '@/lib/supabase/server';
import { requireRol } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page';
import { TIPO_SOLICITUD_LABEL } from '@/lib/estados';
import { saludGlobal, type DashboardProyecto } from '@/lib/salud';
import {
  ReportesCharts,
  type LineaResultado,
  type CategoriaGasto,
  type ProyectoResultado,
} from './reportes-charts';

export const dynamic = 'force-dynamic';

const CATEGORIAS = ['contratistas', 'proveedores', 'caja_chica', 'servicios', 'honorarios'] as const;

export default async function ReportesPage() {
  await requireRol(['gerencia', 'jefe_proyectos', 'administrador', 'presupuestos']);
  const supabase = createClient();

  const [{ data: dash }, { data: lineas }, { data: sols }] = await Promise.all([
    supabase.from('v_dashboard_proyecto').select('*'),
    supabase.from('lineas_negocio').select('id, nombre, color').order('nombre'),
    supabase.from('solicitudes_pago').select('tipo, monto').in('status', ['pagada', 'conciliada']),
  ]);

  // Normalizar la vista (campos nullable) a DashboardProyecto.
  const proyectos: DashboardProyecto[] = (dash ?? []).map((d) => ({
    proyecto_id: d.proyecto_id ?? '',
    codigo: d.codigo,
    nombre: d.nombre ?? 'Sin nombre',
    linea_id: d.linea_id,
    estado: d.estado ?? '',
    tipo_proyecto: d.tipo_proyecto ?? '',
    proyectado: Number(d.proyectado ?? 0),
    pagos: Number(d.pagos ?? 0),
    gasto: Number(d.gasto ?? 0),
    valorizado: Number(d.valorizado ?? 0),
  }));

  // Estado de resultados por línea de negocio.
  const lineasResultado: LineaResultado[] = (lineas ?? []).map((l) => {
    const deLinea = proyectos.filter((p) => p.linea_id === l.id);
    return {
      linea_id: l.id,
      nombre: l.nombre,
      color: l.color,
      proyectado: deLinea.reduce((a, p) => a + p.proyectado, 0),
      pagos: deLinea.reduce((a, p) => a + p.pagos, 0),
      gasto: deLinea.reduce((a, p) => a + p.gasto, 0),
    };
  }).filter((l) => l.proyectado > 0 || l.pagos > 0 || l.gasto > 0);

  // Gasto por las 5 categorías.
  const acumulado = new Map<string, number>();
  for (const s of sols ?? []) acumulado.set(s.tipo, (acumulado.get(s.tipo) ?? 0) + Number(s.monto ?? 0));
  const categorias: CategoriaGasto[] = CATEGORIAS.map((tipo) => ({
    tipo,
    label: TIPO_SOLICITUD_LABEL[tipo] ?? tipo,
    monto: acumulado.get(tipo) ?? 0,
  }));

  // Tabla de proyectos con salud.
  const proyectosResultado: ProyectoResultado[] = proyectos.map((p) => ({
    proyecto_id: p.proyecto_id,
    codigo: p.codigo,
    nombre: p.nombre,
    proyectado: p.proyectado,
    pagos: p.pagos,
    gasto: p.gasto,
    valorizado: p.valorizado,
    salud: saludGlobal(p),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Reportería cruzada: resultados por línea de negocio, gasto por categoría y salud de proyectos."
      />
      <ReportesCharts lineas={lineasResultado} categorias={categorias} proyectos={proyectosResultado} />
    </div>
  );
}
