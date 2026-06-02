import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// IMPORT PROVIDER YANG BARU DIBUAT
import { AuthProvider } from "@/providers/AuthProvider";

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
    >
      {/* Background juga di-set di body agar halaman tidak berkedip putih */}
      <body className="flex min-h-full flex-col bg-slate-950 text-slate-50">
        
        {/* BUNGKUS SELURUH APP DENGAN AUTH PROVIDER */}
        <AuthProvider>
          {children}
        </AuthProvider>

      </body>
    </html>
  );
}