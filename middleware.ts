import {
  NextResponse,
  type NextRequest,
} from "next/server";

import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";

export async function middleware(
  request: NextRequest
) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase =
    createServerClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(
              name
            )?.value;
          },

          set(
            name: string,
            value: string,
            options: CookieOptions
          ) {
            request.cookies.set({
              name,
              value,
              ...options,
            });

            response =
              NextResponse.next({
                request: {
                  headers:
                    request.headers,
                },
              });

            response.cookies.set({
              name,
              value,
              ...options,
            });
          },

          remove(
            name: string,
            options: CookieOptions
          ) {
            request.cookies.set({
              name,
              value: "",
              ...options,
            });

            response =
              NextResponse.next({
                request: {
                  headers:
                    request.headers,
                },
              });

            response.cookies.set({
              name,
              value: "",
              ...options,
            });
          },
        },
      }
    );

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  const pathname =
    request.nextUrl.pathname;

  /*
   * BELUM LOGIN
   */

  if (
    !user &&
    pathname.startsWith(
      "/dashboard"
    )
  ) {
    return NextResponse.redirect(
      new URL(
        "/login",
        request.url
      )
    );
  }

  /*
   * SUDAH LOGIN
   */

  if (user) {
    const { data: profile } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const role =
      profile?.role;

    /*
     * USER TIDAK BOLEH
     * CREATE / EDIT / DELETE
     */

    const isPlantAdminPage =
      pathname.includes(
        "/plants/create"
      ) ||
      pathname.includes(
        "/plants/edit"
      ) ||
      pathname.match(
        /\/plants\/.*\/edit/
      );

    if (
      role === "user" &&
      isPlantAdminPage
    ) {
      return NextResponse.redirect(
        new URL(
          "/dashboard/plants",
          request.url
        )
      );
    }

    /*
     * USER TIDAK BOLEH
     * USERS & SETTINGS
     */

    if (
      role !== "super_admin" &&
      (pathname.startsWith(
        "/admin/users"
      ) ||
        pathname.startsWith(
          "/admin/settings"
        ))
    ) {
      return NextResponse.redirect(
        new URL(
          "/dashboard",
          request.url
        )
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};