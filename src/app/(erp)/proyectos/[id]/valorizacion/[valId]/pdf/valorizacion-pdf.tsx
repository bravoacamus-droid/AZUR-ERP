import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { fmtMoney, fmtNumber } from '@/lib/format';
import { LOGO_DATA_URI } from '@/lib/brand-logo';

const AZUR = '#E20627';
const s = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: AZUR, paddingBottom: 10, marginBottom: 14 },
  logoBox: { width: 50, height: 50, backgroundColor: '#fff', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: '#eee' },
  logo: { width: 44, height: 44, objectFit: 'contain' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: AZUR },
  brandSub: { fontSize: 7, color: '#666', letterSpacing: 2 },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  meta: { fontSize: 8, color: '#444', textAlign: 'right', marginTop: 2 },
  box: { borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 4, padding: 10, marginBottom: 12 },
  rowB: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  k: { color: '#555' },
  vb: { fontFamily: 'Helvetica-Bold' },
  hi: { color: AZUR },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: AZUR, marginBottom: 6 },
  thead: { flexDirection: 'row', backgroundColor: AZUR, paddingVertical: 4, paddingHorizontal: 4 },
  th: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 8 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e5e5', paddingVertical: 3, paddingHorizontal: 4 },
  cTit: { flex: 1 }, cPct: { width: 70, textAlign: 'right' }, cMon: { width: 90, textAlign: 'right' },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, textAlign: 'center', fontSize: 7, color: '#999', borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 6 },
});

export interface ValPdfData {
  proyecto: string; codigo: string; cliente: string; numero: number; fecha: string;
  contrato: number; valorizadoPeriodo: number; amortizacion: number; cobroNeto: number;
  adelantoPct: number; valorizadoAcum: number; saldoContrato: number;
  rows: { titulo: string; pct: number; monto: number }[];
  historial: { numero: number; fecha: string; monto: number }[];
}

export function ValorizacionPDF({ d }: { d: ValPdfData }) {
  return (
    <Document title={`Valorización N${d.numero} — ${d.codigo}`}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.brandRow}>
            <View style={s.logoBox}><Image src={LOGO_DATA_URI} style={s.logo} /></View>
            <View>
              <Text style={s.brand}>AZUR</Text>
              <Text style={s.brandSub}>CONSTRUCTORA E INMOBILIARIA</Text>
            </View>
          </View>
          <View>
            <Text style={s.title}>VALORIZACIÓN N° {d.numero}</Text>
            <Text style={s.meta}>{d.codigo} · {d.fecha}</Text>
            <Text style={s.meta}>{d.cliente}</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Resumen ejecutivo</Text>
        <View style={s.box}>
          <View style={s.rowB}><Text style={s.k}>Monto del contrato</Text><Text style={s.vb}>{fmtMoney(d.contrato)}</Text></View>
          <View style={s.rowB}><Text style={s.k}>Valorización del periodo</Text><Text style={s.vb}>{fmtMoney(d.valorizadoPeriodo)}</Text></View>
          <View style={s.rowB}><Text style={s.k}>Amortización de adelanto ({fmtNumber(d.adelantoPct * 100, 0)}%)</Text><Text style={s.vb}>- {fmtMoney(d.amortizacion)}</Text></View>
          <View style={s.rowB}><Text style={[s.k, s.vb]}>Cobro neto del periodo</Text><Text style={[s.vb, s.hi]}>{fmtMoney(d.cobroNeto)}</Text></View>
          <View style={[s.rowB, { borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 4, marginTop: 2 }]}><Text style={s.k}>Valorizado acumulado</Text><Text style={s.vb}>{fmtMoney(d.valorizadoAcum)}</Text></View>
          <View style={s.rowB}><Text style={s.k}>Saldo por valorizar</Text><Text style={s.vb}>{fmtMoney(d.saldoContrato)}</Text></View>
        </View>

        {d.historial.length > 1 && (
          <>
            <Text style={s.sectionTitle}>Valorizaciones acumuladas</Text>
            <View style={[s.box, { paddingVertical: 6 }]}>
              {d.historial.map((h) => (
                <View key={h.numero} style={s.rowB}>
                  <Text style={s.k}>Valorización N° {h.numero} {h.numero === d.numero ? '(actual)' : ''} · {h.fecha}</Text>
                  <Text style={s.vb}>{fmtMoney(h.monto)}</Text>
                </View>
              ))}
              <View style={[s.rowB, { borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 4, marginTop: 2 }]}>
                <Text style={[s.k, s.vb]}>Total acumulado</Text><Text style={[s.vb, s.hi]}>{fmtMoney(d.valorizadoAcum)}</Text>
              </View>
            </View>
          </>
        )}

        <Text style={s.sectionTitle}>Detalle por partida</Text>
        <View style={s.thead}>
          <Text style={[s.th, s.cTit]}>PARTIDA</Text>
          <Text style={[s.th, s.cPct]}>% PERIODO</Text>
          <Text style={[s.th, s.cMon]}>VALORIZADO</Text>
        </View>
        {d.rows.map((r, i) => (
          <View key={i} style={s.tr}>
            <Text style={s.cTit}>{r.titulo}</Text>
            <Text style={s.cPct}>{fmtNumber(r.pct * 100, 0)}%</Text>
            <Text style={s.cMon}>{fmtMoney(r.monto)}</Text>
          </View>
        ))}

        <Text style={s.footer} fixed>AZUR Constructora e Inmobiliaria · Valorización N{d.numero} · {d.codigo}</Text>
      </Page>
    </Document>
  );
}
