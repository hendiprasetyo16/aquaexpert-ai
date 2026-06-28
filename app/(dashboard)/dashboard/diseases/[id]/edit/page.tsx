// app/(dashboard)/dashboard/diseases/[id]/edit/page.tsx
import { createClient } from "@/lib/supabase/server";
import EditDiseaseClient from "./EditDiseaseClient"; // 👈 Hubungkan ke komponen client tadi

export const dynamic = "force-dynamic";

export default async function EditDiseasePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  
  // Menggunakan await params untuk kompatibilitas Next.js terbaru
  const resolvedParams = await params;

  const { data, error } = await supabase
    .from("diseases")
    .select("*")
    .eq("id", resolvedParams.id)
    .single();

  // Kirim data ke tampilan client yang sudah support multi-bahasa
  return <EditDiseaseClient data={data} error={error} />;
}