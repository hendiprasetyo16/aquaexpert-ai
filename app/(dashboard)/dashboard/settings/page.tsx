// app/(dashboard)/dashboard/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/providers/LanguageProvider";
import { updateProfileAction } from "@/features/settings/actions/settings.actions";
import { 
  User, Mail, Shield, Save, Loader2, 
  Settings2, Clock, Globe, Laptop 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user, profile, isLoading } = useAuth();
  const { language } = useLanguage();
  const lang = language as "id" | "en";

  const [fullName, setFullName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Isi form otomatis saat data profile selesai diload
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error(lang === 'id' ? "Nama tidak boleh kosong!" : "Name cannot be empty!");
      return;
    }

    setIsSaving(true);
    const res = await updateProfileAction(fullName);
    
    if (res.success) {
      toast.success(lang === 'id' ? "Profil berhasil diperbarui!" : "Profile updated successfully!");
    } else {
      toast.error(res.error || "Gagal memperbarui profil.");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 mb-2">
          <Settings2 className="w-8 h-8 text-indigo-500" />
          {lang === 'id' ? "Pengaturan Akun" : "Account Settings"}
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {lang === 'id' 
            ? "Kelola identitas pribadi, preferensi, dan keamanan akun AquaExpert Anda." 
            : "Manage your personal identity, preferences, and AquaExpert account security."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: FORM PROFIL */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-400" /> 
              {lang === 'id' ? "Informasi Dasar" : "Basic Information"}
            </h3>
            
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {lang === 'id' ? "Nama Lengkap" : "Full Name"}
                </label>
                <Input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={lang === 'id' ? "Masukkan nama Anda..." : "Enter your name..."}
                  className="h-12 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </label>
                <Input 
                  type="email" 
                  value={user?.email || ""}
                  disabled
                  className="h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border-transparent text-slate-500 opacity-70 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 font-medium">
                  {lang === 'id' ? "*Email terikat dengan autentikasi utama dan tidak dapat diubah." : "*Email is tied to core authentication and cannot be changed."}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSaving || fullName === profile?.full_name}
                  className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                  {lang === 'id' ? "Simpan Perubahan" : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* KOLOM KANAN: INFO SISTEM */}
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" /> 
              {lang === 'id' ? "Status Keamanan" : "Security Status"}
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Role / Hak Akses</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/50">
                  {profile?.role === 'super_admin' ? 'Super Admin' : profile?.role === 'admin' ? 'Administrator' : 'Aquarist (User)'}
                </div>
              </div>
              
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Globe className="w-3 h-3"/> IP Address Terakhir</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{profile?.ip_address || "Mendeteksi..."}</p>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Clock className="w-3 h-3"/> Login Terakhir</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {profile?.last_login_at 
                    ? new Date(profile.last_login_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                    : "-"}
                </p>
              </div>
              
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Laptop className="w-3 h-3"/> Terdaftar Sejak</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {profile?.created_at 
                    ? new Date(profile.created_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) 
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}