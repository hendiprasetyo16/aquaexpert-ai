// features/aquariums/components/AquariumWizard.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; 
import { createClient } from "@/lib/supabase/client"; 
import { useLanguage } from "@/providers/LanguageProvider";
import { createAquariumAction } from "../actions/aquarium.actions";
import { CreateAquariumInput } from "../types/aquarium.types";
import { createAquariumSchema } from "../validations/aquarium.schema";
import { 
  TANK_TYPES, SUBSTRATE_TYPES, FILTER_TYPES, 
  LIGHT_TYPES, CO2_TYPES, FERTILIZER_TYPES 
} from "../constants/aquarium-options";
import { 
  CheckCircle2, ChevronLeft, ChevronRight, Save, 
  Ruler, Settings2, Droplets, Info, Loader2, Container, ImagePlus, X // <--- TAMBAH ICON X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

import { 
  AquariumDictionary, 
  getTankTypeDesc, 
  getSubstrateDesc, 
  getFilterDesc, 
  getLightDesc, 
  getCO2Desc, 
  getFertilizerDesc 
} from "./aquarium-helpers";

export default function AquariumWizard() {
  const { dict, language } = useLanguage();
  const router = useRouter();
  const lang = language as "id" | "en";
  
  const safeDict = dict as Record<string, any>;
  const aqDict = safeDict?.aquarium as AquariumDictionary | undefined;

  const wizDict = aqDict?.wizard || {
    step1: lang === 'id' ? "Identitas" : "Identity",
    step2: lang === 'id' ? "Dimensi" : "Dimensions",
    step3: lang === 'id' ? "Peralatan" : "Equipment",
    step4: lang === 'id' ? "Perawatan" : "Maintenance",
    btnNext: lang === 'id' ? "Selanjutnya" : "Next",
    btnPrev: lang === 'id' ? "Kembali" : "Previous",
    btnSave: lang === 'id' ? "Simpan Akuarium" : "Save Aquarium",
    btnCancel: lang === 'id' ? "Batal" : "Cancel", // <--- TAMBAHAN DICTIONARY BATAL
    labels: {
      name: lang === 'id' ? "Nama Akuarium" : "Aquarium Name",
      tankType: lang === 'id' ? "Jenis Tema Akuarium" : "Aquascape Style",
      setupDate: lang === 'id' ? "Tanggal Setup Awal" : "Initial Setup Date",
      isPrimary: lang === 'id' ? "Jadikan Tangki Utama" : "Set as Primary Tank",
      length: lang === 'id' ? "Panjang (cm)" : "Length (cm)",
      width: lang === 'id' ? "Lebar (cm)" : "Width (cm)",
      height: lang === 'id' ? "Tinggi (cm)" : "Height (cm)",
      volume: lang === 'id' ? "Volume Estimasi (Liter)" : "Estimated Volume (Liters)",
      filter: lang === 'id' ? "Sistem Filter" : "Filtration System",
      filterCapacity: lang === 'id' ? "Kapasitas Pompa (L/H)" : "Pump Flow Rate (L/H)",
      light: lang === 'id' ? "Jenis Lampu" : "Lighting Type",
      lightWatt: lang === 'id' ? "Daya Lampu (Watt)" : "Light Power (Watts)",
      lightHours: lang === 'id' ? "Durasi Nyala (Jam/Hari)" : "Photoperiod (Hours/Day)",
      co2: lang === 'id' ? "Sistem CO2" : "CO2 System",
      co2Bps: lang === 'id' ? "Dosis CO2 (BPS)" : "CO2 Dosage (BPS)",
      heater: lang === 'id' ? "Gunakan Heater (Pemanas Air)" : "Use Water Heater",
      substrate: lang === 'id' ? "Substrat Dasar" : "Bottom Substrate",
      wcPercent: lang === 'id' ? "Volume Ganti Air (%)" : "Water Change Volume (%)",
      wcInterval: lang === 'id' ? "Interval Ganti Air (Hari)" : "Water Change Interval (Days)",
      fertType: lang === 'id' ? "Metode Pupuk" : "Fertilizer Method",
      fertSchedule: lang === 'id' ? "Jadwal Pupuk" : "Fertilizer Schedule"
    },
    hints: {
      name: lang === 'id' ? "Beri nama unik (misal: Akuarium Ruang Tamu)." : "Give it a unique name.",
      tankType: lang === 'id' ? "Pilih yang paling mirip. Sangat mempengaruhi saran dari AI." : "Choose the closest match. Influences AI advice.",
      setupDate: lang === 'id' ? "Kapan air pertama kali dimasukkan? Penting untuk analisis AI." : "When was water first added? Crucial for AI.",
      isPrimary: lang === 'id' ? "AI Assistant akan otomatis menggunakan tank ini saat Anda bertanya." : "AI Assistant uses this tank as the default.",
      dimensions: lang === 'id' ? "Digunakan AI untuk menghitung kecocokan jumlah ikan." : "Used by AI to calculate fish capacity.",
      filter: lang === 'id' ? "Pilih mekanisme yang paling sesuai. Kosongkan kapasitas pompa jika tidak tahu." : "Choose closest mechanism. Leave capacity empty if unsure.",
      light: lang === 'id' ? "Jika pilih 'Kombinasi', isikan Daya Watt & Jam untuk lampu buatannya saja (saat malam)." : "If 'Mixed', only input Wattage & Hours for the artificial night light.",
      co2: lang === 'id' ? "Pilih jenis suplai CO2. Kosongkan Dosis BPS jika tidak tahu/tidak pakai." : "Select CO2 supply type. Leave BPS empty if unsure/unused.",
      substrate: lang === 'id' ? "Pilih material yang menutupi dasar akuarium Anda." : "Select the material covering your tank bottom.",
      maintenance: lang === 'id' ? "Data ini sangat penting bagi AI untuk mencari akar masalah alga/penyakit." : "Key metrics for AI to find root cause of algae/disease."
    }
  };

  const titleAddText = aqDict?.dashboard?.btnAdd || (lang === 'id' ? "Tambah Akuarium" : "Add Aquarium");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");

  const [formData, setFormData] = useState<CreateAquariumInput>({
    name: "", tank_type: "Community", setup_date: new Date().toISOString().split('T')[0], is_primary: false,
    length_cm: 60, width_cm: 30, height_cm: 36, volume_liters: 64.8, 
    substrate_type: "Sand", filter_type: "Hang on Back (HOB)", filter_capacity_lph: null,
    light_type: "White LED", light_wattage: null, photoperiod_hours: 8,
    co2_type: "None", co2_bps: null, heater_enabled: false,
    water_change_percent: 30, water_change_interval_days: 7, fertilizer_type: "None", fertilizer_schedule: ""
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
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value ? Number(value) : null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      if (!validTypes.includes(file.type)) { setError("Format foto harus JPG, PNG, atau WEBP."); return; }
      if (file.size > 3 * 1024 * 1024) { setError("Ukuran maksimal foto 3MB."); return; }
      setError("");
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleNextStep = () => {
    try {
      if (step === 1) {
        createAquariumSchema.pick({ name: true, setup_date: true, tank_type: true }).parse(formData);
      } else if (step === 2) {
        createAquariumSchema.pick({ length_cm: true, width_cm: true, height_cm: true, volume_liters: true }).parse(formData);
      }
      setError("");
      setStep(s => Math.min(4, s + 1));
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) setError(err.errors[0].message);
    }
  };

  const handleSubmit = async () => {
    try {
      createAquariumSchema.parse(formData);
      setLoading(true);
      setError("");

      let finalImageUrl = null;
      
      if (coverFile) {
        const supabase = createClient();
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `covers/${fileName}`;

        const { error: uploadError } = await supabase.storage.from("aquariums").upload(filePath, coverFile);
        if (uploadError) throw new Error("Gagal mengupload foto: " + uploadError.message);
        
        const { data: { publicUrl } } = supabase.storage.from("aquariums").getPublicUrl(filePath);
        finalImageUrl = publicUrl;
      }

      const payloadToSave = { ...formData, image_url: finalImageUrl };
      const res = await createAquariumAction(payloadToSave);
      
      if (res.success) {
        toast.success(lang === 'id' ? "Akuarium berhasil ditambahkan!" : "Aquarium added successfully!");
        router.push("/dashboard/my-aquarium");
      } else {
        setError(res.error || "Failed to save aquarium");
        setLoading(false);
      }
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].message);
      } else {
        setError(err.message || "Validation failed. Please check your inputs.");
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
              
              {/* UPLOAD FOTO AKUARIUM */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Foto Akuarium (Opsional)</label>
                <input id="cover-image" type="file" accept="image/jpeg, image/png, image/webp" onChange={handleCoverChange} className="hidden" />
                <label htmlFor="cover-image" className="cursor-pointer block">
                  <div className="overflow-hidden rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 transition-all group bg-slate-50 dark:bg-slate-950/50">
                    {coverPreview ? (
                      <div className="relative h-48 w-full">
                        <Image src={coverPreview} alt="Preview Akuarium" fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-sm font-bold">Ganti Foto</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-48 flex-col items-center justify-center text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        <ImagePlus className="h-10 w-10 mb-2" />
                        <span className="text-sm font-bold">Upload Foto</span>
                        <span className="text-xs mt-1">JPG, PNG, WEBP (Max 3MB)</span>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.name} *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-teal-500 outline-none transition-all" placeholder="Contoh: Akuarium Ruang Tamu" />
                <p className="text-xs text-slate-500 flex items-start gap-1 mt-1"><Info className="w-3.5 h-3.5 shrink-0" /> {wizDict.hints.name}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.tankType}</label>
                  <select name="tank_type" value={formData.tank_type} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-teal-500 outline-none">
                    {TANK_TYPES.map(t => <option key={t} value={t}>{getTankTypeDesc(t, lang)}</option>)}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  {SUBSTRATE_TYPES.map(t => <option key={t} value={t}>{getSubstrateDesc(t, lang)}</option>)}
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
                    {FILTER_TYPES.map(t => <option key={t} value={t}>{getFilterDesc(t, lang)}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.filterCapacity}</label>
                  <input type="number" name="filter_capacity_lph" value={formData.filter_capacity_lph || ""} onChange={handleChange} placeholder="Contoh: 600 (Kosongkan jika tak tahu)" className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none" />
                </div>
                <p className="text-xs text-slate-500 col-span-full flex items-start gap-1"><Info className="w-3.5 h-3.5 shrink-0" /> {wizDict.hints.filter}</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 bg-amber-50/50 dark:bg-amber-950/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.light}</label>
                  <select name="light_type" value={formData.light_type || ""} onChange={handleChange} className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none">
                    {LIGHT_TYPES.map(t => <option key={t} value={t}>{getLightDesc(t, lang)}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.lightWatt}</label>
                  <input type="number" name="light_wattage" value={formData.light_wattage || ""} onChange={handleChange} placeholder="Kosongkan jika tak tahu" className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.lightHours}</label>
                  <input type="number" name="photoperiod_hours" value={formData.photoperiod_hours || ""} onChange={handleChange} placeholder="Contoh: 8 (jam)" className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none" />
                </div>
                <p className="text-xs text-slate-500 col-span-full flex items-start gap-1"><Info className="w-3.5 h-3.5 shrink-0" /> {wizDict.hints.light}</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 bg-emerald-50/50 dark:bg-emerald-950/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.co2}</label>
                  <select name="co2_type" value={formData.co2_type || ""} onChange={handleChange} className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none">
                    {CO2_TYPES.map(t => <option key={t} value={t}>{getCO2Desc(t, lang)}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.co2Bps}</label>
                  <input type="number" name="co2_bps" value={formData.co2_bps || ""} onChange={handleChange} placeholder="Dosis. Contoh: 2" disabled={formData.co2_type === 'None'} className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none disabled:opacity-50" />
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
                    {FERTILIZER_TYPES.map(t => <option key={t} value={t}>{getFertilizerDesc(t, lang)}</option>)}
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
            type="button"
            variant="outline" 
            onClick={() => {
              if (step === 1) {
                router.push("/dashboard/my-aquarium"); // <--- LOGIKA BATAL DI STEP 1
              } else {
                setError(""); 
                setStep(s => Math.max(1, s - 1));
              }
            }}
            disabled={loading} // <--- JANGAN DIDISABLE SAAT STEP 1
            className="font-bold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            {step === 1 ? (
              <><X className="w-4 h-4 mr-1" /> {wizDict.btnCancel || (lang === 'id' ? "Batal" : "Cancel")}</>
            ) : (
              <><ChevronLeft className="w-4 h-4 mr-1" /> {wizDict.btnPrev}</>
            )}
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