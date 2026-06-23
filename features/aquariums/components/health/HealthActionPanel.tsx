// features/aquariums/components/health/HealthActionPanel.tsx
"use client";

import { HeartPulse, CheckCircle2 } from "lucide-react";

interface Props {
  recommendations: string[];
  lang: "id" | "en";
}

export default function HealthActionPanel({ recommendations, lang }: Props) {
  
  // Kamus terjemahan untuk kalimat instruksi dari Health Engine
  const translateAction = (text: string) => {
    if (lang === 'id') return text;
    let t = text;
    t = t.replace(/Segera lakukan penggantian air darurat sebesar/gi, "Immediately perform an emergency water change of");
    t = t.replace(/dan periksa keandalan sirkulasi media biologis filter./gi, "and check biological filter media circulation.");
    t = t.replace(/Puasakan ikan selama 24 jam dan tambahkan dosis bakteri starter guna mempercepat reduksi senyawa toksik./gi, "Fast the fish for 24 hours and add starter bacteria to accelerate toxin reduction.");
    t = t.replace(/Tingkatkan frekuensi penggantian air berkala secara disiplin untuk menurunkan akumulasi senyawa nitrat./gi, "Increase regular water change frequency strictly to reduce nitrate accumulation.");
    t = t.replace(/Kurangi kepadatan populasi fauna atau upgrade dimensi tangki ke ukuran kapasitas volume air yang lebih besar./gi, "Reduce fauna population or upgrade to a larger tank volume.");
    t = t.replace(/Segera input daya laju alir LPH filter pompa Anda untuk memicu akurasi kalkulasi sirkulasi air./gi, "Input your filter pump LPH flow rate to enable accurate circulation calculation.");
    t = t.replace(/Lakukan pembersihan kaca/gi, "Perform glass cleaning");
    t = t.replace(/Tambahkan tanaman/gi, "Add more aquatic plants");
    t = t.replace(/Nyalakan filter/gi, "Turn on the filter");
    return t;
  }

  return (
    <div className="bg-teal-50/50 dark:bg-teal-950/10 p-6 rounded-[2rem] border-2 border-teal-200 dark:border-teal-900/50 shadow-md relative overflow-hidden group">
      <HeartPulse className="absolute -right-4 -bottom-4 w-32 h-32 text-teal-500/5 transform group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
      
      <h4 className="text-sm font-black uppercase text-teal-700 dark:text-teal-400 tracking-widest mb-5 flex items-center gap-2 relative z-10">
        <CheckCircle2 className="w-5 h-5" /> 
        {lang === 'id' ? "Tindakan Disarankan" : "Action Required"}
      </h4>
      
      <ul className="space-y-4 relative z-10">
        {recommendations.length === 0 ? (
          <p className="text-sm font-bold text-teal-600/70 dark:text-teal-400/70 italic">
            {lang === 'id' ? "Tidak ada tindakan mendesak." : "No urgent actions required."}
          </p>
        ) : (
          recommendations.map((rec, i) => (
            <li key={i} className="text-sm font-bold text-teal-900 dark:text-teal-100 flex items-start gap-3 bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-teal-100 dark:border-teal-900/40 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0 mt-1 shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
              <span className="leading-relaxed">{translateAction(rec)}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}