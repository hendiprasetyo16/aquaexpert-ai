import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. KEAMANAN STRICT MODE
  const secret = request.headers.get("x-admin-secret");
  const validSecret = process.env.API_SECRET_KEY;
  
  if (!validSecret) {
    return NextResponse.json({ error: "Sistem Terkunci. API_SECRET_KEY belum diatur di Environment Variables server." }, { status: 500 });
  }
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
    const { data: fishesData, error: fishesError } = await supabase
      .from("fishes")
      .select("slug")
      .eq("is_active", true);

    if (fishesError) throw new Error(`Gagal fetch data ikan: ${fishesError.message}`);
    if (!fishesData || fishesData.length === 0) throw new Error("Tidak ada data ikan aktif di database.");

    const emptyFile = new Blob([""], { type: "text/plain" });
    let createdCount = 0;
    const failedSlugs: string[] = [];

    for (const item of fishesData) {
      if (!item.slug) continue;

      const filePath = `${item.slug}/.keep`;

      const { error } = await supabase.storage
        .from("fish-images")
        .upload(filePath, emptyFile, { cacheControl: "3600", upsert: true });

      if (!error) {
        createdCount++;
      } else {
        console.error(`Gagal membuat folder ${item.slug}:`, error.message);
        failedSlugs.push(`${item.slug} (${error.message})`);
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
      message: `Selesai! Seluruh ${createdCount} Folder Ikan berhasil dibuat.` 
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal server.";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}