// app/api/aquariums/sync-images/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. KEAMANAN STRICT MODE
  const secret = request.headers.get("x-admin-secret");
  const validSecret = process.env.API_SECRET_KEY;

  if (!validSecret) {
    return NextResponse.json({ error: "Sistem Terkunci. API_SECRET_KEY belum diatur di server." }, { status: 500 });
  }
  if (secret !== validSecret) {
    return NextResponse.json({ error: "Akses Ditolak. Secret key salah." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Kredensial Supabase tidak lengkap di environment." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Verifikasi apakah bucket aquariums sudah ada
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === 'aquariums');

    if (!bucketExists) {
       return NextResponse.json({ 
         success: false, 
         error: "Bucket 'aquariums' belum tersedia. Silakan jalankan 'Setup Folder' terlebih dahulu." 
       });
    }

    // Mengembalikan status sehat
    return NextResponse.json({ 
      success: true, 
      message: `TADAA! 🎉 Storage Akuarium sehat. Sinkronisasi gambar berjalan otomatis secara real-time dari sisi user.` 
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan verifikasi storage";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}