import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { fmtMoney, fmtNumber } from '@/lib/format';
import { LOGO_DATA_URI } from '@/lib/brand-logo';
import { rolLabel } from '@/lib/roles';

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
  trAlt: { backgroundColor: '#f6f6f6' },
  trGrp: { flexDirection: 'row', backgroundColor: '#fbe9ec', paddingVertical: 3, paddingHorizontal: 4 },
  cell: { fontSize: 7.5 },
  cCod: { width: 38 }, cTit: { flex: 1 }, cUnd: { width: 34, textAlign: 'center' },
  cContr: { width: 70, textAlign: 'right' }, cPct: { width: 52, textAlign: 'right' },
  cMon: { width: 70, textAlign: 'right' }, cAcumPct: { width: 42, textAlign: 'right' },
  cAcum: { width: 70, textAlign: 'right' }, cSaldo: { width: 70, textAlign: 'right' },
  // Resumen ejecutivo compacto (angosto, con filas alternadas)
  resWrap: { width: 340, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 4, marginBottom: 10, overflow: 'hidden' },
  resRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: 8 },
  resAlt: { backgroundColor: '#f6f6f6' },
  resHi: { backgroundColor: '#fbe9ec' },
  resK: { color: '#333', fontSize: 8.5 },
  resV: { fontFamily: 'Helvetica-Bold', fontSize: 8.5 },
  // Desglose del cobro al pie del detalle (angosto, alineado a la derecha)
  desgWrap: { width: 300, alignSelf: 'flex-end', borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 4, marginTop: 8, marginBottom: 8, overflow: 'hidden' },
  desgRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, paddingHorizontal: 8 },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, textAlign: 'center', fontSize: 7, color: '#999', borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 6 },
});

export interface ValPdfData {
  proyecto: string; codigo: string; cliente: string; numero: number; fecha: string;
  conIgv?: boolean;
  contrato: number; valorizadoPeriodo: number; amortizacion: number; cobroNeto: number;
  adelantoPct: number; tasaAmort: number; adelantoTotal: number; amortizadoAcum: number; saldoAdelanto: number;
  valorizadoAcum: number; saldoContrato: number; responsable?: string; responsableFirma?: string; gerente?: string; gerenteFirma?: string;
  firmantes?: { nombre: string; rol?: string; firma?: string }[];
  desglose?: { subtotal: number; gg: number; ga: number; util: number; igv: number; total: number; ggPct: number; gaPct: number; utilPct: number; igvPct: number };
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
      <Text style={[s.th, s.cContr]}>CONTRACTUAL</Text>
      <Text style={[s.th, s.cPct]}>% VAL. N°{d.numero}</Text>
      <Text style={[s.th, s.cMon]}>VAL. N°{d.numero}</Text>
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
        <View style={s.resWrap}>
          <View style={s.resRow}><Text style={s.resK}>Monto del contrato</Text><Text style={s.resV}>{fmtMoney(d.contrato)}</Text></View>
          <View style={[s.resRow, s.resAlt]}><Text style={s.resK}>Adelanto recibido (contrato {fmtNumber(d.adelantoPct * 100, 0)}%)</Text><Text style={s.resV}>{fmtMoney(d.adelantoTotal)}</Text></View>
          <View style={s.resRow}><Text style={s.resK}>Valorizaciones acumuladas anteriores</Text><Text style={s.resV}>{fmtMoney(d.valorizadoAcum - d.valorizadoPeriodo)}</Text></View>
          <View style={[s.resRow, s.resHi]}><Text style={[s.resK, s.vb]}>Valorización N° {d.numero}</Text><Text style={s.resV}>{fmtMoney(d.valorizadoPeriodo)}</Text></View>
          <View style={[s.resRow, s.resHi, { borderTopWidth: 0.5, borderTopColor: '#f0c9d1' }]}><Text style={[s.resK, s.vb, s.hi]}>Saldo por pagar</Text><Text style={[s.resV, s.hi]}>{fmtMoney(d.saldoContrato)}</Text></View>
        </View>
        <Text style={{ fontSize: 7, color: '#888', marginTop: -6, marginBottom: 8 }}>
          Montos {d.conIgv === false ? 'sin IGV (netos)' : 'con IGV incluido'}. El detalle del cobro (margen, IGV y amortización) se muestra al final.
        </Text>

