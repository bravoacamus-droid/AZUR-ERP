import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { LOGO_DATA_URI } from '@/lib/brand-logo';
import type { PnlRow, PnlLinea, PnlMensual } from '@/lib/pnl';

const AZUR = '#C02128';
const s = StyleSheet.create({
  page: { paddingHorizontal: 28, paddingTop: 22, paddingBottom: 42, fontSize: 8, fontFamily: 'Helvetica', color: '#1a1a1a' },
  topbar: { height: 5, backgroundColor: AZUR, borderRadius: 2, marginBottom: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: AZUR, paddingBottom: 10, marginBottom: 12 },
  logoBox: { width: 46, height: 46, backgroundColor: '#fff', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: '#eee' },
  logo: { width: 40, height: 40, objectFit: 'contain' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: AZUR },
  brandSub: { fontSize: 6.5, color: '#666', letterSpacing: 1.5 },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#1a1a1a', textAlign: 'right' },
  fecha: { fontSize: 8.5, color: '#444', textAlign: 'right', marginTop: 2, fontFamily: 'Helvetica-Bold' },
  secWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, marginTop: 12 },
  secBar: { width: 3.5, height: 12, backgroundColor: AZUR, borderRadius: 2 },
  secTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: AZUR },
  thead: { flexDirection: 'row', backgroundColor: AZUR, paddingVertical: 4, paddingHorizontal: 5 },
  th: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 7 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e5e5', paddingVertical: 4, paddingHorizontal: 5 },
  trAlt: { backgroundColor: '#fafafa' },
  trTot: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 5, backgroundColor: '#f0e6e6', borderTopWidth: 1, borderTopColor: AZUR },
  cell: { fontSize: 7.5 },
  nom: { width: '28%', fontFamily: 'Helvetica-Bold' },
  num: { width: '12%', textAlign: 'right' },
  numSm: { width: '10%', textAlign: 'right' },
  nota: { fontSize: 7, color: '#888', marginTop: 10, lineHeight: 1.4 },
  footer: { position: 'absolute', bottom: 20, left: 28, right: 28, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 6 },
  footerTxt: { fontSize: 7, color: '#999' },
  subTit: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#444', marginTop: 8, marginBottom: 3 },
});

export interface PnlPdfData {
  periodo: string; alcance: string;
  lineas: PnlLinea[]; proyectos: PnlRow[]; mensual: PnlMensual;
  fmtMoney: (n: number) => string; fmtPct: (n: number) => string;
  // Gastos de empresa (EEFF): no pasan por el flujo de obra.
  gastosEmpresa?: {
    total: number; sinLinea: number; ingresos: number; egresosObra: number; utilidadEmpresa: number;
    porLinea: { id: string; nombre: string; monto: number }[];
    filas: { id: string; fecha: string; categoria: string | null; descripcion: string | null; proyecto: string | null; monto: number }[];
  };
}

