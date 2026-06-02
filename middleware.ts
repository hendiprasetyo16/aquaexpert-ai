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
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // HAPUS BARIS INI:
  // const { data: { user } } = await supabase.auth.getUser();
  // GANTI DENGAN INI (Membaca KTP/Cookie secara lokal dalam 0 milidetik):
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  const pathname = request.nextUrl.pathname;

  /* JIKA BELUM LOGIN */
  if (!user && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  /* JIKA SUDAH LOGIN */
  if (user) {
    const isAuthPage = pathname === "/" || pathname === "/login" || pathname === "/register";

    if (isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Role Protection
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const role = profile?.role ?? "user";

    const isPlantAdminPage = pathname.includes("/plants/create") || pathname.includes("/plants/edit");

    if (role === "user" && isPlantAdminPage) {
      return NextResponse.redirect(new URL("/dashboard/plants", request.url));
    }

    if (role !== "super_admin" && (pathname.startsWith("/admin/users") || pathname.startsWith("/admin/settings"))) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};