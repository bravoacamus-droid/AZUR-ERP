'use client';

import { useState } from 'react';
import { MapPin, LogIn, LogOut, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

export function CheckIn({ proyectos }: { proyectos: { id: string; nombre: string }[] }) {
  const [proyecto, setProyecto] = useState(proyectos[0]?.id ?? '');
  const [loading, setLoading] = useState<'checkin' | 'checkout' | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function registrar(tipo: 'checkin' | 'checkout') {
    setMsg(null);
    setLoading(tipo);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pos = await new Promise<GeolocationPosition | null>((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve(p),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    });

    const { error } = await supabase.from('asistencias').insert({
      proyecto_id: proyecto || null,
      profile_id: user?.id,
      tipo,
      lat: pos?.coords.latitude ?? null,
      lng: pos?.coords.longitude ?? null,
    });
    setLoading(null);
    setMsg(
      error
        ? 'No se pudo registrar.'
        : `${tipo === 'checkin' ? 'Entrada' : 'Salida'} registrada${pos ? ' con ubicación GPS' : ' (sin GPS)'} ✅`,
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <MapPin className="size-5 text-azur-600" />
        <p className="font-semibold">Asistencia de obra</p>
      </div>
      <Select value={proyecto} onChange={(e) => setProyecto(e.target.value)} className="mb-3">
        {proyectos.length === 0 && <option value="">Sin proyectos asignados</option>}
        {proyectos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="gradient" size="lg" disabled={loading !== null} onClick={() => registrar('checkin')}>
          {loading === 'checkin' ? <Loader2 className="animate-spin" /> : <LogIn />} Entrada
        </Button>
        <Button variant="outline" size="lg" disabled={loading !== null} onClick={() => registrar('checkout')}>
          {loading === 'checkout' ? <Loader2 className="animate-spin" /> : <LogOut />} Salida
        </Button>
      </div>
      {msg && <p className="mt-3 text-center text-sm text-emerald-600">{msg}</p>}
    </div>
  );
}
