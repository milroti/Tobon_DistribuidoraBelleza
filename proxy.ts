import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, manifest.json, sw.js, icons (static PWA assets)
     * - API routes that handle their own auth
     */
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|icons/).*)",
  ],
};
