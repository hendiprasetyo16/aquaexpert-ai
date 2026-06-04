import PlantList from "@/features/plants/components/PlantList";
import { Metadata } from "next";

// Menambahkan metadata statis sering membantu Next.js mengenali ini sebagai halaman utama yang valid
export const metadata: Metadata = {
  title: "Database Tanaman | AquaExpert",
  description: "Kelola database tanaman aquascape AquaExpert.",
};

export default function PlantsPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-50">
      <PlantList />
    </div>
  );
}