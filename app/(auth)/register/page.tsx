"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider"; 

export default function RegisterPage() {
  const { dict } = useLanguage(); 

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false); // <-- STATE BARU UNTUK CEK EMAIL

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
        setError(dict.auth.passwordHint);
        setLoading(false); return;
    }

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({ 
      email, 
      password, 
      options: { data: { full_name: fullName } }
    });
    
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

    // Simpan ke tabel profiles
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert([{ 
        id: data.user.id, 
        email: email, 
        full_name: fullName 
      }]);
      if (profileError) { 
        setError("Akun terbuat, tetapi gagal menyimpan data profil."); 
        setLoading(false); return; 
      }
    }

    // UBAH LAYAR MENJADI PESAN "CEK EMAIL"
    setIsSuccess(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative transition-colors duration-300">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/10 dark:from-teal-900/20 via-background to-background"></div>
      
      <Card className="z-10 w-full max-w-md border-border bg-card/90 text-card-foreground backdrop-blur-sm shadow-xl transition-colors duration-300">
        
        {/* JIKA SUKSES: TAMPILKAN INSTRUKSI CEK EMAIL */}
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center space-y-6 p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/50 border border-teal-200 dark:border-teal-800">
              <MailCheck className="h-10 w-10 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">{dict.auth.registerSuccessTitle}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {dict.auth.registerSuccessDesc}
              </p>
            </div>
            <Link href="/login" className="w-full">
              <Button className="w-full bg-teal-600 text-white hover:bg-teal-500 shadow-md transition-all">
                {dict.auth.loginButton}
              </Button>
            </Link>
          </div>
        ) : (
          
          /* JIKA BELUM SUKSES: TAMPILKAN FORM DAFTAR */
          <>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-3xl font-bold tracking-tight">{dict.auth.registerTitle}</CardTitle>
              <CardDescription className="text-muted-foreground">{dict.auth.registerDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground font-medium">{dict.auth.fullNameLabel}</Label>
                  <Input id="fullName" type="text" placeholder={dict.auth.fullNamePlaceholder} value={fullName} onChange={(e) => setFullName(e.target.value)} required className="border-input bg-background text-foreground focus-visible:ring-teal-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">{dict.auth.emailLabel}</Label>
                  <Input id="email" type="email" placeholder={dict.auth.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} required className="border-input bg-background text-foreground focus-visible:ring-teal-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">{dict.auth.passwordLabel}</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="border-input bg-background text-foreground pr-10 focus-visible:ring-teal-500" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{dict.auth.passwordHint}</p>
                </div>
                
                {error && <p className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-950/50 p-2 rounded-md border border-red-200 dark:border-red-900">{error}</p>}
                
                <Button type="submit" className="w-full bg-teal-600 text-white hover:bg-teal-500 font-semibold shadow-md shadow-teal-600/10" disabled={loading}>
                  {loading ? dict.auth.registerProcessing : dict.auth.registerButton}
                </Button>
              </form>
              
              <div className="mt-4 text-center text-sm text-muted-foreground">
                {dict.auth.hasAccount}{" "}
                <Link href="/login" className="font-medium text-teal-600 dark:text-teal-400 hover:underline">{dict.auth.loginLink}</Link>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}