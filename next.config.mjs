import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  extendDefaultRuntimeCaching: false,
  workboxOptions: {
    disableDevLogs: true,
    importScripts: ['/sw-push.js'],
    runtimeCaching: [
      {
        // App shell / pages
        urlPattern: ({ request, url }) =>
          request.mode === 'navigate' && !url.pathname.startsWith('/api'),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'azur-pages',
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 },
        },
      },
      {
        // Imágenes (logo, íconos, evidencias en storage)
        urlPattern: /\.(?:png|jpg|jpeg|svg|webp|gif|ico)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'azur-images',
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      {
        // Storage de Supabase (fotos, vouchers, documentos)
        urlPattern: ({ url }) =>
          url.origin === 'https://zguodhyafasjgigzbcpi.supabase.co' &&
          url.pathname.startsWith('/storage/'),
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'azur-storage',
          expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 14 },
        },
      },
      {
        // Fuentes Google
        urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'azur-fonts',
          expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
      {
        // CSS / JS estáticos del propio dominio
        urlPattern: /\.(?:css|js|woff2?)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'azur-static',
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts', 'framer-motion'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zguodhyafasjgigzbcpi.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), geolocation=(self), microphone=()' },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
