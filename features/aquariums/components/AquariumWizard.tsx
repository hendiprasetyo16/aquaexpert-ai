// features/aquariums/components/AquariumWizard.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; 
import { createClient } from "@/lib/supabase/client"; 
import { useLanguage } from "@/providers/LanguageProvider";
import { createAquariumAction, updateAquariumAction } from "../actions/aquarium.actions";
import { CreateAquariumInput, Aquarium } from "../types/aquarium.types";
import { createAquariumSchema } from "../validations/aquarium.schema";
import { 
  TANK_TYPES, SUBSTRATE_TYPES, FILTER_TYPES, 
  LIGHT_TYPES, CO2_TYPES, FERTILIZER_TYPES 
} from "../constants/aquarium-options";
import { 
  CheckCircle2, ChevronLeft, ChevronRight, Save, 
  Ruler, Settings2, Droplets, Info, Loader2, Container, ImagePlus, X, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

import { 
  AquariumDictionary, getTankTypeDesc, getSubstrateDesc, 
  getFilterDesc, getLightDesc, getCO2Desc, getFertilizerDesc, getAquascapeStyleDesc 
} from "./aquarium-helpers";

interface AquariumWizardProps {
  mode?: "create" | "edit";
  initialData?: Aquarium | null;
}

const AQUASCAPE_STYLES = ["Bebas", "Nature", "Dutch", "Iwagumi", "Biotope", "Blackwater", "Jungle", "Minimalist"] as const;

const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) { reject(new Error("Failed to get canvas context")); return; }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                type: "image/jpeg", lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else { reject(new Error("Canvas to Blob failed")); }
          }, "image/jpeg", quality);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function AquariumWizard({ mode = "create", initialData }: AquariumWizardProps) {
  const { dict, language } = useLanguage();
  const router = useRouter();
  const lang = language as "id" | "en";
  
  const dictRoot = dict as { aquarium?: AquariumDictionary };
  const aqDict = dictRoot?.aquarium;

  const wizDict = aqDict?.wizard || {
    step1: lang === 'id' ? "Identitas" : "Identity",
    step2: lang === 'id' ? "Dimensi" : "Dimensions",
    step3: lang === 'id' ? "Peralatan" : "Equipment",
    step4: lang === 'id' ? "Perawatan" : "Maintenance",
    btnNext: lang === 'id' ? "Selanjutnya" : "Next",
    btnPrev: lang === 'id' ? "Kembali" : "Previous",
    btnSave: lang === 'id' ? "Simpan Akuarium" : "Save Aquarium",
    btnCancel: lang === 'id' ? "Batal" : "Cancel", 
    labels: {
      name: lang === 'id' ? "Nama Akuarium" : "Aquarium Name",
      tankType: lang === 'id' ? "Fokus Ekosistem (Tipe Tangki)" : "Ecosystem Focus",
      aquascapeStyle: lang === 'id' ? "Tema / Style Visual Aquascape" : "Aquascape Style", 
      setupDate: lang === 'id' ? "Tanggal Setup Air Awal" : "Initial Setup Date",
      isPrimary: lang === 'id' ? "Jadikan Tangki Utama Default" : "Set as Primary Tank",
      length: lang === 'id' ? "Panjang Kaca Luar (cm)" : "Length (cm)",
      width: lang === 'id' ? "Lebar Kaca Luar (cm)" : "Width (cm)",
      height: lang === 'id' ? "Tinggi Kaca Luar (cm)" : "Height (cm)",
      volume: lang === 'id' ? "Volume Bersih Estimasi (Liter)" : "Estimated Net Volume (Liters)",
      filter: lang === 'id' ? "Mekanisme Sistem Filter" : "Filtration System",
      filterCapacity: lang === 'id' ? "Daya Putar Pompa / Filter Flow Rate (L/H)" : "Pump Flow Rate (L/H)",
      light: lang === 'id' ? "Kategori Spesifikasi Lampu" : "Lighting Type",
      lightWatt: lang === 'id' ? "Konsumsi Daya Lampu (Watt)" : "Light Power (Watts)",
      lightHours: lang === 'id' ? "Durasi Pencahayaan (Jam/Hari)" : "Photoperiod (Hours/Day)",
      co2: lang === 'id' ? "Sistem Suplai Gas CO2" : "CO2 System",
      co2Bps: lang === 'id' ? "Kecepatan Dosis CO2 (BPS / Bubble Per Second)" : "CO2 Dosage (BPS)",
      heater: lang === 'id' ? "Gunakan Alat Pengontrol Suhu (Heater/Pemanas Air)" : "Use Water Heater",
      substrate: lang === 'id' ? "Sistem Lapisan Substrat Dasar" : "Bottom Substrate",
      wcPercent: lang === 'id' ? "Volume Air yang Diganti (%)" : "Water Change Volume (%)",
      wcInterval: lang === 'id' ? "Frekuensi Ganti Air (Hari Sekali)" : "Water Change Interval (Days)",
      fertType: lang === 'id' ? "Metode Pemupukan Flora" : "Fertilizer Method",
      fertSchedule: lang === 'id' ? "Dosis & Jadwal Pupuk" : "Fertilizer Schedule"
    },
    hints: {
      name: lang === 'id' ? "Beri nama penanda yang unik agar tidak tertukar." : "Give it a unique name.",
      tankType: lang === 'id' ? "Menentukan tujuan tangki Bapak. AI menggunakannya sebagai tolok ukur keserasian fauna." : "Choose tank purpose. Affects AI fish compatibility.",
      aquascapeStyle: lang === 'id' ? "Menentukan pakem seni visual. Mempengaruhi penilaian estetika layout vegetasi oleh AI." : "Choose your visual tank theme.",
      setupDate: lang === 'id' ? "Kapan pertama kali air dimasukkan? AI memakainya untuk menghitung tingkat kematangan bakteri pengurai." : "When was water first added? Crucial for AI.",
      isPrimary: lang === 'id' ? "Jika dicentang, asisten AI Consultant akan otomatis mendiagnosis tank ini sebagai prioritas utama." : "AI Assistant uses this tank as the default.",
      dimensions: lang === 'id' ? "Volume dihitung otomatis sebagai 'Volume Bersih'." : "Automatically calculated as 'Net Volume'.",
      filter: lang === 'id' ? "Pilih tipe filter fisik yang Bapak gunakan." : "Choose closest mechanism.",
      light: lang === 'id' ? "Pilih kategori spektrum lampu." : "If 'Mixed', input Wattage for main light.",
      co2: lang === 'id' ? "Pencahayaan tinggi tanpa gas CO2 seimbang akan memicu ledakan alga." : "Select CO2 supply type.",
      substrate: lang === 'id' ? "Tanaman penutup dasar (karpet) membutuhkan Aquasoil." : "Select the material covering your tank bottom.",
      maintenance: lang === 'id' ? "Disiplin perawatan harian adalah kunci utama penentu skor vitalitas kesehatan air dari AI." : "Key metrics for AI."
    }
  };

  const titleAddText = mode === "edit" 
    ? (lang === 'id' ? "Konfigurasi Ulang Profil Akuarium" : "Edit Aquarium") 
    : (aqDict?.dashboard?.btnAdd || (lang === 'id' ? "Daftarkan Ekosistem Akuarium Baru" : "Add Aquarium"));

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");

  const [formData, setFormData] = useState<CreateAquariumInput>({
    name: "", tank_type: "Community", aquascape_style: "Bebas", setup_date: new Date().toISOString().split('T')[0], is_primary: false,
    length_cm: 60, width_cm: 30, height_cm: 36, volume_liters: 55, 
    substrate_type: "Sand", filter_type: "Hang on Back (HOB)", filter_flow_lph: null, 
    light_type: "White LED", light_wattage: null, photoperiod_hours: 8,
    co2_type: "None", co2_bps: null, heater_enabled: false,
    water_change_percent: 30, water_change_interval_days: 7, fertilizer_type: "None", fertilizer_schedule: ""
  });

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData({
        name: initialData.name || "",
        tank_type: (initialData.tank_type as CreateAquariumInput["tank_type"]) || "Community",
        aquascape_style: initialData.aquascape_style || "Bebas",
        setup_date: initialData.setup_date || new Date().toISOString().split('T')[0],
        is_primary: initialData.is_primary || false,
        length_cm: initialData.length_cm || 60,
        width_cm: initialData.width_cm || 30,
        height_cm: initialData.height_cm || 36,
        volume_liters: initialData.volume_liters || 55,
        substrate_type: (initialData.substrate_type as CreateAquariumInput["substrate_type"]) || "Sand",
        filter_type: (initialData.filter_type as CreateAquariumInput["filter_type"]) || "Hang on Back (HOB)",
        filter_flow_lph: initialData.filter_flow_lph || null, 
        light_type: (initialData.light_type as CreateAquariumInput["light_type"]) || "White LED",
        light_wattage: initialData.light_wattage || null,
        photoperiod_hours: initialData.photoperiod_hours || 8,
        co2_type: (initialData.co2_type as CreateAquariumInput["co2_type"]) || "None",
        co2_bps: initialData.co2_bps || null,
        heater_enabled: initialData.heater_enabled || false,
        water_change_percent: initialData.water_change_percent || 30,
        water_change_interval_days: initialData.water_change_interval_days || 7,
        fertilizer_type: (initialData.fertilizer_type as CreateAquariumInput["fertilizer_type"]) || "None",
        fertilizer_schedule: initialData.fertilizer_schedule || ""
      });
      if (initialData.image_url) {
        setCoverPreview(initialData.image_url);
      }
    }
  }, [mode, initialData]);

  useEffect(() => {
    if (mode === "edit" && initialData && formData.length_cm === initialData.length_cm && formData.width_cm === initialData.width_cm && formData.height_cm === initialData.height_cm) {
        return; 
    }

    if (formData.length_cm > 0 && formData.width_cm > 0 && formData.height_cm > 0) {
      const volumeBruto = (formData.length_cm * formData.width_cm * formData.height_cm) / 1000;
      const volumeNetto = volumeBruto * 0.85; 
      setFormData(prev => ({ ...prev, volume_liters: Number(volumeNetto.toFixed(1)) }));
    }
  }, [formData.length_cm, formData.width_cm, formData.height_cm, mode, initialData]);

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

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
      if (!validTypes.includes(file.type)) { setError("Format foto harus JPG, PNG, WEBP, atau HEIC."); return; }
      if (file.size > 10 * 1024 * 1024) { setError("Ukuran foto maksimal 10MB sebelum kompresi."); return; }
      
      try {
        setError("");
        setCoverPreview(URL.createObjectURL(file));
        const compressedFile = await compressImage(file, 1200, 0.7);
        setCoverFile(compressedFile);
        setCoverPreview(URL.createObjectURL(compressedFile));
      } catch (err) {
        setError("Gagal memproses dan mengompres gambar.");
      }
    }
  };

  const extractErrorMessage = (err: unknown): string | null => {
    if (!err) return null;
    if (err instanceof Error) return err.message;
    return null;
  };

  const handleNextStep = () => {
    try {
      if (step === 1) {
        if (!formData.name.trim()) {
           setError(lang === 'id' ? "Nama akuarium wajib diisi!" : "Aquarium name is required!");
           return;
        }
        createAquariumSchema.pick({ name: true, setup_date: true, tank_type: true }).parse(formData);
      } else if (step === 2) {
        createAquariumSchema.pick({ length_cm: true, width_cm: true, height_cm: true, volume_liters: true }).parse(formData);
      }
      setError("");
      setStep(s => Math.min(4, s + 1));
    } catch (err: unknown) {
      const cleanError = extractErrorMessage(err);
      if (cleanError) setError(cleanError);
      else setError(lang === "id" ? "Input tidak valid. Mohon periksa kembali form Anda." : "Invalid input. Please check your form.");
    }
  };

