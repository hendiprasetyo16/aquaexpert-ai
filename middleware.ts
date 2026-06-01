import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Membuat klien Supabase khusus untuk lingkungan Server
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Mengecek status user saat ini
  const { data: { user } } = await supabase.auth.getUser()

  // LOGIKA SATPAM:
  // Jika user belum login, dan mencoba mengakses halaman yang berawalan "/dashboard"
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    // Arahkan paksa ke halaman login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}

// Menentukan di rute mana saja satpam ini berjaga
export const config = {
  matcher: [
    /*
     * Berjaga di semua rute KECUALI:
     * - _next/static (file statis)
     * - _next/image (gambar bawaan)
     * - favicon.ico (ikon website)
     * - file gambar dan ekstensi lainnya
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}