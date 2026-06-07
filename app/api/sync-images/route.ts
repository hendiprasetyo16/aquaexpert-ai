import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic'; // Memastikan route tidak di-cache oleh Next.js

export async function GET(request: Request) {
  // 1. KEAMANAN: Membaca secret dari Header, BUKAN dari URL params
  const secret = request.headers.get("x-admin-secret");

  if (secret !== "aquaexpert-sinkron-2024") {
    return NextResponse.json({ error: "Akses Ditolak. Secret key salah." }, { status: 401 });
  }

  // 2. Inisialisasi Supabase (Menggunakan env default Next.js Anda)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Jika Anda punya SUPABASE_SERVICE_ROLE_KEY, pakai itu. Jika tidak, pakai ANON_KEY.
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 3. Ambil semua data tanaman
    const { data: plants, error: plantsError } = await supabase
      .from("plants")
      .select("id, slug")
      .eq("is_active", true);

    if (plantsError) throw plantsError;

    let updatedCount = 0;

    // 4. Looping untuk mengintip Storage masing-masing tanaman
    for (const plant of plants) {
      if (!plant.slug) continue;

      const { data: files, error: filesError } = await supabase.storage
        .from("plant-images")
        .list(plant.slug);

      if (filesError || !files || files.length === 0) continue;

      // Filter file yang valid (bukan folder tersembunyi atau file .empty)
      const validFiles = files.filter(f => !f.name.startsWith("."));
      if (validFiles.length === 0) continue;

      // 5. Ubah daftar nama file menjadi daftar URL Publik
      const publicUrls = validFiles.map((file) => {
        return supabase.storage
          .from("plant-images")
          .getPublicUrl(`${plant.slug}/${file.name}`).data.publicUrl;
      });

      // 6. LOGIKA OTOMATIS: 
      // Karena Anda tidak membedakan "cover", kita ambil file ke-1 sbg Cover, sisanya sbg Galeri
      const newCoverUrl = publicUrls[0]; 
      const newGalleryUrls = publicUrls.slice(1, 9); // Maksimal ambil 8 gambar galeri

      // 7. Simpan URL ke Database
      await supabase
        .from("plants")
        .update({
          image_url: newCoverUrl,
          gallery_urls: newGalleryUrls.length > 0 ? newGalleryUrls : null,
        })
        .eq("id", plant.id);
      
      updatedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `TADAA! 🎉 Berhasil mendeteksi dan melakukan sinkronisasi URL gambar untuk ${updatedCount} tanaman.` 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}