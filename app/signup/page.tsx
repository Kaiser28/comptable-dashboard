'use client';

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabaseClient } from "@/lib/supabase";
import type { Cabinet } from "@/types/database";

const formatAuthErrorMessage = (message: string): string => {
  const normalized = message.toLowerCase();

  if (normalized.includes("email") && normalized.includes("already")) {
    return "Cette adresse e-mail est déjà utilisée.";
  }

  if (normalized.includes("password")) {
    return "Le mot de passe est trop faible. Il doit contenir au moins 6 caractères.";
  }

  return "Impossible de créer le compte. Veuillez vérifier vos informations et réessayer.";
};

export default function SignupPage() {
  const router = useRouter();
  const [cabinetName, setCabinetName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMessage(formatAuthErrorMessage(error.message));
        return;
      }

      const userId = data.user?.id;
      const cabinetPayload: Partial<Cabinet> = {
        nom: cabinetName,
        email,
        telephone: null,
        adresse: null,
      };

      if (userId) {
        cabinetPayload.id = userId;
      }

      const { error: cabinetError } = await supabaseClient
        .from("cabinets")
        .upsert(cabinetPayload, { onConflict: "email" });

      if (cabinetError) {
        setErrorMessage(
          cabinetError.message ||
            "Impossible d’enregistrer le cabinet. Veuillez réessayer plus tard."
        );
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur inattendue est survenue.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Créer un compte cabinet
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Rejoignez SaaS Statuts Juridiques en quelques secondes.
          </p>
        </header>

        {errorMessage ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              className="block text-sm font-medium text-gray-700"
              htmlFor="cabinet-name"
            >
              Nom du cabinet
            </label>
            <input
              id="cabinet-name"
              type="text"
              required
              value={cabinetName}
              onChange={(event) => setCabinetName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              placeholder="Cabinet Dupont"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-700"
              htmlFor="email"
            >
              Email professionnel
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              placeholder="contact@cabinet.fr"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-700"
              htmlFor="password"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-700"
              htmlFor="confirm-password"
            >
              Confirmer le mot de passe
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:bg-gray-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                Création du compte…
              </>
            ) : (
              "Créer un compte"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Déjà inscrit ?{" "}
          <Link
            href="/login"
            className="font-medium text-gray-900 underline-offset-4 hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

