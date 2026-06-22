// features/aquariums/utils/deduction-labels.ts

/**
 * Menerjemahkan kunci internal Health Engine menjadi bahasa yang ramah pengguna (Bilingual)
 */
export function getFriendlyDeductionName(key: string, lang: 'id' | 'en'): string {
  const mapper: Record<string, { id: string, en: string }> = {
    "Outdated Water Parameter": { id: "Data Air Sangat Usang", en: "Outdated Water Logs" },
    "Ammonia Poisoning Factor": { id: "Keracunan Amonia Berbahaya", en: "Ammonia Poisoning" },
    "Nitrite Poisoning Factor": { id: "Penyumbatan Oksigen (Nitrit)", en: "Nitrite Poisoning" },
    "Species pH Mismatch": { id: "Ketidakcocokan pH Ekstrem", en: "Species pH Mismatch" },
    "Species Temperature Mismatch": { id: "Suhu Merusak Metabolisme Ikan", en: "Species Temperature Mismatch" },
    "Weighted Species pH Mismatch": { id: "pH Merugikan Populasi", en: "Weighted Species pH Mismatch" },
    "Weighted Species Temperature Mismatch": { id: "Suhu Berbahaya Bagi Populasi", en: "Weighted Species Temperature Mismatch" },
    "Nitrate High Accumulation": { id: "Penumpukan Nitrat Berlebih", en: "High Nitrate Accumulation" },
    "Nitrate Sensitive Species Stress": { id: "Spesies Rentan Terpapar Nitrat", en: "Nitrate Sensitive Species Stress" },
    "Unstable pH Level": { id: "Fluktuasi pH Tangki", en: "Unstable pH Level" },
    "Thermal Deviation Stress": { id: "Deviasi Suhu Air", en: "Thermal Deviation Stress" },
    "Missing Water Logs": { id: "Tidak Ada Data Tes Air", en: "Missing Water Logs" },
    "Neglected Invasive Plant Growth": { id: "Tanaman Invasif Tak Terawat", en: "Neglected Invasive Flora" },
    "Overdue Tasks Penalty": { id: "Perawatan Menunggak", en: "Overdue Maintenance" },
    "Severe Tank Overstocking": { id: "Kepadatan Fauna Sangat Ekstrem (Overstock)", en: "Severe Overstocking" },
    "Mild Tank Overstocking": { id: "Beban Biologis Penuh", en: "Mild Overstocking" },
    "Weighted Territorial Density Conflict": { id: "Sengketa Area (Konflik Teritorial)", en: "Territorial Density Conflict" },
    "Inadequate Filtration Turnover": { id: "Arus Filtrasi (LPH) Terlalu Lemah", en: "Inadequate Filtration" },
    "Active Disease Outbreak": { id: "Wabah Penyakit Aktif di Tangki", en: "Active Disease Outbreak" },
    "Quarantined Fish Presence": { id: "Adanya Ikan Karantina", en: "Quarantined Fish Presence" },
    "Schooling Isolation Stress": { id: "Ikan Kesepian (Stres Schooling)", en: "Schooling Isolation Stress" },
    "Critically Low Plant Density": { id: "Kepadatan Tanaman Sangat Rendah", en: "Critically Low Plant Density" },
    "Low Plant Density": { id: "Kepadatan Tanaman Rendah", en: "Low Plant Density" },
    "High Plant Density": { id: "Kepadatan Tanaman Tinggi", en: "High Plant Density" },
    "Choking Plant Overcrowding": { id: "Tanaman Terlalu Padat (Menyumbat)", en: "Overcrowded Flora" },
    "Inert Substrate for Root Feeders": { id: "Substrat Pasif Buat Tanaman Akar", en: "Inert Substrate for Root Feeders" },
    "Zero Plant Ecosystem Risk": { id: "Risiko Tangki Tanpa Tanaman", en: "Zero Plant Ecosystem Risk" },
    "Missing CO2 for High-Tech Plants": { id: "Defisit Gas CO2 untuk Tanaman High-Tech", en: "Missing CO2 for High-Tech Plants" },
    "Inadequate Lighting for Demanding Flora": { id: "Intensitas Lampu Kurang Memadai", en: "Inadequate Lighting for Demanding Flora" },
    
    // FIX V1.4: Dua key tambahan dari update Health Engine terakhir
    "Missing Filtration Data": { id: "Data LPH Filtrasi Kosong", en: "Missing Filtration Data" },
    "Severe Species Relationship Conflict": { id: "Konflik Sosial/Teritorial Spesies", en: "Severe Species Relationship Conflict" }
  };

  const localizedValue = mapper[key]?.[lang];

  if (!localizedValue) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[AquaExpert Dev Warning]: Key "${key}" lacks localization mapping.`);
    }
    return lang === "id" ? "Faktor Ekosistem Tidak Dikenal" : "Unknown Ecosystem Factor";
  }

  return localizedValue;
}