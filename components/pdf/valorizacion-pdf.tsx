import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Usamos Helvetica (default) — más confiable que cargar Google Fonts en serverless

const BRAND = { red: '#BE1723', bright: '#E20627', coral: '#ECA4A9', coralSoft: '#F8DDDF', ink: '#0A0A0A', muted: '#5b5b5b', border: '#e3e3e3' };

const styles = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 50, paddingHorizontal: 28, fontSize: 8, fontFamily: 'Helvetica', color: BRAND.ink },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 32, height: 38 },
  brandName: { fontSize: 14, fontWeight: 700, color: BRAND.red, letterSpacing: 0.4 },
  brandSubtitle: { fontSize: 7, color: BRAND.muted, marginTop: 1, textTransform: 'uppercase', letterSpacing: 1.2 },
  badge: { backgroundColor: BRAND.red, color: '#fff', padding: '3 8', borderRadius: 999, fontSize: 6.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 },
  codigo: { fontSize: 10, fontWeight: 700, color: BRAND.red, marginTop: 3 },
  meta: { fontSize: 7, color: BRAND.muted, marginTop: 1 },

  titulo: { fontSize: 13, fontWeight: 700, marginTop: 8, marginBottom: 4 },
  desc: { fontSize: 8, color: BRAND.muted, marginBottom: 10 },

  twoCols: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  card: { flex: 1, backgroundColor: BRAND.coralSoft, padding: 8, borderRadius: 4 },
  cardLabel: { fontSize: 6, color: BRAND.red, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  cardTitle: { fontSize: 10, fontWeight: 700, color: BRAND.ink },
  cardText: { fontSize: 7.5, color: BRAND.muted, marginTop: 1 },

  tableHeader: { flexDirection: 'row', backgroundColor: BRAND.red, color: '#fff', padding: 5, fontSize: 6.5, fontWeight: 700, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', padding: 4, borderBottomWidth: 0.5, borderBottomColor: BRAND.border, fontSize: 7 },
  codigoCell: { color: BRAND.red, fontWeight: 700 },

  totalsBox: { marginTop: 12, alignSelf: 'flex-end', width: '50%' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: BRAND.border, fontSize: 8 },
  totalRowFinal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, marginTop: 4, backgroundColor: BRAND.red, color: '#fff', paddingHorizontal: 8, borderRadius: 3, fontSize: 10, fontWeight: 700 },

  footer: { position: 'absolute', bottom: 18, left: 28, right: 28, fontSize: 6.5, color: BRAND.muted, textAlign: 'center', borderTopWidth: 0.5, borderTopColor: BRAND.border, paddingTop: 6 },
  pageNumber: { textAlign: 'right', fontSize: 6.5, color: BRAND.muted },
});

type Partida = {
  codigo: string;
  descripcion: string;
  unidad: string;
  metrado_contractual: number;
  metrado_anterior: number;
  metrado_periodo: number;
  metrado_acumulado: number;
  precio_unitario: number;
  monto_periodo: number;
  monto_acumulado: number;
  porcentaje_acumulado: number;
};

type Props = {
  logoUrl: string;
  codigo: string;
  numero: number;
  periodoInicio: string;
  periodoFin: string;
  estado: string;
  proyectoCodigo: string;
  proyectoNombre: string;
  cliente: string | null;
  moneda: 'PEN' | 'USD';
  retencionPct: number;
  igvPct: number;
  amortizacionAdelanto: number;
  partidas: Partida[];
  totales: {
    monto_periodo: number;
    monto_acumulado: number;
    retencion: number;
    igv: number;
    monto_a_pagar: number;
  };
};

function fmt(n: number, moneda: 'PEN' | 'USD') {
  const opts = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return moneda === 'USD' ? `$ ${n.toLocaleString('en-US', opts)}` : `S/ ${n.toLocaleString('es-PE', opts)}`;
}

function fmtN(n: number) {
  return n.toLocaleString('es-PE', { maximumFractionDigits: 4 });
}

