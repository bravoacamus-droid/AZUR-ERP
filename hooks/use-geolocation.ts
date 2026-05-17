'use client';

import { useCallback, useState } from 'react';

export type GeoFix = {
  latitud: number;
  longitud: number;
  precision_metros: number;
  timestamp: number;
};

export type GeoError = {
  code: number;
  message: string;
};

/**
 * Hook reusable para obtener la posición GPS actual del dispositivo.
 * No corre permanentemente — el usuario invoca request() al pulsar el botón.
 */
export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [fix, setFix] = useState<GeoFix | null>(null);
  const [error, setError] = useState<GeoError | null>(null);

  const request = useCallback(() => {
    return new Promise<GeoFix>((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        const err = { code: 0, message: 'Tu navegador no soporta geolocalización' };
        setError(err);
        reject(err);
        return;
      }
      setLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next: GeoFix = {
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude,
            precision_metros: pos.coords.accuracy,
            timestamp: pos.timestamp,
          };
          setFix(next);
          setLoading(false);
          resolve(next);
        },
        (err) => {
          const e = { code: err.code, message: err.message };
          setError(e);
          setLoading(false);
          reject(e);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });
  }, []);

  return { request, loading, fix, error };
}
