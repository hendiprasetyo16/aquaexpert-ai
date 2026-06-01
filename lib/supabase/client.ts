import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Fungsi ini akan menghubungkan Next.js dengan Supabase 
  // menggunakan kunci rahasia yang ada di .env.local
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}