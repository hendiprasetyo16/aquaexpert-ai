// features/algae/components/algae-helpers.tsx
export const getAlgaeDifficultyDesc = (level: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!level) return lang === "id" ? "Tidak diketahui" : "Unknown";
  const l = level.toLowerCase();
  if (lang === "id") {
    if (l === "easy") return "Mudah Diatasi";
    if (l === "medium") return "Lumayan Bandel";
    if (l === "hard") return "Sangat Sulit (Butuh Waktu)";
  } else {
    if (l === "easy") return "Easy to Treat";
    if (l === "medium") return "Moderately Stubborn";
    if (l === "hard") return "Very Difficult (Takes Time)";
  }
  return level;
};

export const getSeverityDesc = (severity: number | undefined, lang: "id" | "en" = "id") => {
  if (!severity) return "-";
  if (severity >= 4) return lang === "id" ? "Bahaya Tinggi" : "High Risk";
  if (severity === 3) return lang === "id" ? "Risiko Sedang" : "Medium Risk";
  return lang === "id" ? "Risiko Rendah" : "Low Risk";
};