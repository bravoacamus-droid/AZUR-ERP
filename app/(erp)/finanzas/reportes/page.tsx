import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Reportes financieros' };

const REPORTES = [
  {
    id: 'semanal',
    titulo: 'Reporte semanal',
    descripcion: 'Solicitudes y pagos de los últimos 7 días, con totales por proyecto y categoría.',
  },
  {
    id: 'quincenal',
    titulo: 'Reporte quincenal',
    descripcion: 'Movimientos de los últimos 15 días — ideal para sincronizar con valorizaciones.',
  },
  {
    id: 'mensual',
    titulo: 'Reporte mensual',
    descripcion: 'Todo lo registrado en el mes actual hasta hoy. Multi-proyecto.',
  },
];

export default async function ReportesPage() {
  await requireSession();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reportes financieros"
        description="Exporta consolidados a Excel con filtros y autoformato. PDFs disponibles por valorización y voucher."
        icon={FileSpreadsheet}
        breadcrumbs={[{ label: 'Finanzas' }, { label: 'Reportes' }]}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {REPORTES.map((r) => (
          <div key={r.id} className="azur-card">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-azur-coral/20 text-azur-red">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="font-display text-base font-bold text-azur-ink">{r.titulo}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{r.descripcion}</p>
            <a
              href={`/api/reportes/finanzas?tipo=${r.id}`}
              target="_blank"
              rel="noopener"
              className="mt-4 inline-block w-full"
            >
              <Button variant="default" className="w-full">
                <Download className="h-4 w-4" />
                Descargar Excel
              </Button>
            </a>
          </div>
        ))}
      </div>

      <div className="azur-card bg-azur-coral/10">
        <h3 className="font-display text-base font-bold text-azur-ink">Otros reportes disponibles</h3>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>• <strong>Valorización por proyecto</strong> (PDF formato sector): desde el detalle de cada valorización</li>
          <li>• <strong>Cotización profesional</strong> (PDF con APU): desde el detalle de cada cotización</li>
          <li>• <strong>Voucher de pago</strong> (URL pública): desde el detalle de la solicitud pagada</li>
          <li>• <strong>Dashboard ejecutivo</strong> (interactivo): /dashboard</li>
        </ul>
      </div>
    </div>
  );
}
