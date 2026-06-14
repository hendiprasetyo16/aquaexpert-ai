// app/(dashboard)/dashboard/my-aquarium/[id]/edit/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AquariumWizard from "@/features/aquariums/components/AquariumWizard";
import { getAquariumById } from "@/features/aquariums/repositories/aquarium.repository";

// 1. Tipe params sekarang harus berupa Promise di Next.js terbaru
export default async function EditAquariumPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient(); 
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  try {
    // 2. KITA HARUS AWAIT PARAMS-NYA DULU SEBELUM MENGAMBIL ID
    const resolvedParams = await params;
    
    // 3. Gunakan resolvedParams.id
    const aquarium = await getAquariumById(supabase, resolvedParams.id, user.id);
    
    // Kirim data ke Wizard dengan mode edit
    return <AquariumWizard mode="edit" initialData={aquarium} />;
  } catch (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Akses Ditolak</h2>
        <p className="text-slate-600">Akuarium tidak ditemukan atau Anda tidak memiliki akses.</p>
      </div>
    );
  }
}