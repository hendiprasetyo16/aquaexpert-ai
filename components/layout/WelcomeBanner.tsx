// components/layout/WelcomeBanner.tsx
"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Globe, ShieldAlert, Container } from "lucide-react";

interface TankInfo {
  id: string; name: string; is_primary: boolean;
  health_score: number; alerts: string[];
}

interface Props {
  profile: any; role: string | null; userEmail?: string;
  ipAddress: string; lang: "id" | "en"; dashDict: any;
  primaryTank?: TankInfo; secondaryTanks: TankInfo[];
}

export default function WelcomeBanner({ profile, role, userEmail, ipAddress, lang, dashDict, primaryTank, secondaryTanks }: Props) {
  const router = useRouter();

  const getHealthColor = (score: number) => {
    if (score >= 85) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-rose-500";
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-10 transition-colors">
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-teal-500/10 dark:bg-teal-500/20 blur-[80px] rounded-full pointer-events-none"></div>
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 items-start md:items-center">
        <div className="space-y-2 md:flex-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            {dashDict.welcome || (lang === 'id' ? "Selamat datang," : "Welcome back,")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400">{profile?.full_name || "User"}</span>!
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium max-w-lg">
            {lang === 'id' ? "Pantau kondisi klinis akuarium Anda dan jalankan analisis AI untuk ekosistem yang sehat." : "Monitor your aquarium's clinical conditions and run AI analysis for a healthy ecosystem."}
          </p>
          
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800/50 px-3 py-1 text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest">
              <CheckCircle2 className="w-3.5 h-3.5" /> 
              {role === "super_admin" ? "SUPER ADMIN" : role === "admin" ? "ADMIN" : "AQUARIST"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-400">
              {userEmail}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
              <Globe className="w-3.5 h-3.5" /> {ipAddress}
            </span>
          </div>
        </div>

        <div className="shrink-0 flex flex-col md:items-end gap-4 w-full sm:w-auto">
          {primaryTank ? (
            <>
              <div onClick={() => router.push(`/dashboard/my-aquarium/${primaryTank.id}`)} className="cursor-pointer bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-teal-300 dark:hover:border-teal-800 transition-all flex items-center gap-6 group w-full sm:w-80">
                <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * primaryTank.health_score) / 100} className={`${getHealthColor(primaryTank.health_score)} transition-all duration-1000 ease-out`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center mt-1">
                    <span className={`text-xl font-black ${getHealthColor(primaryTank.health_score)}`}>{primaryTank.health_score}</span>
                  </div>
                </div>
                
                <div className="flex flex-col pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">{lang === 'id' ? "Tank Utama" : "Primary"}</span>
                  </div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{primaryTank.name}</h3>
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-1">
                    {primaryTank.alerts.length > 0 ? (
                      <><ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> {primaryTank.alerts.length} {lang === 'id' ? "Peringatan" : "Alerts"}</>
                    ) : (
                      <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {lang === 'id' ? "Ekosistem Stabil" : "Stable Ecosystem"}</>
                    )}
                  </p>
                </div>
              </div>

              {secondaryTanks.length > 0 && (
                <div className="flex flex-wrap md:justify-end gap-2 w-full max-w-sm">
                  {secondaryTanks.map(tank => (
                    <div key={tank.id} onClick={() => router.push(`/dashboard/my-aquarium/${tank.id}`)} className="cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 flex items-center gap-3 transition-colors shadow-sm">
                      <div className="relative w-7 h-7 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="15" className="text-slate-200 dark:text-slate-700" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="15" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * tank.health_score) / 100} className={`${getHealthColor(tank.health_score)} transition-all duration-1000 ease-out`} strokeLinecap="round" />
                        </svg>
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-none mb-1">{tank.name}</p>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider leading-none">Score: <span className={getHealthColor(tank.health_score)}>{tank.health_score}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center w-full">
              <Container className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-sm font-bold text-slate-500">{lang === 'id' ? "Belum ada akuarium" : "No aquarium yet"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}