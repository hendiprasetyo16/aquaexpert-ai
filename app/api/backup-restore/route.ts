import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

// DAFTAR TABEL YANG INGIN DI-BACKUP (Anda bisa tambahkan 'fishes', 'algae', dll nanti)
const TABLES_TO_BACKUP = ['algae', 'diseases', 'fishes', 'plants', 'profiles', 'tanks', 'users']; 

export async function POST(request: Request) {
  // KEAMANAN TERBARU: Mengecek Secret Key dari Header
  const secret = request.headers.get("x-admin-secret");
  if (secret !== "aquaexpert-sinkron-2024") {
    return NextResponse.json({ error: "Akses Ditolak. Secret key tidak valid." }, { status: 401 });
  }

  try {
    const { action } = await request.json();

    // ==========================================
    // LOGIKA BACKUP (MULTI-TABEL)
    // ==========================================
    if (action === 'BACKUP') {
      const backupData: Record<string, any[]> = {};

      // Looping untuk mengambil data dari seluruh tabel yang didaftarkan
      for (const tableName of TABLES_TO_BACKUP) {
        const { data, error } = await supabase.from(tableName).select('*');
        if (!error && data) {
          backupData[tableName] = data;
        }
      }
      
      // Mengunggah file JSON gabungan ke Storage
      const { error: uploadError } = await supabase.storage
        .from('system-backups')
        .upload(`backup-${Date.now()}.json`, JSON.stringify(backupData), { upsert: true });

      // Menangkap error jika Bucket belum dibuat di Dasbor
      if (uploadError) {
        throw new Error(`Gagal upload: Pastikan bucket 'system-backups' sudah Anda buat di Supabase! Detail: ${uploadError.message}`);
      }

      return NextResponse.json({ 
        success: true, 
        message: `Backup sukses! Menyimpan ${Object.keys(backupData).length} tabel ke Storage.` 
      });
    }

    // ==========================================
    // LOGIKA RESTORE (MULTI-TABEL)
    // ==========================================
    if (action === 'RESTORE') {
      const { data: files, error: listError } = await supabase.storage
        .from('system-backups')
        .list('', { sortBy: { column: 'created_at', order: 'desc' } });
        
      if (listError || !files || files.length === 0) throw new Error("Tidak ada file backup ditemukan di Storage.");

      // Ambil file paling atas (paling terbaru)
      const { data: fileContent, error: dlError } = await supabase.storage
        .from('system-backups')
        .download(files[0].name);
        
      if (dlError || !fileContent) throw new Error("Gagal mengunduh file backup dari Storage.");

      // Parsing isi JSON
      const json = JSON.parse(await fileContent.text());
      let restoredTables = 0;

      // Looping untuk melakukan upsert data ke masing-masing tabel
      for (const tableName of Object.keys(json)) {
         const tableData = json[tableName];
         if (tableData && tableData.length > 0) {
             const { error: upsertError } = await supabase.from(tableName).upsert(tableData);
             if (!upsertError) {
                restoredTables++;
             } else {
                console.error(`Gagal memulihkan tabel ${tableName}:`, upsertError.message);
             }
         }
      }

      return NextResponse.json({ 
        success: true, 
        message: `Restore berhasil dipulihkan untuk ${restoredTables} tabel dari file: ${files[0].name}` 
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}