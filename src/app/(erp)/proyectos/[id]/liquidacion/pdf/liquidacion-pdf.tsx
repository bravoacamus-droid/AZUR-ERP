import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { fmtMoney, fmtPct } from '@/lib/format';
import { LOGO_DATA_URI } from '@/lib/brand-logo';
import { rolLabel } from '@/lib/roles';

const AZUR = '#E20627';
const s = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: AZUR, paddingBottom: 10, marginBottom: 14 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: { width: 50, height: 50, backgroundColor: '#fff', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: '#eee' },
  logo: { width: 44, height: 44, objectFit: 'contain' },
  brand: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: AZUR },
  brandSub: { fontSize: 7, color: '#666', letterSpacing: 2 },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  meta: { fontSize: 8, color: '#444', textAlign: 'right', marginTop: 2 },
  box: { borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 4, padding: 10, marginBottom: 12 },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: AZUR, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  k: { color: '#555' },
  vb: { fontFamily: 'Helvetica-Bold' },
  hi: { color: AZUR },
  pos: { color: '#0a7d33' },
  tot: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 5, marginTop: 4 },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, textAlign: 'center', fontSize: 7, color: '#999', borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 6 },
});

export interface LiqPdfData {
  proyecto: string; codigo: string; cliente: string; fecha: string;
  contrato: number; adicionales: number; deductivos: number; contratoAjustado: number;
  valorizado: number; cobrado: number; porCobrar: number;
  costoPresupuestado: number; gastado: number;
  margenPresupuesto: number; utilidadReal: number; margenPct: number;
  adelantoInicial: number; amortizado: number; adelantoSaldo: number;
  medios?: { banco: string; titular: string; cuentaSoles?: string; cciSoles?: string; cuentaDolares?: string; cciDolares?: string; detraccion: boolean }[];
  firmantes?: { nombre: string; rol?: string; firma?: string }[];
}

export function LiquidacionPDF({ d }: { d: LiqPdfData }) {
  return (
    <Document title={`Liquidación — ${d.codigo}`}>
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View style={s.brandRow}>
            <View style={s.logoBox}><Image src={LOGO_DATA_URI} style={s.logo} /></View>
            <View><Text style={s.brand}>AZUR</Text><Text style={s.brandSub}>CONSTRUCTORA E INMOBILIARIA</Text></View>
          </View>
          <View>
            <Text style={s.title}>LIQUIDACIÓN DE OBRA</Text>
            <Text style={s.meta}>{d.codigo} · {d.fecha}</Text>
            <Text style={s.meta}>{d.cliente}</Text>
          </View>
        </View>

        <View style={s.box}>
          <Text style={[s.vb, { fontSize: 11, marginBottom: 4 }]}>{d.proyecto}</Text>
        </View>

        <Text style={s.sectionTitle}>Balance contractual</Text>
        <View style={s.box}>
          <View style={s.row}><Text style={s.k}>Contrato (precio cliente)</Text><Text style={s.vb}>{fmtMoney(d.contrato)}</Text></View>
          <View style={s.row}><Text style={s.k}>(+) Adicionales aprobados</Text><Text style={[s.vb, s.pos]}>+ {fmtMoney(d.adicionales)}</Text></View>
          <View style={s.row}><Text style={s.k}>(−) Deductivos aprobados</Text><Text style={[s.vb, s.hi]}>- {fmtMoney(d.deductivos)}</Text></View>
          <View style={s.tot}><Text style={s.vb}>Contrato ajustado</Text><Text style={s.vb}>{fmtMoney(d.contratoAjustado)}</Text></View>
        </View>

        <Text style={s.sectionTitle}>Cobranza</Text>
        <View style={s.box}>
          <View style={s.row}><Text style={s.k}>Valorizado al cliente</Text><Text style={s.vb}>{fmtMoney(d.valorizado)}</Text></View>
          <View style={s.row}><Text style={s.k}>Cobrado (abonos)</Text><Text style={[s.vb, s.pos]}>{fmtMoney(d.cobrado)}</Text></View>
          <View style={s.row}><Text style={s.k}>Por cobrar</Text><Text style={s.vb}>{fmtMoney(d.porCobrar)}</Text></View>
        </View>

        <Text style={s.sectionTitle}>Adelanto</Text>
        <View style={s.box}>
          <View style={s.row}><Text style={s.k}>Adelanto inicial</Text><Text style={s.vb}>{fmtMoney(d.adelantoInicial)}</Text></View>
          <View style={s.row}><Text style={s.k}>Amortizado acumulado</Text><Text style={s.vb}>{fmtMoney(d.amortizado)}</Text></View>
          <View style={s.row}><Text style={s.k}>Saldo del adelanto</Text><Text style={[s.vb, s.hi]}>{fmtMoney(d.adelantoSaldo)}</Text></View>
        </View>

        <Text style={s.sectionTitle}>Resultado del proyecto</Text>
        <View style={s.box}>
          <View style={s.row}><Text style={s.k}>Costo presupuestado (interno)</Text><Text style={s.vb}>{fmtMoney(d.costoPresupuestado)}</Text></View>
          <View style={s.row}><Text style={s.k}>Gastado real (egresos)</Text><Text style={[s.vb, s.hi]}>{fmtMoney(d.gastado)}</Text></View>
          <View style={s.tot}><Text style={s.vb}>Margen vs. presupuesto</Text><Text style={[s.vb, d.margenPresupuesto >= 0 ? s.pos : s.hi]}>{fmtMoney(d.margenPresupuesto)}</Text></View>
          <View style={s.row}><Text style={[s.vb, { fontSize: 11 }]}>Utilidad real (cobrado − gastado)</Text><Text style={[s.vb, { fontSize: 11 }, d.utilidadReal >= 0 ? s.pos : s.hi]}>{fmtMoney(d.utilidadReal)} ({fmtPct(d.margenPct, 1)})</Text></View>
        </View>

        {d.medios && d.medios.length ? (
          <View wrap={false}>
            <Text style={s.sectionTitle}>Medios de pago — depositar a nombre de {d.medios[0].titular}</Text>
            <View style={s.box}>
              {d.medios.map((m, i) => (
                <Text key={i} style={{ fontSize: 8, color: '#333', marginBottom: 2 }}>
                  {m.banco}{m.detraccion ? ' (Detracción)' : ''}:
                  {m.cuentaSoles ? ` S/ ${m.cuentaSoles}${m.cciSoles ? ` · CCI ${m.cciSoles}` : ''}` : ''}
                  {m.cuentaSoles && m.cuentaDolares ? '   |  ' : ''}
                  {m.cuentaDolares ? ` US$ ${m.cuentaDolares}${m.cciDolares ? ` · CCI ${m.cciDolares}` : ''}` : ''}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {d.firmantes && d.firmantes.length ? (
          <View wrap={false} style={{ marginTop: 36, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' }}>
            {d.firmantes.map((f, i) => (
              <View key={i} style={{ alignItems: 'center', width: 200, marginBottom: 8 }}>
                {f.firma ? <Image src={f.firma} style={{ height: 44, width: 150, objectFit: 'contain' }} /> : <View style={{ height: 44 }} />}
                <View style={{ borderTopWidth: 1, borderTopColor: '#333', width: 170, marginBottom: 4 }} />
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{f.nombre}</Text>
                <Text style={{ fontSize: 8, color: '#666' }}>{f.rol ? rolLabel(f.rol) : ''}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={s.footer} fixed>AZUR Constructora e Inmobiliaria · Liquidación de obra · {d.codigo}</Text>
      </Page>
    </Document>
  );
}
