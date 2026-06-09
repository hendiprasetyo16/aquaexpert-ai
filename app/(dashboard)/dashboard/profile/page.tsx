"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // <-- IMPORT ROUTER DITAMBAHKAN
import { useAuth } from "@/hooks/useAuth";
import { updateProfileName, updateProfilePassword } from "@/features/profile/actions/profile.actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, KeyRound, User as UserIcon, Mail, ShieldAlert, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter(); // <-- INISIALISASI ROUTER
  const { user, profile, role, isLoading } = useAuth();
  
  // States untuk Ubah Nama
  const [fullName, setFullName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // States untuk Ubah Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // States untuk Toggle Visibilitas Password
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sinkronisasi data profile awal ke state form
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  // ===================================================================================
  // FUNGSI INTI: MENGAMBIL TOKEN CLIENT UNTUK MEMBANTU SERVER ACTION DI HP/PWA
  // ===================================================================================
  const getAccessToken = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null; 
  };

  // Handler: Ubah Nama Lengkap
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingName(true);

    try {
      const token = await getAccessToken(); 
      const result = await updateProfileName(fullName, token); 
      
      if (result.success) {
        toast.success(result.message || "Nama berhasil diperbarui!");
        
        // REFRESH HALUS (TanPA KEDIP) UNTUK MENGUPDATE SIDEBAR
        router.refresh();
      } else {
        toast.error(result.error || "Gagal memperbarui nama.");
        setFullName(profile?.full_name || ""); // Rollback UI
      }
    } catch (error: any) {
      toast.error("Terjadi kesalahan sistem saat menghubungi server.");
    } finally {
      setIsSavingName(false);
    }
  };

  // Handler: Ubah Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok!");
      return;
    }
    
    setIsSavingPassword(true);

    try {
      const token = await getAccessToken(); 
      const result = await updateProfilePassword(newPassword, token); 

      if (result.success) {
        toast.success(result.message || "Password berhasil diganti!");
        setNewPassword("");
        setConfirmPassword("");
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        
        // REFRESH HALUS UNTUK MENYEGARKAN SESI KEAMANAN
        router.refresh();
      } else {
        toast.error(result.error || "Gagal mengganti password.");
      }
    } catch (error: any) {
      toast.error("Terjadi kesalahan sistem saat menghubungi server.");
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Profil Saya</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Kelola informasi identitas dan keamanan akun Anda.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* KARTU 1: INFORMASI UMUM */}
        <Card className="h-fit border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm transition-colors duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
              <UserIcon className="h-5 w-5 text-teal-600 dark:text-teal-500" />
              Informasi Umum
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">Perbarui nama lengkap yang akan ditampilkan di sistem.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Box Jabatan Adaptif */}
            <div className="mb-6 flex items-center gap-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400">
                <UserIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Jabatan Anda</p>
                <div className="flex items-center gap-2">
                  <p className="font-bold capitalize text-slate-800 dark:text-slate-200">{role?.replace("_", " ")}</p>
                  {role === "super_admin" && <ShieldAlert className="h-4 w-4 text-red-500 dark:text-red-400" />}
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email (Tidak dapat diubah)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input 
                    type="email" 
                    value={user?.email || ""} 
                    disabled 
                    className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 py-2 pl-10 pr-4 text-slate-500 dark:text-slate-400 opacity-70 outline-none transition-colors" 
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nama Lengkap</label>
                <input 
                  required
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 transition-colors" 
                />
              </div>
              <button 
                type="submit" 
                disabled={isSavingName || fullName === profile?.full_name}
                className="flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-500 disabled:opacity-50 w-full sm:w-auto"
              >
                {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSavingName ? "Menyimpan..." : "Simpan Nama"}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* KARTU 2: GANTI PASSWORD */}
        <Card className="h-fit border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm transition-colors duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
              <KeyRound className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              Keamanan Akun
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">Ganti kata sandi Anda secara berkala untuk menjaga keamanan.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Password Baru</label>
                <div className="relative">
                  <input 
                    required
                    minLength={6}
                    type={showNewPassword ? "text" : "password"} 
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 pr-10 text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 transition-colors" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Konfirmasi Password Baru</label>
                <div className="relative">
                  <input 
                    required
                    minLength={6}
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Ketik ulang password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 pr-10 text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 transition-colors" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSavingPassword || !newPassword || !confirmPassword}
                className="flex items-center justify-center gap-2 rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-yellow-500 disabled:opacity-50 w-full sm:w-auto"
              >
                {isSavingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSavingPassword ? "Memperbarui..." : "Update Password"}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}