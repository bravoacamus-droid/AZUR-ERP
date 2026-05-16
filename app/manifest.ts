import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AZUR · ERP Constructora e Inmobiliaria',
    short_name: 'AZUR',
    description:
      'Plataforma integral de gestión de obra: finanzas, proyectos, comercial y app de campo.',
    start_url: '/inicio',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FFFFFF',
    theme_color: '#BE1723',
    lang: 'es-PE',
    dir: 'ltr',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-256.png', sizes: '256x256', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Check-in obra',
        short_name: 'Check-in',
        description: 'Registrar entrada con GPS',
        url: '/checkin',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Parte diario',
        short_name: 'RDO',
        description: 'Reporte diario de obra',
        url: '/rdo',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Solicitar pago',
        short_name: 'Pago',
        description: 'Nueva solicitud de pago',
        url: '/solicitudes/nueva',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
