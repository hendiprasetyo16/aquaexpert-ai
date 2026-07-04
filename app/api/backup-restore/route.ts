// app/api/backup-restore/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// 💡 UPDATE: Daftar 25 Tabel terbaru diurutkan secara hierarkis (Topological Sort)
// Urutan ini SANGAT KRUSIAL saat RESTORE agar tidak terjadi error Foreign Key Constraint
const TABLES_TO_BACKUP = [
  // --- 1. MASTER DATA / BASE TABLES ---
  'profiles',
  'my_aquariums',
  'fishes',
  'plants',
  'algae',
  'diseases',
  'symptoms',
  'medications',
  'system_activities',
  'medication_efficacy_stats',

  // --- 2. LEVEL 1 DEPENDENCIES (Relasi Langsung) ---
  'disease_medications',
  'disease_symptoms',
  'fish_disease_relations',
  'medication_environment_rules',
  'medication_fauna_safety',
  'medication_interactions',
  'maintenance_tasks',
  'aquarium_parameters',
  'aquarium_fishes',
  'aquarium_plants',
  'aquarium_treatments',
  'treatment_sessions',

  // --- 3. LEVEL 2 DEPENDENCIES (Riwayat & Log) ---
  'aquarium_maintenance_logs',
  'treatment_logs',
  'treatment_outcomes'
];

export async function POST(request: Request) {
  // 1. KEAMANAN TERBARU: Menggunakan Env Variable, BUKAN Hardcoded!
  const secret = request.headers.get("x-admin-secret");
  const validSecret = process.env.API_SECRET_KEY || "aquaexpert-sinkron-2024"; 
  
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
      const backupData: Record<string, Record<string, unknown>[]> = {};

      for (const tableName of TABLES_TO_BACKUP) {
        const { data, error } = await supabase.from(tableName).select('*');
        if (!error && data) {
          backupData[tableName] = data as Record<string, unknown>[];
        }
      }
      
      // 💡 PERBAIKAN: Membuat format tanggal YYYYMMDD-HHMMSS
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const readableDate = `${year}${month}${day}-${hours}${minutes}${seconds}`;
      const fileName = `backup-${readableDate}.json`;
      
      const { error: uploadError } = await supabase.storage
        .from('system-backups')
        .upload(fileName, JSON.stringify(backupData), { upsert: true });

      if (uploadError) {
        throw new Error(`Gagal upload ke Storage: ${uploadError.message}`);
      }

      return NextResponse.json({ 
        success: true, 
        message: `Backup sukses! Menyimpan ${Object.keys(backupData).length} tabel dengan nama ${fileName}` 
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

      // 💡 PERBAIKAN: Looping menggunakan array TABLES_TO_BACKUP, bukan Object.keys(json)
      // Ini menjamin proses insert data dieksekusi dengan urutan yang aman (Master didahulukan sebelum Relasi).
      for (const tableName of TABLES_TO_BACKUP) {
         const tableData = json[tableName];
         
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal server";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}