export function PnlPDF({ d }: { d: PnlPdfData }) {
  const M = d.fmtMoney, P = d.fmtPct;
  const gap = (g: number) => `${g >= 0 ? '+' : ''}${P(g)}`;
  return (
    <Document title={`Estado de resultados — ${d.alcance}`}>
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.topbar} fixed />
        <View style={s.header} fixed>
          <View style={s.brandRow}>
            <View style={s.logoBox}><Image src={LOGO_DATA_URI} style={s.logo} /></View>
            <View><Text style={s.brand}>Azur</Text><Text style={s.brandSub}>CONSTRUCTORA E INMOBILIARIA</Text></View>
          </View>
          <View>
            <Text style={s.title}>ESTADO DE RESULTADOS (P&L)</Text>
            <Text style={s.fecha}>{d.periodo} · {d.alcance}</Text>
          </View>
        </View>

        {/* Por línea */}
        <View style={s.secWrap}><View style={s.secBar} /><Text style={s.secTitle}>Por línea de negocio</Text></View>
        <View style={s.thead}>
          <Text style={[s.nom, s.th]}>LÍNEA</Text>
          <Text style={[s.num, s.th]}>COBRADO</Text><Text style={[s.num, s.th]}>GASTADO</Text>
          <Text style={[s.num, s.th]}>UTIL. REAL</Text><Text style={[s.numSm, s.th]}>% M. REAL</Text>
          <Text style={[s.numSm, s.th]}>% M. COT.</Text><Text style={[s.numSm, s.th]}>GAP</Text>
        </View>
        {d.lineas.length === 0 ? <View style={s.tr}><Text style={s.cell}>Sin datos.</Text></View> : d.lineas.map((l, i) => (
          <View key={l.linea_id} style={i % 2 === 1 ? [s.tr, s.trAlt] : s.tr} wrap={false}>
            <Text style={[s.cell, s.nom]}>{l.nombre} ({l.nProyectos})</Text>
            <Text style={[s.cell, s.num]}>{M(l.cobrado)}</Text><Text style={[s.cell, s.num]}>{M(l.gastado)}</Text>
            <Text style={[s.cell, s.num]}>{M(l.utilReal)}</Text><Text style={[s.cell, s.numSm]}>{P(l.margenRealPct)}</Text>
            <Text style={[s.cell, s.numSm]}>{P(l.margenCotPct)}</Text><Text style={[s.cell, s.numSm]}>{gap(l.gapPct)}</Text>
          </View>
        ))}

        {/* Por proyecto */}
        <View style={s.secWrap}><View style={s.secBar} /><Text style={s.secTitle}>Por proyecto</Text></View>
        <View style={s.thead}>
          <Text style={[s.nom, s.th]}>PROYECTO</Text>
          <Text style={[s.numSm, s.th]}>COBRADO</Text><Text style={[s.numSm, s.th]}>GASTADO</Text>
          <Text style={[s.numSm, s.th]}>UTIL. REAL</Text><Text style={[s.numSm, s.th]}>% M. REAL</Text>
          <Text style={[s.numSm, s.th]}>UTIL. COT.</Text><Text style={[s.numSm, s.th]}>% M. COT.</Text><Text style={[s.numSm, s.th]}>GAP</Text>
        </View>
        {d.proyectos.length === 0 ? <View style={s.tr}><Text style={s.cell}>Sin datos.</Text></View> : d.proyectos.map((p, i) => (
          <View key={p.id} style={i % 2 === 1 ? [s.tr, s.trAlt] : s.tr} wrap={false}>
            <Text style={[s.cell, s.nom]}>{p.nombre}</Text>
            <Text style={[s.cell, s.numSm]}>{M(p.cobrado)}</Text><Text style={[s.cell, s.numSm]}>{M(p.gastado)}</Text>
            <Text style={[s.cell, s.numSm]}>{M(p.utilReal)}</Text><Text style={[s.cell, s.numSm]}>{P(p.margenRealPct)}</Text>
            <Text style={[s.cell, s.numSm]}>{M(p.utilCotizada)}</Text><Text style={[s.cell, s.numSm]}>{P(p.margenCotPct)}</Text><Text style={[s.cell, s.numSm]}>{gap(p.gapPct)}</Text>
          </View>
        ))}

        {/* Por línea / mes (base caja) */}
        <View style={s.secWrap}><View style={s.secBar} /><Text style={s.secTitle}>Por línea / mes (base caja: cobrado − gastado)</Text></View>
        <View style={s.thead}>
          <Text style={[{ width: '16%' }, s.th]}>MES</Text>
          <Text style={[{ width: '16%', textAlign: 'right' }, s.th]}>COBRADO</Text>
          <Text style={[{ width: '16%', textAlign: 'right' }, s.th]}>GASTADO</Text>
          <Text style={[{ width: '16%', textAlign: 'right' }, s.th]}>UTILIDAD</Text>
          {d.mensual.lineas.map((l) => <Text key={l.id} style={[{ width: `${36 / Math.max(1, d.mensual.lineas.length)}%`, textAlign: 'right' }, s.th]}>{l.nombre}</Text>)}
        </View>
        {d.mensual.filas.length === 0 ? <View style={s.tr}><Text style={s.cell}>Sin movimientos.</Text></View> : d.mensual.filas.map((f, i) => (
          <View key={f.mes} style={i % 2 === 1 ? [s.tr, s.trAlt] : s.tr} wrap={false}>
            <Text style={[s.cell, { width: '16%' }]}>{f.mes.slice(5, 7)}/{f.mes.slice(0, 4)}</Text>
            <Text style={[s.cell, { width: '16%', textAlign: 'right' }]}>{M(f.cobrado)}</Text>
            <Text style={[s.cell, { width: '16%', textAlign: 'right' }]}>{M(f.gastado)}</Text>
            <Text style={[s.cell, { width: '16%', textAlign: 'right' }]}>{M(f.utilidad)}</Text>
            {d.mensual.lineas.map((l) => <Text key={l.id} style={[s.cell, { width: `${36 / Math.max(1, d.mensual.lineas.length)}%`, textAlign: 'right' }]}>{M(f.porLinea[l.id] ?? 0)}</Text>)}
          </View>
        ))}
        {d.mensual.filas.length > 0 && (
          <View style={s.trTot}>
            <Text style={[s.cell, { width: '16%' }]}>Total</Text>
            <Text style={[s.cell, { width: '16%', textAlign: 'right' }]}>{M(d.mensual.total.cobrado)}</Text>
            <Text style={[s.cell, { width: '16%', textAlign: 'right' }]}>{M(d.mensual.total.gastado)}</Text>
            <Text style={[s.cell, { width: '16%', textAlign: 'right' }]}>{M(d.mensual.total.utilidad)}</Text>
            {d.mensual.lineas.map((l) => <Text key={l.id} style={[s.cell, { width: `${36 / Math.max(1, d.mensual.lineas.length)}%`, textAlign: 'right' }]}>{M(d.mensual.total.porLinea[l.id] ?? 0)}</Text>)}
          </View>
        )}


        {/* Gastos de empresa (EEFF): no pasan por el flujo de obra */}
        {d.gastosEmpresa && (
          <View break={d.gastosEmpresa.filas.length > 12}>
            <View style={s.secWrap}><View style={s.secBar} /><Text style={s.secTitle}>Gastos de empresa (EEFF)</Text></View>

            <View style={s.thead}>
              <Text style={[{ width: '25%' }, s.th]}>INGRESOS (COBRADO)</Text>
              <Text style={[{ width: '25%', textAlign: 'right' }, s.th]}>GASTOS DE OBRA</Text>
              <Text style={[{ width: '25%', textAlign: 'right' }, s.th]}>GASTOS DE EMPRESA</Text>
              <Text style={[{ width: '25%', textAlign: 'right' }, s.th]}>UTILIDAD DE EMPRESA</Text>
            </View>
            <View style={s.trTot}>
              <Text style={[s.cell, { width: '25%' }]}>{M(d.gastosEmpresa.ingresos)}</Text>
              <Text style={[s.cell, { width: '25%', textAlign: 'right' }]}>{M(d.gastosEmpresa.egresosObra)}</Text>
              <Text style={[s.cell, { width: '25%', textAlign: 'right' }]}>{M(d.gastosEmpresa.total)}</Text>
              <Text style={[s.cell, { width: '25%', textAlign: 'right' }]}>{M(d.gastosEmpresa.utilidadEmpresa)}</Text>
            </View>

            {d.gastosEmpresa.porLinea.length > 0 && (
              <View>
                <Text style={s.subTit}>Por línea de negocio</Text>
                <View style={s.thead}>
                  <Text style={[{ width: '70%' }, s.th]}>LÍNEA</Text>
                  <Text style={[{ width: '30%', textAlign: 'right' }, s.th]}>GASTO DE EMPRESA</Text>
                </View>
                {d.gastosEmpresa.porLinea.map((l, i) => (
                  <View key={l.id} style={i % 2 === 1 ? [s.tr, s.trAlt] : s.tr} wrap={false}>
                    <Text style={[s.cell, { width: '70%' }]}>{l.nombre}</Text>
                    <Text style={[s.cell, { width: '30%', textAlign: 'right' }]}>{M(l.monto)}</Text>
                  </View>
                ))}
                {d.gastosEmpresa.sinLinea > 0 && (
                  <View style={s.tr} wrap={false}>
                    <Text style={[s.cell, { width: '70%' }]}>Sin línea (general de empresa)</Text>
                    <Text style={[s.cell, { width: '30%', textAlign: 'right' }]}>{M(d.gastosEmpresa.sinLinea)}</Text>
                  </View>
                )}
              </View>
            )}

            <Text style={s.subTit}>Detalle</Text>
            <View style={s.thead}>
              <Text style={[{ width: '12%' }, s.th]}>FECHA</Text>
              <Text style={[{ width: '20%' }, s.th]}>CATEGORÍA</Text>
              <Text style={[{ width: '32%' }, s.th]}>DESCRIPCIÓN</Text>
              <Text style={[{ width: '22%' }, s.th]}>PROYECTO</Text>
              <Text style={[{ width: '14%', textAlign: 'right' }, s.th]}>MONTO</Text>
            </View>
            {d.gastosEmpresa.filas.length === 0 ? (
              <View style={s.tr}><Text style={s.cell}>Sin gastos de empresa en el periodo.</Text></View>
            ) : d.gastosEmpresa.filas.map((g, i) => (
              <View key={g.id} style={i % 2 === 1 ? [s.tr, s.trAlt] : s.tr} wrap={false}>
                <Text style={[s.cell, { width: '12%' }]}>{g.fecha}</Text>
                <Text style={[s.cell, { width: '20%' }]}>{g.categoria ?? '—'}</Text>
                <Text style={[s.cell, { width: '32%' }]}>{g.descripcion ?? '—'}</Text>
                <Text style={[s.cell, { width: '22%' }]}>{g.proyecto ?? '—'}</Text>
                <Text style={[s.cell, { width: '14%', textAlign: 'right' }]}>{M(g.monto)}</Text>
              </View>
            ))}
            {d.gastosEmpresa.filas.length > 0 && (
              <View style={s.trTot}>
                <Text style={[s.cell, { width: '86%' }]}>Total gastos de empresa</Text>
                <Text style={[s.cell, { width: '14%', textAlign: 'right' }]}>{M(d.gastosEmpresa.total)}</Text>
              </View>
            )}
          </View>
        )}

        <Text style={s.nota}>Utilidad real = Cobrado − Gastado (flujo de caja del proyecto, acumulado a la fecha). Margen cotizado = (GG + GA + Utilidad) / (1 + GG + GA + Utilidad) sobre el contrato neto de IGV. Utilidad cotizada = contrato neto × margen cotizado (proyectada a fin de obra). Gap = margen real − margen cotizado. El estado por línea/mes es base caja (cobrado − gastado del mes).</Text>

        <View style={s.footer} fixed>
          <Text style={s.footerTxt}>Azur Constructora e Inmobiliaria | Estado de resultados</Text>
          <Text style={s.footerTxt} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
