import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/server';
import { sendPushToUser } from '@/lib/push/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/push/test
 * Envía una notificación push de prueba al usuario logueado.
 * Requiere sesión activa y al menos 1 suscripción registrada.
 */
export async function GET() {
  const session = await requireSession();

  try {
    const result = await sendPushToUser(session.userId, {
      title: 'AZUR · Notificación de prueba',
      body: `Hola ${session.fullName ?? ''} — las push notifications están funcionando.`,
      url: '/inicio',
      tag: 'azur-test',
    });

    return NextResponse.json({
      ok: true,
      enviadas: result.sent,
      eliminadas_invalidas: result.removed,
      mensaje:
        result.sent === 0
          ? 'Sin suscripciones activas. Activa las notificaciones en /inicio desde tu celular.'
          : `Push enviada a ${result.sent} dispositivo(s).`,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
