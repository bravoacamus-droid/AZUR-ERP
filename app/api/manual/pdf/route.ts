import { NextResponse } from 'next/server';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { createElement, type ReactElement } from 'react';
import { ManualPDF } from '@/components/pdf/manual-pdf';
import { requireSession } from '@/lib/auth/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  // Solo usuarios logueados pueden descargar el manual
  await requireSession();

  const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://azur-erp.vercel.app';
  const logoUrl = `${origin}/logo.png`;

  const element = createElement(ManualPDF, { logoUrl }) as unknown as ReactElement<DocumentProps>;
  const buffer = await renderToBuffer(element);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="AZUR-ERP-Manual-Usuario.pdf"',
      'Cache-Control': 'private, no-cache',
    },
  });
}
