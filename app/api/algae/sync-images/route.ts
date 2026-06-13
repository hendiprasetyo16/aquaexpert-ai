// app/api/algae/sync-images/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secret = request.headers.get("x-admin-secret");
  const validSecret = process.env.API_SECRET_KEY || "aquaexpert-sinkron-2024";

  if (secret !== validSecret) {
    return NextResponse.json({ error: "Akses Ditolak." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Kredensial tidak lengkap." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: algaeList, error: algaeError } = await supabase
      .from("algae")
      .select("id, slug, name_id")
      .eq("is_active", true);

    if (algaeError) throw new Error(algaeError.message);
    if (!algaeList || algaeList.length === 0) throw new Error("Tidak ada data alga.");

    const { data: files, error: filesError } = await supabase.storage
      .from("algae-images")
      .list();

    if (filesError) throw new Error(filesError.message);
    if (!files || files.length === 0) throw new Error("Bucket algae-images kosong.");

    let updatedCount = 0;
    const failedSyncs: string[] = [];

    for (const algae of algaeList) {
      if (!algae.slug) continue;

      const matchingFiles = files.filter(f => f.name.startsWith(algae.slug + "-"));
      if (matchingFiles.length === 0) continue;

      const coverFile = matchingFiles.find(f => f.name.includes("-cover-"));
      const galleryFiles = matchingFiles.filter(f => f.name.includes("-gallery-")).slice(0, 8);

      let newCoverUrl: string | null = null;
      // PERBAIKAN: Berikan tipe secara eksplisit string[]
      let newGalleryUrls: string[] = [];

      if (coverFile) {
        newCoverUrl = supabase.storage.from("algae-images").getPublicUrl(coverFile.name).data.publicUrl;
      }
      if (galleryFiles.length > 0) {
        newGalleryUrls = galleryFiles.map(f => supabase.storage.from("algae-images").getPublicUrl(f.name).data.publicUrl);
      }

      if (newCoverUrl || newGalleryUrls.length > 0) {
        const { error: updateError } = await supabase
          .from("algae")
          .update({
            image_url: newCoverUrl || null,
            gallery_urls: newGalleryUrls.length > 0 ? newGalleryUrls : null,
          })
          .eq("id", algae.id);
        
        if (updateError) failedSyncs.push(`${algae.name_id} (${updateError.message})`);
        else updatedCount++;
      }
    }

    if (failedSyncs.length > 0) {
       return NextResponse.json({ 
        success: true, 
        message: `Berhasil Sync: ${updatedCount} alga. Gagal: ${failedSyncs.length}`,
        errors: failedSyncs
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil sinkronisasi URL gambar untuk ${updatedCount} alga.` 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}