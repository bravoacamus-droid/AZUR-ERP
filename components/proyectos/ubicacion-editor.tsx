'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Crosshair, MapPin, Save, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { actualizarUbicacionProyecto } from '@/app/(erp)/proyectos/[id]/actions';

// Leaflet no funciona en SSR
const MapPicker = dynamic(
  () => import('@/components/maps/map-picker').then((m) => m.MapPicker),
  { ssr: false, loading: () => <div className="grid h-72 place-items-center rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground">Cargando mapa…</div> },
);

type Ubigeo = {
  codigo: string;
  departamento: string;
  provincia: string;
  distrito: string;
  latitud: number | null;
  longitud: number | null;
  tipo: 'departamento' | 'provincia' | 'distrito';
};

type Props = {
  proyectoId: string;
  ubigeos: Ubigeo[];
  initial: {
    ubigeo_codigo: string | null;
    departamento: string | null;
    provincia: string | null;
    distrito: string | null;
    direccion: string | null;
    ubicacion: string | null;
    latitud: number | null;
    longitud: number | null;
    radio_geofence_m: number | null;
  };
  onSaved?: () => void;
};

type Nominatim = {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    state?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    neighbourhood?: string;
    road?: string;
    house_number?: string;
  };
};

const DEFAULT_CENTER = { lat: -12.0464, lng: -77.0428 }; // Lima

const selectClass =
  'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

