import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth';
import { SolicitudForm } from './solicitud-form';
import { MisSolicitudes } from './mis-solicitudes';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 10;

export default async function SolicitudesPage({ searchParams }: { searchParams: { estado?: string; q?: string; page?: string } }) {
  const session = await requireSession();
  const supabase = createClient() as any;

  const estado = (searchParams.estado ?? '').trim();
  const q = (searchParams.q ?? '').trim();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const desde = (page - 1) * PAGE_SIZE;

  const [{ data: proyectos }, { data: partidas }, { data: contrapartes }, { data: categorias }] = await Promise.all([
    supabase.from('proyectos').select('id, nombre').order('created_at', { ascending: false }),
    supabase.from('proyecto_items').select('id, titulo, proyecto_id').eq('es_hoja', true).order('orden'),
    supabase.from('contrapartes').select('id, razon_social, tipo, ruc_dni, banco, cuenta, cci').eq('validado', true).order('razon_social'),
    supabase.from('categorias_gasto').select('id, nombre, tipo_base').eq('activo', true).order('nombre'),
  ]);

  // Mis solicitudes con filtro por estado/búsqueda y paginación.
  let query = supabase
    .from('solicitudes_pago')
    .select('id, codigo, tipo, categoria, categoria_etapa, monto, moneda, status, beneficiario_nombre, razon_social, ruc_dni, descripcion, sustento_url, voucher_url, detraccion_monto, motivo_rechazo, fecha_programada, aprobado_at, programado_at, pagado_at, num_operacion, created_at, proyecto:proyectos(nombre)', { count: 'exact' })
    .eq('solicitado_por', session.id);
  if (estado) query = query.eq('status', estado);
  if (q) query = query.or(`codigo.ilike.%${q}%,beneficiario_nombre.ilike.%${q}%`);
  const { data: solicitudes, count } = await query.order('created_at', { ascending: false }).range(desde, desde + PAGE_SIZE - 1);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/campo" className="mb-1 inline-flex items-center text-sm text-muted-foreground">
          <ChevronLeft className="size-4" /> Campo
        </Link>
        <h1 className="text-xl font-bold">Solicitud de pago</h1>
      </div>

      <SolicitudForm proyectos={proyectos ?? []} partidas={partidas ?? []} contrapartes={contrapartes ?? []} categorias={categorias ?? []} />

      <MisSolicitudes
        solicitudes={solicitudes ?? []}
        total={count ?? 0}
        page={page}
        pageSize={PAGE_SIZE}
        estado={estado}
      />
    </div>
  );
}
