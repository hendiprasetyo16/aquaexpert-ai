// D:\aquaexpert-ai\app\(dashboard)\dashboard\profile\page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { updateProfileName, updateProfilePassword } from "@/features/profile/actions/profile.actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, Save, KeyRound, User as UserIcon, Mail, ShieldAlert, Eye, EyeOff, Globe, Clock, Laptop 
} from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/providers/LanguageProvider"; // <-- IMPORT KAMUS

export default function ProfilePage() {
  const { user, profile, role, isLoading } = useAuth();
  const { dict, language } = useLanguage(); // <-- PANGGIL KAMUS & BAHASA
  const lang = language as "id" | "en";
  
  const [fullName, setFullName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingName(true);

    try {
      const result = await updateProfileName(fullName); 
      if (result.success) {
        toast.success("Berhasil / Success!");
        setTimeout(() => { window.location.reload(); }, 500);
      } else {
        toast.error(result.error || "Gagal / Failed");
        setFullName(profile?.full_name || ""); 
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error.";
      toast.error(errorMessage);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Password mismatch!"); return;
    }
    setIsSavingPassword(true);

    try {
      const result = await updateProfilePassword(newPassword); 
      if (result.success) {
        toast.success("Berhasil / Success!");
        setNewPassword(""); setConfirmPassword("");
        setShowNewPassword(false); setShowConfirmPassword(false);
      } else {
        toast.error(result.error || "Gagal / Failed");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error.";
      toast.error(errorMessage);
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-500" />
      </div>
    );
  }

  // Generate Avatar Otomatis
  const avatarUrl = profile?.full_name 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=0D9488&color=fff&rounded=true&bold=true`
    : `https://ui-avatars.com/api/?name=User&background=random&rounded=true`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{dict.profile.title}</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">{dict.profile.subtitle}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* KARTU 1: INFORMASI UMUM */}
        <Card className="h-fit border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm transition-colors duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
              <UserIcon className="h-5 w-5 text-teal-600 dark:text-teal-500" />
              {dict.profile.generalInfo}
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">{dict.profile.generalInfoDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            
            {/* BAGIAN AVATAR & ROLE */}
            <div className="mb-6 flex items-center gap-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
              <img src={avatarUrl} alt="Avatar" className="h-12 w-12 rounded-full shadow-sm" />
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{dict.profile.yourRole}</p>
                <div className="flex items-center gap-2">
                  <p className="font-bold capitalize text-slate-800 dark:text-slate-200">{role?.replace("_", " ")}</p>
                  {role === "super_admin" && <ShieldAlert className="h-4 w-4 text-red-500 dark:text-red-400" />}
                </div>
              </div>
            </div>

            {/* INFO SISTEM (Berjejer 3) */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-4 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {lang === 'id' ? 'IP Terakhir' : 'Last IP'}
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {profile?.ip_address || "-"}
                </span>
              </div>
              <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 pt-3 sm:pt-0 sm:pl-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {lang === 'id' ? 'Login Terakhir' : 'Last Login'}
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {profile?.last_login_at ? new Date(profile.last_login_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US') : "-"}
                </span>
              </div>
              <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 pt-3 sm:pt-0 sm:pl-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Laptop className="w-3 h-3" /> {lang === 'id' ? 'Terdaftar' : 'Joined'}
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US') : "-"}
                </span>
              </div>
            </div>

            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.profile.emailLabel}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input type="email" value={user?.email || ""} disabled className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 py-2 pl-10 pr-4 text-slate-500 dark:text-slate-400 opacity-70 outline-none transition-colors" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.profile.fullNameLabel}</label>
                <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 transition-colors" />
              </div>
              <button type="submit" disabled={isSavingName || fullName === profile?.full_name} className="flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-500 disabled:opacity-50 w-full sm:w-auto">
                {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSavingName ? dict.profile.saving : dict.profile.saveName}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* KARTU 2: GANTI PASSWORD */}
        <Card className="h-fit border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm transition-colors duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
              <KeyRound className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              {dict.profile.security}
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">{dict.profile.securityDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.profile.newPassword}</label>
                <div className="relative">
                  <input required minLength={6} type={showNewPassword ? "text" : "password"} placeholder={dict.profile.newPasswordPlaceholder} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 pr-10 text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 transition-colors" />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.profile.confirmPassword}</label>
                <div className="relative">
                  <input required minLength={6} type={showConfirmPassword ? "text" : "password"} placeholder={dict.profile.confirmPasswordPlaceholder} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 pr-10 text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 transition-colors" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isSavingPassword || !newPassword || !confirmPassword} className="flex items-center justify-center gap-2 rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-yellow-500 disabled:opacity-50 w-full sm:w-auto">
                {isSavingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSavingPassword ? dict.profile.updating : dict.profile.updatePassword}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}