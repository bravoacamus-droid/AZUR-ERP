'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  Circle,
  useMapEvents,
} from 'react-leaflet';
import { azurMarkerIcon } from './leaflet-fix';
import 'leaflet/dist/leaflet.css';

type LatLng = { lat: number; lng: number };

type Props = {
  value: LatLng;
  onChange: (next: LatLng) => void;
  radioMetros?: number;
  className?: string;
  zoom?: number;
};

/** Centra el mapa cuando el value cambia (ej. selección de ubigeo). */
function Recenter({ value }: { value: LatLng }) {
  const map = useMap();
  const prev = useRef<LatLng | null>(null);
  useEffect(() => {
    if (
      !prev.current ||
      Math.abs(prev.current.lat - value.lat) > 0.0001 ||
      Math.abs(prev.current.lng - value.lng) > 0.0001
    ) {
      map.setView([value.lat, value.lng], map.getZoom(), { animate: true });
      prev.current = value;
    }
  }, [map, value]);
  return null;
}

/** Captura clicks en el mapa y mueve el marcador. */
function ClickHandler({ onChange }: { onChange: (next: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function MapPicker({ value, onChange, radioMetros, className, zoom = 15 }: Props) {
  const center = useMemo<[number, number]>(() => [value.lat, value.lng], [value.lat, value.lng]);

  return (
    <div className={className ?? 'h-72 w-full overflow-hidden rounded-xl border border-border'}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={center}
          draggable
          icon={azurMarkerIcon}
          eventHandlers={{
            dragend(e) {
              const m = e.target as L.Marker;
              const ll = m.getLatLng();
              onChange({ lat: ll.lat, lng: ll.lng });
            },
          }}
        />
        {radioMetros && radioMetros > 0 && (
          <Circle
            center={center}
            radius={radioMetros}
            pathOptions={{ color: '#BE1723', fillColor: '#ECA4A9', fillOpacity: 0.2, weight: 2 }}
          />
        )}
        <Recenter value={value} />
        <ClickHandler onChange={onChange} />
      </MapContainer>
    </div>
  );
}
