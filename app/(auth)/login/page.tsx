"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider"; 

function LoginFormContent() {
  const searchParams = useSearchParams();
  const { dict } = useLanguage(); 

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      
      // CEGAT ERROR SUPABASE DAN TERJEMAHKAN
      if (signInError) {
        if (signInError.message.includes("Email not confirmed")) {
          throw new Error(dict.auth.unverifiedEmail);
        } else if (signInError.message.includes("Invalid login credentials")) {
          throw new Error(dict.auth.invalidCredentials);
        } else {
          throw signInError;
        }
      }

      if (data?.user?.id) {
        await supabase.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", data.user.id);
        await supabase.from("system_activities").insert({
          title: "User Login", message: `User dengan email "${email}" berhasil masuk ke dalam sistem.`,
          category: "user_activity", created_by: email
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
      window.location.replace("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "account_disabled") setError("Akun Anda telah dinonaktifkan oleh Administrator.");
  }, [searchParams]);

  return (
    <Card className="z-10 w-full max-w-md border-border bg-card/90 text-card-foreground backdrop-blur-sm shadow-xl transition-colors duration-300">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold tracking-tight">
          <span className="text-teal-600 dark:text-teal-400">Aqua</span>Expert
        </CardTitle>
        <CardDescription className="text-muted-foreground">{dict.auth.loginDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium">{dict.auth.emailLabel}</Label>
            <Input id="email" type="email" placeholder={dict.auth.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} required className="border-input bg-background text-foreground focus-visible:ring-teal-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-medium">{dict.auth.passwordLabel}</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="border-input bg-background text-foreground pr-10 focus-visible:ring-teal-500" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          {error && <p className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-950/50 p-2 rounded-md border border-red-200 dark:border-red-900">{error}</p>}
          
          <Button type="submit" className="w-full bg-teal-600 text-white hover:bg-teal-500 font-semibold shadow-md shadow-teal-600/10" disabled={loading}>
            {loading ? dict.auth.loginProcessing : dict.auth.loginButton}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {dict.auth.noAccount}{" "}
          <Link href="/register" className="font-medium text-teal-600 dark:text-teal-400 hover:underline">{dict.auth.registerLink}</Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative transition-colors duration-300">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/10 dark:from-teal-900/20 via-background to-background"></div>
      <Suspense fallback={<div className="z-10 text-teal-600 dark:text-teal-400 animate-pulse font-medium">Memuat halaman...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}