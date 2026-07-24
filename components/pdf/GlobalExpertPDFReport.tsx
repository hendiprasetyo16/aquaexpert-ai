// components/pdf/GlobalExpertPDFReport.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, Svg, Path, Circle } from '@react-pdf/renderer';

// Font untuk PDF
Font.register({
  family: 'Open Sans',
  src: 'https://fonts.gstatic.com/s/opensans/v18/mem8YaGs126MiZpBA-UFVZ0e.ttf',
});

const styles = StyleSheet.create({
  page: { 
    paddingTop: 25, 
    paddingBottom: 40, 
    paddingHorizontal: 25, 
    fontFamily: 'Open Sans', 
    color: '#334155',
    position: 'relative'
  },
  header: { borderBottom: '2px solid #0d9488', paddingBottom: 8, marginBottom: 15 },
  brand: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  subBrand: { fontSize: 8, color: '#64748b', marginTop: 2 },
  titleSection: { marginBottom: 15, textAlign: 'center' },
  title: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase' },
  date: { fontSize: 8, color: '#64748b', marginTop: 3 },
  
  // 💡 PERBAIKAN: Mengurangi margin dan padding agar lebih padat & muat banyak per halaman
  resultCard: { border: '1px solid #cbd5e1', borderRadius: 6, padding: 10, marginBottom: 12, backgroundColor: '#ffffff' },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 10 },
  speciesName: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  scoreBadge: { fontSize: 8, backgroundColor: '#f0fdfa', color: '#0d9488', padding: '3 6', borderRadius: 4, fontWeight: 'bold', border: '1px solid #ccfbf1' },
  
  cardBody: { flexDirection: 'row' },
  leftCol: { width: '30%', marginRight: 10 },
  imageContainer: { width: '100%', height: 130, borderRadius: 5, overflow: 'hidden', border: '1px solid #e2e8f0' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  rightCol: { flex: 1 },
  
  descBox: { border: '1px solid #e2e8f0', borderRadius: 5, padding: 8, marginBottom: 8, backgroundColor: '#f8fafc' },
  boxTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 4, color: '#0f172a' },
  
  impactBox: { border: '1px solid #fecaca', borderRadius: 5, padding: 8, marginBottom: 8, backgroundColor: '#fef2f2' },
  impactTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 4, color: '#be123c' },
  impactTagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  impactTag: { backgroundColor: '#ffe4e6', color: '#be123c', padding: '2 5', borderRadius: 3, fontSize: 7, fontWeight: 'bold', border: '1px solid #fecdd3', marginRight: 3, marginBottom: 3 },

  gridRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'stretch' },
  causeBox: { flex: 1, backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 5, padding: 8, marginRight: 3 },
  causeTitle: { fontSize: 9, fontWeight: 'bold', color: '#b45309', marginBottom: 4 },
  
  actionBox: { flex: 1, backgroundColor: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 5, padding: 8, marginLeft: 3 },
  actionTitle: { fontSize: 9, fontWeight: 'bold', color: '#0f766e', marginBottom: 4 },
  actionSubTitle: { fontSize: 8, fontWeight: 'bold', color: '#0d9488', marginTop: 4, marginBottom: 3 }, 

  listItem: { flexDirection: 'row', marginBottom: 3, alignItems: 'flex-start' },
  itemText: { flex: 1, fontSize: 8, color: '#334155', lineHeight: 1.3 },
  
  emptyText: { fontStyle: 'italic', color: '#94a3b8', fontSize: 8 },
  
  // 💡 FOOTER STATIS DI BAWAH HALAMAN
  footer: { position: 'absolute', bottom: 15, left: 25, right: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', fontSize: 7, color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: 6 },
});

const CheckIcon = () => (
  <View style={{ width: 8, height: 8, marginRight: 4, marginTop: 1 }}>
    <Svg viewBox="0 0 24 24">
      <Path d="M20 6L9 17L4 12" stroke="#0d9488" strokeWidth={3} fill="none" />
    </Svg>
  </View>
);