const handleSubmit = async () => {
    try {
      createAquariumSchema.parse(formData);
      setLoading(true);
      setError("");

      let finalImageUrl = mode === "edit" ? initialData?.image_url : null;
      const supabase = createClient();
      
      // Ganti bagian di dalam handleSubmit, tepatnya pada blok `if (coverFile) { ... }`
      if (coverFile) {
        const { data: { user } } = await supabase.auth.getUser();
        
        // 1. Ekstraksi identitas (Email & Nama)
        const emailPart = user?.email?.split('@')[0] || "user";
        const fullName = user?.user_metadata?.full_name || "unknown";
        
        // 2. Bersihkan karakter agar aman untuk file system (hanya huruf, angka, underscore)
        const cleanEmail = emailPart.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase().substring(0, 15);
        const cleanName = fullName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase().substring(0, 15);
        const cleanTheme = (formData.aquascape_style || "bebas").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        
        // 3. Tanggal (Format: YYYYMMDD)
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, ""); 
        
        // 4. Random ID untuk menjamin tidak ada file yang tertimpa
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileExt = coverFile.name.split('.').pop() || "jpg";
        
        // Format Final: email_nama_tema_tanggal_random.jpg
        // Contoh: hendi_hendiprasetyo_iwagumi_20260704_x9z2k1.jpg
        const customFileName = `${cleanEmail}_${cleanName}_${cleanTheme}_${dateStr}_${randomSuffix}.${fileExt}`;
        const filePath = `covers/${customFileName}`; 

        const { error: uploadError } = await supabase.storage.from("aquariums").upload(filePath, coverFile);
        if (uploadError) throw new Error("Gagal mengupload foto: " + uploadError.message);
        
        const { data: { publicUrl } } = supabase.storage.from("aquariums").getPublicUrl(filePath);
        finalImageUrl = publicUrl;
      }

      const payloadToSave = { ...formData, image_url: finalImageUrl };
      
      let res;
      if (mode === "edit" && initialData) res = await updateAquariumAction(initialData.id, payloadToSave);
      else res = await createAquariumAction(payloadToSave);
      
      if (res.success) {
        toast.success(mode === "edit" ? (lang === 'id' ? "Akuarium diperbarui!" : "Aquarium updated!") : (lang === 'id' ? "Akuarium ditambahkan!" : "Aquarium added!"));
        router.push(mode === "edit" ? `/dashboard/my-aquarium/${initialData?.id}` : "/dashboard/my-aquarium");
      } else {
        setError(res.error || "Failed to save aquarium");
        setLoading(false);
      }
    } catch (err: unknown) {
      const cleanError = extractErrorMessage(err);
      if (cleanError) setError(cleanError); else setError("Validation failed. Please check your inputs.");
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
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-teal-500 rounded-full z-0 transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
          
          {STEPS.map((s) => {
            const isActive = step >= s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-colors duration-300 ${isActive ? "bg-teal-500 border-teal-100 dark:border-teal-900 text-white" : "bg-slate-100 dark:bg-slate-800 border-white dark:border-slate-950 text-slate-400"}`}>
                  {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                </div>
                <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider absolute -bottom-6 whitespace-nowrap ${isCurrent ? "text-teal-600 dark:text-teal-400" : "text-slate-400 opacity-0 sm:opacity-100"}`}>{s.title}</span>
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
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Foto Profil Sampul Tangki (Opsional)</label>
                <input id="cover-image" type="file" accept="image/jpeg, image/png, image/webp, image/heic" onChange={handleCoverChange} className="hidden" />
                <label htmlFor="cover-image" className="cursor-pointer block">
                  <div className="overflow-hidden rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 transition-all group bg-slate-50 dark:bg-slate-950/50">
                    {coverPreview ? (
                      <div className="relative h-48 w-full">
                        <Image src={coverPreview} alt="Preview" fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-sm font-bold">Ganti Foto</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-48 flex-col items-center justify-center text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        <ImagePlus className="h-10 w-10 mb-2" />
                        <span className="text-sm font-bold">Upload Foto Aktual Tangki</span>
                        <span className="text-xs mt-1">Sistem Otomatis Mengompres File (Maksimal 10MB)</span>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.name} *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-teal-500 outline-none transition-all" placeholder="Contoh: Tank Kaca Kamar Tidur, Aquascape Ruang Tamu" />
                <p className="text-xs text-slate-500 flex items-start gap-1 mt-1"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {wizDict.hints.name}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.tankType}</label>
                  <select name="tank_type" value={formData.tank_type} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-teal-500 outline-none cursor-pointer">
                    {TANK_TYPES.map(t => <option key={t} value={t}>{getTankTypeDesc(t, lang)}</option>)}
                  </select>
                  <p className="text-xs text-slate-500 flex items-start gap-1 mt-1"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {wizDict.hints.tankType}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.aquascapeStyle}</label>
                  <select name="aquascape_style" value={formData.aquascape_style || "Bebas"} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-teal-500 outline-none cursor-pointer">
                    {AQUASCAPE_STYLES.map(s => <option key={s} value={s}>{getAquascapeStyleDesc(s, lang)}</option>)}
                  </select>
                  <p className="text-xs text-slate-500 flex items-start gap-1 mt-1"><Info className="w-3.5 h-3.5 shrink-0" /> {wizDict.hints.aquascapeStyle}</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/50 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-blue-800 dark:text-blue-400 block mb-1">💡 Bantuan Cepat Pilih Fokus Ekosistem:</span>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong className="text-slate-700 dark:text-slate-300">Komunitas:</strong> Gabungan berbagai jenis ikan damai yang aman disatukan.</li>
                    <li><strong className="text-slate-700 dark:text-slate-300">Iwagumi:</strong> Seni meniru padang rumput hijau luas di alam bebas, hanya fokus susunan batu.</li>
                    <li><strong className="text-slate-700 dark:text-slate-300">Dutch Style:</strong> Seperti kebun bunga, tangki penuh sesak dengan barisan tanaman warna-warni.</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.setupDate} *</label>
                <input required type="date" name="setup_date" value={formData.setup_date} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-teal-500 outline-none" />
                <p className="text-xs text-slate-500 flex items-start gap-1 mt-1"><Info className="w-3.5 h-3.5 shrink-0" /> {wizDict.hints.setupDate}</p>
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
                  <input type="number" name="length_cm" value={formData.length_cm || ""} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-teal-500 outline-none font-bold" placeholder="Contoh: 60" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.width}</label>
                  <input type="number" name="width_cm" value={formData.width_cm || ""} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-teal-500 outline-none font-bold" placeholder="Contoh: 30" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.height}</label>
                  <input type="number" name="height_cm" value={formData.height_cm || ""} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-teal-500 outline-none font-bold" placeholder="Contoh: 36" />
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">{wizDict.labels.volume}</p>
                <div className="text-4xl font-black text-teal-600 dark:text-teal-400">
                  {formData.volume_liters} <span className="text-xl text-slate-400">Liter Air Netto</span>
                </div>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed max-w-xl mx-auto">{wizDict.hints.dimensions}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.substrate}</label>
                <select name="substrate_type" value={formData.substrate_type || ""} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-teal-500 outline-none cursor-pointer">
                  {SUBSTRATE_TYPES.map(t => <option key={t} value={t}>{getSubstrateDesc(t, lang)}</option>)}
                </select>
                <p className="text-xs text-slate-500 flex items-start gap-1 mt-1"><Info className="w-3.5 h-3.5 shrink-0" /> {wizDict.hints.substrate}</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              
              <div className="grid sm:grid-cols-2 gap-4 bg-blue-50/40 dark:bg-blue-950/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.filter}</label>
                  <select name="filter_type" value={formData.filter_type || ""} onChange={handleChange} className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none cursor-pointer">
                    {FILTER_TYPES.map(t => <option key={t} value={t}>{getFilterDesc(t, lang)}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.filterCapacity}</label>
                  <input type="number" name="filter_flow_lph" value={formData.filter_flow_lph || ""} onChange={handleChange} placeholder="Contoh: 600" className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none font-bold" />
                </div>
                <div className="text-xs text-slate-500 col-span-full bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed mt-1">
                  <strong className="text-blue-700 dark:text-blue-400 block mb-1">📋 Lembar Panduan Pompa (LPH):</strong>
                  Rasio sehat perputaran air akuarium yang ideal adalah <span className="font-bold text-slate-700 dark:text-slate-300">4 kali lipat hingga 6 kali lipat</span> volume air tangki Bapak per jam.
                  <br />💡 <span className="italic">Rumus Cepat: Jika tangki Bapak berkapasitas 55 Liter, carilah pompa filter yang di spek kardusnya tertulis minimal 220 L/H hingga 300 L/H.</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 bg-amber-50/40 dark:bg-amber-950/10 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.light}</label>
                  <select name="light_type" value={formData.light_type || ""} onChange={handleChange} className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none cursor-pointer">
                    {LIGHT_TYPES.map(t => <option key={t} value={t}>{getLightDesc(t, lang)}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.lightWatt}</label>
                  <input type="number" name="light_wattage" value={formData.light_wattage || ""} onChange={handleChange} placeholder="Contoh: 18" className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.lightHours}</label>
                  <input type="number" name="photoperiod_hours" value={formData.photoperiod_hours || ""} onChange={handleChange} placeholder="Contoh: 8" className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none font-bold" />
                </div>
                <div className="text-xs text-slate-500 col-span-full bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed mt-1">
                  <strong className="text-amber-700 dark:text-amber-400 block mb-1">📋 Lembar Panduan Pencahayaan (Watt):</strong>
                  Ikan & tanaman membutuhkan siklus siang yang teratur. Durasi standar menyalakan lampu adalah <span className="font-bold text-slate-700 dark:text-slate-300">7 - 8 jam sehari</span>.
                  <br />💡 <span className="italic">Tips Alga: Jangan menyalakan lampu lebih dari 10 jam, karena air tangki Bapak akan berubah menjadi hijau keruh akibat ledakan alga.</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 bg-emerald-50/40 dark:bg-emerald-950/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.co2}</label>
                  <select name="co2_type" value={formData.co2_type || ""} onChange={handleChange} className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none cursor-pointer">
                    {CO2_TYPES.map(t => <option key={t} value={t}>{getCO2Desc(t, lang)}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.co2Bps}</label>
                  <input type="number" name="co2_bps" value={formData.co2_bps || ""} onChange={handleChange} placeholder="Contoh: 2" disabled={formData.co2_type === 'None'} className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none disabled:opacity-50 font-bold" />
                </div>
                <div className="space-y-2 pt-8 pl-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300 text-sm">
                    <input type="checkbox" name="heater_enabled" checked={formData.heater_enabled} onChange={handleChange} className="w-5 h-5 accent-emerald-600 rounded shrink-0" />
                    {wizDict.labels.heater}
                  </label>
                </div>
                <div className="text-xs text-slate-500 col-span-full bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed mt-1">
                  <strong className="text-emerald-700 dark:text-emerald-400 block mb-1">📋 Lembar Panduan Gas CO2 (BPS):</strong>
                  BPS artinya jumlah gelembung gas CO2 yang keluar dalam satu detik di counter tabung Bapak.
                  <br />💡 <span className="italic">Rekomendasi Pemula: Jika menggunakan tipe tabung gas hitech, setel setelan regulator di angka aman **1 - 2 BPS**. Mengisi terlalu tinggi (di atas 4 BPS) bisa meracuni dan membuat ikan pingsan kekurangan oksigen.</span>
                </div>
              </div>

            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.wcPercent}</label>
                  <div className="relative">
                    <input type="number" name="water_change_percent" value={formData.water_change_percent || ""} onChange={handleChange} placeholder="Contoh: 30" className="w-full h-12 pl-4 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none font-bold text-lg" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">% Air</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.wcInterval}</label>
                  <div className="relative">
                    <input type="number" name="water_change_interval_days" value={formData.water_change_interval_days || ""} onChange={handleChange} placeholder="Contoh: 7" className="w-full h-12 pl-4 pr-24 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none font-bold text-lg" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Hari Sekali</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 col-span-full bg-blue-50/50 dark:bg-blue-950/10 p-3 rounded-xl border border-blue-100/50 dark:border-blue-900/30 leading-relaxed">
                  ⚠️ <span className="font-bold text-slate-700 dark:text-slate-300">Peringatan Keras Pemula:</span> Jangan pernah menguras air akuarium sampai habis total (100% ganti air) karena akan menghancurkan koloni bakteri baik pelapis air tangki Bapak. Rekomendasi medis yang aman adalah mengganti <span className="font-black text-blue-600 dark:text-blue-400">25% - 30% air saja, diulangi setiap 7 hari sekali</span>.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.fertType}</label>
                  <select name="fertilizer_type" value={formData.fertilizer_type || ""} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none cursor-pointer">
                    {FERTILIZER_TYPES.map(t => <option key={t} value={t}>{getFertilizerDesc(t, lang)}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{wizDict.labels.fertSchedule}</label>
                  <input type="text" name="fertilizer_schedule" value={formData.fertilizer_schedule || ""} onChange={handleChange} placeholder="Contoh: 3 pencet (pump) setiap hari Selasa & Jumat" className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none" />
                </div>
              </div>
              
              <div className="p-4 bg-teal-50 dark:bg-teal-950/20 rounded-xl border border-teal-100 dark:border-teal-900/30">
                <p className="text-sm text-teal-800 dark:text-teal-400 flex items-start gap-2">
                  <Info className="w-5 h-5 shrink-0 mt-0.5" /> 
                  {wizDict.hints.maintenance}
                </p>
              </div>
            </div>
          )}

        </div>

        <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
          <Button 
            type="button"
            variant="outline" 
            onClick={() => {
              if (step === 1) {
                if (mode === "edit" && initialData) router.push(`/dashboard/my-aquarium/${initialData.id}`);
                else router.push("/dashboard/my-aquarium"); 
              } else {
                setError(""); setStep(s => Math.max(1, s - 1));
              }
            }}
            disabled={loading}
            className="h-12 px-6 rounded-xl font-bold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm w-full sm:w-auto flex justify-center items-center"
          >
            {step === 1 ? (
              <><X className="w-4 h-4 mr-2" /> {wizDict.btnCancel || (lang === 'id' ? "Batal" : "Cancel")}</>
            ) : (
              <><ChevronLeft className="w-4 h-4 mr-2" /> {wizDict.btnPrev}</>
            )}
          </Button>

          {step < 4 ? (
            <Button onClick={handleNextStep} className="bg-teal-600 hover:bg-teal-500 text-white font-bold h-12 px-8 rounded-xl shadow-md shadow-teal-600/20 transition-all w-full sm:w-auto flex justify-center items-center">
              {wizDict.btnNext} <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="bg-teal-600 hover:bg-teal-500 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-teal-600/30 transition-all active:scale-95 w-full sm:w-auto flex justify-center items-center">
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {mode === "edit" ? (lang === 'id' ? "Perbarui Profil Tangki" : "Update Profile") : wizDict.btnSave}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}