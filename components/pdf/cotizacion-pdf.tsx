import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { CotizacionTotales } from '@/lib/comercial/apu';

// Usamos Helvetica (default) — más confiable que cargar Google Fonts en serverless

const BRAND = {
  red: '#BE1723',
  bright: '#E20627',
  coral: '#ECA4A9',
  coralSoft: '#F8DDDF',
  ink: '#0A0A0A',
  muted: '#5b5b5b',
  border: '#e3e3e3',
};

const styles = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 56, paddingHorizontal: 36, fontSize: 9, fontFamily: 'Helvetica', color: BRAND.ink },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 36, height: 44 },
  brandName: { fontSize: 16, fontWeight: 700, color: BRAND.red, letterSpacing: 0.5 },
  brandSubtitle: { fontSize: 8, color: BRAND.muted, marginTop: 1, textTransform: 'uppercase', letterSpacing: 1.2 },
  badge: {
    backgroundColor: BRAND.red,
    color: '#fff',
    padding: '4 10',
    borderRadius: 999,
    fontSize: 7.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codigoBox: { alignItems: 'flex-end' },
  codigo: { fontSize: 11, fontWeight: 700, color: BRAND.red, marginTop: 4 },
  meta: { fontSize: 8, color: BRAND.muted, marginTop: 2 },
  hr: { borderTopWidth: 1, borderTopColor: BRAND.border, marginVertical: 14 },

  twoCols: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: BRAND.coralSoft,
    padding: 12,
    borderRadius: 6,
  },
  cardLabel: { fontSize: 7, color: BRAND.red, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  cardTitle: { fontSize: 11, fontWeight: 700, color: BRAND.ink },
  cardText: { fontSize: 8.5, color: BRAND.muted, marginTop: 2 },

  titulo: { fontSize: 14, fontWeight: 700, marginTop: 8, marginBottom: 4 },
  descripcion: { fontSize: 9, color: BRAND.muted, marginBottom: 12, lineHeight: 1.4 },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND.red,
    color: '#fff',
    padding: 8,
    fontSize: 8,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    fontSize: 8.5,
  },
  mono: { fontFamily: 'Helvetica' },
  codigoCell: { color: BRAND.red, fontWeight: 700 },

  totalsBox: { marginTop: 14, alignSelf: 'flex-end', width: '52%' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.border,
    fontSize: 9,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 4,
    backgroundColor: BRAND.red,
    color: '#fff',
    paddingHorizontal: 10,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: BRAND.red,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 6,
  },
  terminosText: { fontSize: 8.5, color: BRAND.muted, lineHeight: 1.5 },

  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    fontSize: 7.5,
    color: BRAND.muted,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    paddingTop: 8,
  },
  pageNumber: { textAlign: 'right', fontSize: 7.5, color: BRAND.muted },
});

type Cliente = {
  razon_social?: string | null;
  ruc?: string | null;
  contacto?: string | null;
  email?: string | null;
  direccion?: string | null;
};

type Partida = {
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  parcial: number;
};

type Props = {
  logoUrl: string;
  codigo: string;
  titulo: string;
  descripcion?: string | null;
  ubicacion?: string | null;
  estado: string;
  fechaEmision: string;
  validezDias: number;
  moneda: 'PEN' | 'USD';
  margenPorcentaje: number;
  ggPorcentaje: number;
  igvPorcentaje: number;
  cliente: Cliente | null;
  partidas: Partida[];
  totales: CotizacionTotales;
  notas?: string | null;
  terminos?: string | null;
};

function fmt(value: number, moneda: 'PEN' | 'USD') {
  const opts: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  if (moneda === 'USD') return `$ ${value.toLocaleString('en-US', opts)}`;
  return `S/ ${value.toLocaleString('es-PE', opts)}`;
}

