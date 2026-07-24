// components/pdf/GlobalExpertPDFReport.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, Svg, Path, Circle } from '@react-pdf/renderer';

// Font untuk PDF
Font.register({
  family: 'Open Sans',
  src: 'https://fonts.gstatic.com/s/opensans/v18/mem8YaGs126MiZpBA-UFVZ0e.ttf',
});

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Open Sans', color: '#334155' },
  header: { borderBottom: '2px solid #0d9488', paddingBottom: 10, marginBottom: 20 },
  brand: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  subBrand: { fontSize: 9, color: '#64748b', marginTop: 4 },
  titleSection: { marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase' },
  date: { fontSize: 9, color: '#64748b', marginTop: 5 },
  
  resultCard: { border: '1px solid #cbd5e1', borderRadius: 8, padding: 15, marginBottom: 25, backgroundColor: '#ffffff' },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 10, marginBottom: 15 },
  speciesName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  scoreBadge: { fontSize: 9, backgroundColor: '#f0fdfa', color: '#0d9488', padding: '4 8', borderRadius: 4, fontWeight: 'bold', border: '1px solid #ccfbf1' },
  
  cardBody: { flexDirection: 'row' },
  leftCol: { width: '35%', marginRight: 15 },
  imageContainer: { width: '100%', height: 160, borderRadius: 6, overflow: 'hidden', border: '1px solid #e2e8f0' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  rightCol: { flex: 1 },
  
  descBox: { border: '1px solid #e2e8f0', borderRadius: 6, padding: 10, marginBottom: 10, backgroundColor: '#f8fafc' },
  boxTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 6, color: '#0f172a' },
  
  impactBox: { border: '1px solid #fecaca', borderRadius: 6, padding: 10, marginBottom: 10, backgroundColor: '#fef2f2' },
  impactTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 6, color: '#be123c' },
  impactTagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  // 💡 PERBAIKAN: Menggunakan margin karena PDF kadang tidak support property 'gap'
  impactTag: { backgroundColor: '#ffe4e6', color: '#be123c', padding: '3 6', borderRadius: 4, fontSize: 8, fontWeight: 'bold', border: '1px solid #fecdd3', marginRight: 4, marginBottom: 4 },

  gridRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'stretch' },
  causeBox: { flex: 1, backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: 10, marginRight: 4 },
  causeTitle: { fontSize: 10, fontWeight: 'bold', color: '#b45309', marginBottom: 6 },
  
  actionBox: { flex: 1, backgroundColor: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 6, padding: 10, marginLeft: 4 },
  actionTitle: { fontSize: 10, fontWeight: 'bold', color: '#0f766e', marginBottom: 6 },
  actionSubTitle: { fontSize: 9, fontWeight: 'bold', color: '#0d9488', marginTop: 6, marginBottom: 4 }, 

  listItem: { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-start' },
  itemText: { flex: 1, fontSize: 9, color: '#334155', lineHeight: 1.4 },
  
  emptyText: { fontStyle: 'italic', color: '#94a3b8', fontSize: 9 },
  footer: { position: 'absolute', bottom: 20, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: 10 },
});

// 💡 KOMPONEN SVG UNTUK CENTANG & TITIK (DIJAMIN MUNCUL DI PDF)
const CheckIcon = () => (
  <View style={{ width: 10, height: 10, marginRight: 5, marginTop: 1 }}>
    <Svg viewBox="0 0 24 24">
      <Path d="M20 6L9 17L4 12" stroke="#0d9488" strokeWidth={3} fill="none" />
    </Svg>
  </View>
);

const DotIcon = () => (
  <View style={{ width: 4, height: 4, marginRight: 6, marginTop: 3.5, marginLeft: 2 }}>
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

        <Text style={styles.footer} fixed>
          {data.dict.footerText}
        </Text>
      </Page>
    </Document>
  );
};