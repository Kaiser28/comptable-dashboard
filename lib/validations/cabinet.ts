import { z } from "zod";

/**
 * Schéma de validation Zod pour les données du cabinet
 */
export const cabinetSchema = z.object({
  nom_cabinet: z.string().min(1, "Le nom du cabinet est requis").max(255),
  siret: z
    .string()
    .refine(
      (val) => !val || /^\d{14}$/.test(val),
      "Le SIRET doit contenir exactement 14 chiffres"
    )
    .optional()
    .or(z.literal("")),
  telephone: z
    .string()
    .refine(
      (val) => !val || /^(?:(?:\+|00)33|0)[1-9](?:[\s.-]*\d{2}){4}$/.test(val),
      "Format de téléphone invalide (ex: 01 23 45 67 89 ou +33 1 23 45 67 89)"
    )
    .optional()
    .or(z.literal("")),
  email_contact: z
    .string()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Email invalide"
    )
    .optional()
    .or(z.literal("")),
  adresse_ligne1: z.string().min(1, "L'adresse ligne 1 est requise").max(255),
  adresse_ligne2: z.string().max(255).optional().or(z.literal("")),
  code_postal: z
    .string()
    .regex(/^\d{5}$/, "Le code postal doit contenir exactement 5 chiffres"),
  ville: z.string().min(1, "La ville est requise").max(100),
  pays: z.string().min(1, "Le pays est requis").default("France"),
});

export type CabinetFormData = z.infer<typeof cabinetSchema>;

