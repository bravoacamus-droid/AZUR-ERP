import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * - _next/static, _next/image
     * - favicon, archivos estáticos comunes
     */
    '/((?!_next/static|_next/image|favicon.ico|sw-push.js|sw.js|workbox-.*|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|json)$).*)',
  ],
};
