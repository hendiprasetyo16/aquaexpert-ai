// features/aquariums/components/health/health-formatters.ts
export const getHealthColor = (status: string) => {
  switch (status) {
    case "Excellent": return "text-emerald-600";
    case "Good": return "text-blue-600";
    case "Warning": return "text-amber-600";
    case "Critical": return "text-rose-600";
    default: return "text-slate-600";
  }
};

export const getHealthBg = (status: string) => {
  switch (status) {
    case "Excellent": return "bg-emerald-600";
    case "Good": return "bg-blue-600";
    case "Warning": return "bg-amber-500";
    case "Critical": return "bg-rose-600";
    default: return "bg-slate-600";
  }
};

export const getHealthBorder = (status: string) => {
  switch (status) {
    case "Excellent": return "border-emerald-500";
    case "Good": return "border-blue-500";
    case "Warning": return "border-amber-500";
    case "Critical": return "border-rose-500";
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