import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase Client pour composants React (client-side)
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

