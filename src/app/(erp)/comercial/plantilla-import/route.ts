import ExcelJS from 'exceljs';

export const runtime = 'nodejs';

const RED = 'FFE20627';
const DARK = 'FF1A1A1A';

// Plantilla brandeada (.xlsx AZUR) para importar el itemizado de una cotización.
export async function GET() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'AZUR Constructora e Inmobiliaria';
  const ws = wb.addWorksheet('Itemizado', { views: [{ state: 'frozen', ySplit: 4 }] });

  ws.getColumn(1).width = 8;
  ws.getColumn(2).width = 48;
  ws.getColumn(3).width = 10;
  ws.getColumn(4).width = 12;
  ws.getColumn(5).width = 15;
  ws.getColumn(6).width = 12;

  // Barra de título (rojo AZUR)
  ws.mergeCells('A1:F1');
  const t = ws.getCell('A1');
  t.value = 'AZUR  ·  CONSTRUCTORA E INMOBILIARIA';
  t.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED } };
  t.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(1).height = 30;

  // Subtítulo
  ws.mergeCells('A2:F2');
  const s = ws.getCell('A2');
  s.value = 'Plantilla de importación · Itemizado de cotización';
  s.font = { bold: true, size: 11, color: { argb: DARK } };
  ws.getRow(2).height = 18;

  // Instrucciones
  ws.mergeCells('A3:F3');
  const ins = ws.getCell('A3');
  ins.value = 'Completa desde la fila 5. Nivel: 1 = partida, 2 = sub partida, 3 = actividad. Solo las hojas llevan Unidad, Cantidad, Costo unitario y Margen %. Guarda y súbelo (o copia y pega) en el importador de la cotización.';
  ins.font = { size: 9, italic: true, color: { argb: 'FF666666' } };
  ins.alignment = { wrapText: true, vertical: 'middle' };
  ws.getRow(3).height = 30;

  // Cabecera (fila 4)
  const headers = ['Nivel', 'Título', 'Unidad', 'Cantidad', 'Costo unitario', 'Margen %'];
  const hr = ws.getRow(4);
  headers.forEach((h, i) => {
    const c = hr.getCell(i + 1);
    c.value = h;
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  hr.height = 20;

  // Ejemplos
  const ejemplos: (string | number)[][] = [
    [1, 'ÁREAS INTERIORES DE LA CASA', '', '', '', ''],
    [2, 'Cisterna', 'm2', 11.35, 255.08, 30],
    [2, 'Movimiento de tierras', 'm2', 146.53, 40.15, 30],
    [1, 'Mesa de trabajo en acero inoxidable', 'm2', 20, 850, 30],
  ];
  ejemplos.forEach((row) => {
    const r = ws.addRow(row);
    r.getCell(2).alignment = { indent: Number(row[0]) >= 2 ? 1 : 0 };
    r.getCell(5).numFmt = '#,##0.00';
    r.getCell(6).numFmt = '0"%"';
    r.font = { color: { argb: 'FF888888' } }; // ejemplos en gris (se reemplazan)
  });

  const buf = await wb.xlsx.writeBuffer();
  return new Response(Buffer.from(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Plantilla-cotizacion-AZUR.xlsx"',
    },
  });
}
