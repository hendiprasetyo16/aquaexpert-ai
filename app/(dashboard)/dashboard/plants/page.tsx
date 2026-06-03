import PlantList from "@/features/plants/components/PlantList";


export default function PlantsPage() {
  return (
    // Menambahkan background gelap dan warna teks default terang
    <div className="min-h-screen bg-slate-950 p-6 text-slate-50">
      <PlantList />
    </div>
  );
}