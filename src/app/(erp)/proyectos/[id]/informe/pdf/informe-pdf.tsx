import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { fmtMoney, fmtNumber } from '@/lib/format';
import { LOGO_DATA_URI } from '@/lib/brand-logo';

const AZUR = '#E20627';
const AZUR_DARK = '#BE1723';

const s = StyleSheet.create({
  page: { padding: 32, paddingBottom: 48, fontSize: 9, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: AZUR, paddingBottom: 10, marginBottom: 14 },
  logoBox: { width: 50, height: 50, backgroundColor: '#fff', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: '#eee' },
  logo: { width: 44, height: 44, objectFit: 'contain' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: AZUR },
  brandSub: { fontSize: 7, color: '#666', letterSpacing: 2 },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  meta: { fontSize: 8, color: '#444', textAlign: 'right', marginTop: 2 },

  projHead: { backgroundColor: '#faf3f4', borderWidth: 1, borderColor: '#f0d9dc', borderRadius: 6, padding: 12, marginBottom: 14 },
  projName: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: AZUR_DARK, marginBottom: 6 },
  projGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  projCell: { width: '50%', marginBottom: 3, flexDirection: 'row' },
  projK: { color: '#777', width: 70 },
  projV: { fontFamily: 'Helvetica-Bold', flex: 1 },

  box: { borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 4, padding: 10, marginBottom: 12 },
  rowB: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  k: { color: '#555' },
  vb: { fontFamily: 'Helvetica-Bold' },
  hi: { color: AZUR },
  pos: { color: '#15803d' },

  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: AZUR, marginBottom: 6, marginTop: 4 },
  thead: { flexDirection: 'row', backgroundColor: AZUR, paddingVertical: 4, paddingHorizontal: 4 },
  th: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 8 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e5e5', paddingVertical: 3, paddingHorizontal: 4 },
  trGen: { backgroundColor: '#f1f1f1' },
  cTit: { flex: 1 }, cPct: { width: 58, textAlign: 'right' }, cMon: { width: 78, textAlign: 'right' }, cSal: { width: 78, textAlign: 'right' },
  bold: { fontFamily: 'Helvetica-Bold' },

  galPartida: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: AZUR_DARK, marginTop: 8, marginBottom: 4, borderBottomWidth: 0.5, borderBottomColor: '#e5e5e5', paddingBottom: 2 },
  galRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  galCell: { width: '31%', marginBottom: 8 },
  galImg: { width: '100%', height: 90, objectFit: 'cover', borderRadius: 4, borderWidth: 1, borderColor: '#eee' },
  galPh: { width: '100%', height: 90, borderRadius: 4, borderWidth: 1, borderColor: '#eee', backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  galPhTxt: { fontSize: 7, color: '#999' },
  galCap: { fontSize: 6.5, color: '#666', marginTop: 2 },
  galDesc: { fontSize: 6.5, color: '#333', marginTop: 1 },

  note: { fontSize: 8, color: '#333', marginBottom: 4 },
  noteDate: { fontFamily: 'Helvetica-Bold', color: AZUR_DARK },
  empty: { fontSize: 8, color: '#999', fontStyle: 'italic' },

  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, textAlign: 'center', fontSize: 7, color: '#999', borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 6 },
});

export interface InformeRow {
  titulo: string;
  codigo?: string;
  esGeneral: boolean;
  pctAcum: number;     // 0..1
  valorizado: number;
  saldo: number;
}

export interface InformeFoto {
  url: string;
  fecha: string;
  descripcion?: string | null;
}

export interface InformeGaleria {
  partida: string;
  fotos: InformeFoto[];
}

export interface InformeNota {
  fecha: string;
  texto: string;
}

export interface InformePdfData {
  proyecto: string;
  codigo: string;
  cliente: string;
  direccion: string;
  fechaInforme: string;
  periodo: string;
  rows: InformeRow[];
  contrato: number;
  valorizadoAcum: number;
  porCobrar: number;
  adicionales: number;
  deductivos: number;
  galeria: InformeGaleria[];
  notas: InformeNota[];
  opciones?: { economico?: boolean; avance?: boolean; evidencias?: boolean; observaciones?: boolean };
}

// Image segura: si la url falla, @react-pdf omite el render del nodo y no rompe
// el resto del documento (cada Image se evalúa de forma independiente).
function SafeImage({ url }: { url: string }) {
  try {
    return <Image src={url} style={s.galImg} />;
  } catch {
    return (
      <View style={s.galPh}>
        <Text style={s.galPhTxt}>Imagen no disponible</Text>
      </View>
    );
  }
}

