import { Leaf } from "lucide-react";

export default function EmptyPlantState() {
  return (
    // PERBAIKAN: bg-slate-50 dan border-slate-300 untuk mode terang
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 py-16 text-center transition-colors duration-300">
      {/* PERBAIKAN: Lingkaran ikon menjadi lebih cerah di mode terang */}
      <div className="rounded-full bg-slate-100 dark:bg-slate-800/50 p-4 transition-colors duration-300">
        <Leaf className="h-10 w-10 text-slate-400 dark:text-slate-500" />
      </div>
      {/* PERBAIKAN: Judul menjadi text-gray-900 di mode terang */}
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-slate-200">Belum ada data tanaman</h3>
      {/* PERBAIKAN: Deskripsi disesuaikan kontrasnya */}
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Database Plant Expert saat ini masih kosong. Silakan tambahkan data tanaman pertama Anda.
      </p>
    </div>
  );
}