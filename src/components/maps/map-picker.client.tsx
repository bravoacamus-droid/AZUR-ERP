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

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

const LIMA: [number, number] = [-12.0464, -77.0428];

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
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const reverseSeq = useRef(0);

  async function buscar() {
    const q = query.trim();
    if (!q) return;
    setBuscando(true);
    setAviso(null);
    setResults([]);
    try {
      const url =
        'https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=pe&accept-language=es&q=' +
        encodeURIComponent(q);
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('geocoder');
      const data: NominatimResult[] = await res.json();
      setResults(data);
      if (data.length === 0) setAviso('Sin resultados. Puedes marcar el punto manualmente en el mapa.');
    } catch {
      setAviso('No se pudo buscar la dirección. Puedes marcar el punto manualmente en el mapa.');
    } finally {
      setBuscando(false);
    }
  }

  function elegir(r: NominatimResult) {
    const la = parseFloat(r.lat);
    const ln = parseFloat(r.lon);
    setResults([]);
    setQuery(r.display_name);
    onChange(la, ln, r.display_name);
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
          placeholder="Buscar dirección (ej. Av. Javier Prado 123, San Isidro)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              buscar();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={buscar} disabled={buscando || !query.trim()}>
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
