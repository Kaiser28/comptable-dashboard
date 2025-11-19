import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { withRateLimit } from "@/lib/ratelimit-upstash";
import { validateUploadedFile } from "@/lib/file-validation";

/**
 * POST /api/clients/[id]/pieces-jointes
 * Upload une pièce jointe pour un client
 * 
 * Rate limiting strict : 20 req/min (upload fichiers - OWASP)
 */
export const POST = withRateLimit(
  async (
    request: Request,
    { params }: { params: { id: string } }
  ) => {
    try {
      const clientId = params.id;

      if (!clientId) {
        return NextResponse.json(
          { error: "ID client manquant" },
          { status: 400 }
        );
      }

      // ============================================
      // SÉCURITÉ : Authentification
      // ============================================
      const authHeader = request.headers.get("authorization");
      const token = authHeader?.replace("Bearer ", "");

      let supabase;
      let user;
      let authError;

      if (token) {
        // Utiliser le token du header pour les tests automatisés
        supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          }
        );
        const result = await supabase.auth.getUser(token);
        user = result.data.user;
        authError = result.error;
      } else {
        // Utiliser les cookies pour l'authentification navigateur
        const cookieStore = await cookies();
        supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get(name: string) {
                return cookieStore.get(name)?.value;
              },
            },
          }
        );
        const result = await supabase.auth.getUser();
        user = result.data.user;
        authError = result.error;
      }

      if (authError || !user) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }

      // ============================================
      // SÉCURITÉ : Vérification que le client existe et appartient au cabinet
      // ============================================
      const { data: expertComptable, error: expertError } = await supabase
        .from("experts_comptables")
        .select("cabinet_id")
        .eq("user_id", user.id)
        .single();

      if (expertError || !expertComptable?.cabinet_id) {
        return NextResponse.json(
          { error: "Cabinet introuvable ou inaccessible." },
          { status: 404 }
        );
      }

      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id, cabinet_id")
        .eq("id", clientId)
        .eq("cabinet_id", expertComptable.cabinet_id)
        .single();

      if (clientError || !client) {
        return NextResponse.json(
          { error: "Client introuvable ou inaccessible." },
          { status: 404 }
        );
      }

      // ============================================
      // SÉCURITÉ : Extraction et validation du fichier
      // ============================================
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "Aucun fichier fourni" },
          { status: 400 }
        );
      }

      // Validation robuste AVANT upload (détection MIME type réel avec file-type)
      const validation = await validateUploadedFile(file, 10);

      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error || "Fichier invalide" },
          { status: 400 }
        );
      }

      // ============================================
      // LOGIQUE MÉTIER : Upload dans Supabase Storage
      // ============================================
      // Générer un nom de fichier unique et sécurisé
      const timestamp = Date.now();
      const sanitizedFileName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .substring(0, 100);
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
      const storagePath = `clients/${clientId}/${timestamp}-${sanitizedFileName}`;

      // Convertir File en Buffer pour l'upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload dans le bucket "pieces-jointes" (ou "documents" selon votre config Supabase)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("pieces-jointes")
        .upload(storagePath, buffer, {
          contentType: validation.detectedType || file.type,
          upsert: false, // Ne pas écraser les fichiers existants
        });

      if (uploadError) {
        console.error("[PIECES JOINTES] Erreur upload:", uploadError);
        return NextResponse.json(
          { error: "Erreur lors de l'upload du fichier" },
          { status: 500 }
        );
      }

      // Récupérer l'URL publique du fichier
      const { data: urlData } = supabase.storage
        .from("pieces-jointes")
        .getPublicUrl(storagePath);

      // ============================================
      // LOGIQUE MÉTIER : Enregistrement dans la table pieces_jointes
      // ============================================
      const typeFichier = formData.get("type_fichier") as string | null;

      const { data: pieceJointe, error: insertError } = await supabase
        .from("pieces_jointes")
        .insert({
          client_id: clientId,
          nom_fichier: file.name,
          type_fichier: typeFichier || "document-divers",
          taille_fichier: file.size,
          url_fichier: urlData.publicUrl,
        })
        .select()
        .single();

      if (insertError) {
        console.error("[PIECES JOINTES] Erreur insertion DB:", insertError);
        // Nettoyer le fichier uploadé si l'insertion échoue
        await supabase.storage.from("pieces-jointes").remove([storagePath]);
        return NextResponse.json(
          { error: "Erreur lors de l'enregistrement du fichier" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: pieceJointe,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("[PIECES JOINTES] Erreur inattendue:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Erreur inattendue lors de l'upload du fichier",
        },
        { status: 500 }
      );
    }
  },
  { limiter: "strict" } // 20 req/min pour upload fichiers (mutation sensible)
);

