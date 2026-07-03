// features/aquariums/utils/deduction-labels.ts

/**
 * Daftar terjemahan mutlak untuk semua label deduksi (pengurangan skor).
 * Menangani semua kunci yang dihasilkan oleh health-engine (CamelCase maupun Kalimat).
 */
export const deductionLabels: Record<string, { id: string; en: string }> = {
  // ==========================================
  // KUNCI DARI SISTEM BARU (CamelCase)
  // ==========================================
  ammoniaDeduction: { id: "Keracunan Amonia Berbahaya", en: "Dangerous Ammonia Poisoning" },
  nitriteDeduction: { id: "Penyumbatan Oksigen (Nitrite/Nitrate)", en: "Oxygen Depletion (Nitrite/Nitrate)" },
  nitrateDeduction: { id: "Penumpukan Nitrat Berlebih", en: "Excessive Nitrate Buildup" },
  phDeduction: { id: "pH Merugikan Populasi", en: "Harmful pH Levels" },
  tempDeduction: { id: "Suhu Air Mematikan", en: "Lethal Water Temperature" },
  missingPlantsDeduction: { id: "Kepadatan Tanaman Sangat Rendah", en: "Critically Low Plant Density" },
  missingFishesDeduction: { id: "Tidak Ada Aktivitas Fauna", en: "No Fauna Activity" },
  overstockDeduction: { id: "Kepadatan Fauna Sangat Ekstrem (Overstock)", en: "Extreme Fauna Overstocking" },
  compatibilityDeduction: { id: "Konflik Sosial/Teritorial Spesies", en: "Social/Territorial Species Conflict" },
  maintenanceDeduction: { id: "Tugas Perawatan Tertunda Parah", en: "Severely Overdue Maintenance Tasks" },
  filterFlowDeduction: { id: "Sirkulasi Filter Kurang Memadai", en: "Insufficient Filter Circulation" },

  // ==========================================
  // KUNCI DARI SISTEM LAMA (Format Kalimat)
  // ==========================================
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
  "Missing Filtration Data": { id: "Data LPH Filtrasi Kosong", en: "Missing Filtration Data" },
  "Severe Species Relationship Conflict": { id: "Konflik Sosial/Teritorial Spesies", en: "Severe Species Relationship Conflict" }
};

/**
 * Fungsi untuk mendapatkan nama deduksi yang ramah dibaca (Bilingual)
 * @param key Kunci deduksi dari health-engine
 * @param lang Bahasa yang diinginkan ('id' atau 'en')
 */
export function getFriendlyDeductionName(key: string, lang: "id" | "en" = "id"): string {
  // Bersihkan key (jaga-jaga jika ada spasi tambahan)
  const cleanKey = key.trim();
  
  // Jika terdaftar di kamus raksasa di atas
  if (deductionLabels[cleanKey]) {
    return lang === 'id' ? deductionLabels[cleanKey].id : deductionLabels[cleanKey].en;
  }

  // Peringatan developer jika ada string aneh yang belum diterjemahkan
  if (process.env.NODE_ENV === "development") {
    console.warn(`[AquaExpert Dev Warning]: Key "${cleanKey}" lacks localization mapping.`);
  }

  // Fallback System: Jika key tidak terdaftar sama sekali, ubah camelCase menjadi Title Case bahasa Inggris
  const fallbackEn = cleanKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace('Deduction', '')
    .trim() + " Penalty";

  return lang === 'id' ? `Penalti ${fallbackEn}` : fallbackEn;
}