"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react"; // <-- Import Ikon Mata

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false); // <-- State untuk Ikon Mata
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
        setError("Password harus mengandung kombinasi huruf dan angka.");
        setLoading(false);
        return;
    }

    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: data.user.id, 
            email: email,
            full_name: fullName,
          }
        ]);

      if (profileError) {
        setError("Akun terbuat, tetapi gagal menyimpan data profil.");
        setLoading(false);
        return;
      }
    }

    setSuccessMsg("Pendaftaran berhasil! Mengarahkan ke dashboard...");
    
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/20 via-slate-950 to-slate-950"></div>
      
      <Card className="z-10 w-full max-w-md border-slate-800 bg-slate-900/80 text-slate-50 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Buat Akun
          </CardTitle>
          <CardDescription className="text-slate-400">
            Daftar untuk mulai mengelola aquarium Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-300">Nama Lengkap</Label>
              <Input 
                id="fullName" 
                type="text" 
                placeholder="Budi Santoso" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="border-slate-700 bg-slate-950 text-slate-200 focus-visible:ring-teal-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nama@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-slate-700 bg-slate-950 text-slate-200 focus-visible:ring-teal-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              {/* Desain Kotak Password dengan Ikon */}
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="border-slate-700 bg-slate-950 pr-10 text-slate-200 focus-visible:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500">Minimal 6 karakter, dengan kombinasi huruf dan angka.</p>
            </div>
            
            {error && <p className="text-sm font-medium text-red-500">{error}</p>}
            {successMsg && <p className="text-sm font-medium text-teal-400">{successMsg}</p>}
            
            <Button 
              type="submit" 
              className="w-full bg-teal-600 text-white hover:bg-teal-500"
              disabled={loading}
            >
              {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-slate-400">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-medium text-teal-400 hover:underline">
              Masuk di sini
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}