export function InformePDF({ d }: { d: InformePdfData }) {
  const op = d.opciones ?? {};
  const show = (k: keyof NonNullable<InformePdfData['opciones']>) => op[k] !== false;
  return (
    <Document title={`Informe de obra — ${d.codigo}`}>
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View style={s.brandRow}>
            <View style={s.logoBox}><Image src={LOGO_DATA_URI} style={s.logo} /></View>
            <View>
              <Text style={s.brand}>AZUR</Text>
              <Text style={s.brandSub}>CONSTRUCTORA E INMOBILIARIA</Text>
            </View>
          </View>
          <View>
            <Text style={s.title}>INFORME DE OBRA</Text>
            <Text style={s.meta}>{d.codigo} · {d.fechaInforme}</Text>
            <Text style={s.meta}>{d.periodo}</Text>
          </View>
        </View>

        {/* Cabecera del proyecto */}
        <View style={s.projHead}>
          <Text style={s.projName}>{d.proyecto}</Text>
          <View style={s.projGrid}>
            <View style={s.projCell}><Text style={s.projK}>Cliente</Text><Text style={s.projV}>{d.cliente || '—'}</Text></View>
            <View style={s.projCell}><Text style={s.projK}>Código</Text><Text style={s.projV}>{d.codigo || '—'}</Text></View>
            <View style={s.projCell}><Text style={s.projK}>Dirección</Text><Text style={s.projV}>{d.direccion || '—'}</Text></View>
            <View style={s.projCell}><Text style={s.projK}>Fecha</Text><Text style={s.projV}>{d.fechaInforme}</Text></View>
            <View style={s.projCell}><Text style={s.projK}>Periodo</Text><Text style={s.projV}>{d.periodo}</Text></View>
          </View>
        </View>

        {/* Resumen económico */}
        {show('economico') && <>
        <Text style={s.sectionTitle}>Resumen económico</Text>
        <View style={s.box}>
          <View style={s.rowB}><Text style={s.k}>Monto del contrato</Text><Text style={s.vb}>{fmtMoney(d.contrato)}</Text></View>
          <View style={s.rowB}><Text style={s.k}>Valorizado acumulado</Text><Text style={s.vb}>{fmtMoney(d.valorizadoAcum)}</Text></View>
          <View style={s.rowB}><Text style={[s.k, s.vb]}>Por cobrar acumulado</Text><Text style={[s.vb, s.hi]}>{fmtMoney(d.porCobrar)}</Text></View>
          <View style={[s.rowB, { borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 4, marginTop: 2 }]}><Text style={s.k}>Adicionales aprobados</Text><Text style={[s.vb, s.pos]}>+ {fmtMoney(d.adicionales)}</Text></View>
          <View style={s.rowB}><Text style={s.k}>Deductivos aprobados</Text><Text style={[s.vb, s.hi]}>- {fmtMoney(d.deductivos)}</Text></View>
        </View>
        </>}

        {/* Resumen de avance por partida (incluye valorizado/saldo) */}
        {show('avance') && <>
        <Text style={s.sectionTitle}>Resumen de avance por partida</Text>
        <View style={s.thead}>
          <Text style={[s.th, s.cTit]}>PARTIDA</Text>
          <Text style={[s.th, s.cPct]}>% ACUM.</Text>
          <Text style={[s.th, s.cMon]}>VALORIZADO</Text>
          <Text style={[s.th, s.cSal]}>SALDO</Text>
        </View>
        {d.rows.length === 0 ? (
          <View style={s.tr}><Text style={s.empty}>Sin partidas registradas.</Text></View>
        ) : d.rows.map((r, i) => (
          <View key={i} style={[s.tr, ...(r.esGeneral ? [s.trGen] : [])]} wrap={false}>
            <Text style={[s.cTit, ...(r.esGeneral ? [s.bold] : [])]}>{r.codigo ? `${r.codigo}  ` : ''}{r.titulo}</Text>
            <Text style={[s.cPct, ...(r.esGeneral ? [s.bold] : [])]}>{fmtNumber(r.pctAcum * 100, 0)}%</Text>
            <Text style={[s.cMon, ...(r.esGeneral ? [s.bold] : [])]}>{fmtMoney(r.valorizado)}</Text>
            <Text style={[s.cSal, ...(r.esGeneral ? [s.bold] : [])]}>{fmtMoney(r.saldo)}</Text>
          </View>
        ))}
        </>}

        {/* Galería de evidencias */}
        {show('evidencias') && <>
        <Text style={[s.sectionTitle, { marginTop: 12 }]}>Registro fotográfico de obra</Text>
        {d.galeria.length === 0 ? (
          <Text style={s.empty}>Sin evidencias registradas.</Text>
        ) : d.galeria.map((g, gi) => (
          <View key={gi} wrap={false}>
            <Text style={s.galPartida}>{g.partida}</Text>
            <View style={s.galRow}>
              {g.fotos.map((f, fi) => (
                <View key={fi} style={s.galCell} wrap={false}>
                  <SafeImage url={f.url} />
                  <Text style={s.galCap}>{f.fecha}</Text>
                  {f.descripcion ? <Text style={s.galDesc}>{f.descripcion}</Text> : null}
                </View>
              ))}
            </View>
          </View>
        ))}
        </>}

        {/* Notas / observaciones del residente */}
        {show('observaciones') && d.notas.length > 0 && (
          <View wrap={false}>
            <Text style={[s.sectionTitle, { marginTop: 12 }]}>Observaciones del residente</Text>
            {d.notas.map((n, i) => (
              <Text key={i} style={s.note}><Text style={s.noteDate}>{n.fecha}: </Text>{n.texto}</Text>
            ))}
          </View>
        )}

        <Text style={s.footer} fixed render={({ pageNumber, totalPages }) => (
          `AZUR Constructora e Inmobiliaria · Informe de obra · ${d.codigo} · Pág. ${pageNumber} de ${totalPages}`
        )} />
      </Page>
    </Document>
  );
}
