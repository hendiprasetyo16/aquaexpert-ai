// D:\aquaexpert-ai\app\api\backup-restore\route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const TABLES_TO_BACKUP = ['algae', 'diseases', 'fishes', 'plants', 'profiles', 'tanks', 'users']; 

export async function POST(request: Request) {
  // 1. KEAMANAN TERBARU: Menggunakan Env Variable, BUKAN Hardcoded!
  // Pastikan Anda menambahkan variabel API_SECRET_KEY di Vercel dengan nilai "aquaexpert-sinkron-2024"
  const secret = request.headers.get("x-admin-secret");
  const validSecret = process.env.API_SECRET_KEY || "aquaexpert-sinkron-2024"; // Fallback sementara untuk lokal
  
  if (secret !== validSecret) {
    return NextResponse.json({ error: "Akses Ditolak. Secret key tidak valid." }, { status: 401 });
  }

  // 2. INISIALISASI AMAN DI DALAM FUNGSI (Mencegah Error Vercel Build)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Wajib Service Role untuk admin task
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Kredensial Supabase tidak lengkap di env server." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { action } = await request.json();

    // ==========================================
    // LOGIKA BACKUP
    // ==========================================
    if (action === 'BACKUP') {
      // REFAKTOR: Mengganti any[] menjadi Record<string, unknown>[]
      // Baris dari database (row) adalah objek dengan key string dan value yang belum diketahui (unknown)
      const backupData: Record<string, Record<string, unknown>[]> = {};

      for (const tableName of TABLES_TO_BACKUP) {
        const { data, error } = await supabase.from(tableName).select('*');
        if (!error && data) {
          // Melakukan type assertion yang aman dari Supabase data ke tipe kita
          backupData[tableName] = data as Record<string, unknown>[];
        }
      }
      
      const { error: uploadError } = await supabase.storage
        .from('system-backups')
        .upload(`backup-${Date.now()}.json`, JSON.stringify(backupData), { upsert: true });

      if (uploadError) {
        throw new Error(`Gagal upload ke Storage: ${uploadError.message}`);
      }

      return NextResponse.json({ 
        success: true, 
        message: `Backup sukses! Menyimpan ${Object.keys(backupData).length} tabel ke Storage.` 
      });
    }

    // ==========================================
    // LOGIKA RESTORE
    // ==========================================
    if (action === 'RESTORE') {
      const { data: files, error: listError } = await supabase.storage
        .from('system-backups')
        .list('', { sortBy: { column: 'created_at', order: 'desc' } });
        
      if (listError || !files || files.length === 0) throw new Error("Tidak ada file backup ditemukan.");

      const { data: fileContent, error: dlError } = await supabase.storage
        .from('system-backups')
        .download(files[0].name);
        
      if (dlError || !fileContent) throw new Error("Gagal mengunduh file backup.");

      const json = JSON.parse(await fileContent.text());
      let restoredTables = 0;

      for (const tableName of Object.keys(json)) {
         const tableData = json[tableName];
         // Memastikan tableData benar-benar sebuah Array sebelum di-upsert (Type Guard)
         if (tableData && Array.isArray(tableData) && tableData.length > 0) {
             const { error: upsertError } = await supabase.from(tableName).upsert(tableData);
             if (!upsertError) {
                restoredTables++;
             } else {
                console.error(`Gagal pulih tabel ${tableName}:`, upsertError.message);
             }
         }
      }

      return NextResponse.json({ 
        success: true, 
        message: `Restore berhasil dipulihkan untuk ${restoredTables} tabel dari file: ${files[0].name}` 
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (error: unknown) { // REFAKTOR: Mengganti 'any' menjadi 'unknown'
    // REFAKTOR: Pengecekan tipe error yang aman (Type Guarding)
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal server";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}