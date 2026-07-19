// features/treatments/actions/waterqualitylogs.action.ts
// 💡 FITUR BARU: Ambil data log kualitas air dari sesi pengobatan
// Hanya ambil log yang memiliki data kualitas air (water_parameters)
// Hasilnya akan diformat agar mudah dibaca oleh Recharts
// Contoh hasil: [{ day: "Hari 1", temp: 25, ammonia: 0.2, nitrite: 0.1 }, ...]
// 💡 Catatan: Supabase menyimpan water_parameters sebagai JSONB, jadi kita perlu parse isinya
// 💡 Catatan: Jika tidak ada data, akan mengembalikan array kosong
// 💡 Catatan: Jika terjadi error, akan mengembalikan { success: false, data: [] }
// 💡 Catatan: Gunakan ini di halaman
// dashboard untuk menampilkan grafik kualitas air per hari selama sesi pengobatan
// 💡 Catatan: Pastikan untuk memanggil ini di server action (misal: getServerSideProps) agar tidak terkena cache Vercel
// 💡 Catatan: Jika ingin menambahkan filter berdasarkan range tanggal, bisa ditambahkan parameter startDate & endDate

"use server";

import { createClient } from "@/lib/supabase/server";

export async function getWaterQualityLogsAction(sessionId: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("treatment_logs")
      .select("day_number, log_date, water_parameters")
      .eq("session_id", sessionId)
      .not("water_parameters", "is", null) 
      .order("day_number", { ascending: true });

    if (error) throw error;

    const formattedData = data.map(log => {
      let params = log.water_parameters;
      if (typeof log.water_parameters === 'string') {
          try {
              params = JSON.parse(log.water_parameters);
          } catch(e) {
              params = {};
          }
      }

      return {
        day: `Hari ${log.day_number}`,
        temp: params?.temp ? Number(params.temp) : null,
        ammonia: params?.ammonia ? Number(params.ammonia) : null,
        nitrite: params?.nitrite ? Number(params.nitrite) : null,
      };
    });

    return { success: true, data: formattedData };
  } catch (error) {
    console.error("Error fetching water quality:", error);
    return { success: false, data: [] };
  }
}