export function ValorizacionPDF({
  logoUrl,
  codigo,
  numero,
  periodoInicio,
  periodoFin,
  estado,
  proyectoCodigo,
  proyectoNombre,
  cliente,
  moneda,
  retencionPct,
  igvPct,
  amortizacionAdelanto,
  partidas,
  totales,
}: Props) {
  const fechaTxt = `${new Date(periodoInicio).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
  })} – ${new Date(periodoFin).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })}`;

  return (
    <Document title={`Valorización ${codigo} — ${proyectoCodigo}`} author="AZUR">
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image src={logoUrl} style={styles.logo} />
            <View>
              <Text style={styles.brandName}>AZUR</Text>
              <Text style={styles.brandSubtitle}>Constructora e Inmobiliaria</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.badge}>Valorización</Text>
            <Text style={styles.codigo}>{codigo}</Text>
            <Text style={styles.meta}>N° {numero} · {fechaTxt}</Text>
          </View>
        </View>

        <Text style={styles.titulo}>
          Valorización N° {numero} — {proyectoNombre}
        </Text>
        <Text style={styles.desc}>Proyecto {proyectoCodigo}</Text>

        <View style={styles.twoCols}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Cliente</Text>
            <Text style={styles.cardTitle}>{cliente ?? 'A definir'}</Text>
            <Text style={styles.cardText}>Moneda: {moneda === 'USD' ? 'Dólares' : 'Soles'}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Comerciales</Text>
            <Text style={styles.cardText}>Retención {retencionPct}% · IGV {igvPct}%</Text>
            {amortizacionAdelanto > 0 && (
              <Text style={styles.cardText}>
                Amortización adelanto: {fmt(amortizacionAdelanto, moneda)}
              </Text>
            )}
          </View>
        </View>

        {/* Tabla */}
        <View style={styles.tableHeader}>
          <Text style={{ width: '8%' }}>Cód.</Text>
          <Text style={{ width: '24%' }}>Descripción</Text>
          <Text style={{ width: '5%' }}>Und</Text>
          <Text style={{ width: '8%', textAlign: 'right' }}>M. Contr.</Text>
          <Text style={{ width: '8%', textAlign: 'right' }}>M. Ant.</Text>
          <Text style={{ width: '8%', textAlign: 'right' }}>M. Per.</Text>
          <Text style={{ width: '8%', textAlign: 'right' }}>M. Acum.</Text>
          <Text style={{ width: '9%', textAlign: 'right' }}>P.U.</Text>
          <Text style={{ width: '10%', textAlign: 'right' }}>Periodo</Text>
          <Text style={{ width: '10%', textAlign: 'right' }}>Acumulado</Text>
          <Text style={{ width: '5%', textAlign: 'right' }}>%</Text>
        </View>

        {partidas.map((p, i) => (
          <View key={i} style={styles.tableRow} wrap={false}>
            <Text style={[{ width: '8%' }, styles.codigoCell]}>{p.codigo}</Text>
            <Text style={{ width: '24%', paddingRight: 4 }}>{p.descripcion}</Text>
            <Text style={{ width: '5%' }}>{p.unidad}</Text>
            <Text style={{ width: '8%', textAlign: 'right' }}>{fmtN(p.metrado_contractual)}</Text>
            <Text style={{ width: '8%', textAlign: 'right' }}>{fmtN(p.metrado_anterior)}</Text>
            <Text style={{ width: '8%', textAlign: 'right', fontWeight: 700 }}>{fmtN(p.metrado_periodo)}</Text>
            <Text style={{ width: '8%', textAlign: 'right' }}>{fmtN(p.metrado_acumulado)}</Text>
            <Text style={{ width: '9%', textAlign: 'right' }}>{fmt(p.precio_unitario, moneda)}</Text>
            <Text style={{ width: '10%', textAlign: 'right' }}>{fmt(p.monto_periodo, moneda)}</Text>
            <Text style={{ width: '10%', textAlign: 'right', fontWeight: 700 }}>{fmt(p.monto_acumulado, moneda)}</Text>
            <Text style={{ width: '5%', textAlign: 'right', color: BRAND.red }}>
              {p.porcentaje_acumulado.toFixed(0)}%
            </Text>
          </View>
        ))}

        {/* Totales */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text>Monto del periodo</Text>
            <Text>{fmt(totales.monto_periodo, moneda)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Retención ({retencionPct}%)</Text>
            <Text>-{fmt(totales.retencion, moneda)}</Text>
          </View>
          {amortizacionAdelanto > 0 && (
            <View style={styles.totalRow}>
              <Text>Amortización adelanto</Text>
              <Text>-{fmt(amortizacionAdelanto, moneda)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text>IGV ({igvPct}%)</Text>
            <Text>{fmt(totales.igv, moneda)}</Text>
          </View>
          <View style={styles.totalRowFinal}>
            <Text>MONTO A PAGAR</Text>
            <Text>{fmt(totales.monto_a_pagar, moneda)}</Text>
          </View>
        </View>

        <Text style={styles.footer} fixed>
          AZUR Constructora e Inmobiliaria · Valorización generada el{' '}
          {new Date().toLocaleString('es-PE')}
        </Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            totalPages > 1 ? `Página ${pageNumber} de ${totalPages}` : ''
          }
          fixed
        />
      </Page>
    </Document>
  );
}
