// features/aquariums/components/health/health-formatters.ts

export const getHealthColor = (status: string) => {
  switch (status) {
    case "Excellent": return "text-emerald-500";
    case "Good": return "text-blue-500";
    case "Warning": return "text-amber-500";
    case "Critical": return "text-red-500";
    default: return "text-slate-500";
  }
};

export const getHealthBg = (status: string) => {
  switch (status) {
    case "Excellent": return "bg-emerald-500";
    case "Good": return "bg-blue-500";
    case "Warning": return "bg-amber-500";
    case "Critical": return "bg-red-500";
    default: return "bg-slate-500";
  }
};

export const getHealthBorder = (status: string) => {
  switch (status) {
    case "Excellent": return "border-emerald-500";
    case "Good": return "border-blue-500";
    case "Warning": return "border-amber-500";
    case "Critical": return "border-red-500";
    default: return "border-slate-500";
  }
};

export const getHealthStatusText = (status: string, isEn: boolean) => {
  if (isEn) return status.toUpperCase();
  switch (status) {
    case "Excellent": return "SEMPURNA";
    case "Good": return "BAIK";
    case "Warning": return "PERINGATAN";
    case "Critical": return "KRITIS";
    default: return status.toUpperCase();
  }
};

export const getTrendIcon = (trend: string, lang: "id" | "en") => {
  switch (trend) {
    case "improving": return lang === 'id' ? "↗ Membaik" : "↗ Improving";
    case "declining": return lang === 'id' ? "↘ Memburuk" : "↘ Declining";
    default: return lang === 'id' ? "→ Stabil" : "→ Stable";
  }
};

export const translateHealthAlert = (text: string, isEn: boolean) => {
  if (!isEn) return text; 
  let t = text;
  t = t.replace("Kondisi Keseluruhan Kritis: Kualitas air yang buruk mengancam stabilitas seluruh ekosistem.", "Overall Condition Critical: Poor water quality threatens entire ecosystem stability.");
  t = t.replace("Kondisi Keseluruhan Kritis: Kepadatan biologis melebihi kapasitas ekosistem.", "Overall Condition Critical: Biological density exceeds ecosystem capacity.");
  t = t.replace("Kondisi ekosistem sangat stabil dan harmonis.", "Ecosystem is very stable and harmonious.");
  t = t.replace("Kondisi ekosistem stabil.", "Stable ecosystem conditions.");
  t = t.replace("Tidak ada log parameter air.", "No water parameter logs found.");
  t = t.replace("Tidak ada tanaman hidup untuk menyerap nitrat berlebih secara alami.", "No live plants to naturally absorb excess nitrates.");
  t = t.replace("pH terlalu asam", "pH is too acidic");
  t = t.replace("pH terlalu basa", "pH is too alkaline");
  t = t.replace("Suhu air terlalu panas", "Water temperature is too hot");
  t = t.replace("Suhu terlalu dingin", "Temperature is too cold");
  t = t.replace("Peringatan: Nitrit mulai terdeteksi.", "Warning: Nitrite is beginning to be detected.");
  t = t.replace("Bahaya: Amonia terdeteksi", "Danger: Ammonia detected");
  t = t.replace("Kritis: Kadar Nitrit tinggi", "Critical: High Nitrite levels");
  t = t.replace("Kadar Nitrat tinggi", "High Nitrate levels");
  t = t.replace("memicu ledakan alga.", "triggers algae blooms.");
  t = t.replace("Overstocking Ekstrem:", "Extreme Overstocking:");
  t = t.replace("Overcrowded Plants:", "Overcrowded Plants:");
  t = t.replace("Penundaan perawatan:", "Maintenance delay:");
  t = t.replace("Kritis: Data parameter air sangat usang", "Critical: Water parameter data is highly outdated");
  t = t.replace("Peringatan: Log parameter air belum diperbarui > 1 bulan.", "Warning: Water parameter log not updated > 1 month.");
  t = t.replace("Info: Data parameter air sudah melewati 14 hari.", "Info: Water parameter data is over 14 days old.");
  t = t.replace("Beban biologis (Bioload) hampir melampaui batas aman kapasitas tampung.", "Biological load (Bioload) is approaching safe capacity limits.");
  return t;
};

export const translateHealthRec = (text: string, isEn: boolean) => {
  if (!isEn) return text;
  let t = text;
  t = t.replace("Lanjutkan rutinitas perawatan hebat Anda!", "Continue your great maintenance routine!");
  t = t.replace("Lakukan pengujian parameter air dasar (pH, Ammonia) sebagai langkah awal diagnosis.", "Perform basic water parameter testing (pH, Ammonia) as an initial diagnostic step.");
  t = t.replace("Pertimbangkan menanam tanaman low-light sebagai filter penunjang biologis.", "Consider planting low-light plants as a biological support filter.");
  t = t.replace("Kurangi populasi fauna atau pindahkan ke tank berukuran lebih besar.", "Reduce fauna population or move them to a larger tank.");
  t = t.replace("Segera lakukan water change 50% dan tambahkan bakteri starter.", "Immediately perform a 50% water change and add starter bacteria.");
  t = t.replace("Siklus nitrogen belum stabil. Ganti air 30% dan puasakan ikan.", "Nitrogen cycle is not stable. Change 30% water and fast the fishes.");
  t = t.replace("Tingkatkan frekuensi ganti air berkala dan bersihkan media mekanis.", "Increase frequency of periodic water changes and clean mechanical media.");
  t = t.replace("Segera uji parameter air secara menyeluruh.", "Immediately test water parameters thoroughly.");
  t = t.replace("Jadwalkan pengujian air minggu ini.", "Schedule water testing this week.");
  t = t.replace("Sebaiknya lakukan tes air ringan (Amonia/pH) dalam waktu dekat.", "Consider a light water test (Ammonia/pH) soon.");
  t = t.replace("Tambahkan kipas (cooling fan) atau nyalakan aerasi maksimal.", "Add a cooling fan or maximize aeration.");
  t = t.replace("Periksa termostat heater dan pastikan sirkulasi air di sekitarnya lancar.", "Check heater thermostat and ensure good water circulation around it.");
  t = t.replace("Selesaikan sisa tunggakan pemeliharaan fisik untuk menghindari kelelahan ekosistem.", "Complete pending physical maintenance to avoid ecosystem fatigue.");
  t = t.replace("Segera pindahkan ikan ke tank lain. Risiko amonia spike sangat tinggi.", "Immediately move fish to another tank. High risk of ammonia spike.");
  t = t.replace("Tingkatkan filtrasi biologis dan pertahankan disiplin jadwal ganti air.", "Increase biological filtration and maintain strict water change schedule.");
  t = t.replace("Lakukan pemangkasan untuk mencegah dead-spots sirkulasi dan busuk daun.", "Perform trimming to prevent circulation dead-spots and leaf rot.");
  t = t.replace("Cek sumber air atau periksa benda yang menurunkan pH (seperti kayu atau daun ketapang berlebih).", "Check water source or items lowering pH (like excessive driftwood or catappa leaves).");
  t = t.replace("Kurangi penggunaan bebatuan kapur (limestone) jika bukan tank cichlid Afrika.", "Reduce limestone usage unless it is an African cichlid tank.");
  return t;
};