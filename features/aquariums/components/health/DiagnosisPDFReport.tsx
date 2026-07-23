// features/aquariums/components/health/DiagnosisPDFReport.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { HybridDiagnosisResponse } from '../../services/gemini-expert.actions';

// Mendaftarkan font bawaan agar PDF terlihat rapi (opsional, tapi disarankan)
Font.register({
  family: 'Open Sans',
  src: 'https://fonts.gstatic.com/s/opensans/v18/mem8YaGs126MiZpBA-UFVZ0e.ttf',
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Open Sans', fontSize: 12, color: '#334155' },
  header: { borderBottom: '2px solid #0d9488', paddingBottom: 10, marginBottom: 20 },
  brand: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  subBrand: { fontSize: 10, color: '#64748b', marginTop: 4 },
  titleSection: { marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase' },
  date: { fontSize: 10, color: '#64748b', marginTop: 5 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: 5, marginBottom: 10, marginTop: 20 },
  summaryBox: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 5, marginBottom: 15 },
  summaryText: { fontSize: 12, lineHeight: 1.5, color: '#0f172a', fontWeight: 'bold' },
  riskLevel: { fontSize: 12, fontWeight: 'bold', marginBottom: 15 },
  listItem: { flexDirection: 'row', marginBottom: 5 },
  bullet: { width: 15, fontWeight: 'bold' },
  itemText: { flex: 1, lineHeight: 1.4 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 9, color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: 10 },
});

interface PDFProps {
  data: HybridDiagnosisResponse;
  date: string;
}

export const DiagnosisPDFReport = ({ data, date }: PDFProps) => {
  // 💡 KUNCI PERBAIKAN: Beritahu TypeScript apa yang harus dilakukan jika data kosong
  if (!data || !data.localDiagnosis) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>Data diagnosis tidak tersedia atau gagal dimuat.</Text>
        </Page>
      </Document>
    );
  }

  // Ekstrak variabel agar kode di bawahnya lebih bersih dan diakui aman oleh TypeScript
  const { localDiagnosis, expertAIExtras } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER LOGO */}
        <View style={styles.header}>
          <Text style={styles.brand}>AquaExpert</Text>
          <Text style={styles.subBrand}>Sistem Pakar & Analisis Ekosistem Akuarium</Text>
        </View>

        {/* JUDUL LAPORAN */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Hasil Diagnosis Ekosistem</Text>
          <Text style={styles.date}>Dicetak pada: {date}</Text>
        </View>

        {/* TINGKAT RISIKO & RINGKASAN */}
        <Text style={[styles.riskLevel, { color: localDiagnosis.riskLevel === 'CRITICAL' ? '#e11d48' : '#0d9488' }]}>
          STATUS RISIKO: {localDiagnosis.riskLevel}
        </Text>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>{localDiagnosis.summary}</Text>
        </View>

        {/* AKAR MASALAH */}
        {localDiagnosis.rootCauses.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Akar Masalah Terdeteksi</Text>
            {localDiagnosis.rootCauses.map((cause, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.itemText}>{cause.title} ({cause.severity.toUpperCase()}) - {cause.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* RENCANA TINDAKAN */}
        {localDiagnosis.nextActions.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Rencana Tindakan (Action Plan)</Text>
            {localDiagnosis.nextActions.map((action, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={styles.bullet}>{i + 1}.</Text>
                <Text style={styles.itemText}>[{action.priority.toUpperCase()}] {action.instruction}</Text>
              </View>
            ))}
          </View>
        )}

        {/* CATATAN AI */}
        {expertAIExtras?.generatedByGemini && expertAIExtras.commentary && (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>Catatan Tambahan Pakar (AI)</Text>
            {/* Karena PDF tidak bisa merender Markdown langsung, kita bersihkan tanda bintang */}
            <Text style={{ fontSize: 10, lineHeight: 1.5 }}>
              {expertAIExtras.commentary.replace(/\*\*/g, '').replace(/\*/g, '')}
            </Text>
          </View>
        )}

        {/* FOOTER */}
        <Text style={styles.footer} fixed>
          Dokumen ini dihasilkan secara otomatis oleh AquaExpert AI Core pada {date}.
        </Text>
      </Page>
    </Document>
  );
};