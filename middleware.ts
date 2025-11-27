import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
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

  // Récupérer la session actuelle
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Si une session existe, essayer de la rafraîchir pour s'assurer qu'elle est à jour
  // Cela garantit que auth.uid() fonctionne correctement côté client
  if (session) {
    try {
      // Rafraîchir la session pour mettre à jour les tokens et cookies
      const {
        data: { session: refreshedSession },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (refreshError) {
        // Si le refresh échoue, la session est probablement expirée
        console.log('[MIDDLEWARE] Erreur refresh session:', refreshError.message);
        // On continue avec la session existante ou null
      } else if (refreshedSession) {
        // La session a été rafraîchie avec succès
        // Les cookies sont automatiquement mis à jour via les handlers set() dans createServerClient
        console.log('[MIDDLEWARE] Session rafraîchie avec succès');
      }
    } catch (error) {
      // Erreur lors du refresh, on continue avec la session existante
      console.error('[MIDDLEWARE] Erreur lors du refresh de session:', error);
    }
  }

  // Utiliser la session (rafraîchie ou originale) pour vérifier l'authentification
  const user = session?.user ?? null;

  // Redirection si accès dashboard sans authentification
  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirection si accès login/signup avec authentification
  if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup") && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Retourner la response avec les cookies mis à jour (via refreshSession)
  return response;
}

// Matcher universel : s'exécute sur toutes les routes sauf les fichiers statiques
// Exclut : fichiers Next.js statiques, images optimisées, favicon, et assets (svg, png, jpg, etc.)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

