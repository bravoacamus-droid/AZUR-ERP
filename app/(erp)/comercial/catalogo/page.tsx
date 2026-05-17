import Link from 'next/link';
import { Briefcase, Calculator, Layers, Package, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { formatPEN } from '@/lib/utils';
import { INSUMO_CATEGORIA_LABEL, INSUMO_CATEGORIA_VARIANT } from '@/lib/comercial/estados';

export const metadata = { title: 'Catálogo' };

export default async function CatalogoPage() {
  await requireSession();
  const supabase = createClient();

  const [{ data: insumos, count: insumosCount }, { data: partidas, count: partidasCount }, { count: cuadrillasCount }] =
    await Promise.all([
      supabase
        .from('insumos_maestros')
        .select('id, codigo, descripcion, categoria, unidad, precio_unit, moneda', { count: 'exact' })
        .eq('activo', true)
        .order('codigo')
        .limit(30),
      supabase
        .from('partidas_maestras')
        .select('id, codigo, descripcion, unidad, rendimiento', { count: 'exact' })
        .eq('activo', true)
        .order('codigo')
        .limit(30),
      supabase.from('cuadrillas').select('id', { count: 'exact', head: true }).eq('activo', true),
    ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Catálogo maestro"
        description="Insumos, partidas y cuadrillas reutilizables entre todas las cotizaciones."
        icon={Briefcase}
        breadcrumbs={[{ label: 'Comercial' }, { label: 'Catálogo' }]}
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={Package} label="Insumos" value={insumosCount ?? 0} href="#insumos" />
        <KpiCard icon={Layers} label="Partidas maestras" value={partidasCount ?? 0} href="#partidas" />
        <KpiCard icon={Users} label="Cuadrillas" value={cuadrillasCount ?? 0} href="/comercial/catalogo" />
      </div>

      {/* Insumos */}
      <section id="insumos" className="azur-card p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-azur-ink">Insumos</h2>
            <p className="text-xs text-muted-foreground">Mano de obra, materiales, equipos y otros — precios referenciales</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-azur-coral/10 text-left text-xs uppercase tracking-wider text-azur-red">
              <tr>
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Descripción</th>
                <th className="px-4 py-3 font-semibold">Categoría</th>
                <th className="px-4 py-3 font-semibold">Und</th>
                <th className="px-4 py-3 text-right font-semibold">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {(insumos ?? []).map((i) => (
                <tr key={i.id} className="hover:bg-azur-coral/5">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-azur-red">{i.codigo}</td>
                  <td className="px-4 py-2.5 text-azur-ink">{i.descripcion}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={INSUMO_CATEGORIA_VARIANT[i.categoria] ?? 'default'}>
                      {INSUMO_CATEGORIA_LABEL[i.categoria] ?? i.categoria}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{i.unidad}</td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {i.moneda === 'USD'
                      ? `$ ${Number(i.precio_unit).toFixed(2)}`
                      : formatPEN(Number(i.precio_unit))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border/60 px-6 py-3 text-xs text-muted-foreground">
          Mostrando {insumos?.length ?? 0} de {insumosCount ?? 0} insumos. Próximamente: editor in-line, importar/exportar Excel y actualización masiva de precios.
        </p>
      </section>

      {/* Partidas maestras */}
      <section id="partidas" className="azur-card p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-azur-ink">Partidas maestras</h2>
            <p className="text-xs text-muted-foreground">
              Plantillas reusables que puedes copiar a una cotización (con su APU)
            </p>
          </div>
          <Link href="/comercial/apu" className="text-xs font-semibold text-azur-red hover:underline">
            Ir al editor APU →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-azur-coral/10 text-left text-xs uppercase tracking-wider text-azur-red">
              <tr>
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Descripción</th>
                <th className="px-4 py-3 font-semibold">Und</th>
                <th className="px-4 py-3 text-right font-semibold">Rendimiento / día</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {(partidas ?? []).map((p) => (
                <tr key={p.id} className="hover:bg-azur-coral/5">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-azur-red">{p.codigo}</td>
                  <td className="px-4 py-2.5 text-azur-ink">{p.descripcion}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{p.unidad}</td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {p.rendimiento ? Number(p.rendimiento).toLocaleString('es-PE') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Calculator;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="azur-card group flex items-start gap-4 transition-all hover:-translate-y-0.5 hover:shadow-azur-md"
    >
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-azur-coral/20 text-azur-red transition-colors group-hover:bg-azur-red group-hover:text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold text-azur-ink">{value}</p>
      </div>
    </Link>
  );
}