        {chunks.map((chunk, ci) => (
          <View key={ci} break={ci > 0}>
            <Text style={s.sectionTitle}>Detalle por partida{ci > 0 ? ' (continuación)' : ''}</Text>
            <Thead />
            {chunk.map((r, i) => (
              <View key={i} style={i % 2 === 1 ? [s.tr, s.trAlt] : s.tr} wrap={false}>
                <Text style={[s.cell, s.cCod]}>{r.codigo}</Text>
                <Text style={[s.cell, s.cTit]}>{r.titulo}</Text>
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
          <View style={[s.tr, s.trGrp, { borderTopWidth: 1, borderTopColor: AZUR }]}>
            <Text style={[s.cell, s.cCod]}></Text>
            <Text style={[s.cell, s.cTit, s.vb]}>TOTALES</Text>
            <Text style={[s.cell, s.cContr, s.vb]}>{fmtMoney(d.rows.reduce((a, r) => a + r.contractual, 0))}</Text>
            <Text style={[s.cell, s.cPct]}></Text>
            <Text style={[s.cell, s.cMon, s.vb]}>{fmtMoney(d.valorizadoPeriodo)}</Text>
            <Text style={[s.cell, s.cAcumPct]}></Text>
            <Text style={[s.cell, s.cAcum, s.vb]}>{fmtMoney(d.rows.reduce((a, r) => a + r.valorizadoAcum, 0))}</Text>
            <Text style={[s.cell, s.cSaldo, s.vb]}>{fmtMoney(d.rows.reduce((a, r) => a + r.saldo, 0))}</Text>
          </View>

          {/* Desglose del cobro: del valorizado a lo neto (margen, IGV, amortización). */}
          <View style={s.desgWrap} wrap={false}>
            {d.desglose ? (
              <>
                <View style={s.desgRow}><Text style={s.resK}>Subtotal (con margen)</Text><Text style={s.resV}>{fmtMoney(d.desglose.subtotal)}</Text></View>
                {d.desglose.ggPct > 0 && <View style={[s.desgRow, s.resAlt]}><Text style={s.resK}>Gastos generales ({fmtNumber(d.desglose.ggPct * 100, 0)}%)</Text><Text style={s.resV}>{fmtMoney(d.desglose.gg)}</Text></View>}
                {d.desglose.gaPct > 0 && <View style={s.desgRow}><Text style={s.resK}>Gastos administrativos ({fmtNumber(d.desglose.gaPct * 100, 0)}%)</Text><Text style={s.resV}>{fmtMoney(d.desglose.ga)}</Text></View>}
                {d.desglose.utilPct > 0 && <View style={[s.desgRow, s.resAlt]}><Text style={s.resK}>Utilidad ({fmtNumber(d.desglose.utilPct * 100, 0)}%)</Text><Text style={s.resV}>{fmtMoney(d.desglose.util)}</Text></View>}
                {d.desglose.igvPct > 0 && <View style={s.desgRow}><Text style={s.resK}>I.G.V. ({fmtNumber(d.desglose.igvPct * 100, 0)}%)</Text><Text style={s.resV}>{fmtMoney(d.desglose.igv)}</Text></View>}
                <View style={[s.desgRow, s.resAlt]}><Text style={[s.resK, s.vb]}>Valorización del periodo</Text><Text style={s.resV}>{fmtMoney(d.valorizadoPeriodo)}</Text></View>
              </>
            ) : (
              <View style={s.desgRow}><Text style={[s.resK, s.vb]}>Valorización del periodo</Text><Text style={s.resV}>{fmtMoney(d.valorizadoPeriodo)}</Text></View>
            )}
            <View style={s.desgRow}><Text style={s.resK}>Amortización del adelanto ({fmtNumber(d.tasaAmort * 100, 1)}%)</Text><Text style={s.resV}>- {fmtMoney(d.amortizacion)}</Text></View>
            <View style={[s.desgRow, s.resHi, { borderTopWidth: 0.5, borderTopColor: '#f0c9d1' }]}><Text style={[s.resK, s.vb, s.hi]}>Cobro neto del periodo</Text><Text style={[s.resV, s.hi]}>{fmtMoney(d.cobroNeto)}</Text></View>
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
            {d.firmantes && d.firmantes.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginTop: 24 }}>
                {d.firmantes.map((f, i) => (
                  <View key={i} style={{ alignItems: 'center', width: 190, marginBottom: 8 }}>
                    {f.firma ? <Image src={f.firma} style={{ height: 44, width: 150, objectFit: 'contain' }} /> : <View style={{ height: 44 }} />}
                    <View style={{ borderTopWidth: 1, borderTopColor: '#333', width: 165, marginBottom: 4 }} />
                    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{f.nombre}</Text>
                    <Text style={{ fontSize: 8, color: '#666' }}>{f.rol ? rolLabel(f.rol) : ''}</Text>
                  </View>
                ))}
              </View>
            ) : (
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 24 }}>
              <View style={{ alignItems: 'center', width: 200 }}>
                {/* Firma del Jefe de Proyectos si está cargada; si no, espacio para firmar. */}
                {d.responsableFirma ? <Image src={d.responsableFirma} style={{ height: 44, width: 150, objectFit: 'contain' }} /> : <View style={{ height: 44 }} />}
                <View style={{ borderTopWidth: 1, borderTopColor: '#333', width: 170, marginBottom: 4 }} />
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{d.responsable ?? ''}</Text>
                <Text style={{ fontSize: 8, color: '#666' }}>Elaborado por · Jefe de Proyectos</Text>
              </View>
              <View style={{ alignItems: 'center', width: 200 }}>
                {d.gerenteFirma ? <Image src={d.gerenteFirma} style={{ height: 44, width: 150, objectFit: 'contain' }} /> : <View style={{ height: 44 }} />}
                <View style={{ borderTopWidth: 1, borderTopColor: '#333', width: 170, marginBottom: 4 }} />
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{d.gerente ?? ' '}</Text>
                <Text style={{ fontSize: 8, color: '#666' }}>Aprobado por · Gerencia</Text>
              </View>
            </View>
            )}
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
