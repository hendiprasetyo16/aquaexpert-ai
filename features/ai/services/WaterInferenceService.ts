// features/ai/services/WaterInferenceService.ts

export class WaterInferenceService {
  /**
   * 💡 NEW: ROOT CAUSE INFERENCE ENGINE
   * Menganalisis gejala yang diinput user untuk menebak kondisi air (Amonia/Nitrit/dll)
   * secara heuristik, bahkan ketika data parameter air dari laboratorium kosong.
   */
  static infer(selectedSymptoms: {name_id?: string | null, name_en?: string | null}[]): string[] {
    const issues = new Set<string>();
    
    let gasping = false;
    let redGills = false;
    let clampedFins = false;
    let cloudyEyes = false;
    let lethargic = false;
    
    selectedSymptoms.forEach(sym => {
      const text = `${sym.name_id || ''} ${sym.name_en || ''}`.toLowerCase();
      
      if (text.includes("megap") || text.includes("gasping") || text.includes("permukaan") || text.includes("surface") || text.includes("udara")) gasping = true;
      if (text.includes("insang") || text.includes("gill") || text.includes("merah") || text.includes("red") || text.includes("terbakar") || text.includes("burn")) redGills = true;
      if (text.includes("kuncup") || text.includes("clamped") || text.includes("lipat") || text.includes("folded")) clampedFins = true;
      if (text.includes("selaput") || text.includes("cloudy") || text.includes("keruh") || text.includes("mata") || text.includes("eye")) cloudyEyes = true;
      if (text.includes("diam") || text.includes("dasar") || text.includes("lethargic") || text.includes("bottom")) lethargic = true;
    });

    // 💡 INFERENCE RULES (Hukum Sebab-Akibat)
    // FIX: Menggunakan .add() untuk tipe data Set
    if (gasping && redGills) {
      issues.add("CRITICAL_AMMONIA_SPIKE");
    } else if (gasping && lethargic) {
      issues.add("OXYGEN_DEPLETION_OR_NITRITE");
    }
    
    if (clampedFins && cloudyEyes) {
      issues.add("POOR_WATER_QUALITY_GENERAL");
    }

    return Array.from(issues);
  }
}