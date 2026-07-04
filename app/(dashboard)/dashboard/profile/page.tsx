// app/(dashboard)/dashboard/profile/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { updateProfileName, updateProfilePassword, updateProfileAvatar } from "@/features/profile/actions/profile.actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, Save, KeyRound, User as UserIcon, Mail, 
  ShieldAlert, Eye, EyeOff, Globe, Clock, Laptop, Shield, Camera 
} from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/providers/LanguageProvider";

// 💡 FUNGSI KOMPRESI MILIK BAPAK (Diatur ke maksimal 400px agar super ringan)
const compressImage = (file: File, maxWidth = 400, quality = 0.8): Promise<File> => {
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

export default function ProfilePage() {
  const { user, profile, role, isLoading } = useAuth();
  const { dict, language } = useLanguage(); 
  const lang = language as "id" | "en";
  
  const [fullName, setFullName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  // AKSI UPLOAD FOTO PROFIL
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(lang === 'id' ? "File terlalu besar (Maks 5MB)" : "File too large (Max 5MB)");
      return;
    }

    setIsUploadingAvatar(true);
    const loadingToast = toast.loading(lang === 'id' ? "Mengunggah foto..." : "Uploading photo...");

    try {
      // Panggil fungsi kompresi Bapak!
      const compressedFile = await compressImage(file);
      
      const formData = new FormData();
      formData.append("avatar", compressedFile);

      const result = await updateProfileAvatar(formData);
      if (result.success) {
        toast.success(lang === 'id' ? "Foto profil diperbarui!" : "Avatar updated!", { id: loadingToast });
        setTimeout(() => { window.location.reload(); }, 500);
      } else {
        toast.error(result.error || "Gagal mengunggah foto.", { id: loadingToast });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error.";
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingName(true);

    try {
      const result = await updateProfileName(fullName); 
      if (result.success) {
        toast.success(lang === 'id' ? "Berhasil / Success!" : "Success!");
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
      toast.error(lang === 'id' ? "Password mismatch!" : "Password mismatch!"); return;
    }
    setIsSavingPassword(true);

    try {
      const result = await updateProfilePassword(newPassword); 
      if (result.success) {
        toast.success(lang === 'id' ? "Berhasil / Success!" : "Success!");
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

  // 💡 LOGIKA AVATAR: Jika user punya avatar di database, gunakan itu. Jika tidak, gunakan inisial nama.
  // Pastikan property 'avatar_url' sudah Bapak tambahkan di interface Profile (AuthProvider.tsx)
  const fallbackAvatarUrl = profile?.full_name 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=0D9488&color=fff&rounded=true&bold=true&size=128`
    : `https://ui-avatars.com/api/?name=User&background=random&rounded=true`;
  
  // @ts-ignore - Mengabaikan error sementara jika type avatar_url belum terbaca sempurna di editor Bapak
  const currentAvatar = profile?.avatar_url || fallbackAvatarUrl;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{dict.profile?.title}</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">{dict.profile?.subtitle}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="h-fit border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm transition-colors duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
              <UserIcon className="h-5 w-5 text-teal-600 dark:text-teal-500" />
              {dict.profile?.generalInfo}
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">{dict.profile?.generalInfoDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            
            <div className="mb-6 flex items-center gap-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
              
              {/* TOMBOL UPLOAD AVATAR */}
              <div className="relative shrink-0 group">
                <img 
                  src={currentAvatar} 
                  alt="Avatar" 
                  className={`w-16 h-16 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-800 object-cover ${isUploadingAvatar ? 'opacity-50' : 'opacity-100'}`} 
                />
                
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  title="Ubah Foto Profil"
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingAvatar ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                </button>
              </div>

              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{dict.profile?.yourRole}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="font-bold capitalize text-slate-800 dark:text-slate-200">{role?.replace("_", " ")}</p>
                  {role === "super_admin" && <ShieldAlert className="h-4 w-4 text-red-500 dark:text-red-400" />}
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.profile?.emailLabel}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input type="email" value={user?.email || ""} disabled className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 py-2 pl-10 pr-4 text-slate-500 dark:text-slate-400 opacity-70 outline-none cursor-not-allowed transition-colors" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.profile?.fullNameLabel}</label>
                <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 transition-colors" />
              </div>
              <button type="submit" disabled={isSavingName || fullName === profile?.full_name} className="flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-500 disabled:opacity-50 w-full sm:w-auto">
                {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSavingName ? dict.profile?.saving : dict.profile?.saveName}
              </button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6 flex flex-col h-full">
          <Card className="h-fit border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm transition-colors duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
                <KeyRound className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                {dict.profile?.security}
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">{dict.profile?.securityDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.profile?.newPassword}</label>
                  <div className="relative">
                    <input required minLength={6} type={showNewPassword ? "text" : "password"} placeholder={dict.profile?.newPasswordPlaceholder} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 pr-10 text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 transition-colors" />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.profile?.confirmPassword}</label>
                  <div className="relative">
                    <input required minLength={6} type={showConfirmPassword ? "text" : "password"} placeholder={dict.profile?.confirmPasswordPlaceholder} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 pr-10 text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 transition-colors" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isSavingPassword || !newPassword || !confirmPassword} className="flex items-center justify-center gap-2 rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-yellow-500 disabled:opacity-50 w-full sm:w-auto">
                  {isSavingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSavingPassword ? dict.profile?.updating : dict.profile?.updatePassword}
                </button>
              </form>
            </CardContent>
          </Card>

          <Card className="h-fit mt-auto border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 shadow-sm transition-colors duration-300">
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex items-center gap-3 w-full sm:w-1/3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                    {lang === 'id' ? "IP Terakhir" : "Last IP"}
                  </p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                    {profile?.ip_address || "-"}
                  </p>
                </div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700"></div>

              <div className="flex items-center gap-3 w-full sm:w-1/3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                    {lang === 'id' ? "Login Terakhir" : "Last Login"}
                  </p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                    {profile?.last_login_at 
                      ? new Date(profile.last_login_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) 
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700"></div>

              <div className="flex items-center gap-3 w-full sm:w-1/3">
                <div className="p-2 bg-sky-100 dark:bg-sky-900/40 rounded-lg text-sky-600 dark:text-sky-400 shrink-0">
                  <Laptop className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                    {lang === 'id' ? "Terdaftar" : "Joined"}
                  </p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                    {profile?.created_at 
                      ? new Date(profile.created_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) 
                      : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}