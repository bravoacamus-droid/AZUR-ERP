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
  box: { borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 4, padding: 8, marginBottom: 8 },
  rowB: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  k: { color: '#555' },
  vb: { fontFamily: 'Helvetica-Bold' },
  hi: { color: AZUR },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: AZUR, marginBottom: 4 },
  thead: { flexDirection: 'row', backgroundColor: AZUR, paddingVertical: 4, paddingHorizontal: 4 },
  th: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 7.5 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e5e5', paddingVertical: 3, paddingHorizontal: 4 },
  trGrp: { flexDirection: 'row', backgroundColor: '#fbe9ec', paddingVertical: 3, paddingHorizontal: 4 },
  cell: { fontSize: 7.5 },
  cCod: { width: 38 }, cTit: { flex: 1 }, cUnd: { width: 34, textAlign: 'center' },
  cContr: { width: 70, textAlign: 'right' }, cPct: { width: 42, textAlign: 'right' },
  cMon: { width: 70, textAlign: 'right' }, cAcumPct: { width: 42, textAlign: 'right' },
  cAcum: { width: 70, textAlign: 'right' }, cSaldo: { width: 70, textAlign: 'right' },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, textAlign: 'center', fontSize: 7, color: '#999', borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 6 },
});

export interface ValPdfData {
  proyecto: string; codigo: string; cliente: string; numero: number; fecha: string;
  contrato: number; valorizadoPeriodo: number; amortizacion: number; cobroNeto: number;
  adelantoPct: number; tasaAmort: number; adelantoTotal: number; amortizadoAcum: number; saldoAdelanto: number;
  valorizadoAcum: number; saldoContrato: number; responsable?: string;
  rows: {
    codigo: string; titulo: string; unidad: string; contractual: number;
    pct: number; monto: number; pctAcum: number; valorizadoAcum: number; saldo: number;
  }[];
  historial: { numero: number; fecha: string; monto: number }[];
  medios?: { banco: string; titular: string; cuentaSoles?: string; cciSoles?: string; cuentaDolares?: string; cciDolares?: string; detraccion: boolean }[];
}

