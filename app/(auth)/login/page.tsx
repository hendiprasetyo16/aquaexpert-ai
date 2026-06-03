"use client";

import { useState, useEffect, Suspense } from "react"; // Tambahkan Suspense
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

// 1. KITA BUAT KOMPONEN KECIL UNTUK ISI FORMULIRNYA
function LoginFormContent() {
  const searchParams = useSearchParams();

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

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Beri waktu sejenak agar Cookie benar-benar tertulis di browser
      await new Promise((resolve) => setTimeout(resolve, 300));

      // MENDOBRAK CACHE NEXT.JS SECARA AMAN:
      window.location.replace("/dashboard");
      
    } catch (err: any) {
      setError(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const error = searchParams.get("error");

    if (error === "account_disabled") {
      setError("Akun Anda telah dinonaktifkan oleh Administrator.");
    }
  }, [searchParams]);

  return (
    <Card className="z-10 w-full max-w-md border-slate-800 bg-slate-900/80 text-slate-50 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold tracking-tight">
          <span className="text-teal-400">Aqua</span>Expert
        </CardTitle>
        <CardDescription className="text-slate-400">
          Masukkan email dan password untuk masuk ke akun Anda
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
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
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-slate-700 bg-slate-950 pr-10 text-slate-200 focus-visible:ring-teal-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-teal-600 text-white hover:bg-teal-500"
            disabled={loading}
          >
            {loading ? "Memproses..." : "Masuk"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-400">
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-teal-400 hover:underline">
            Daftar di sini
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// 2. KEMUDIAN KITA BUNGKUS DENGAN SUSPENSE PADA KOMPONEN UTAMA PAGE
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 relative">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/20 via-slate-950 to-slate-950"></div>
      
      {/* Suspense akan melindungi useSearchParams agar tidak merusak proses Build */}
      <Suspense fallback={<div className="z-10 text-teal-500 animate-pulse">Memuat halaman...</div>}>
        <LoginFormContent />
      </Suspense>

    </div>
  );
}