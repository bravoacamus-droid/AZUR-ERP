import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth';
import { TareoForm } from './tareo-form';
import { TareoList } from './tareo-list';

export const dynamic = 'force-dynamic';

export default async function TareoPage() {
  const session = await requireSession();
  const supabase = createClient() as any;
  const [{ data: proyectos }, { data: trabajadores }, { data: tareo }] = await Promise.all([
    supabase.from('proyectos').select('id, nombre').order('created_at', { ascending: false }),
    supabase.from('trabajadores').select('id, nombre, especialidad, tarifa_dia, recurrente').eq('activo', true).order('nombre'),
    supabase.from('tareo').select('id, proyecto_id, fecha, trabajador_nombre, presente, horas, horas_extra, estado, proyecto:proyectos(nombre)').eq('created_by', session.id).order('fecha', { ascending: false }).limit(200),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/campo" className="mb-1 inline-flex items-center text-sm text-muted-foreground"><ChevronLeft className="size-4" /> Campo</Link>
        <h1 className="text-xl font-bold">Tareo de cuadrilla</h1>
      </div>

      <TareoForm proyectos={proyectos ?? []} trabajadores={trabajadores ?? []} />
      <TareoList rows={tareo ?? []} proyectos={proyectos ?? []} />
    </div>
  );
}
