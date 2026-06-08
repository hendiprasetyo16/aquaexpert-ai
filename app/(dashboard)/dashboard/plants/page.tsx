import PlantList from "@/features/plants/components/PlantList";
import { Metadata } from "next";

// Menambahkan metadata statis sering membantu Next.js mengenali ini sebagai halaman utama yang valid
export const metadata: Metadata = {
  title: "Database Tanaman | AquaExpert",
  description: "Kelola database tanaman aquascape AquaExpert.",
};

export default function PlantsPage() {
  return (
    // PERBAIKAN: Background dihapus agar transparan dan menyatu dengan background dari layout.tsx
    <div className="p-6 text-gray-900 dark:text-slate-50 transition-colors duration-300">
      <PlantList />
    </div>
  );
}