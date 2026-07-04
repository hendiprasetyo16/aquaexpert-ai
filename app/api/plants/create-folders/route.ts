// app/api/plants/create-folders/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. KEAMANAN
  const secret = request.headers.get("x-admin-secret");
  const validSecret = process.env.API_SECRET_KEY || "aquaexpert-sinkron-2024";
  
  if (secret !== validSecret) {
    return NextResponse.json({ error: "Akses Ditolak. Secret key tidak valid." }, { status: 401 });
  }

  // 2. INISIALISASI AMAN
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Kredensial Supabase (termasuk SERVICE ROLE KEY) tidak lengkap di environment." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 3. 💡 PERBAIKAN: Ambil daftar slug langsung dari Database (Bukan Hardcode!)
    const { data: plants, error: plantsError } = await supabase
      .from("plants")
      .select("slug")
      .eq("is_active", true);

    if (plantsError) throw new Error(`Gagal fetch data plants: ${plantsError.message}`);
    if (!plants || plants.length === 0) throw new Error("Tidak ada tanaman aktif ditemukan di database.");

    const emptyFile = new Blob([""], { type: "text/plain" });
    let createdCount = 0;
    const failedSlugs: string[] = [];

    // 4. Looping pembuatan folder berdasarkan data real-time
    for (const plant of plants) {
      if (!plant.slug) continue;

      const filePath = `${plant.slug}/.keep`;

      const { error } = await supabase.storage
        .from("plant-images")
        .upload(filePath, emptyFile, { cacheControl: "3600", upsert: true });

      if (!error) {
        createdCount++;
      } else {
        console.error(`Gagal membuat folder ${plant.slug}:`, error.message);
        failedSlugs.push(`${plant.slug} (${error.message})`);
      }
    }

    if (failedSlugs.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: `Selesai dengan catatan. Berhasil: ${createdCount}, Gagal: ${failedSlugs.length}`,
        errors: failedSlugs 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Selesai! Seluruh ${createdCount} Folder Tanaman berhasil dibuat tanpa error.` 
    });

  } catch (error: unknown) {
    console.error("Kesalahan sistem Create Folders:", error);
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal server.";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}