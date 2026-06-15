import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegister } from '@/components/pwa-register';

export const metadata: Metadata = {
  title: 'AZUR ERP · Constructora e Inmobiliaria',
  description: 'ERP integral + PWA de obra para AZUR Constructora e Inmobiliaria.',
  manifest: '/manifest.webmanifest',
  applicationName: 'AZUR ERP',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AZUR ERP',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#E20627',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
