/**
 * Validations pour les actes de réduction de capital
 */

export interface ReductionCapitalValidationData {
  ancien_capital?: number | null;
  montant_reduction?: number | null;
  nouveau_capital_apres_reduction?: number | null;
  modalite_reduction?: string | null;
  nombre_actions?: number | null;
  nombre_actions_rachetees?: number | null;
  prix_rachat_par_action?: number | null;
  ancienne_valeur_nominale?: number | null;
  nouvelle_valeur_nominale?: number | null;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valide que le capital final est >= 1€
 * RÈGLE 2 : Capital final ≥ 1€ (minimum légal SAS)
 */
export function validateCapitalFinalMinimum(
  data: ReductionCapitalValidationData
): ValidationResult {
  const capitalFinal = data.nouveau_capital_apres_reduction;

  // Si le capital final n'est pas défini, on ne peut pas valider
  if (capitalFinal === null || capitalFinal === undefined) {
    return {
      valid: true, // Pas d'erreur si non défini (sera validé ailleurs)
      error: undefined
    };
  }

  // Validation : capital final doit être >= 1€
  if (capitalFinal < 1) {
    return {
      valid: false,
      error: 'Le capital final doit être ≥ 1€ (minimum légal SAS)'
    };
  }

  return {
    valid: true
  };
}

/**
 * Valide toutes les règles de réduction de capital
 */
export function validateReductionCapital(
  data: ReductionCapitalValidationData
): ValidationResult {
  // RÈGLE 2 : Capital final ≥ 1€
  const capitalFinalResult = validateCapitalFinalMinimum(data);
  if (!capitalFinalResult.valid) {
    return capitalFinalResult;
  }

  // Autres validations peuvent être ajoutées ici...

  return {
    valid: true
  };
}

