// app/api/fishes/sync-images/route.ts
import { NextResponse } from "next/server";

// Kode sementara agar TypeScript dan Vercel tidak error
export async function GET(request: Request) {
  return NextResponse.json({ 
    success: true, 
    message: "API Sinkronisasi Ikan masih dalam tahap pengembangan." 
  });
}