export function CotizacionPDF({
  logoUrl,
  codigo,
  titulo,
  descripcion,
  ubicacion,
  estado,
  fechaEmision,
  validezDias,
  moneda,
  margenPorcentaje,
  ggPorcentaje,
  igvPorcentaje,
  cliente,
  partidas,
  totales,
  notas,
  terminos,
}: Props) {
  const fechaTxt = new Date(fechaEmision).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Document
      title={`Cotización ${codigo} — AZUR`}
      author="AZUR Constructora e Inmobiliaria"
      subject={titulo}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image src={logoUrl} style={styles.logo} />
            <View>
              <Text style={styles.brandName}>AZUR</Text>
              <Text style={styles.brandSubtitle}>Constructora e Inmobiliaria</Text>
            </View>
          </View>
          <View style={styles.codigoBox}>
            <Text style={styles.badge}>Cotización · {estado}</Text>
            <Text style={styles.codigo}>{codigo}</Text>
            <Text style={styles.meta}>Emisión: {fechaTxt}</Text>
            <Text style={styles.meta}>Validez: {validezDias} días</Text>
          </View>
        </View>

        {/* Título */}
        <Text style={styles.titulo}>{titulo}</Text>
        {descripcion ? <Text style={styles.descripcion}>{descripcion}</Text> : null}

        {/* Cliente y obra */}
        <View style={styles.twoCols}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Cliente</Text>
            <Text style={styles.cardTitle}>{cliente?.razon_social ?? '—'}</Text>
            {cliente?.ruc ? <Text style={styles.cardText}>RUC {cliente.ruc}</Text> : null}
            {cliente?.contacto ? <Text style={styles.cardText}>{cliente.contacto}</Text> : null}
            {cliente?.email ? <Text style={styles.cardText}>{cliente.email}</Text> : null}
            {cliente?.direccion ? <Text style={styles.cardText}>{cliente.direccion}</Text> : null}
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Obra</Text>
            <Text style={styles.cardTitle}>{ubicacion ?? 'A definir'}</Text>
            <Text style={styles.cardText}>Moneda: {moneda === 'USD' ? 'Dólares' : 'Soles'}</Text>
            <Text style={styles.cardText}>
              GG {ggPorcentaje}% · Utilidad {margenPorcentaje}% · IGV {igvPorcentaje}%
            </Text>
          </View>
        </View>

        <View style={styles.hr} />

        {/* Tabla de partidas */}
        <View style={styles.tableHeader}>
          <Text style={{ width: '10%' }}>Código</Text>
          <Text style={{ width: '40%' }}>Descripción</Text>
          <Text style={{ width: '8%' }}>Und</Text>
          <Text style={{ width: '11%', textAlign: 'right' }}>Cantidad</Text>
          <Text style={{ width: '15%', textAlign: 'right' }}>P. Unit</Text>
          <Text style={{ width: '16%', textAlign: 'right' }}>Parcial</Text>
        </View>

        {partidas.map((p, i) => (
          <View key={i} style={styles.tableRow} wrap={false}>
            <Text style={[{ width: '10%', paddingRight: 6 }, styles.codigoCell, styles.mono]}>{p.codigo}</Text>
            <Text style={{ width: '40%', paddingRight: 6 }}>{p.descripcion}</Text>
            <Text style={{ width: '8%', paddingRight: 6 }}>{p.unidad}</Text>
            <Text style={[{ width: '11%', textAlign: 'right', paddingLeft: 6 }, styles.mono]}>
              {p.cantidad.toLocaleString('es-PE', { maximumFractionDigits: 4 })}
            </Text>
            <Text style={[{ width: '15%', textAlign: 'right', paddingLeft: 6 }, styles.mono]}>
              {fmt(p.precio_unitario, moneda)}
            </Text>
            <Text style={[{ width: '16%', textAlign: 'right', paddingLeft: 6 }, styles.mono]}>
              {fmt(p.parcial, moneda)}
            </Text>
          </View>
        ))}

        {/* Totales */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text>Costo directo</Text>
            <Text style={styles.mono}>{fmt(totales.costoDirecto, moneda)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Gastos generales ({ggPorcentaje}%)</Text>
            <Text style={styles.mono}>{fmt(totales.gastosGenerales, moneda)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Utilidad ({margenPorcentaje}%)</Text>
            <Text style={styles.mono}>{fmt(totales.utilidad, moneda)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={{ fontWeight: 700 }}>Subtotal</Text>
            <Text style={[styles.mono, { fontWeight: 700 }]}>{fmt(totales.subtotal, moneda)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>IGV ({igvPorcentaje}%)</Text>
            <Text style={styles.mono}>{fmt(totales.igv, moneda)}</Text>
          </View>
          <View style={styles.totalRowFinal}>
            <Text>TOTAL</Text>
            <Text style={styles.mono}>{fmt(totales.total, moneda)}</Text>
          </View>
        </View>

        {/* Términos */}
        {(notas || terminos) && (
          <>
            {notas ? (
              <>
                <Text style={styles.sectionTitle}>Notas</Text>
                <Text style={styles.terminosText}>{notas}</Text>
              </>
            ) : null}
            {terminos ? (
              <>
                <Text style={styles.sectionTitle}>Términos y condiciones</Text>
                <Text style={styles.terminosText}>{terminos}</Text>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Términos y condiciones</Text>
                <Text style={styles.terminosText}>
                  · Forma de pago: 50% adelanto, 50% contra entrega final. {'\n'}
                  · Validez de la presente cotización: {validezDias} días calendario desde la emisión. {'\n'}
                  · No incluye: trabajos no descritos en el alcance, modificaciones del proyecto y
                  permisos municipales. {'\n'}
                  · Cualquier ampliación o reducción se gestionará vía adicional o deductivo formal.
                </Text>
              </>
            )}
          </>
        )}

        <Text style={styles.footer} fixed>
          AZUR Constructora e Inmobiliaria · Documento generado el{' '}
          {new Date().toLocaleString('es-PE')}
        </Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