export function ValorizacionPDF({ d }: { d: ValPdfData }) {
  // Paginación controlada del detalle: se reparte en bloques y se repite el
  // encabezado de columnas al inicio de cada página. Capacidades conservadoras
  // (medidas por render) para que ningún bloque desborde sin su encabezado.
  const hasHist = d.historial.length > 1;
  const firstCap = hasHist ? 8 : 12;
  const contCap = 20;
  const chunks: ValPdfData['rows'][] = [];
  if (d.rows.length === 0) {
    chunks.push([]);
  } else {
    chunks.push(d.rows.slice(0, firstCap));
    for (let i = firstCap; i < d.rows.length; i += contCap) chunks.push(d.rows.slice(i, i + contCap));
  }
  const Thead = () => (
    <View style={s.thead}>
      <Text style={[s.th, s.cCod]}>ÍTEM</Text>
      <Text style={[s.th, s.cTit]}>PARTIDA</Text>
      <Text style={[s.th, s.cUnd]}>UND</Text>
      <Text style={[s.th, s.cContr]}>CONTRACTUAL</Text>
      <Text style={[s.th, s.cPct]}>% PER.</Text>
      <Text style={[s.th, s.cMon]}>VAL. PERIODO</Text>
      <Text style={[s.th, s.cAcumPct]}>% ACUM.</Text>
      <Text style={[s.th, s.cAcum]}>VAL. ACUM.</Text>
      <Text style={[s.th, s.cSaldo]}>SALDO</Text>
    </View>
  );
  return (
    <Document title={`Valorización N${d.numero} — ${d.codigo}`}>
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.header} fixed>
          <View style={s.brandRow}>
            <View style={s.logoBox}><Image src={LOGO_DATA_URI} style={s.logo} /></View>
            <View>
              <Text style={s.brand}>AZUR</Text>
              <Text style={s.brandSub}>CONSTRUCTORA E INMOBILIARIA</Text>
            </View>
          </View>
          <View>
            <Text style={s.title}>VALORIZACIÓN N° {d.numero}</Text>
            <Text style={[s.meta, { fontFamily: 'Helvetica-Bold', color: '#1a1a1a' }]}>{d.proyecto}</Text>
            <Text style={s.meta}>{d.codigo} · {d.fecha}</Text>
            <Text style={s.meta}>Cliente: {d.cliente}</Text>
            {d.responsable ? <Text style={s.meta}>Jefe de Proyectos: {d.responsable}</Text> : null}
          </View>
        </View>

        <Text style={s.sectionTitle}>Resumen ejecutivo</Text>
        <View style={s.box}>
          <View style={s.rowB}><Text style={s.k}>Monto del contrato</Text><Text style={s.vb}>{fmtMoney(d.contrato)}</Text></View>
          <View style={s.rowB}><Text style={s.k}>Adelanto recibido (contrato {fmtNumber(d.adelantoPct * 100, 0)}%{d.adelantoTotal > d.contrato * d.adelantoPct ? ' + adic.' : ''})</Text><Text style={s.vb}>- {fmtMoney(d.adelantoTotal)}</Text></View>

          <Text style={[s.k, { marginTop: 6, marginBottom: 2, fontFamily: 'Helvetica-Bold' }]}>Periodo — Valorización N° {d.numero}</Text>
          <View style={s.rowB}><Text style={s.k}>Valorización del periodo</Text><Text style={s.vb}>{fmtMoney(d.valorizadoPeriodo)}</Text></View>
          <View style={s.rowB}><Text style={s.k}>Amortización del adelanto ({fmtNumber(d.tasaAmort * 100, 1)}%)</Text><Text style={s.vb}>- {fmtMoney(d.amortizacion)}</Text></View>
          <View style={s.rowB}><Text style={[s.k, s.vb]}>Cobro neto del periodo</Text><Text style={[s.vb, s.hi]}>{fmtMoney(d.cobroNeto)}</Text></View>

          <Text style={[s.k, { marginTop: 6, marginBottom: 2, fontFamily: 'Helvetica-Bold' }]}>Acumulado del proyecto</Text>
          <View style={s.rowB}><Text style={s.k}>Valorización acumulada</Text><Text style={s.vb}>{fmtMoney(d.valorizadoAcum)}</Text></View>
          <View style={s.rowB}><Text style={s.k}>Adelanto amortizado acumulado</Text><Text style={s.vb}>- {fmtMoney(d.amortizadoAcum)}</Text></View>
          <View style={s.rowB}><Text style={s.k}>Saldo del adelanto por amortizar</Text><Text style={s.vb}>{fmtMoney(d.saldoAdelanto)}</Text></View>
          <View style={[s.rowB, { borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 4, marginTop: 2 }]}><Text style={[s.k, s.vb]}>Saldo por valorizar</Text><Text style={[s.vb, s.hi]}>{fmtMoney(d.saldoContrato)}</Text></View>
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

        {chunks.map((chunk, ci) => (
          <View key={ci} break={ci > 0}>
            <Text style={s.sectionTitle}>Detalle por partida{ci > 0 ? ' (continuación)' : ''}</Text>
            <Thead />
            {chunk.map((r, i) => (
              <View key={i} style={s.tr} wrap={false}>
                <Text style={[s.cell, s.cCod]}>{r.codigo}</Text>
                <Text style={[s.cell, s.cTit]}>{r.titulo}</Text>
                <Text style={[s.cell, s.cUnd]}>{r.unidad}</Text>
                <Text style={[s.cell, s.cContr]}>{fmtMoney(r.contractual)}</Text>
                <Text style={[s.cell, s.cPct]}>{fmtNumber(r.pct * 100, 0)}%</Text>
                <Text style={[s.cell, s.cMon]}>{fmtMoney(r.monto)}</Text>
                <Text style={[s.cell, s.cAcumPct]}>{fmtNumber(r.pctAcum * 100, 0)}%</Text>
                <Text style={[s.cell, s.cAcum]}>{fmtMoney(r.valorizadoAcum)}</Text>
                <Text style={[s.cell, s.cSaldo]}>{fmtMoney(r.saldo)}</Text>
              </View>
            ))}
            {ci === chunks.length - 1 && (
        /* TOTALES + conformidad + firmas viajan como un solo bloque: la firma NUNCA
           queda sola. Si no cabe al pie, salta a la página siguiente acompañada de los
           totales y la conformidad, con la cabecera fija repetida arriba. */
        <View wrap={false} minPresenceAhead={40}>
          <View style={[s.tr, { borderTopWidth: 1, borderTopColor: AZUR }]}>
            <Text style={[s.cell, s.cCod]}></Text>
            <Text style={[s.cell, s.cTit, s.vb]}>TOTALES</Text>
            <Text style={[s.cell, s.cUnd]}></Text>
            <Text style={[s.cell, s.cContr, s.vb]}>{fmtMoney(d.rows.reduce((a, r) => a + r.contractual, 0))}</Text>
            <Text style={[s.cell, s.cPct]}></Text>
            <Text style={[s.cell, s.cMon, s.vb]}>{fmtMoney(d.valorizadoPeriodo)}</Text>
            <Text style={[s.cell, s.cAcumPct]}></Text>
            <Text style={[s.cell, s.cAcum, s.vb]}>{fmtMoney(d.rows.reduce((a, r) => a + r.valorizadoAcum, 0))}</Text>
            <Text style={[s.cell, s.cSaldo, s.vb]}>{fmtMoney(d.rows.reduce((a, r) => a + r.saldo, 0))}</Text>
          </View>

          <View style={{ marginTop: 10 }}>
            <View style={[s.box, { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }]}>
              <Text style={[s.k, s.vb]}>Conformidad · Valorización N° {d.numero} — {d.proyecto}</Text>
              <Text style={[s.vb, s.hi]}>Cobro neto del periodo: {fmtMoney(d.cobroNeto)}</Text>
            </View>
            {d.medios && d.medios.length ? (
              <View style={{ marginBottom: 8 }}>
                <Text style={[s.k, s.vb, { fontSize: 8, marginBottom: 2 }]}>Medios de pago — depositar a nombre de {d.medios[0].titular}</Text>
                {d.medios.map((m, i) => (
                  <Text key={i} style={{ fontSize: 7.5, color: '#333', marginBottom: 1 }}>
                    {m.banco}{m.detraccion ? ' (Detracción)' : ''}:
                    {m.cuentaSoles ? ` S/ ${m.cuentaSoles}${m.cciSoles ? ` · CCI ${m.cciSoles}` : ''}` : ''}
                    {m.cuentaSoles && m.cuentaDolares ? '   |  ' : ''}
                    {m.cuentaDolares ? ` US$ ${m.cuentaDolares}${m.cciDolares ? ` · CCI ${m.cciDolares}` : ''}` : ''}
                  </Text>
                ))}
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center', width: 200 }}>
                {/* Espacio en blanco para firmar (encima de la línea) */}
                <View style={{ height: 34 }} />
                <View style={{ borderTopWidth: 1, borderTopColor: '#333', width: 170, marginBottom: 4 }} />
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{d.responsable ?? ''}</Text>
                <Text style={{ fontSize: 8, color: '#666' }}>Elaborado por · Jefe de Proyectos</Text>
              </View>
              <View style={{ alignItems: 'center', width: 200 }}>
                <View style={{ height: 34 }} />
                <View style={{ borderTopWidth: 1, borderTopColor: '#333', width: 170, marginBottom: 4 }} />
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}> </Text>
                <Text style={{ fontSize: 8, color: '#666' }}>Aprobado por · Gerencia</Text>
              </View>
            </View>
          </View>
        </View>
            )}
          </View>
        ))}

        <Text style={s.footer} fixed>AZUR Constructora e Inmobiliaria · Valorización N{d.numero} · {d.codigo}</Text>
      </Page>
    </Document>
  );
}
