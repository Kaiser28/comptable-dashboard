import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { PostgrestSingleResponse, PostgrestResponseFailure } from "@supabase/postgrest-js";
import { Redis } from "@upstash/redis";

/**
 * Timeout pour chaque vérification de service (5 secondes)
 */
const SERVICE_TIMEOUT_MS = 5000;

/**
 * Uptime de l'application (calculé au démarrage)
 */
const APP_START_TIME = Date.now();

/**
 * Helper pour ajouter un timeout à une Promise
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutValue: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(timeoutValue), timeoutMs)),
  ]);
}

/**
 * Vérifie la santé de Supabase Database
 */
async function checkDatabase(): Promise<{ status: "up" | "down"; latency: number }> {
  const startTime = Date.now();
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Objet d'erreur timeout complet selon les types Supabase PostgrestResponseFailure
    const timeoutError: PostgrestResponseFailure = {
      data: null,
      error: {
        message: "Database health check timeout",
        details: "",
        hint: "",
        code: "PGRST504",
        name: "PostgrestError",
      },
      count: null,
      status: 504,
      statusText: "Gateway Timeout",
    };

    // Requête simple sur une table existante avec timeout
    // Wrapper avec Promise.resolve() pour convertir PromiseLike en Promise
    const dbQuery = Promise.resolve(
      supabase.from("clients").select("id").limit(1)
    );
    
    const result: PostgrestSingleResponse<{ id: string }[]> = await withTimeout(
      dbQuery,
      SERVICE_TIMEOUT_MS,
      timeoutError
    );

    const latency = Date.now() - startTime;

    if (result.error) {
      // Timeout ou erreur Supabase
      if (result.error.code === "PGRST504") {
        return { status: "down", latency: SERVICE_TIMEOUT_MS };
      }
      return { status: "down", latency };
    }

    return { status: "up", latency };
  } catch (error) {
    const latency = Date.now() - startTime;
    return { status: "down", latency };
  }
}

/**
 * Vérifie la santé d'Upstash Redis
 */
async function checkRedis(): Promise<{ status: "up" | "down"; latency: number }> {
  const startTime = Date.now();

  try {
    // Créer une instance Redis pour le health check
    const redis = Redis.fromEnv();

    // PING Redis avec timeout
    const pingPromise = redis.ping();
    
    const result = await withTimeout(
      pingPromise,
      SERVICE_TIMEOUT_MS,
      "TIMEOUT"
    );

    const latency = Date.now() - startTime;

    if (result === "TIMEOUT") {
      return { status: "down", latency: SERVICE_TIMEOUT_MS };
    }

    // Redis PING retourne "PONG" si OK
    if (result === "PONG") {
      return { status: "up", latency };
    }

    return { status: "down", latency };
  } catch (error) {
    const latency = Date.now() - startTime;
    return { status: "down", latency };
  }
}

/**
 * GET /api/health
 * Health check endpoint pour monitoring
 * 
 * Vérifie :
 * - Supabase Database (SELECT 1)
 * - Upstash Redis (PING)
 * - Next.js API (toujours UP)
 * 
 * Status HTTP :
 * - 200 : Tous les services UP
 * - 207 : Au moins un service DOWN (degraded)
 * - 503 : Tous les services critiques DOWN
 */
export async function GET() {
  try {
    // Vérifier tous les services en parallèle
    const [database, redis, api] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      Promise.resolve({
        status: "up" as const,
        uptime: Math.floor((Date.now() - APP_START_TIME) / 1000), // en secondes
      }),
    ]);

    // Déterminer le statut global
    const servicesDown = [database, redis].filter((s) => s.status === "down").length;
    const allCriticalDown = database.status === "down" && redis.status === "down";

    let globalStatus: "healthy" | "degraded" | "down";
    let httpStatus: number;

    if (servicesDown === 0) {
      globalStatus = "healthy";
      httpStatus = 200;
    } else if (allCriticalDown) {
      globalStatus = "down";
      httpStatus = 503;
    } else {
      globalStatus = "degraded";
      httpStatus = 207; // Multi-Status
    }

    const response = {
      status: globalStatus,
      timestamp: new Date().toISOString(),
      services: {
        database,
        redis,
        api,
      },
    };

    return NextResponse.json(response, { status: httpStatus });
  } catch (error) {
    // Erreur inattendue lors du health check
    return NextResponse.json(
      {
        status: "down",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
        services: {
          database: { status: "down" as const, latency: 0 },
          redis: { status: "down" as const, latency: 0 },
          api: { status: "up" as const, uptime: Math.floor((Date.now() - APP_START_TIME) / 1000) },
        },
      },
      { status: 503 }
    );
  }
}

