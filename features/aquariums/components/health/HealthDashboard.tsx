// features/aquariums/components/health/HealthDashboard.tsx
"use client";

import { HealthAnalysisResult } from "../../utils/health-engine";
import { getHealthBorder } from "./health-formatters";
import HealthScoreGauge from "./HealthScoreGauge";
import HealthBentoCards from "./HealthBentoCards";
import HealthAlertPanel from "./HealthAlertPanel";
import HealthActionPanel from "./HealthActionPanel";
import { getFriendlyDeductionName } from "../../utils/deduction-labels";

interface Props {
  healthResult: HealthAnalysisResult;
  lang: "id" | "en";
}

export default function HealthDashboard({ healthResult, lang }: Props) {
  let limitingFactor: { key: string; name: string; penalty: number } | null = null;
  let maxPen = 0;
  
  if (healthResult.deductions) {
    for (const [key, val] of Object.entries(healthResult.deductions)) {
      if (val > maxPen) {
        maxPen = val;
        limitingFactor = { 
          key, // Kita butuh kunci asli (key) dari Health Engine untuk memanggil kamus penjelasan
          name: getFriendlyDeductionName(key, lang), 
          penalty: Math.floor(val) 
        };
      }
    }
  }

  // FIX: Kamus Edukatif (Kualitatif) untuk menjelaskan alasan biologis di balik Faktor Pembatas Utama.
  // Peta kunci (key) diambil persis sesuai nama deduksi yang dilempar dari health-engine.ts
  const getLimitingFactorExplanation = (key: string, lang: "id" | "en") => {
    const explanationsId: Record<string, string> = {
      "Critically Low Plant Density": "Kepadatan flora (tanaman) yang sangat sedikit di dalam akuarium berukuran ini membuat daya serap amonia dan nitrat alami menjadi sangat lemah. Hal ini memaksa filter bekerja ekstra keras dan meningkatkan risiko alga meledak.",
      "Low Plant Density": "Jumlah tanaman hidup masih kurang untuk mendukung proses penjernihan air alami dan penyerapan racun.",
      "High Plant Density": "Akuarium terlalu padat oleh tanaman, menutupi area renang bebas yang dibutuhkan ikan pelagis.",
      "Choking Plant Overcrowding": "Hutan tanaman terlalu lebat hingga menutupi arus air (dead spots), menyebabkan penumpukan kotoran organik yang membusuk di dasar tangki.",
      "Missing CO2 for High-Tech Plants": "Beberapa tanaman yang Anda miliki adalah spesies rewel (high-tech) yang mutlak membutuhkan injeksi gas CO2 untuk bisa berfotosintesis. Tanpa CO2, mereka akan layu, mencemari air, dan mati.",
      "Inadequate Lighting for Demanding Flora": "Beberapa tanaman di tangki ini kelaparan cahaya. Intensitas lampu saat ini terlalu lemah untuk menopang kebutuhan fotosintesis mereka.",
      "Inert Substrate for Root Feeders": "Anda menanam spesies yang makan dari akar (Root Feeder) seperti Amazon Sword/Cryptocoryne di atas pasir polos tanpa nutrisi. Akar mereka akan mati kelaparan.",
      "Missing Filtration Data": "Sistem buta terhadap seberapa kuat arus air Anda. Masukkan daya pompa (L/H) di menu Edit agar AI bisa menghitung rasio pergantian air.",
      "Inadequate Filtration Turnover": "Pompa filter Anda terlalu lemah untuk membersihkan air dengan volume dan jumlah ikan sebanyak ini. Limbah akan cepat menumpuk.",
      "Mild Tank Overstocking": "Populasi ikan mulai terasa padat. Kadar oksigen terlarut akan cepat menipis dan kotoran lebih cepat menumpuk.",
      "Severe Tank Overstocking": "Overpopulasi ekstrem! Akuarium sesak napas. Jumlah limbah biologis yang dihasilkan ikan sudah melampaui kemampuan filter mengurainya.",
      "Weighted Territorial Density Conflict": "Tangki terlalu sempit untuk menampung ego ikan teritorial. Agresi fisik dan perebutan wilayah (bullying) tidak bisa dihindari.",
      "Active Disease Outbreak": "Wabah patogen sedang berlangsung! Kehadiran penyakit menular menekan seluruh sistem imun ekosistem.",
      "Schooling Isolation Stress": "Anda memelihara spesies ikan koloni/bergerombol (Schooling) tapi dalam jumlah yang terlalu sedikit (kurang dari batas minimal). Mereka akan merasa tidak aman, stres berat, dan kehilangan warna.",
      "Severe Species Relationship Conflict": "Tabrakan predator dan mangsa. Ikan agresif dicampur dengan spesies yang terlalu kecil atau pemalu.",
      "Nitrate High Accumulation": "Limbah Nitrat terlalu pekat. Walau tak mematikan secepat Amonia, Nitrat tinggi jangka panjang merusak organ internal ikan secara perlahan.",
      "Nitrate Sensitive Species Stress": "Spesies ikan tertentu sangat alergi terhadap limbah organik. Nitrat harus dijaga seminimal mungkin.",
      "Ammonia Poisoning Factor": "Deteksi racun mematikan! Amonia membakar insang dan merusak sistem saraf. Tangki butuh tindakan penyelamatan (ganti air) instan.",
      "Nitrite Poisoning Factor": "Racun Nitrit mencegah darah ikan mengikat oksigen (Penyakit Darah Coklat). Insang akan megap-megap mencari udara.",
      "Outdated Water Parameter": "Data parameter air Anda sudah kedaluwarsa. Diagnosis ini bertumpu pada perkiraan buta karena tes air belum diperbarui.",
      "Overdue Tasks Penalty": "Filter yang kotor dan jadwal ganti air yang diabaikan memicu bom waktu penumpukan racun organik di dalam air.",
      "Zero Plant Ecosystem Risk": "Anda sama sekali tidak menggunakan tanaman hidup, membuat tangki sepenuhnya bergantung 100% pada filter mekanis. Ekosistem sangat rentan runtuh jika mati lampu."
    };

    const explanationsEn: Record<string, string> = {
      "Critically Low Plant Density": "The critically low mass of live plants limits natural ammonia and nitrate absorption. This forces the mechanical filter to overwork and heavily increases the risk of an algae bloom.",
      "Low Plant Density": "Live plant biomass is insufficient to support robust natural bio-filtration and toxin absorption.",
      "High Plant Density": "The tank is overly congested with plants, suffocating the open swimming space required by pelagic fish.",
      "Choking Plant Overcrowding": "An overgrown jungle is choking water circulation, creating dangerous 'dead spots' where organic detritus rots.",
      "Missing CO2 for High-Tech Plants": "You are keeping demanding high-tech plants without pressurized CO2. They will inevitably melt, rot, and spike ammonia levels.",
      "Inadequate Lighting for Demanding Flora": "Several plant species are starving for photons. Your current lighting fixture lacks the PAR/intensity required to sustain them.",
      "Inert Substrate for Root Feeders": "You planted heavy root-feeding species in an inert (barren) substrate. Their root systems will starve without root tabs.",
      "Missing Filtration Data": "The engine is blind to your water flow dynamics. Input your filter's L/H pump capacity in the Edit menu.",
      "Inadequate Filtration Turnover": "Your filter pump is severely underpowered for this volume and bioload. Toxic waste will accumulate rapidly.",
      "Mild Tank Overstocking": "The fish population is dense. Dissolved oxygen depletes faster, and nitrate accumulates quicker.",
      "Severe Tank Overstocking": "Extreme overstocking! The biological waste output wildly exceeds the ecosystem's capacity to process it.",
      "Weighted Territorial Density Conflict": "The tank footprint is too small to handle the egos of territorial species. Physical aggression and bullying are inevitable.",
      "Active Disease Outbreak": "Active pathogen outbreak! A contagious disease is severely suppressing the entire ecosystem's immune defenses.",
      "Schooling Isolation Stress": "You kept schooling/shoaling fish below their minimum required group size. They will suffer extreme insecurity, stress, and loss of color.",
      "Severe Species Relationship Conflict": "Predator/prey mismatch. Aggressive species are housed with vulnerable, peaceful targets.",
      "Nitrate High Accumulation": "Heavy nitrate concentration. While not immediately lethal like ammonia, chronic high nitrates cause slow internal organ failure.",
      "Nitrate Sensitive Species Stress": "Certain fragile species in your tank are highly allergic to organic waste. Nitrates must be kept pristine.",
      "Ammonia Poisoning Factor": "Lethal toxin detected! Ammonia burns gills and damages neural pathways. Requires an immediate emergency water change.",
      "Nitrite Poisoning Factor": "Toxic nitrites prevent fish blood from carrying oxygen (Brown Blood Disease). Fish will suffocate at the surface.",
      "Outdated Water Parameter": "Your water parameter logs are expired. The AI is flying blind on ecosystem chemistry.",
      "Overdue Tasks Penalty": "Clogged filters and neglected water changes act as a ticking time bomb for organic rotting and toxin spikes.",
      "Zero Plant Ecosystem Risk": "You use zero live plants, making the tank 100% reliant on mechanical filters. The ecosystem is highly vulnerable if the power goes out."
    };

    return lang === 'id' 
      ? (explanationsId[key] || "Faktor ini mengganggu stabilitas kenyamanan ekosistem secara keseluruhan.")
      : (explanationsEn[key] || "This factor disrupts the overall comfort and stability of the ecosystem.");
  };

  return (
    <div className="space-y-5">
      {/* KOTAK ATAS UTAMA */}
      <div className={`w-full bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-md border-t-8 border-x border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row gap-8 items-center lg:items-start ${getHealthBorder(healthResult.status)}`}>
        
        {/* KOLOM KIRI: RADAR GAUGE */}
        <HealthScoreGauge 
          score={healthResult.scores.overall} 
          status={healthResult.status} 
          trend={healthResult.trend} 
          lang={lang} 
        />

        {/* KOLOM KANAN: BENTO KOTAK & FAKTOR PEMBATAS */}
        <div className="flex-1 w-full flex flex-col gap-6">
          <HealthBentoCards scores={healthResult.scores} lang={lang} />
          
          {limitingFactor && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl p-5 sm:p-6 flex items-start gap-4 w-full shadow-sm animate-in fade-in slide-in-from-bottom-2">
               <div className="mt-1 text-rose-500 text-2xl md:text-3xl bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm shrink-0">🔥</div>
               <div className="flex-1 text-left">
                 <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-1.5 flex items-center gap-2">
                   {lang === 'id' ? "Faktor Pembatas Utama" : "Main Limiting Factor"}
                   <span className="w-12 h-px bg-rose-200 dark:bg-rose-800/50 hidden sm:block"></span>
                 </p>
                 <h4 className="text-base md:text-lg font-black text-slate-800 dark:text-slate-200 leading-snug mb-2">
                   {limitingFactor.name} 
                   <span className="text-rose-600 dark:text-rose-500 text-sm ml-2 bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 rounded-md align-middle">(-{limitingFactor.penalty} Poin)</span>
                 </h4>
                 {/* FIX: Paragraf penjelasan edukatif ditambahkan di sini */}
                 <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                   {getLimitingFactorExplanation(limitingFactor.key, lang)}
                 </p>
               </div>
            </div>
          )}
        </div>

      </div>

      {/* KOTAK BAWAH: DUAL PANEL ALERTS & ACTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-2">
        <HealthAlertPanel alerts={healthResult.alerts} status={healthResult.status} lang={lang} />
        <HealthActionPanel recommendations={healthResult.recommendations} lang={lang} />
      </div>
    </div>
  );
}