"use client";

import { useEffect } from "react";
import { getPlants } from "@/features/plants/repositories/plant.repository";

export default function PlantsPage() {
  useEffect(() => {
    async function test() {
      const plants = await getPlants();
      console.log("DATA TANAMAN:", plants);
    }

    test();
  }, []);

  return (
    <div className="p-6 text-white">
      <h1>Plants Page - Cek Console Browser Anda (F12)</h1>
    </div>
  );
}