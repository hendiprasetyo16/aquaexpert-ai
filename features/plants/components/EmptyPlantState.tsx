import { Leaf } from "lucide-react";

export default function EmptyPlantState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/30 py-16 text-center">
      <div className="rounded-full bg-slate-800/50 p-4">
        <Leaf className="h-10 w-10 text-slate-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-200">Belum ada data tanaman</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        Database Plant Expert saat ini masih kosong. Silakan tambahkan data tanaman pertama Anda.
      </p>
    </div>
  );
}