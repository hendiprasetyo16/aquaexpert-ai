import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. KEAMANAN STRICT MODE (TANPA FALLBACK)
  const secret = request.headers.get("x-admin-secret");
  const validSecret = process.env.API_SECRET_KEY; // Murni mengambil dari brankas server
  
  // Cek apakah Admin Server sudah mengatur password di Vercel/.env
  if (!validSecret) {
    return NextResponse.json({ error: "Sistem Terkunci. API_SECRET_KEY belum diatur di Environment Variables server." }, { status: 500 });
  }

  // Cek apakah password yang dikirim dari tombol Control Panel cocok
  if (secret !== validSecret) {
    return NextResponse.json({ error: "Akses Ditolak. Secret key tidak valid." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Kredensial Supabase tidak lengkap." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Menggunakan name_id sesuai skema database terbaru
    const { data: algaeData, error: algaeError } = await supabase
      .from("algae")
      .select("id, slug, name_id")
      .eq("is_active", true);

    if (algaeError) throw new Error(algaeError.message);
    if (!algaeData || algaeData.length === 0) throw new Error("Tidak ada data alga.");

    let updatedCount = 0;
    const failedSyncs: string[] = [];

    for (const item of algaeData) {
      if (!item.slug) {
        failedSyncs.push(`${item.name_id} (Slug kosong)`);
        continue;
      }

      const { data: files, error: filesError } = await supabase.storage
        .from("algae-images")
        .list(item.slug);

      if (filesError) {
        failedSyncs.push(`${item.name_id} (Gagal akses storage)`);
        continue;
      }

      if (!files || files.length === 0) continue;

      const validFiles = files.filter(f => !f.name.startsWith("."));
      if (validFiles.length === 0) continue;

      const publicUrls = validFiles.map((file) => {
        return supabase.storage
          .from("algae-images")
          .getPublicUrl(`${item.slug}/${file.name}`).data.publicUrl;
      });

      const newCoverUrl = publicUrls[0]; 
      const newGalleryUrls = publicUrls.slice(1, 9); // Limit 8 galeri

      const { error: updateError } = await supabase
        .from("algae")
        .update({
          image_url: newCoverUrl,
          gallery_urls: newGalleryUrls.length > 0 ? newGalleryUrls : null,
        })
        .eq("id", item.id);
      
      if (updateError) {
        failedSyncs.push(`${item.name_id} (Gagal update DB)`);
      } else {
        updatedCount++;
      }
    }

    if (failedSyncs.length > 0) {
       return NextResponse.json({ 
        success: true, 
        message: `Selesai dengan catatan. Berhasil Sync: ${updatedCount} Alga. Gagal Sync: ${failedSyncs.length}`,
        errors: failedSyncs
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `TADAA! 🎉 Berhasil melakukan sinkronisasi URL gambar untuk ${updatedCount} jenis Alga.` 
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal server.";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}