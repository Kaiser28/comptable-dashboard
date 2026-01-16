import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Rate limiting strict pour login : 5 tentatives / 15 minutes par IP
 * Protection contre les attaques brute force
 * Note: Nécessite Upstash Redis configuré (optionnel)
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
    console.log('[LOGIN API] Début de la requête de connexion');
    
    // Instance Redis Upstash pour stocker le compteur d'échecs (optionnel)
    let redis: any = null;
    let currentFailures: number | null = null;
    
    // Initialiser Redis uniquement si les variables sont configurées
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const { Redis } = await import("@upstash/redis");
        redis = Redis.fromEnv();
        const ip = getClientIP(request);
        const key = `login-fails:${ip}`;
        
        console.log('[LOGIN API] Redis initialisé, vérification rate limit pour IP:', ip);
        
        // ============================================
        // SÉCURITÉ : Vérification rate limit AVANT traitement
        // ============================================
        currentFailures = await redis.get<number>(key);
        
        if (currentFailures !== null && currentFailures >= LOGIN_RATE_LIMIT.maxAttempts) {
          console.log('[LOGIN API] Rate limit dépassé pour IP:', ip);
          return NextResponse.json(
            {
              error: `Trop de tentatives de connexion. Réessayez dans ${LOGIN_RATE_LIMIT.windowMinutes} minutes.`,
            },
            { status: 429 }
          );
        }
      } catch (redisError) {
        console.error('[LOGIN API] Erreur initialisation Redis:', redisError);
        // Continuer sans rate limiting si Redis échoue
      }
    } else {
      console.warn('[LOGIN API] Upstash Redis non configuré - Rate limiting désactivé');
    }

    // ============================================
    // EXTRACTION DES DONNÉES
    // ============================================
    const body = await request.json().catch((error): null => {
      console.error('[LOGIN API] Erreur parsing body:', error);
      return null;
    });
    
    if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
      console.error('[LOGIN API] Body invalide ou données manquantes');
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const { email, password } = body;
    console.log('[LOGIN API] Tentative de connexion pour:', email);

    // ============================================
    // AUTHENTIFICATION SUPABASE
    // ============================================
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('[LOGIN API] Variables Supabase:', {
      url: supabaseUrl ? 'définie' : 'MANQUANTE',
      key: supabaseKey ? 'définie' : 'MANQUANTE'
    });
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[LOGIN API] Variables Supabase manquantes!');
      return NextResponse.json(
        { error: "Configuration serveur incorrecte" },
        { status: 500 }
      );
    }
    
    console.log('[LOGIN API] AVANT await cookies()');
    const cookieStore = await cookies();
    console.log('[LOGIN API] APRÈS await cookies() - succès');
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
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
    
    console.log('[LOGIN API] Résultat authentification:', {
      success: !!data.user,
      error: error?.message || 'aucune'
    });

    // ============================================
    // GESTION SUCCÈS / ÉCHEC
    // ============================================
    if (error || !data.user) {
      // Échec : incrémenter le compteur d'échecs (si Redis disponible)
      if (redis) {
        const ip = getClientIP(request);
        const key = `login-fails:${ip}`;
        const newFailureCount = (currentFailures ?? 0) + 1;
        
        // Stocker avec expiration de 15 minutes
        await redis.setex(
          key,
          LOGIN_RATE_LIMIT.windowMinutes * 60, // Convertir minutes en secondes
          newFailureCount
        );
      }

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

    // Succès : réinitialiser le compteur d'échecs (si Redis disponible)
    if (redis) {
      const ip = getClientIP(request);
      const key = `login-fails:${ip}`;
      await redis.del(key);
    }

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

