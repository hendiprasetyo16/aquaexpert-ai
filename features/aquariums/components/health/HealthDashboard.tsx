// features/aquariums/components/health/HealthDashboard.tsx
"use client";

import { HealthAnalysisResult } from "../../utils/health-engine";
import { getHealthBorder } from "./health-formatters";
import HealthScoreGauge from "./HealthScoreGauge";
import HealthBentoCards from "./HealthBentoCards";
import HealthAlertPanel from "./HealthAlertPanel";
import HealthActionPanel from "./HealthActionPanel";

interface Props {
  healthResult: HealthAnalysisResult;
  lang: "id" | "en";
}

export default function HealthDashboard({ healthResult, lang }: Props) {
  return (
    <div className="space-y-5">
      {/* KOTAK ATAS: GAUGE (Kiri) + BENTO SUB-SCORES (Kanan) */}
      <div className={`w-full bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-md border-t-8 border-x border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-8 items-center md:items-stretch ${getHealthBorder(healthResult.status)}`}>
        <HealthScoreGauge 
          score={healthResult.scores.overall} 
          status={healthResult.status} 
          trend={healthResult.trend} 
          lang={lang} 
          deductions={healthResult.deductions} // PENTING: Oper data deductions ke Gauge
        />
        <div className="flex-1 w-full flex flex-col justify-center">
          <HealthBentoCards scores={healthResult.scores} lang={lang} />
        </div>
      </div>

      {/* KOTAK BAWAH: DUAL PANEL ALERTS & ACTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-2">
        <HealthAlertPanel alerts={healthResult.alerts} status={healthResult.status} lang={lang} />
        <HealthActionPanel recommendations={healthResult.recommendations} lang={lang} />
      </div>
    </div>
  );
}