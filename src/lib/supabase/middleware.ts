import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database";

/**
 * Creates a Supabase client scoped to middleware.
 *
 * Unlike the Server Component client (which uses `cookies()` from next/headers),
 * middleware must read cookies from the incoming NextRequest and write them to
 * a mutable NextResponse. This requires re-assigning `supabaseResponse` inside
 * `setAll` so that both the request AND the response carry the updated cookies.
 *
 * IMPORTANT: The caller must return the `supabaseResponse` returned by this
 * function — never create a new NextResponse() after calling getUser(), or the
 * updated auth cookies will be lost.
 */
export function createMiddlewareClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies to the request so subsequent reads in this middleware
          // chain see the updated values.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Recreate the response so it carries the new request cookies …
          supabaseResponse = NextResponse.next({ request });
          // … then write the Set-Cookie headers onto the response.
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return { supabase, getResponse: () => supabaseResponse };
}
