// app/(dashboard)/dashboard/protocols/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { 
  getProtocolMasterDataAction, 
  updateProtocolAction, 
  ProtocolDiseaseDto, 
  ProtocolMedicationDto, 
  DiseaseMedicationDto 
} from "@/features/treatments/actions/protocol.actions";

import { 
  Network, Stethoscope, Pill, Save, Loader2, Search, CheckCircle2, 
  AlertTriangle, FlaskConical, Beaker, Eraser, Info, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

// ============================================================================
// 🧠 OTAK PAKAR VETERINER (PRE-LOADED EXPERT KNOWLEDGE)
// Disesuaikan 100% dengan nama_en dari Database Bapak
// ============================================================================
const AI_EXPERT_DICTIONARY: Record<string, { primary: string[], alt: string[] }> = {
  "White Spot Disease (Ich)": { primary: ["Malachite Green"], alt: ["Methylene Blue", "Aquarium Salt"] },
  "Fin Rot": { primary: ["Kanaplex", "Erythromycin"], alt: ["API Melafix"] },
  "Columnaris": { primary: ["Kanaplex"], alt: ["Erythromycin"] },
  "Dropsy": { primary: ["Kanaplex"], alt: ["Epsom Salt"] },
  "Swim Bladder Disorder": { primary: ["Epsom Salt"], alt: [] },
  "Ammonia Poisoning": { primary: ["Seachem Prime"], alt: [] },
  "Nitrite Poisoning": { primary: ["Methylene Blue"], alt: ["Seachem Prime"] },
  "Hole In Head Disease": { primary: ["Flubendazole"], alt: [] },
  "Velvet Disease": { primary: ["Copper Sulfate"], alt: ["Malachite Green"] },
  "Anchor Worm": { primary: ["Praziquantel"], alt: [] },
  "Popeye": { primary: ["Kanaplex", "Epsom Salt"], alt: ["Erythromycin"] }
};

export default function MedicalProtocolsPage() {
  const { language } = useLanguage();
  const lang = language as "id" | "en";

  const [diseases, setDiseases] = useState<ProtocolDiseaseDto[]>([]);
  const [medications, setMedications] = useState<ProtocolMedicationDto[]>([]);
  const [relations, setRelations] = useState<DiseaseMedicationDto[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string | null>(null);

  const [primaryMeds, setPrimaryMeds] = useState<Set<string>>(new Set());
  const [alternativeMeds, setAlternativeMeds] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    setIsLoading(true);
    const res = await getProtocolMasterDataAction();
    if (res.success) {
      setDiseases(res.diseases);
      setMedications(res.medications);
      setRelations(res.relations);
    } else {
      toast.error(res.error || (lang === 'id' ? "Gagal memuat data." : "Failed to load data."));
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (selectedDiseaseId) {
      const relatedMeds = relations.filter(r => r.disease_id === selectedDiseaseId);
      const pMeds = new Set<string>();
      const aMeds = new Set<string>();
      
      relatedMeds.forEach(rel => {
        if (rel.priority === "Primary") pMeds.add(rel.medication_id);
        else aMeds.add(rel.medication_id);
      });
      setPrimaryMeds(pMeds);
      setAlternativeMeds(aMeds);
    } else {
      setPrimaryMeds(new Set());
      setAlternativeMeds(new Set());
    }
  }, [selectedDiseaseId, relations]);

  const toggleMedication = (medId: string, type: "Primary" | "Alternative") => {
    const newPrimary = new Set(primaryMeds);
    const newAlternative = new Set(alternativeMeds);

    if (type === "Primary") {
      if (newPrimary.has(medId)) { newPrimary.delete(medId); } 
      else { newPrimary.add(medId); newAlternative.delete(medId); }
    } else {
      if (newAlternative.has(medId)) { newAlternative.delete(medId); } 
      else { newAlternative.add(medId); newPrimary.delete(medId); }
    }
    setPrimaryMeds(newPrimary);
    setAlternativeMeds(newAlternative);
  };

  const handleClearAll = () => { setPrimaryMeds(new Set()); setAlternativeMeds(new Set()); };

  // ============================================================================
  // FUNGSI CANGGIH: GENERATE OBAT OTOMATIS BERDASARKAN AI
  // ============================================================================
  const handleApplyAIRecommendation = () => {
    const selectedDiseaseInfo = diseases.find(d => d.id === selectedDiseaseId);
    if (!selectedDiseaseInfo) return;

    // Bersihkan centangan admin yang salah
    handleClearAll();

    const diseaseNameEn = selectedDiseaseInfo.name_en;
    const expertRule = AI_EXPERT_DICTIONARY[diseaseNameEn];

    if (expertRule) {
      const newPrimary = new Set<string>();
      const newAlt = new Set<string>();
      
      expertRule.primary.forEach(medNameEn => {
        const med = medications.find(m => m.name_en === medNameEn);
        if (med) newPrimary.add(med.id);
      });
      
      expertRule.alt.forEach(medNameEn => {
        const med = medications.find(m => m.name_en === medNameEn);
        if (med) newAlt.add(med.id);
      });
      
      setPrimaryMeds(newPrimary);
      setAlternativeMeds(newAlt);
      toast.success(lang === 'id' ? "Rekomendasi Pakar diterapkan! Silakan klik Simpan." : "Expert recommendation applied! Please click Save.");
    } else {
      toast.error(lang === 'id' ? "Belum ada standar pakar untuk penyakit ini." : "No expert standard for this disease yet.");
    }
  };

  const handleSaveProtocol = async () => {
    if (!selectedDiseaseId) return;
    setIsSaving(true);
    const pArray = Array.from(primaryMeds);
    const aArray = Array.from(alternativeMeds);
    const res = await updateProtocolAction(selectedDiseaseId, pArray, aArray);
    
    if (res.success) {
      toast.success(lang === 'id' ? "Protokol medis berhasil disimpan!" : "Medical protocol saved!");
      await fetchData(); 
    } else { toast.error(res.error || "Gagal menyimpan protokol."); }
    setIsSaving(false);
  };

  const filteredMeds = medications.filter(med => 
    (med.name_id.toLowerCase().includes(searchQuery.toLowerCase())) || 
    (med.name_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (med.active_ingredient.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedDiseaseInfo = diseases.find(d => d.id === selectedDiseaseId);

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 transition-colors bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-indigo-600 dark:text-indigo-500 flex items-center gap-3">
                <Network className="h-8 w-8" />
                {lang === 'id' ? "Modul Protokol Medis AI" : "AI Medical Protocol Module"}
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl text-sm font-medium leading-relaxed">
                {lang === 'id' ? "Pusat pengaturan resep AI. Gunakan tombol 'Terapkan Standar Pakar' agar admin tidak salah dalam memilih obat." : "Central control for connecting Diseases and Medications. Data here becomes the core reference for AI prescriptions."}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
            <p className="font-bold animate-pulse">{lang === 'id' ? "Memuat struktur database..." : "Loading database structure..."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* PANEL KIRI */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-rose-500" />
                <h2 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-sm">
                  {lang === 'id' ? "Daftar Penyakit" : "Disease List"}
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {diseases.map(disease => {
                  const isSelected = selectedDiseaseId === disease.id;
                  const connectedMeds = relations.filter(r => r.disease_id === disease.id).length;
                  
                  return (
                    <button key={disease.id} onClick={() => setSelectedDiseaseId(disease.id)} className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex justify-between items-center group ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                      <div>
                        <p className={`font-bold text-sm ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {lang === 'id' ? disease.name_id : disease.name_en}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                          {connectedMeds} {lang === 'id' ? "Obat Terhubung" : "Linked Meds"}
                        </p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-500" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* PANEL KANAN */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[500px]">
              {!selectedDiseaseId ? (
                <div className="flex flex-col items-center justify-center flex-1 p-10 text-center opacity-60">
                  <Network className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                  <h3 className="text-xl font-black text-slate-600 dark:text-slate-400">{lang === 'id' ? "Pilih Penyakit Terlebih Dahulu" : "Select a Disease First"}</h3>
                </div>
              ) : (
                <>
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          {lang === 'id' ? selectedDiseaseInfo?.name_id : selectedDiseaseInfo?.name_en}
                        </h2>
                        <div className="flex gap-4 mt-2">
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">{primaryMeds.size} Utama</span>
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">{alternativeMeds.size} Cadangan</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* TOMBOL AI BARU */}
                        <Button onClick={handleApplyAIRecommendation} className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg shadow-emerald-500/20 text-xs sm:text-sm">
                          <Sparkles className="w-4 h-4 mr-2" /> {lang === 'id' ? "Terapkan Standar AI" : "Apply AI Standard"}
                        </Button>
                        <Button variant="outline" onClick={handleClearAll} className="h-11 rounded-xl font-bold text-red-500 border-red-200">
                          <Eraser className="w-4 h-4" />
                        </Button>
                        <Button onClick={handleSaveProtocol} disabled={isSaving} className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black px-6">
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} 
                          <span className="hidden sm:inline">{lang === 'id' ? "Simpan" : "Save"}</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative max-w-md">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" placeholder={lang === 'id' ? "Cari nama obat..." : "Search medication..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-semibold outline-none focus:border-indigo-500" />
                    </div>
                  </div>

                  <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    <div className="space-y-3">
                      {filteredMeds.map(med => {
                        const isPrimary = primaryMeds.has(med.id);
                        const isAlternative = alternativeMeds.has(med.id);
                        const isSelected = isPrimary || isAlternative;

                        return (
                          <div key={med.id} className={`p-4 rounded-2xl border-2 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isSelected ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100 bg-white'}`}>
                            <div className="flex-1">
                              <h4 className="font-bold text-slate-800 text-sm">{lang === 'id' ? med.name_id : med.name_en}</h4>
                              <p className="text-[10px] font-black uppercase text-slate-500 mt-1">{med.active_ingredient}</p>
                            </div>
                            <div className="flex gap-2 shrink-0 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                              <button onClick={() => toggleMedication(med.id, "Primary")} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${isPrimary ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>
                                Utama
                              </button>
                              <button onClick={() => toggleMedication(med.id, "Alternative")} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${isAlternative ? 'bg-amber-500 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>
                                Cadangan
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}