export function UbicacionEditor({ proyectoId, ubigeos, initial, onSaved }: Props) {
  const departamentos = useMemo(
    () => ubigeos.filter((u) => u.tipo === 'departamento').sort((a, b) => a.departamento.localeCompare(b.departamento)),
    [ubigeos],
  );

  const [departamento, setDepartamento] = useState(initial.departamento ?? '');
  const [provincia, setProvincia] = useState(initial.provincia ?? '');
  const [distrito, setDistrito] = useState(initial.distrito ?? '');
  const [direccion, setDireccion] = useState(initial.direccion ?? initial.ubicacion ?? '');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: Number(initial.latitud ?? DEFAULT_CENTER.lat),
    lng: Number(initial.longitud ?? DEFAULT_CENTER.lng),
  });
  const [radio, setRadio] = useState(Number(initial.radio_geofence_m ?? 200));
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Nominatim[]>([]);
  const [pending, startTransition] = useTransition();

  // Provincias filtradas por departamento (de distritos seedeados)
  const provincias = useMemo(() => {
    const set = new Set<string>();
    for (const u of ubigeos) {
      if (u.tipo === 'distrito' && u.departamento === departamento) set.add(u.provincia);
    }
    return Array.from(set).sort();
  }, [ubigeos, departamento]);

  const distritos = useMemo(() => {
    return ubigeos
      .filter((u) => u.tipo === 'distrito' && u.departamento === departamento && u.provincia === provincia)
      .sort((a, b) => a.distrito.localeCompare(b.distrito));
  }, [ubigeos, departamento, provincia]);

  // Al cambiar dept, centra mapa en su centroide
  useEffect(() => {
    if (!departamento) return;
    const dep = departamentos.find((d) => d.departamento === departamento);
    if (dep?.latitud && dep?.longitud && !initial.latitud) {
      setCoords({ lat: Number(dep.latitud), lng: Number(dep.longitud) });
    }
    // Reset provincia si ya no es válida
    if (provincia && !provincias.includes(provincia)) setProvincia('');
    if (distrito && !distritos.find((d) => d.distrito === distrito)) setDistrito('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departamento]);

  // Al cambiar distrito, centra mapa en su coord
  function onDistritoChange(nuevo: string) {
    setDistrito(nuevo);
    const d = distritos.find((x) => x.distrito === nuevo);
    if (d?.latitud && d?.longitud) {
      setCoords({ lat: Number(d.latitud), lng: Number(d.longitud) });
    }
  }

  // Search address via Nominatim (devuelve top 5 para que el usuario elija)
  async function searchAddress() {
    const q = searchQuery.trim();
    if (q.length < 3) {
      toast.error('Escribe al menos 3 caracteres');
      return;
    }
    setSearching(true);
    setSearchResults([]);
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', q);
      url.searchParams.set('format', 'json');
      url.searchParams.set('countrycodes', 'pe');
      url.searchParams.set('limit', '5');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('accept-language', 'es');
      // Bounding box aproximado de Perú para priorizar resultados peruanos
      url.searchParams.set('viewbox', '-81.4,-0.04,-68.6,-18.4');
      url.searchParams.set('bounded', '1');
      const res = await fetch(url.toString(), {
        headers: { 'Accept-Language': 'es' },
      });
      const data = (await res.json()) as Nominatim[];
      if (!data || data.length === 0) {
        toast.error('No se encontró esa dirección. Intenta con menos detalle (ej. solo calle + distrito).');
        return;
      }
      setSearchResults(data);
      // Si solo hay 1 resultado, aplicar directo
      if (data.length === 1) {
        applyResult(data[0]!);
      }
    } catch {
      toast.error('Error al buscar (verifica tu conexión)');
    } finally {
      setSearching(false);
    }
  }

  function applyResult(r: Nominatim) {
    setCoords({ lat: Number(r.lat), lng: Number(r.lon) });
    if (!direccion) setDireccion(r.display_name);
    // Auto-fill ubigeo si el address tiene esa info
    const addr = r.address;
    if (addr?.state && !departamento) {
      const match = departamentos.find((d) =>
        d.departamento.toLowerCase().includes(addr.state!.toLowerCase()),
      );
      if (match) setDepartamento(match.departamento);
    }
    setSearchResults([]);
    toast.success('Ubicación aplicada — ajusta el marcador si es necesario');
  }

  function save() {
    const fd = new FormData();
    fd.set('proyecto_id', proyectoId);
    const sel = distritos.find((d) => d.distrito === distrito);
    if (sel?.codigo) fd.set('ubigeo_codigo', sel.codigo);
    fd.set('departamento', departamento);
    fd.set('provincia', provincia);
    fd.set('distrito', distrito);
    fd.set('direccion', direccion);
    fd.set('latitud', String(coords.lat));
    fd.set('longitud', String(coords.lng));
    fd.set('radio_geofence_m', String(radio));
    startTransition(async () => {
      try {
        await actualizarUbicacionProyecto(fd);
        toast.success('Ubicación guardada');
        onSaved?.();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al guardar';
        toast.error(msg);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="space-y-1.5">
        <Label htmlFor="search">Buscar dirección</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  searchAddress();
                }
              }}
              placeholder="Ej. Av. Javier Prado 1234, San Isidro"
              className="pl-10"
            />
          </div>
          <Button type="button" onClick={searchAddress} loading={searching}>
            Buscar
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Busca por dirección o referencia. Solo Perú. Powered by OpenStreetMap. Si el resultado no
          es exacto, ajusta el marcador en el mapa con la mano.
        </p>

        {searchResults.length > 1 && (
          <div className="rounded-xl border border-azur-coral/40 bg-azur-coral/5 p-2">
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-azur-red">
              {searchResults.length} resultados — elige el correcto
            </p>
            <ul className="space-y-1">
              {searchResults.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => applyResult(r)}
                    className="w-full rounded-lg border border-transparent bg-white p-2 text-left text-xs transition-colors hover:border-azur-red hover:bg-azur-coral/10"
                  >
                    <p className="line-clamp-2 font-medium text-azur-ink">{r.display_name}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {Number(r.lat).toFixed(5)}, {Number(r.lon).toFixed(5)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Ubigeo */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="dept">Departamento</Label>
          <select
            id="dept"
            value={departamento}
            onChange={(e) => setDepartamento(e.target.value)}
            className={selectClass}
          >
            <option value="">— Selecciona —</option>
            {departamentos.map((d) => (
              <option key={d.codigo} value={d.departamento}>
                {d.departamento}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="prov">Provincia</Label>
          {provincias.length > 0 ? (
            <select
              id="prov"
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              className={selectClass}
            >
              <option value="">— Selecciona —</option>
              {provincias.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id="prov"
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              placeholder="Escribe provincia"
            />
          )}
        </div>
        <div>
          <Label htmlFor="dist">Distrito</Label>
          {distritos.length > 0 ? (
            <select
              id="dist"
              value={distrito}
              onChange={(e) => onDistritoChange(e.target.value)}
              className={selectClass}
            >
              <option value="">— Selecciona —</option>
              {distritos.map((d) => (
                <option key={d.codigo} value={d.distrito}>
                  {d.distrito}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id="dist"
              value={distrito}
              onChange={(e) => setDistrito(e.target.value)}
              placeholder="Escribe distrito"
            />
          )}
        </div>
      </div>

      {/* Dirección */}
      <div>
        <Label htmlFor="direccion">Dirección de obra</Label>
        <Input
          id="direccion"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          placeholder="Av. / Jr. / Calle, número, referencia"
        />
      </div>

      {/* Mapa */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-azur-red" />
            Ubicación exacta en el mapa
          </Label>
          <p className="font-mono text-[11px] text-muted-foreground">
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </p>
        </div>
        <MapPicker value={coords} onChange={setCoords} radioMetros={radio} />
        <p className="text-[11px] text-muted-foreground">
          Click en el mapa o arrastra el marcador. El círculo rojo muestra el radio de geofence
          para validar los check-in del residente.
        </p>
      </div>

      {/* Radio geofence */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="radio">Radio geofence (metros)</Label>
          <Input
            id="radio"
            type="number"
            min={50}
            max={2000}
            step={10}
            value={radio}
            onChange={(e) => setRadio(Number(e.target.value))}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Los check-in dentro de este radio se marcan como "en obra".
          </p>
        </div>
        <div className="sm:col-span-2 flex items-end justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (!navigator.geolocation) {
                toast.error('GPS no disponible');
                return;
              }
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                  toast.success('Posición actualizada con tu GPS');
                },
                () => toast.error('No se pudo obtener tu GPS'),
                { enableHighAccuracy: true, timeout: 10000 },
              );
            }}
          >
            <Crosshair className="h-4 w-4" />
            Usar mi GPS
          </Button>
          <Button type="button" onClick={save} loading={pending}>
            <Save className="h-4 w-4" />
            Guardar ubicación
          </Button>
        </div>
      </div>
    </div>
  );
}
