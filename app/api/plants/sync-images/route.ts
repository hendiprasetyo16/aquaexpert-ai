import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. KEAMANAN
  const secret = request.headers.get("x-admin-secret");
  const validSecret = process.env.API_SECRET_KEY || "aquaexpert-sinkron-2024";

  if (secret !== validSecret) {
    return NextResponse.json({ error: "Akses Ditolak. Secret key salah." }, { status: 401 });
  }

  // 2. INISIALISASI AMAN (Runtime di dalam fungsi)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Wajib menggunakan SERVICE_ROLE untuk admin action yang memanipulasi Database massal
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Kredensial Supabase (termasuk SERVICE ROLE KEY) tidak lengkap di environment." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 3. Ambil data tanaman aktif
    const { data: plants, error: plantsError } = await supabase
      .from("plants")
      .select("id, slug, name")
      .eq("is_active", true);

    if (plantsError) throw new Error(`Gagal fetch data plants: ${plantsError.message}`);
    if (!plants || plants.length === 0) throw new Error("Tidak ada tanaman aktif ditemukan di database.");

    let updatedCount = 0;
    const failedSyncs: string[] = []; // Menampung nama tanaman yang gagal sync

    // 4. Looping & Sinkronisasi
    for (const plant of plants) {
      if (!plant.slug) {
        failedSyncs.push(`${plant.name} (Slug kosong)`);
        continue;
      }

      const { data: files, error: filesError } = await supabase.storage
        .from("plant-images")
        .list(plant.slug);

      if (filesError) {
        failedSyncs.push(`${plant.name} (Gagal akses storage: ${filesError.message})`);
        continue;
      }

      if (!files || files.length === 0) continue;

      // Filter folder/file tersembunyi
      const validFiles = files.filter(f => !f.name.startsWith("."));
      if (validFiles.length === 0) continue;

      const publicUrls = validFiles.map((file) => {
        return supabase.storage
          .from("plant-images")
          .getPublicUrl(`${plant.slug}/${file.name}`).data.publicUrl;
      });

      const newCoverUrl = publicUrls[0]; 
      const newGalleryUrls = publicUrls.slice(1, 9); // Maks 8 galeri

      // Simpan perubahan
      const { error: updateError } = await supabase
        .from("plants")
        .update({
          image_url: newCoverUrl,
          gallery_urls: newGalleryUrls.length > 0 ? newGalleryUrls : null,
        })
        .eq("id", plant.id);
      
      if (updateError) {
        failedSyncs.push(`${plant.name} (Gagal update DB: ${updateError.message})`);
      } else {
        updatedCount++;
      }
    }

    if (failedSyncs.length > 0) {
       return NextResponse.json({ 
        success: true, 
        message: `Selesai dengan catatan. Berhasil Sync: ${updatedCount} tanaman. Gagal Sync: ${failedSyncs.length}`,
        errors: failedSyncs
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `TADAA! 🎉 Berhasil melakukan sinkronisasi URL gambar untuk ${updatedCount} tanaman.` 
    });

  // ... kode perulangan untuk mengambil file public URL ...
  } catch (error: unknown) {
    console.error("Kesalahan sistem Sync Images:", error);
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal server.";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}