const DotIcon = () => (
  <View style={{ width: 3, height: 3, marginRight: 5, marginTop: 3, marginLeft: 2 }}>
    <Svg viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="12" fill="#d97706" />
    </Svg>
  </View>
);

export interface UniversalPDFData {
  reportTitle: string;
  date: string;
  dict: {
    subBrand: string;
    analysis: string;
    impacts: string;
    causes: string;
    treatment: string;
    prevention: string;
    emptyNotes: string;
    empty: string;
    footerText: string;
  };
  results: {
    name: string;
    imageUrl?: string; 
    scoreText: string;
    reasons: string[];
    causes: string[];
    treatments: string[];
    preventions: string[];
    impacts: string[];
  }[];
}

export const GlobalExpertPDFReport = ({ data }: { data: UniversalPDFData }) => {
  if (!data || !data.results) {
    return (
      <Document>
        <Page size="A4" style={styles.page}><Text>No data available.</Text></Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>AquaExpert</Text>
          <Text style={styles.subBrand}>{data.dict.subBrand}</Text>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title}>{data.reportTitle}</Text>
          <Text style={styles.date}>{data.date}</Text>
        </View>

        {data.results.map((item, index) => (
          <View key={index} style={styles.resultCard} wrap={false}>
            <View style={styles.cardHeader}>
              <Text style={styles.speciesName}>{index + 1}. {item.name}</Text>
              <Text style={styles.scoreBadge}>{item.scoreText}</Text>
            </View>

            <View style={styles.cardBody}>
              {item.imageUrl && (
                <View style={styles.leftCol}>
                  <View style={styles.imageContainer}>
                    <Image src={item.imageUrl} style={styles.image} />
                  </View>
                </View>
              )}

              <View style={styles.rightCol}>
                
                <View style={styles.descBox}>
                  <Text style={styles.boxTitle}>{data.dict.analysis}</Text>
                  {item.reasons.length > 0 ? item.reasons.map((r, i) => (
                    <View key={i} style={styles.listItem}>
                      <CheckIcon />
                      <Text style={styles.itemText}>{r}</Text>
                    </View>
                  )) : <Text style={styles.emptyText}>{data.dict.emptyNotes}</Text>}
                </View>

                {item.impacts && item.impacts.length > 0 && (
                  <View style={styles.impactBox}>
                    <Text style={styles.impactTitle}>{data.dict.impacts}</Text>
                    <View style={styles.impactTagsContainer}>
                      {item.impacts.map((impact, i) => (
                        <Text key={i} style={styles.impactTag}>{impact}</Text>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.gridRow}>
                  <View style={styles.causeBox}>
                    <Text style={styles.causeTitle}>{data.dict.causes}</Text>
                    {item.causes.length > 0 ? item.causes.map((c, i) => (
                      <View key={i} style={styles.listItem}>
                        <DotIcon />
                        <Text style={styles.itemText}>{c}</Text>
                      </View>
                    )) : <Text style={styles.emptyText}>{data.dict.empty}</Text>}
                  </View>

                  <View style={styles.actionBox}>
                    <Text style={styles.actionTitle}>{data.dict.treatment}</Text>
                    
                    {item.treatments.length > 0 ? item.treatments.map((t, i) => (
                      <View key={i} style={styles.listItem}>
                        <CheckIcon />
                        <Text style={styles.itemText}>{t}</Text>
                      </View>
                    )) : <Text style={styles.emptyText}>{data.dict.empty}</Text>}

                    {item.preventions.length > 0 && (
                      <>
                        <Text style={styles.actionSubTitle}>{data.dict.prevention}</Text>
                        {item.preventions.map((p, i) => (
                          <View key={i} style={styles.listItem}>
                            <CheckIcon />
                            <Text style={styles.itemText}>{p}</Text>
                          </View>
                        ))}
                      </>
                    )}
                  </View>
                </View>

              </View>
            </View>
          </View>
        ))}

        {/* FOOTER STATIS DENGAN NOMOR HALAMAN OTOMATIS */}
        <View style={styles.footer} fixed>
          <Text>{data.dict.footerText}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};