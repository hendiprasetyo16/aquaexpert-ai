import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // KEAMANAN STRICT MODE
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
    // Membuat file pancingan agar memastikan bucket siap dan aman
    const { error } = await supabase.storage
      .from("avatars")
      .upload("system/.keep", new Blob(["keep folder"]), { upsert: true });

    if (error && !error.message.includes("The resource already exists")) {
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil! Bucket 'avatars' sudah siap digunakan oleh User.` 
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}