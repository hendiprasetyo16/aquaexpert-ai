import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// IMPORT PROVIDER
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/components/theme-provider"; // <-- Import Provider Tema
import { LanguageProvider } from "@/providers/LanguageProvider"; // <-- Language provider for i18n

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AquaExpert AI",
  description: "Sistem Pakar Aquascape & Aquarium",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning /* <-- WAJIB DITAMBAHKAN agar next-themes tidak error saat me-load halaman */
    >
      {/* Class bg-slate-950 dan text-slate-50 diganti menjadi bg-background dan text-foreground.
        Ini akan otomatis membaca warna dari global.css milikmu (Terang = putih, Gelap = slate gelap).
      */}
      <body className="flex min-h-full flex-col bg-background text-foreground">
        
        {/* BUNGKUS APLIKASI DENGAN THEME PROVIDER */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system" // Default mengikuti settingan sistem OS/HP pengguna
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            {/* AUTH PROVIDER TETAP AMAN DI DALAMNYA */}
            <AuthProvider>
              {children}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>

      </body>
    </html>
  );
}