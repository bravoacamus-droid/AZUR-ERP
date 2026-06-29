import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { fmtMoney, fmtNumber } from '@/lib/format';
import { LOGO_DATA_URI } from '@/lib/brand-logo';
import { FIRMA_DATA_URI } from '@/lib/brand-firma';

const AZUR = '#E20627';
const AZUR2 = '#BE1723';

// Helvetica built-in (NO Google Fonts — Anexo A.3 Bug #7).
const s = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, borderBottomWidth: 2, borderBottomColor: AZUR, paddingBottom: 10 },
  logoBox: { width: 54, height: 54, backgroundColor: '#fff', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: '#eee' },
  logo: { width: 48, height: 48, objectFit: 'contain' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: AZUR },
  brandSub: { fontSize: 7, color: '#666', letterSpacing: 2 },
  codigo: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: AZUR2, textAlign: 'right' },
  meta: { fontSize: 8, color: '#444', textAlign: 'right', marginTop: 2 },
  box: { borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 4, padding: 8, marginBottom: 10 },
  rowB: { flexDirection: 'row', marginBottom: 2 },
  k: { width: 90, color: '#666', fontFamily: 'Helvetica-Bold', fontSize: 8 },
  v: { flex: 1, fontSize: 8 },
  thead: { flexDirection: 'row', backgroundColor: AZUR, color: '#fff', paddingVertical: 4, paddingHorizontal: 4 },
  th: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#fff' },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e5e5', paddingVertical: 3, paddingHorizontal: 4 },
  trParent: { flexDirection: 'row', backgroundColor: '#f7f7f7', paddingVertical: 3, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: '#ddd' },
  cItem: { width: 38 },
  cTit: { flex: 1 },
  cUnd: { width: 36, textAlign: 'center' },
  cCant: { width: 42, textAlign: 'right' },
  cPU: { width: 60, textAlign: 'right' },
  cSub: { width: 70, textAlign: 'right' },
  totRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 2 },
  totLabel: { width: 160, textAlign: 'right', color: '#444', marginRight: 8 },
  totVal: { width: 90, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  totHi: { color: AZUR },
  cond: { fontSize: 8, color: '#333', marginBottom: 2 },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: AZUR2, marginTop: 8, marginBottom: 3 },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, textAlign: 'center', fontSize: 7, color: '#999', borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 6 },
});

export interface PdfRow { codigo: string; titulo: string; depth: number; esHoja: boolean; unidad?: string | null; cantidad?: number | null; precio_unitario: number; subtotal: number; }
export interface PdfData {
  codigo: string; fecha: string; proyecto: string; asunto?: string; ubicacion?: string;
  cliente: string; ruc?: string; empresa: string; rucEmpresa?: string; vigencia?: string; plazo?: string;
  moneda?: string; tipoCambio?: number; mostrarEquivPen?: boolean;
  rows: PdfRow[];
  totales: { subtotal: number; gg?: number; ga?: number; util?: number; costoDirecto: number; igv?: number; total: number; descuento?: number; totalConDescuento: number };
  condiciones?: string; serviciosIncluidos?: string; serviciosOmitidos?: string; garantia?: string;
  medios: { banco: string; titular: string; cuentaSoles?: string; cciSoles?: string; cuentaDolares?: string; cciDolares?: string; detraccion: boolean }[];
  formaPago?: { concepto: string; porcentaje: number; esAdelanto: boolean }[];
  responsable?: string; responsableRol?: string;
}

const ROL_LABEL: Record<string, string> = {
  gerencia: 'Gerencia General', comercial: 'Área Comercial', presupuestos: 'Presupuestos',
  jefe_proyectos: 'Jefatura de Proyectos', administrador: 'Administración',
};

