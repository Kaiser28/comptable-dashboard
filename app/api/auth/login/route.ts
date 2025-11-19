import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting strict pour login : 5 tentatives / 15 minutes par IP
 * Protection contre les attaques brute force
 */
const LOGIN_RATE_LIMIT = {
  maxAttempts: 5,
  windowMinutes: 15,
};

/**
 * Extrait l'IP depuis les headers de la requête
 */
function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}

/**
 * POST /api/auth/login
 * Route de connexion protégée contre les attaques brute force
 * 
 * Rate limiting : 5 tentatives / 15 minutes par IP
 */
export async function POST(request: Request) {
  try {
    // Instance Redis Upstash pour stocker le compteur d'échecs (initialisée au runtime uniquement)
    const redis = Redis.fromEnv();
    
    const ip = getClientIP(request);
    const key = `login-fails:${ip}`;

    // ============================================
    // SÉCURITÉ : Vérification rate limit AVANT traitement
    // ============================================
    const currentFailures = await redis.get<number>(key);
    
    if (currentFailures !== null && currentFailures >= LOGIN_RATE_LIMIT.maxAttempts) {
      return NextResponse.json(
        {
          error: `Trop de tentatives de connexion. Réessayez dans ${LOGIN_RATE_LIMIT.windowMinutes} minutes.`,
        },
        { status: 429 }
      );
    }

    // ============================================
    // EXTRACTION DES DONNÉES
    // ============================================
    const body = await request.json().catch((error): null => {
      console.error('[LOGIN API] Erreur parsing body:', error);
      return null;
    });
    
    if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const { email, password } = body;

    // ============================================
    // AUTHENTIFICATION SUPABASE
    // ============================================
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Erreur silencieuse si cookie déjà défini (Server Component)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: "", ...options });
            } catch (error) {
              // Erreur silencieuse si cookie déjà supprimé
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // ============================================
    // GESTION SUCCÈS / ÉCHEC
    // ============================================
    if (error || !data.user) {
      // Échec : incrémenter le compteur d'échecs
      const newFailureCount = (currentFailures ?? 0) + 1;
      
      // Stocker avec expiration de 15 minutes
      await redis.setex(
        key,
        LOGIN_RATE_LIMIT.windowMinutes * 60, // Convertir minutes en secondes
        newFailureCount
      );

      // Message d'erreur générique (ne pas révéler si l'email existe)
      const errorMessage = 
        error?.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect"
          : error?.message || "Impossible de se connecter. Veuillez réessayer.";

      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      );
    }

    // Succès : réinitialiser le compteur d'échecs
    await redis.del(key);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[LOGIN API] Erreur inattendue:", error);
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Une erreur inattendue est survenue lors de la connexion",
      },
      { status: 500 }
    );
  }
}

