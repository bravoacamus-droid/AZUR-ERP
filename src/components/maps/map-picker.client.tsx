'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Arreglo del bug clásico de iconos de Leaflet en bundlers (los iconos no se ven).
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export interface MapPickerValue {
  lat: number | null;
  lng: number | null;
}

export interface MapPickerProps {
  value?: MapPickerValue;
  onChange: (lat: number, lng: number, direccion?: string) => void;
}

interface Resultado {
  display_name: string;
  lat: number;
  lon: number;
}

const LIMA: [number, number] = [-12.0464, -77.0428];

// ── Geocodificación ─────────────────────────────────────────────────────
// 1) Photon (komoot): búsqueda difusa tipo Google — tolera nombres de edificio,
//    mayúsculas y abreviaturas ("EL DERBY 055, TORRE CRONOS SURCO"); se sesga
//    a Lima y se filtra a Perú.
// 2) Respaldo Nominatim: con la consulta completa y, si no hay resultados,
//    con versiones simplificadas (sin "torre/piso/oficina…" ni tramos sobrantes).
type PhotonFeature = { geometry: { coordinates: [number, number] }; properties: Record<string, string | undefined> };

function etiquetaPhoton(p: PhotonFeature['properties']): string {
  const calle = [p.street, p.housenumber].filter(Boolean).join(' ');
  const partes = [p.name && p.name !== p.street ? p.name : null, calle || null, p.district || p.locality, p.city, p.state];
  return [...new Set(partes.filter(Boolean) as string[])].join(', ');
}

async function buscarPhoton(q: string, centro: [number, number]): Promise<Resultado[]> {
  const url = `https://photon.komoot.io/api/?limit=8&lang=default&lat=${centro[0]}&lon=${centro[1]}&q=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('photon');
  const data: { features?: PhotonFeature[] } = await res.json();
  return (data.features ?? [])
    .filter((f) => (f.properties.countrycode ?? '').toUpperCase() === 'PE')
    .slice(0, 6)
    .map((f) => ({ display_name: etiquetaPhoton(f.properties), lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] }));
}

async function buscarNominatim(q: string): Promise<Resultado[]> {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=pe&accept-language=es&q=' + encodeURIComponent(q);
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('nominatim');
  const data: { display_name: string; lat: string; lon: string }[] = await res.json();
  return data.map((r) => ({ display_name: r.display_name, lat: parseFloat(r.lat), lon: parseFloat(r.lon) }));
}

// Variantes cada vez más simples de la dirección escrita.
function variantes(q: string): string[] {
  const limpia = q
    .replace(/\b(torre|edificio|edif\.?|piso|oficina|of\.?|dpto\.?|departamento|int\.?|interior|mz\.?|lote|lt\.?)\s+[\w-]+/gi, ' ')
    .replace(/\s{2,}/g, ' ').replace(/\s+,/g, ',').trim();
  const tramos = limpia.split(',').map((t) => t.trim()).filter(Boolean);
  const out = [q, limpia];
  if (tramos.length > 2) out.push([tramos[0], tramos[tramos.length - 1]].join(', '));
  if (tramos.length > 1) out.push(tramos[0]);
  return [...new Set(out.filter((x) => x.length >= 3))];
}

export async function geocodificar(q: string, centro: [number, number] = LIMA): Promise<Resultado[]> {
  try {
    const r = await buscarPhoton(q, centro);
    if (r.length) return r;
  } catch { /* se intenta con Nominatim */ }
  for (const v of variantes(q)) {
    try {
      const r = await buscarNominatim(v);
      if (r.length) return r;
    } catch { /* siguiente variante */ }
  }
  return [];
}

// Recentra el mapa cuando cambian las coordenadas seleccionadas.
function Recenter({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], Math.max(map.getZoom(), 15), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

// Captura clicks en el mapa para colocar el marcador manualmente.
function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPickerClient({ value, onChange }: MapPickerProps) {
  const lat = value?.lat ?? null;
  const lng = value?.lng ?? null;
  const hasPoint = lat != null && lng != null;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Resultado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const reverseSeq = useRef(0);
  const searchSeq = useRef(0);
  const elegido = useRef<string | null>(null);
  const centro: [number, number] = hasPoint ? [lat!, lng!] : LIMA;

  async function buscar(texto = query, silencioso = false) {
    const q = texto.trim();
    if (!q) return;
    const seq = ++searchSeq.current;
    setBuscando(true);
    if (!silencioso) setAviso(null);
    try {
      const data = await geocodificar(q, centro);
      if (seq !== searchSeq.current) return; // llegó una búsqueda más nueva
      setResults(data);
      if (data.length === 0 && !silencioso) setAviso('Sin resultados. Revisa la dirección o marca el punto manualmente en el mapa.');
      // Búsqueda explícita con un único resultado: se ubica directo.
      if (!silencioso && data.length === 1) elegir(data[0]);
    } catch {
      if (!silencioso) setAviso('No se pudo buscar la dirección. Puedes marcar el punto manualmente en el mapa.');
    } finally {
      if (seq === searchSeq.current) setBuscando(false);
    }
  }

  // Sugerencias mientras se escribe (como Google Maps), con espera de 450 ms.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 4 || q === elegido.current) return;
    const t = setTimeout(() => { void buscar(q, true); }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function elegir(r: Resultado) {
    searchSeq.current++;
    elegido.current = r.display_name;
    setResults([]);
    setAviso(null);
    setQuery(r.display_name);
    onChange(r.lat, r.lon, r.display_name);
  }

  // Reverse geocoding al hacer click: sugiere una dirección, pero nunca bloquea.
  async function clickMapa(la: number, ln: number) {
    onChange(la, ln);
    const seq = ++reverseSeq.current;
    try {
      const url =
        'https://nominatim.openstreetmap.org/reverse?format=json&accept-language=es&lat=' +
        la +
        '&lon=' +
        ln;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return;
      const data: { display_name?: string } = await res.json();
      if (seq === reverseSeq.current && data.display_name) {
        onChange(la, ln, data.display_name);
      }
    } catch {
      /* sin red: se mantiene la ubicación manual sin dirección */
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar dirección o lugar (ej. Av. El Derby 055, Surco)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              buscar();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={() => buscar()} disabled={buscando || !query.trim()}>
          {buscando ? <Loader2 className="animate-spin" /> : <Search />} Buscar
        </Button>
      </div>

      {results.length > 0 && (
        <ul className="max-h-40 divide-y overflow-y-auto rounded-lg border bg-white text-sm">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => elegir(r)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-azur-50"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-azur-600" />
                <span className="text-foreground/90">{r.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {aviso && <p className="text-xs text-muted-foreground">{aviso}</p>}

      <div className="overflow-hidden rounded-xl border" style={{ height: 280 }}>
        <MapContainer
          center={hasPoint ? [lat!, lng!] : LIMA}
          zoom={hasPoint ? 15 : 12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onClick={clickMapa} />
          <Recenter lat={lat} lng={lng} />
          {hasPoint && <Marker position={[lat!, lng!]} />}
        </MapContainer>
      </div>

      <p className="text-xs text-muted-foreground">
        Busca una dirección o haz click en el mapa para ubicar al cliente.
        {hasPoint && ` · Lat ${lat!.toFixed(5)}, Lng ${lng!.toFixed(5)}`}
      </p>
    </div>
  );
}
