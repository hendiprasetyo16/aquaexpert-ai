// features/reminders/components/AddReminderModal.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Save, Loader2, CalendarClock, Container, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { addReminderAction } from "../actions/reminder.actions";
import { createClient } from "@/lib/supabase/client";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lang: "id" | "en";
}

interface AquariumOption {
  id: string;
  name: string;
}

export default function AddReminderModal({ isOpen, onClose, onSuccess, lang }: Props) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aquariums, setAquariums] = useState<AquariumOption[]>([]);

  // Format tanggal hari ini (YYYY-MM-DD) untuk nilai default
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: today,
    priority: "medium" as "low" | "medium" | "high",
    aquariumId: ""
  });

  // Ambil daftar akuarium milik user saat modal dibuka
  useEffect(() => {
    const fetchAquariums = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('my_aquariums').select('id, name').eq('user_id', user.id).order('name');
        if (data) setAquariums(data);
      }
    };
    if (isOpen) fetchAquariums();
  }, [isOpen]);

  useEffect(() => {
    setMounted(true);
    if (isOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.dueDate) {
      toast.error(lang === 'id' ? "Judul tugas dan tanggal wajib diisi!" : "Title and date are required!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addReminderAction({
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        priority: formData.priority,
        aquariumId: formData.aquariumId || undefined
      });

      if (res.success) {
        toast.success(lang === 'id' ? "Tugas berhasil ditambahkan!" : "Task added successfully!");
        onSuccess();
        onClose();
        // Reset form
        setFormData({ title: "", description: "", dueDate: today, priority: "medium", aquariumId: "" });
      } else {
        toast.error("Gagal menyimpan tugas.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div style={{ zIndex: 999999 }} className="fixed inset-0 flex items-center justify-center bg-slate-900/80 dark:bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        <div className="shrink-0 p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wide">
              {lang === 'id' ? "Tambah Pengingat" : "Add Reminder"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar">
          <form id="reminder-form" onSubmit={handleSubmit} className="p-5 space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500">{lang === 'id' ? "Apa yang harus dilakukan?" : "What needs to be done?"}</label>
              <Input required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder={lang === 'id' ? "Cth: Kuras Air 30%..." : "e.g., Change 30% Water..."} className="h-12 rounded-xl font-bold bg-slate-50 dark:bg-slate-950" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500">{lang === 'id' ? "Jadwal" : "Due Date"}</label>
                <Input required type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="h-12 rounded-xl font-bold bg-slate-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500">{lang === 'id' ? "Tingkat Penting" : "Priority"}</label>
                <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value as "low"|"medium"|"high"})} className="w-full h-12 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100">
                  <option value="low">🟢 {lang === 'id' ? "Rendah" : "Low"}</option>
                  <option value="medium">🟡 {lang === 'id' ? "Sedang" : "Medium"}</option>
                  <option value="high">🔴 {lang === 'id' ? "Tinggi (Penting!)" : "High (Urgent!)"}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 flex items-center gap-1.5">
                <Container className="w-3.5 h-3.5" /> {lang === 'id' ? "Untuk Akuarium (Opsional)" : "For Aquarium (Optional)"}
              </label>
              <select value={formData.aquariumId} onChange={(e) => setFormData({...formData, aquariumId: e.target.value})} className="w-full h-12 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100">
                <option value="">{lang === 'id' ? "-- Berlaku Umum --" : "-- General Task --"}</option>
                {aquariums.map(aq => (
                  <option key={aq.id} value={aq.id}>{aq.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500">{lang === 'id' ? "Catatan Tambahan (Opsional)" : "Additional Notes (Optional)"}</label>
              <textarea 
                rows={3} 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder={lang === 'id' ? "Cth: Jangan lupa bersihkan spons filter juga." : "e.g., Don't forget to clean the sponge filter."}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 resize-none custom-scrollbar" 
              />
            </div>

          </form>
        </div>

        <div className="shrink-0 p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Button type="submit" form="reminder-form" disabled={isSubmitting} className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/30 transition-all">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> {lang === 'id' ? "Simpan Jadwal" : "Save Reminder"}</>}
          </Button>
        </div>

      </div>
    </div>,
    document.body
  );
}