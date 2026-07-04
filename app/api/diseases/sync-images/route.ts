import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. KEAMANAN STRICT MODE
  const secret = request.headers.get("x-admin-secret");
  const validSecret = process.env.API_SECRET_KEY;
  
  if (!validSecret) {
    return NextResponse.json({ error: "Sistem Terkunci. API_SECRET_KEY belum diatur." }, { status: 500 });
  }
  if (secret !== validSecret) {
    return NextResponse.json({ error: "Akses Ditolak." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Kredensial Supabase tidak lengkap." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: diseasesData, error: diseasesError } = await supabase
      .from("diseases")
      .select("id, slug, name_id")
      .eq("is_active", true);

    if (diseasesError) throw new Error(diseasesError.message);
    if (!diseasesData || diseasesData.length === 0) throw new Error("Tidak ada data penyakit.");

    // 💡 PERBEDAAN: Ambil semua file di root bucket ('')
    const { data: rootFiles, error: rootFilesError } = await supabase.storage
      .from("disease-images")
      .list("");

    if (rootFilesError) throw new Error(`Gagal akses storage: ${rootFilesError.message}`);
    const validRootFiles = (rootFiles || []).filter(f => !f.name.startsWith("."));

    let updatedCount = 0;
    const failedSyncs: string[] = [];

    for (const item of diseasesData) {
      if (!item.slug) continue;

      // Cari file yang namanya diawali dengan slug penyakit ini
      const matchingFiles = validRootFiles.filter(f => f.name.startsWith(item.slug!));

      if (matchingFiles.length === 0) {
        continue; // Lewati jika belum ada gambarnya, bukan berarti error
      }

      // Urutkan abjad agar gambar utama konsisten
      matchingFiles.sort((a, b) => a.name.localeCompare(b.name));

      const publicUrls = matchingFiles.map((file) => {
        return supabase.storage
          .from("disease-images")
          .getPublicUrl(file.name).data.publicUrl;
      });

      const newCoverUrl = publicUrls[0]; 
      const newGalleryUrls = publicUrls.slice(1, 9);

      const { error: updateError } = await supabase
        .from("diseases")
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
        message: `Berhasil Sync: ${updatedCount} Penyakit. Gagal: ${failedSyncs.length}`,
        errors: failedSyncs
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil melakukan sinkronisasi URL gambar untuk ${updatedCount} Penyakit.` 
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal server.";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}