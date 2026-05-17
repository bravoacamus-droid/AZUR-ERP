import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const url = new URL(req.url);
  const tipo = url.searchParams.get('tipo') ?? 'mensual'; // semanal | quincenal | mensual

  // Rango
  const now = new Date();
  let inicio: Date;
  if (tipo === 'semanal') {
    inicio = new Date(now);
    inicio.setDate(now.getDate() - 7);
  } else if (tipo === 'quincenal') {
    inicio = new Date(now);
    inicio.setDate(now.getDate() - 15);
  } else {
    inicio = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const inicioISO = inicio.toISOString().slice(0, 10);
  const finISO = now.toISOString().slice(0, 10);

  const { data: solicitudes } = await supabase
    .from('solicitudes_pago')
    .select('codigo, concepto, beneficiario, categoria, urgencia, estado, monto, moneda, created_at, proyecto:proyecto_id(codigo, nombre)')
    .gte('created_at', `${inicioISO}T00:00:00Z`)
    .lte('created_at', `${finISO}T23:59:59Z`)
    .order('created_at', { ascending: false });

  const { data: pagos } = await supabase
    .from('pagos')
    .select('codigo, monto, moneda, fecha_programada, fecha_ejecutado, banco_origen, numero_operacion, solicitud:solicitud_id(codigo, concepto, beneficiario)')
    .gte('fecha_programada', inicioISO)
    .lte('fecha_programada', finISO)
    .order('fecha_programada', { ascending: false });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'AZUR ERP';
  wb.created = new Date();

  // Hoja Solicitudes
  const wsSol = wb.addWorksheet('Solicitudes', {
    headerFooter: { oddHeader: '&L&BAZUR&R&BReporte ' + tipo + ' ' + inicioISO + ' a ' + finISO },
  });
  wsSol.columns = [
    { header: 'Código', key: 'codigo', width: 18 },
    { header: 'Proyecto', key: 'proyecto', width: 28 },
    { header: 'Concepto', key: 'concepto', width: 36 },
    { header: 'Beneficiario', key: 'beneficiario', width: 28 },
    { header: 'Categoría', key: 'categoria', width: 16 },
    { header: 'Urgencia', key: 'urgencia', width: 12 },
    { header: 'Estado', key: 'estado', width: 16 },
    { header: 'Monto', key: 'monto', width: 14, style: { numFmt: '#,##0.00' } },
    { header: 'Moneda', key: 'moneda', width: 8 },
    { header: 'Creado', key: 'created_at', width: 18 },
  ];
  (solicitudes ?? []).forEach((s) => {
    const p = Array.isArray(s.proyecto) ? s.proyecto[0] : s.proyecto;
    wsSol.addRow({
      codigo: s.codigo,
      proyecto: p ? `${p.codigo} ${p.nombre}` : '',
      concepto: s.concepto,
      beneficiario: s.beneficiario,
      categoria: s.categoria,
      urgencia: s.urgencia,
      estado: s.estado,
      monto: Number(s.monto),
      moneda: s.moneda,
      created_at: new Date(s.created_at).toLocaleString('es-PE'),
    });
  });
  wsSol.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  wsSol.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFBE1723' },
  };
  wsSol.autoFilter = { from: 'A1', to: 'J1' };

  // Hoja Pagos
  const wsPag = wb.addWorksheet('Pagos');
  wsPag.columns = [
    { header: 'Código', key: 'codigo', width: 18 },
    { header: 'Solicitud', key: 'solicitud', width: 18 },
    { header: 'Concepto', key: 'concepto', width: 36 },
    { header: 'Beneficiario', key: 'beneficiario', width: 28 },
    { header: 'Programado', key: 'programado', width: 14 },
    { header: 'Ejecutado', key: 'ejecutado', width: 14 },
    { header: 'Banco', key: 'banco', width: 16 },
    { header: 'N° Op.', key: 'op', width: 18 },
    { header: 'Monto', key: 'monto', width: 14, style: { numFmt: '#,##0.00' } },
    { header: 'Moneda', key: 'moneda', width: 8 },
  ];
  (pagos ?? []).forEach((p) => {
    const s = Array.isArray(p.solicitud) ? p.solicitud[0] : p.solicitud;
    wsPag.addRow({
      codigo: p.codigo,
      solicitud: s?.codigo ?? '',
      concepto: s?.concepto ?? '',
      beneficiario: s?.beneficiario ?? '',
      programado: p.fecha_programada,
      ejecutado: p.fecha_ejecutado ?? '',
      banco: p.banco_origen ?? '',
      op: p.numero_operacion ?? '',
      monto: Number(p.monto),
      moneda: p.moneda,
    });
  });
  wsPag.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  wsPag.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFBE1723' },
  };
  wsPag.autoFilter = { from: 'A1', to: 'J1' };

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="azur-reporte-${tipo}-${finISO}.xlsx"`,
      'Cache-Control': 'private, no-cache',
    },
  });
}
