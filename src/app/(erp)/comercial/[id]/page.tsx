import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireRol } from '@/lib/auth';
import { CotizacionEditor } from './editor';

export const dynamic = 'force-dynamic';

export default async function CotizacionPage({ params }: { params: { id: string } }) {
  const session = await requireRol(['gerencia', 'comercial', 'presupuestos']);
  const supabase = createClient();

  const { data: cot } = await supabase
    .from('cotizaciones')
    .select('*, cliente:clientes(*), linea:lineas_negocio(*)')
    .eq('id', params.id)
    .single();
  if (!cot) notFound();

  const [{ data: items }, { data: formas }, { data: versiones }, { data: medios }, { data: apu }, { data: catalogo }] = await Promise.all([
    supabase.from('cotizacion_items').select('*').eq('cotizacion_id', params.id).order('orden'),
    supabase.from('cotizacion_formas_pago').select('*').eq('cotizacion_id', params.id).order('orden'),
    supabase.from('cotizacion_versiones').select('id, version, justificacion, created_at').eq('cotizacion_id', params.id).order('version', { ascending: false }),
    supabase.from('medios_pago_empresa').select('*').order('orden'),
    supabase.from('apu_componentes').select('*, item:cotizacion_items!inner(cotizacion_id)').eq('item.cotizacion_id', params.id).order('orden'),
    supabase.from('catalogo_partidas').select('id, codigo, descripcion, unidad, costo_referencial').order('codigo'),
  ]);

  // marca qué partidas del catálogo traen APU plantilla
  const { data: apuTpl } = await supabase.from('catalogo_apu').select('catalogo_partida_id');
  const conApu = new Set((apuTpl ?? []).map((a) => a.catalogo_partida_id));
  const catalogoConApu = (catalogo ?? []).map((c) => ({ ...c, tiene_apu: conApu.has(c.id) }));

  return (
    <div className="space-y-4">
      <Link href="/comercial" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver a cotizaciones
      </Link>
      <CotizacionEditor
        cot={cot}
        items={items ?? []}
        formas={formas ?? []}
        versiones={versiones ?? []}
        medios={medios ?? []}
        apu={apu ?? []}
        catalogo={catalogoConApu}
        userNombre={session.nombre}
        userId={session.id}
      />
    </div>
  );
}
