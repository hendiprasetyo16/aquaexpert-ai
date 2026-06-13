import AlgaeList from "@/features/algae/components/AlgaeList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Database Alga | AquaExpert",
  description: "Kelola database hama alga aquascape AquaExpert.",
};

export default function AlgaePage() {
  return (
    <div className="p-6 text-gray-900 dark:text-slate-50 transition-colors duration-300">
      <AlgaeList />
    </div>
  );
}