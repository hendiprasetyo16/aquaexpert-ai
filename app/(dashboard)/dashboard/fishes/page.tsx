// app/(dashboard)/dashboard/fishes/page.tsx
import FishList from "@/features/fishes/components/FishList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Database Ikan | AquaExpert",
  description: "Kelola database spesies ikan aquascape AquaExpert.",
};

export default function FishesPage() {
  return (
    <div className="p-6 text-gray-900 dark:text-slate-50 transition-colors duration-300">
      <FishList />
    </div>
  );
}