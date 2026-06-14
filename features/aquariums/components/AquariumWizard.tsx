// features/aquariums/components/AquariumWizard.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/providers/LanguageProvider";
import { createAquariumAction } from "../actions/aquarium.actions";
import { CreateAquariumInput } from "../types/aquarium.types";
import { AquariumDictionary } from "./aquarium-helpers";
import { createAquariumSchema } from "../validations/aquarium.schema";
import { 
  TANK_TYPES, SUBSTRATE_TYPES, FILTER_TYPES, 
  LIGHT_TYPES, CO2_TYPES, FERTILIZER_TYPES 
} from "../constants/aquarium-options";
import { 
  CheckCircle2, ChevronLeft, ChevronRight, Save, 
  Ruler, Settings2, Droplets, Info, Loader2, Container 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AquariumWizard() {
  const { dict, language } = useLanguage();
  const router = useRouter();
  
  // SOLUSI UX: Penjelasan Bahasa Manusia Awam
  const aqDict = (dict as any)?.aquarium as AquariumDictionary | undefined;
  const wizDict = aqDict?.wizard || {
    step1: language === 'id' ? "Identitas" : "Identity",
    step2: language === 'id' ? "Dimensi" : "Dimensions",
    step3: language === 'id' ? "Peralatan" : "Equipment",
    step4: language === 'id' ? "Perawatan" : "Maintenance",
    btnNext: language === 'id' ? "Selanjutnya" : "Next",
    btnPrev: language === 'id' ? "Kembali" : "Previous",
    btnSave: language === 'id' ? "Simpan Akuarium" : "Save Aquarium",
    labels: {
      name: language === 'id' ? "Nama Akuarium" : "Aquarium Name",
      tankType: language === 'id' ? "Jenis Tema Akuarium" : "Aquascape Style",
      setupDate: language === 'id' ? "Tanggal Setup Awal" : "Initial Setup Date",
      isPrimary: language === 'id' ? "Jadikan Tangki Utama" : "Set as Primary Tank",
      length: language === 'id' ? "Panjang (cm)" : "Length (cm)",
      width: language === 'id' ? "Lebar (cm)" : "Width (cm)",
      height: language === 'id' ? "Tinggi (cm)" : "Height (cm)",
      volume: language === 'id' ? "Volume Estimasi (Liter)" : "Estimated Volume (Liters)",
      filter: language === 'id' ? "Sistem Filter" : "Filtration System",
      filterCapacity: language === 'id' ? "Kapasitas Pompa (L/H)" : "Pump Flow Rate (L/H)",
      light: language === 'id' ? "Jenis Lampu" : "Lighting Type",
      lightWatt: language === 'id' ? "Daya Lampu (Watt)" : "Light Power (Watts)",
      lightHours: language === 'id' ? "Durasi Nyala (Jam/Hari)" : "Photoperiod (Hours/Day)",
      co2: language === 'id' ? "Sistem CO2" : "CO2 System",
      co2Bps: language === 'id' ? "Dosis CO2 (BPS)" : "CO2 Dosage (BPS)",
      heater: language === 'id' ? "Gunakan Heater (Pemanas Air)" : "Use Water Heater",
      substrate: language === 'id' ? "Substrat Dasar" : "Bottom Substrate",
      wcPercent: language === 'id' ? "Volume Ganti Air (%)" : "Water Change Volume (%)",
      wcInterval: language === 'id' ? "Interval Ganti Air (Hari)" : "Water Change Interval (Days)",
      fertType: language === 'id' ? "Metode Pupuk" : "Fertilizer Method",
      fertSchedule: language === 'id' ? "Jadwal Pupuk" : "Fertilizer Schedule"
    },
    hints: {
      name: language === 'id' ? "Beri nama unik (misal: Akuarium Ruang Tamu)." : "Give it a unique name (e.g., Living Room Tank).",
      tankType: language === 'id' ? "Pilih yang paling mirip. Sangat mempengaruhi saran dari AI." : "Choose the closest match. Influences AI advice.",
      setupDate: language === 'id' ? "Kapan air pertama kali dimasukkan? Penting untuk analisis AI." : "When was water first added? Crucial for AI.",
      isPrimary: language === 'id' ? "AI Assistant akan otomatis menggunakan tank ini saat Anda bertanya." : "AI Assistant uses this tank as the default.",
      dimensions: language === 'id' ? "Digunakan AI untuk menghitung kecocokan jumlah ikan." : "Used by AI to calculate fish capacity.",
      filter: language === 'id' ? "Jika pakai filter rakitan (DIY), pilih jenis yang paling mendekati cara kerjanya." : "For DIY filters, choose the closest working mechanism.",
      light: language === 'id' ? "WRGB = Lampu khusus aquascape (berwarna). White LED = Lampu putih biasa." : "WRGB = Color aquascape light. White LED = Standard white.",
      co2: language === 'id' ? "Pressurized = Tabung gas besi/alumunium. BPS = Jumlah gelembung per detik. Pilih 'None' jika tidak pakai." : "Pressurized = Iron/Alumunium gas tank. BPS = Bubbles per second. Choose 'None' if unused.",
      substrate: language === 'id' ? "Pasir, kerikil (gravel), atau tanah khusus tanaman (aquasoil)." : "Sand, gravel, or specific plant soil (aquasoil).",
      maintenance: language === 'id' ? "Metode 'All-in-One' adalah untuk pupuk cair botolan biasa. Kosongkan jadwal jika tidak pasti." : "Use 'All-in-One' for standard liquid ferts. Leave schedule blank if unsure."
    }
  };

  const titleAddText = aqDict?.dashboard?.btnAdd || (language === 'id' ? "Tambah Akuarium" : "Add Aquarium");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<CreateAquariumInput>({
    name: "",
    tank_type: "Community", // Diubah default ke Community agar ramah pemula
    setup_date: new Date().toISOString().split('T')[0], 
    is_primary: false,
    
    length_cm: 60,
    width_cm: 30,
    height_cm: 36,
    volume_liters: 64.8, 
    
    substrate_type: "Sand", // Ramah pemula
    filter_type: "Hang on Back (HOB)", // Ramah pemula
    filter_capacity_lph: null,
    light_type: "White LED", // Ramah pemula
    light_wattage: null,
    photoperiod_hours: 8,
    co2_type: "None", // Ramah pemula
    co2_bps: null,
    heater_enabled: false,
    water_change_percent: 30,
    water_change_interval_days: 7,
    fertilizer_type: "None", // Ramah pemula
    fertilizer_schedule: ""
  });

  useEffect(() => {
    if (formData.length_cm > 0 && formData.width_cm > 0 && formData.height_cm > 0) {
      const volume = (formData.length_cm * formData.width_cm * formData.height_cm) / 1000;
      setFormData(prev => ({ ...prev, volume_liters: Number(volume.toFixed(1)) }));
    }
  }, [formData.length_cm, formData.width_cm, formData.height_cm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value ? Number(value) : null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNextStep = () => {
    try {
      if (step === 1) {
        createAquariumSchema
          .pick({ name: true, setup_date: true, tank_type: true })
          .parse(formData);
      } else if (step === 2) {
        createAquariumSchema
          .pick({ length_cm: true, width_cm: true, height_cm: true, volume_liters: true })
          .parse(formData);
      }
      
      setError("");
      setStep(s => Math.min(4, s + 1));
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].message);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      createAquariumSchema.parse(formData);

      setLoading(true);
      setError("");
      
      const res = await createAquariumAction(formData);
      if (res.success) {
        router.push("/dashboard/my-aquarium");
      } else {
        setError(res.error || "Failed to save aquarium");
        setLoading(false);
      }
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].message);
      } else {
        setError("Validation failed. Please check your inputs.");
      }
      setLoading(false);
    }
  };

  const STEPS = [
    { num: 1, title: wizDict.step1, icon: Container },
    { num: 2, title: wizDict.step2, icon: Ruler },
    { num: 3, title: wizDict.step3, icon: Settings2 },
    { num: 4, title: wizDict.step4, icon: Droplets },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 min-h-[80vh] flex flex-col">
      
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
          {titleAddText}
        </h2>
        
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full z-0"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-teal-500 rounded-full z-0 transition-all duration-500"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>
          
          {STEPS.map((s) => {
            const isActive = step >= s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-colors duration-300 ${
                  isActive 
                    ? "bg-teal-500 border-teal-100 dark:border-teal-900 text-white" 
                    : "bg-slate-100 dark:bg-slate-800 border-white dark:border-slate-950 text-slate-400"
                }`}>
                  {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                </div>
                <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider absolute -bottom-6 whitespace-nowrap ${isCurrent ? "text-teal-600 dark:text-teal-400" : "text-slate-400 opacity-0 sm:opacity-100"}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 flex-1 flex flex-col mt-4">
        <div className="p-6 md:p-8 flex-1">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl border border-red-200 dark:border-red-800/50 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.name} *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-teal-500 outline-none transition-all" placeholder="Contoh: Akuarium Ruang Tamu" />
                <p className="text-xs text-slate-500 flex items-start gap-1 mt-1"><Info className="w-3.5 h-3.5 shrink-0" /> {wizDict.hints.name}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.tankType}</label>
                  <select name="tank_type" value={formData.tank_type} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-teal-500 outline-none">
                    {TANK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <p className="text-xs text-slate-500 flex items-start gap-1 mt-1"><Info className="w-3.5 h-3.5 shrink-0" /> {wizDict.hints.tankType}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.setupDate} *</label>
                  <input required type="date" name="setup_date" value={formData.setup_date} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-teal-500 outline-none" />
                  <p className="text-xs text-slate-500 flex items-start gap-1 mt-1"><Info className="w-3.5 h-3.5 shrink-0" /> {wizDict.hints.setupDate}</p>
                </div>
              </div>

              <div className="p-4 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-100 dark:border-teal-900 flex items-center gap-3">
                <input type="checkbox" id="is_primary" name="is_primary" checked={formData.is_primary} onChange={handleChange} className="w-5 h-5 accent-teal-600 rounded cursor-pointer" />
                <div>
                  <label htmlFor="is_primary" className="font-bold text-teal-800 dark:text-teal-400 cursor-pointer">{wizDict.labels.isPrimary}</label>
                  <p className="text-xs text-teal-600 dark:text-teal-500 mt-0.5">{wizDict.hints.isPrimary}</p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.length}</label>
                  <input type="number" name="length_cm" value={formData.length_cm || ""} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-teal-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.width}</label>
                  <input type="number" name="width_cm" value={formData.width_cm || ""} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-teal-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.height}</label>
                  <input type="number" name="height_cm" value={formData.height_cm || ""} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-teal-500 outline-none" />
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">{wizDict.labels.volume}</p>
                <div className="text-4xl font-black text-teal-600 dark:text-teal-400">
                  {formData.volume_liters} <span className="text-xl text-slate-400">Liters</span>
                </div>
                <p className="text-xs text-slate-500 mt-3">{wizDict.hints.dimensions}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.substrate}</label>
                <select name="substrate_type" value={formData.substrate_type || ""} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-teal-500 outline-none">
                  {SUBSTRATE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <p className="text-xs text-slate-500 flex items-start gap-1 mt-1"><Info className="w-3.5 h-3.5 shrink-0" /> {wizDict.hints.substrate}</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.filter}</label>
                  <select name="filter_type" value={formData.filter_type || ""} onChange={handleChange} className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none">
                    {FILTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.filterCapacity}</label>
                  <input type="number" name="filter_capacity_lph" value={formData.filter_capacity_lph || ""} onChange={handleChange} placeholder="Contoh: 600 (Kosongkan jika tidak tahu)" className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none" />
                </div>
                <p className="text-xs text-slate-500 col-span-full flex items-start gap-1"><Info className="w-3.5 h-3.5 shrink-0" /> {wizDict.hints.filter}</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 bg-amber-50/50 dark:bg-amber-950/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.light}</label>
                  <select name="light_type" value={formData.light_type || ""} onChange={handleChange} className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none">
                    {LIGHT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.lightWatt}</label>
                  <input type="number" name="light_wattage" value={formData.light_wattage || ""} onChange={handleChange} placeholder="Kosongkan jika tidak tahu" className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.lightHours}</label>
                  <input type="number" name="photoperiod_hours" value={formData.photoperiod_hours || ""} onChange={handleChange} placeholder="Contoh: 8 (jam sehari)" className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none" />
                </div>
                <p className="text-xs text-slate-500 col-span-full flex items-start gap-1"><Info className="w-3.5 h-3.5 shrink-0" /> {wizDict.hints.light}</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 bg-emerald-50/50 dark:bg-emerald-950/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.co2}</label>
                  <select name="co2_type" value={formData.co2_type || ""} onChange={handleChange} className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none">
                    {CO2_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.co2Bps}</label>
                  <input type="number" name="co2_bps" value={formData.co2_bps || ""} onChange={handleChange} placeholder="Kosongkan jika tidak tahu" disabled={formData.co2_type === 'None'} className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none disabled:opacity-50" />
                </div>
                <div className="space-y-2 pt-8 pl-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300 text-sm">
                    <input type="checkbox" name="heater_enabled" checked={formData.heater_enabled} onChange={handleChange} className="w-5 h-5 accent-emerald-600 rounded" />
                    {wizDict.labels.heater}
                  </label>
                </div>
                <p className="text-xs text-slate-500 col-span-full flex items-start gap-1"><Info className="w-3.5 h-3.5 shrink-0" /> {wizDict.hints.co2}</p>
              </div>

            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.wcPercent}</label>
                  <div className="relative">
                    <input type="number" name="water_change_percent" value={formData.water_change_percent || ""} onChange={handleChange} placeholder="Contoh: 30" className="w-full h-12 pl-4 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.wcInterval}</label>
                  <div className="relative">
                    <input type="number" name="water_change_interval_days" value={formData.water_change_interval_days || ""} onChange={handleChange} placeholder="Contoh: 7" className="w-full h-12 pl-4 pr-16 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Hari</span>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.fertType}</label>
                  <select name="fertilizer_type" value={formData.fertilizer_type || ""} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none">
                    {FERTILIZER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.fertSchedule}</label>
                  <input type="text" name="fertilizer_schedule" value={formData.fertilizer_schedule || ""} onChange={handleChange} placeholder="Contoh: 2 tetes setiap pagi" className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 outline-none" />
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                  <Info className="w-5 h-5 shrink-0 mt-0.5" /> 
                  {wizDict.hints.maintenance}
                </p>
              </div>
            </div>
          )}

        </div>

        <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-b-2xl flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => {
              setError(""); 
              setStep(s => Math.max(1, s - 1));
            }}
            disabled={step === 1 || loading}
            className="font-bold border-slate-300 dark:border-slate-700"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> {wizDict.btnPrev}
          </Button>

          {step < 4 ? (
            <Button 
              onClick={handleNextStep} 
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold"
            >
              {wizDict.btnNext} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-8 shadow-lg shadow-teal-600/20 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {wizDict.btnSave}
            </Button>
          )}
        </div>
      </div>

    </div>
  );
}