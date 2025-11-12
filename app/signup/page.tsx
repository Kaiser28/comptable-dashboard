'use client';

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabaseClient } from "@/lib/supabase";
import { initExpertComptable } from "@/lib/initExpert";
import type { Cabinet } from "@/types/database";

type FormErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  nom_cabinet?: string;
  telephone?: string;
  adresse?: string;
  global?: string;
};

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nomCabinet, setNomCabinet] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validation email
    if (!email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "L'email n'est pas valide";
    }

    // Validation mot de passe
    if (!password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
    }

    // Validation confirmation mot de passe
    if (!confirmPassword) {
      newErrors.confirmPassword = "La confirmation du mot de passe est requise";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    // Validation nom du cabinet
    if (!nomCabinet.trim()) {
      newErrors.nom_cabinet = "Le nom du cabinet est requis";
    } else if (nomCabinet.trim().length < 2) {
      newErrors.nom_cabinet = "Le nom du cabinet doit contenir au moins 2 caractères";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    // Validation
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Étape 1 : Créer l'utilisateur avec Supabase Auth
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        console.error("Erreur création utilisateur:", authError);
        const errorMessage = authError.message.toLowerCase();
        if (errorMessage.includes("email") && (errorMessage.includes("already") || errorMessage.includes("exists"))) {
          setErrors({ global: "Cet email est déjà utilisé. Veuillez vous connecter ou utiliser un autre email." });
        } else if (errorMessage.includes("password")) {
          setErrors({ password: "Le mot de passe est trop faible. Utilisez au moins 8 caractères." });
        } else {
          setErrors({ global: "Impossible de créer le compte. Veuillez réessayer." });
        }
        return;
      }

      if (!authData.user) {
        console.error("Aucun utilisateur retourné par Supabase Auth");
        setErrors({ global: "Impossible de créer l'utilisateur. Veuillez réessayer." });
        return;
      }

      const userId = authData.user.id;

      // Étape 2 : Créer le cabinet
      const cabinetPayload: Partial<Cabinet> = {
        id: userId, // Dans notre structure, cabinet.id = userId
        nom: nomCabinet.trim(),
        email: email.trim(),
        telephone: telephone.trim() || null,
        adresse: adresse.trim() || null,
      };

      const { error: cabinetError } = await supabaseClient
        .from("cabinets")
        .upsert(cabinetPayload, { onConflict: "email" })
        .select()
        .single();

      if (cabinetError) {
        console.error("Erreur création cabinet:", cabinetError);
        setErrors({
          global: "Impossible d'enregistrer le cabinet. Veuillez réessayer plus tard.",
        });
        return;
      }

      const cabinetId = userId; // Dans notre structure, cabinet.id = userId

      // Étape 3 : Créer automatiquement l'expert-comptable admin
      try {
        const expertPayload = {
          id: crypto.randomUUID(),
          cabinet_id: cabinetId,
          user_id: userId,
          email: email.trim(),
          nom: null,
          prenom: null,
          telephone: null,
          role: 'admin' as const,
          actif: true,
        };

        const { error: expertError } = await supabaseClient
          .from("experts_comptables")
          .insert(expertPayload)
          .select()
          .single();

        if (expertError && expertError.code !== "23505") {
          // Ignorer les erreurs de doublon (23505), mais logger les autres
          console.error("Erreur création expert:", expertError);
          // Ne pas bloquer l'inscription si l'expert ne peut pas être créé
        }
      } catch (err) {
        console.error("Exception lors création expert:", err);
        // Ne pas bloquer l'inscription si l'expert ne peut pas être créé
        // Il sera créé au prochain chargement du dashboard (filet de sécurité)
      }

      // Rediriger vers le dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      setErrors({ 
        global: "Une erreur est survenue lors de la création de votre compte. Veuillez réessayer ou contacter le support." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">
            Créer un compte cabinet
          </CardTitle>
          <CardDescription>
            Rejoignez SaaS Statuts Juridiques en quelques secondes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errors.global && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errors.global}</AlertDescription>
            </Alert>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Nom du cabinet */}
            <div className="space-y-2">
              <Label htmlFor="nom_cabinet">
                Nom du cabinet <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nom_cabinet"
                type="text"
                value={nomCabinet}
                onChange={(e) => {
                  setNomCabinet(e.target.value);
                  if (errors.nom_cabinet) {
                    setErrors({ ...errors, nom_cabinet: undefined });
                  }
                }}
                placeholder="Cabinet Dupont"
                required
                className={errors.nom_cabinet ? "border-red-500" : ""}
              />
              {errors.nom_cabinet && (
                <p className="text-sm text-red-600">{errors.nom_cabinet}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email professionnel <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors({ ...errors, email: undefined });
                  }
                }}
                placeholder="contact@cabinet.fr"
                required
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="password">
                Mot de passe <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors({ ...errors, password: undefined });
                  }
                }}
                placeholder="••••••••"
                minLength={8}
                required
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
              <p className="text-xs text-gray-500">
                Minimum 8 caractères
              </p>
            </div>

            {/* Confirmation mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: undefined });
                  }
                }}
                placeholder="••••••••"
                minLength={8}
                required
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone du cabinet</Label>
              <Input
                id="telephone"
                type="tel"
                autoComplete="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="01 23 45 67 89"
                className={errors.telephone ? "border-red-500" : ""}
              />
              {errors.telephone && (
                <p className="text-sm text-red-600">{errors.telephone}</p>
              )}
            </div>

            {/* Adresse */}
            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse du cabinet</Label>
              <Input
                id="adresse"
                type="text"
                autoComplete="street-address"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="123 Rue de la République, 75001 Paris"
                className={errors.adresse ? "border-red-500" : ""}
              />
              {errors.adresse && (
                <p className="text-sm text-red-600">{errors.adresse}</p>
              )}
            </div>

            {/* Bouton de soumission */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                  Création du compte…
                </>
              ) : (
                "Créer mon compte"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Déjà inscrit ?{" "}
            <Link
              href="/login"
              className="font-medium text-gray-900 underline-offset-4 hover:underline"
            >
              Connectez-vous
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
