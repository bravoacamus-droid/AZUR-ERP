import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';
import {
  type RolSistema,
  ROL_DEFAULT_HOME,
  isErpRoute,
  isPwaRoute,
  isAuthRoute,
  canAccessRoute,
} from '@/lib/auth/roles';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { pathname } = request.nextUrl;

  // Rutas públicas (assets, api de auth callback, voucher público)
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/voucher/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/api/public') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/sw.js' ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|js|css|woff2?)$/);

  if (isPublic) return supabaseResponse;

  const { data: { user } } = await supabase.auth.getUser();

  // No autenticado → redirige a login (excepto rutas de auth)
  if (!user) {
    if (isAuthRoute(pathname)) return supabaseResponse;
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Autenticado y en página de auth → redirige al home del rol
  if (isAuthRoute(pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();
    const rol = (profile?.rol as RolSistema | undefined) ?? 'residente';
    const home = request.nextUrl.clone();
    home.pathname = ROL_DEFAULT_HOME[rol];
    home.search = '';
    return NextResponse.redirect(home);
  }

  // Verifica rol vs ruta (ERP vs PWA)
  if (isErpRoute(pathname) || isPwaRoute(pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol, activo')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.activo) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('error', 'inactive');
      return NextResponse.redirect(loginUrl);
    }

    const rol = profile.rol as RolSistema;
    if (!canAccessRoute(rol, pathname)) {
      const home = request.nextUrl.clone();
      home.pathname = ROL_DEFAULT_HOME[rol];
      home.search = '';
      return NextResponse.redirect(home);
    }
  }

  return supabaseResponse;
}
