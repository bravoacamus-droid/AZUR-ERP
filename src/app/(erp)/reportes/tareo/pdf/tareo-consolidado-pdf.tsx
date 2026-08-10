import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { LOGO_DATA_URI } from '@/lib/brand-logo';

const AZUR = '#C02128';
const s = StyleSheet.create({
  page: { paddingHorizontal: 34, paddingTop: 22, paddingBottom: 42, fontSize: 9, fontFamily: 'Helvetica', color: '#1a1a1a' },
  topbar: { height: 5, backgroundColor: AZUR, borderRadius: 2, marginBottom: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: AZUR, paddingBottom: 10, marginBottom: 12 },
  logoBox: { width: 46, height: 46, backgroundColor: '#fff', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: '#eee' },
  logo: { width: 40, height: 40, objectFit: 'contain' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: AZUR },
  brandSub: { fontSize: 6.5, color: '#666', letterSpacing: 1.5 },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: AZUR, textAlign: 'right' },
  fecha: { fontSize: 8.5, color: '#444', textAlign: 'right', marginTop: 2, fontFamily: 'Helvetica-Bold' },
  thead: { flexDirection: 'row', backgroundColor: AZUR, paddingVertical: 5, paddingHorizontal: 6 },
  th: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 8 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e5e5', paddingVertical: 5, paddingHorizontal: 6, alignItems: 'center' },
  trAlt: { backgroundColor: '#fafafa' },
  cell: { fontSize: 8 },
  cNom: { width: '38%', fontFamily: 'Helvetica-Bold' },
  cProy: { width: '14%', textAlign: 'center', color: '#555' },
  cDias: { width: '12%', textAlign: 'right' },
  cHoras: { width: '12%', textAlign: 'right' },
  cExtra: { width: '10%', textAlign: 'right', color: '#b45309' },
  cMonto: { width: '14%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  trTot: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 6, backgroundColor: '#f0e6e6', borderTopWidth: 1, borderTopColor: AZUR },
  nota: { fontSize: 7, color: '#888', marginTop: 8 },
  footer: { position: 'absolute', bottom: 20, left: 34, right: 34, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 6 },
  footerTxt: { fontSize: 7, color: '#999' },
});

export interface TareoConsFila { nombre: string; proyectosN: number; dias: number; horas: number; extra: number; monto: number; correcciones: number }
export interface TareoConsData {
  periodo: string; alcance: string; desde?: string; hasta: string;
  filas: TareoConsFila[]; total: number; fmtMoney: (n: number) => string;
}

export function TareoConsolidadoPDF({ d }: { d: TareoConsData }) {
  return (
    <Document title={`Tareo consolidado — ${d.hasta}`}>
      <Page size="A4" style={s.page}>
        <View style={s.topbar} fixed />
        <View style={s.header} fixed>
          <View style={s.brandRow}>
            <View style={s.logoBox}><Image src={LOGO_DATA_URI} style={s.logo} /></View>
            <View><Text style={s.brand}>Azur</Text><Text style={s.brandSub}>CONSTRUCTORA E INMOBILIARIA</Text></View>
          </View>
          <View>
            <Text style={s.title}>TAREO CONSOLIDADO (USO INTERNO)</Text>
            <Text style={s.fecha}>{d.periodo}{d.alcance ? ` · ${d.alcance}` : ''}</Text>
          </View>
        </View>

        <View style={s.thead}>
          <Text style={[s.cNom, s.th]}>TRABAJADOR</Text>
          <Text style={[s.cProy, s.th]}>PROYECTOS</Text>
          <Text style={[s.cDias, s.th]}>DÍAS</Text>
          <Text style={[s.cHoras, s.th]}>HORAS</Text>
          <Text style={[s.cExtra, s.th]}>EXTRA</Text>
          <Text style={[s.cMonto, s.th]}>MONTO</Text>
        </View>
        {d.filas.length === 0 ? (
          <View style={s.tr}><Text style={s.cell}>Sin tareo en el periodo.</Text></View>
        ) : d.filas.map((f, i) => (
          <View key={i} style={i % 2 === 1 ? [s.tr, s.trAlt] : s.tr} wrap={false}>
            <Text style={[s.cell, s.cNom]}>{f.nombre}{f.correcciones > 0 ? `  (+${f.correcciones} corr.)` : ''}</Text>
            <Text style={[s.cell, s.cProy]}>{f.proyectosN}</Text>
            <Text style={[s.cell, s.cDias]}>{f.dias}</Text>
            <Text style={[s.cell, s.cHoras]}>{f.horas}</Text>
            <Text style={[s.cell, s.cExtra]}>{f.extra || '—'}</Text>
            <Text style={[s.cell, s.cMonto]}>{d.fmtMoney(f.monto)}</Text>
          </View>
        ))}
        {d.filas.length > 0 && (
          <View style={s.trTot}>
            <Text style={[s.cell, s.cNom]}>TOTAL DEL PERIODO</Text>
            <Text style={[s.cell, s.cProy]} /><Text style={[s.cell, s.cDias]} /><Text style={[s.cell, s.cHoras]} /><Text style={[s.cell, s.cExtra]} />
            <Text style={[s.cell, s.cMonto]}>{d.fmtMoney(d.total)}</Text>
          </View>
        )}
        <Text style={s.nota}>Monto = jornal semanal ÷ 48 × horas; la hora extra vale 20% más. Incluye tareo aprobado y pagado del periodo.</Text>

        <View style={s.footer} fixed>
          <Text style={s.footerTxt}>Azur Constructora e Inmobiliaria | Tareo consolidado</Text>
          <Text style={s.footerTxt} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
