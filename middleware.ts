import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // KUNCI PERBAIKAN TYPESCRIPT:
  // Tampung data-nya secara utuh terlebih dahulu agar TypeScript tidak marah
  const { data } = await supabase.auth.getClaims();
  
  // Gunakan optional chaining (?.) untuk mengambil id dengan aman
  const user = data?.claims ? { id: data.claims.sub } : null;
  
  const pathname = request.nextUrl.pathname;

  if (!user && pathname.startsWith("/dashboard")) {
    // 303 See Other: Mencegah bug "muter-muter" saat klik Back di browser
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  if (user) {
    const isAuthPage =
      pathname === "/" || pathname === "/login" || pathname === "/register";

    if (isAuthPage) {
      // 303 See Other: Mencegah bug "muter-muter" saat klik Back di browser
      return NextResponse.redirect(new URL("/dashboard", request.url), 303);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};