export function CotizacionPDF({ d }: { d: PdfData }) {
  const cur = d.moneda === 'USD' ? 'USD' : 'PEN';
  const tc = Number(d.tipoCambio ?? 1);
  const m = (n: number) => fmtMoney(n, cur);
  return (
    <Document title={`COTIZACIÓN ${d.codigo}`}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.brandRow}>
            <View style={s.logoBox}><Image src={LOGO_DATA_URI} style={s.logo} /></View>
            <View>
              <Text style={s.brand}>AZUR</Text>
              <Text style={s.brandSub}>CONSTRUCTORA E INMOBILIARIA</Text>
              <Text style={{ fontSize: 8, marginTop: 4 }}>{d.empresa}</Text>
              {d.rucEmpresa ? <Text style={{ fontSize: 8, color: '#666' }}>{d.rucEmpresa}</Text> : null}
            </View>
          </View>
          <View>
            <Text style={s.codigo}>COTIZACIÓN {d.codigo}</Text>
            <Text style={s.meta}>Fecha: {d.fecha}</Text>
            {d.vigencia ? <Text style={s.meta}>Vigencia: {d.vigencia}</Text> : null}
          </View>
        </View>

        <View style={s.box}>
          <View style={s.rowB}><Text style={s.k}>Proyecto</Text><Text style={s.v}>{d.proyecto}</Text></View>
          <View style={s.rowB}><Text style={s.k}>Cliente</Text><Text style={s.v}>{d.cliente}</Text></View>
          {d.ruc ? <View style={s.rowB}><Text style={s.k}>RUC</Text><Text style={s.v}>{d.ruc}</Text></View> : null}
          {d.ubicacion ? <View style={s.rowB}><Text style={s.k}>Ubicación</Text><Text style={s.v}>{d.ubicacion}</Text></View> : null}
          {d.asunto ? <View style={s.rowB}><Text style={s.k}>Asunto</Text><Text style={s.v}>{d.asunto}</Text></View> : null}
          {d.plazo ? <View style={s.rowB}><Text style={s.k}>Plazo</Text><Text style={s.v}>{d.plazo}</Text></View> : null}
        </View>

        {/* Tabla cliente: ITEM, TÍTULO, UNIDAD, CANTIDAD, P.U., SUBTOTAL */}
        <View style={s.thead}>
          <Text style={[s.th, s.cItem]}>ÍTEM</Text>
          <Text style={[s.th, s.cTit]}>DESCRIPCIÓN</Text>
          <Text style={[s.th, s.cUnd]}>UND</Text>
          <Text style={[s.th, s.cCant]}>CANT</Text>
          <Text style={[s.th, s.cPU]}>P. UNIT</Text>
          <Text style={[s.th, s.cSub]}>SUBTOTAL</Text>
        </View>
        {d.rows.map((r, i) => (
          <View key={i} style={r.esHoja ? s.tr : [s.trParent, { backgroundColor: ['#e3e5e8', '#edeef0', '#f4f5f6'][Math.min(2, r.depth)] }]}>
            <Text style={s.cItem}>{r.codigo}</Text>
            <Text style={[s.cTit, { paddingLeft: r.depth * 8, fontFamily: r.esHoja ? 'Helvetica' : 'Helvetica-Bold' }]}>{r.titulo}</Text>
            <Text style={s.cUnd}>{r.esHoja ? (r.unidad ?? '') : ''}</Text>
            <Text style={s.cCant}>{r.esHoja && r.cantidad ? fmtNumber(r.cantidad, 0) : ''}</Text>
            <Text style={s.cPU}>{r.esHoja ? fmtNumber(r.precio_unitario) : ''}</Text>
            <Text style={[s.cSub, { fontFamily: r.esHoja ? 'Helvetica' : 'Helvetica-Bold' }]}>{fmtNumber(r.subtotal)}</Text>
          </View>
        ))}

        {/* Totales */}
        <View style={{ marginTop: 10 }}>
          {cur === 'USD' ? <View style={s.totRow}><Text style={[s.totLabel, { fontFamily: 'Helvetica-Bold' }]}>Moneda: Dólares (US$) · T.C. {fmtNumber(tc, 3)}</Text><Text style={s.totVal} /></View> : null}
          <View style={s.totRow}><Text style={s.totLabel}>SUBTOTAL</Text><Text style={s.totVal}>{m(d.totales.subtotal)}</Text></View>
          {d.totales.gg != null ? <View style={s.totRow}><Text style={s.totLabel}>Gastos generales</Text><Text style={s.totVal}>{m(d.totales.gg)}</Text></View> : null}
          {d.totales.ga != null ? <View style={s.totRow}><Text style={s.totLabel}>Gastos administrativos</Text><Text style={s.totVal}>{m(d.totales.ga)}</Text></View> : null}
          {d.totales.util != null ? <View style={s.totRow}><Text style={s.totLabel}>Utilidad</Text><Text style={s.totVal}>{m(d.totales.util)}</Text></View> : null}
          {d.totales.igv != null ? <View style={s.totRow}><Text style={s.totLabel}>I.G.V. (18%)</Text><Text style={s.totVal}>{m(d.totales.igv)}</Text></View> : null}
          <View style={s.totRow}><Text style={[s.totLabel, { fontFamily: 'Helvetica-Bold' }]}>TOTAL</Text><Text style={[s.totVal, s.totHi]}>{m(d.totales.total)}</Text></View>
          {d.totales.descuento ? <>
            <View style={s.totRow}><Text style={s.totLabel}>Descuento comercial</Text><Text style={s.totVal}>- {m(d.totales.descuento)}</Text></View>
            <View style={s.totRow}><Text style={[s.totLabel, { fontFamily: 'Helvetica-Bold' }]}>TOTAL CON DESCUENTO</Text><Text style={[s.totVal, s.totHi]}>{m(d.totales.totalConDescuento)}</Text></View>
          </> : null}
          {cur === 'USD' && d.mostrarEquivPen !== false ? <View style={s.totRow}><Text style={s.totLabel}>Equivalente en soles (T.C. {fmtNumber(tc, 3)})</Text><Text style={s.totVal}>{fmtMoney((d.totales.descuento ? d.totales.totalConDescuento : d.totales.total) * tc, 'PEN')}</Text></View> : null}
        </View>

        {/* Condiciones */}
        {d.serviciosIncluidos ? <><Text style={s.sectionTitle}>SERVICIOS INCLUIDOS</Text><Text style={s.cond}>{d.serviciosIncluidos}</Text></> : null}
        {d.serviciosOmitidos ? <><Text style={s.sectionTitle}>SERVICIOS OMITIDOS</Text><Text style={s.cond}>{d.serviciosOmitidos}</Text></> : null}
        {d.garantia ? <><Text style={s.sectionTitle}>GARANTÍA</Text><Text style={s.cond}>{d.garantia}</Text></> : null}

        {d.formaPago && d.formaPago.length ? <>
          <Text style={s.sectionTitle}>FORMA DE PAGO</Text>
          {d.formaPago.map((f, i) => (
            <View key={i} style={s.totRow}>
              <Text style={[s.totLabel, { textAlign: 'left', width: 'auto', flex: 1 }]}>
                {f.esAdelanto ? 'Adelanto — ' : ''}{f.concepto}
              </Text>
              <Text style={[s.totVal, { width: 70 }]}>{fmtNumber(f.porcentaje * 100, 0)}%</Text>
              <Text style={[s.totVal, { width: 90 }]}>{m(d.totales.totalConDescuento * f.porcentaje)}</Text>
            </View>
          ))}
        </> : null}

        {d.medios.length ? <>
          <Text style={s.sectionTitle}>MEDIOS DE PAGO</Text>
          {d.medios.map((m, i) => (
            <View key={i} style={{ marginBottom: 3 }} wrap={false}>
              <Text style={[s.cond, { fontFamily: 'Helvetica-Bold' }]}>{m.banco} — {m.titular}{m.detraccion ? ' (Detracción)' : ''}</Text>
              {m.cuentaSoles ? <Text style={s.cond}>   Soles: Cta {m.cuentaSoles}{m.cciSoles ? ` · CCI ${m.cciSoles}` : ''}</Text> : null}
              {m.cuentaDolares ? <Text style={s.cond}>   Dólares: Cta {m.cuentaDolares}{m.cciDolares ? ` · CCI ${m.cciDolares}` : ''}</Text> : null}
            </View>
          ))}
        </> : null}

        {/* Firma del responsable (abajo a la derecha; con imagen si está registrada) */}
        <View style={{ marginTop: 30, alignItems: 'flex-end' }} wrap={false}>
          <View style={{ alignItems: 'center', width: 220 }}>
            {FIRMA_DATA_URI ? <Image src={FIRMA_DATA_URI} style={{ width: 150, height: 55, objectFit: 'contain', marginBottom: 2 }} /> : <View style={{ height: 40 }} />}
            <View style={{ borderTopWidth: 1, borderTopColor: '#333', width: 200, marginBottom: 4 }} />
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{d.responsable ?? ''}</Text>
            <Text style={{ fontSize: 8, color: '#666' }}>{d.responsableRol ? (ROL_LABEL[d.responsableRol] ?? d.responsableRol) : 'Responsable'} · {d.empresa}</Text>
          </View>
        </View>

        <Text style={s.footer} fixed>AZUR Constructora e Inmobiliaria · {d.empresa} · Cotización {d.codigo}</Text>
      </Page>
    </Document>
  );
}
