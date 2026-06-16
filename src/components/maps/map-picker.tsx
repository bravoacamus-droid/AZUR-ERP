'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/misc';
import type { MapPickerProps } from './map-picker.client';

export type { MapPickerValue, MapPickerProps } from './map-picker.client';

// react-leaflet rompe en SSR: cargamos el mapa real solo en cliente.
const MapPickerClient = dynamic(() => import('./map-picker.client'), {
  ssr: false,
  loading: () => <Skeleton className="h-[280px] w-full rounded-xl" />,
});

export function MapPicker(props: MapPickerProps) {
  return <MapPickerClient {...props} />;
}

export default MapPicker;
