// Types
export interface ValidationError {
  code: string;
  message: string;
  field: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Interface des données à valider
interface ClientDataToValidate {
  capital_social: number;
  nb_actions: number;
  montant_libere: number;
  duree_societe: number;
  objet_social: string;
}

// Fonction 1 : Validation cohérence capital
function validateCapitalCoherence(capital: number, nbActions: number): ValidationError | null {
  const valeurNominale = capital / nbActions;
  
  // Vérifier que c'est un nombre entier (avec tolérance de 0.01 pour les arrondis)
  if (Math.abs(valeurNominale - Math.round(valeurNominale * 100) / 100) > 0.01) {
    return {
      code: 'CAPITAL_NOT_DIVISIBLE',
      message: `Le capital social (${capital.toLocaleString('fr-FR')} €) n'est pas divisible par le nombre d'actions (${nbActions}). Valeur nominale calculée : ${valeurNominale.toFixed(2)} €. Ajustez le capital ou le nombre d'actions pour obtenir une valeur nominale entière.`,
      field: 'capital_social',
      severity: 'error'
    };
  }
  
  return null;
}

// Fonction 2 : Validation libération minimum 50%
function validateLiberationMinimum(capital: number, montantLibere: number): ValidationError | null {
  const minimum = capital * 0.5;
  const pourcentage = (montantLibere / capital) * 100;
  
  if (montantLibere < minimum) {
    return {
      code: 'LIBERATION_INSUFFICIENT',
      message: `Le montant libéré (${montantLibere.toLocaleString('fr-FR')} €, soit ${pourcentage.toFixed(0)}%) est inférieur au minimum légal de 50% (${minimum.toLocaleString('fr-FR')} €). La loi impose une libération d'au moins la moitié du capital à la constitution.`,
      field: 'montant_libere',
      severity: 'error'
    };
  }
  
  return null;
}

// Fonction 3 : Validation durée société (max 99 ans)
function validateDureeSociete(duree: number): ValidationError | null {
  if (duree > 99) {
    return {
      code: 'DUREE_EXCEEDS_MAXIMUM',
      message: `La durée de la société (${duree} ans) dépasse le maximum légal de 99 ans.`,
      field: 'duree_societe',
      severity: 'error'
    };
  }
  
  if (duree < 1) {
    return {
      code: 'DUREE_TOO_SHORT',
      message: `La durée de la société doit être d'au moins 1 an.`,
      field: 'duree_societe',
      severity: 'error'
    };
  }
  
  return null;
}

// Fonction 4 : Détection activités réglementées
function detectActivitesReglementees(objetSocial: string): ValidationError | null {
  const motsClefs = [
    { mots: ['médecin', 'médical', 'santé', 'clinique', 'docteur', 'cabinet médical'], activite: 'médicale' },
    { mots: ['avocat', 'juriste', 'juridique', 'cabinet d\'avocat'], activite: 'juridique' },
    { mots: ['architecte', 'architecture', 'ordre des architectes'], activite: 'd\'architecte' },
    { mots: ['expert-comptable', 'comptable', 'expertise comptable'], activite: 'comptable' },
    { mots: ['notaire', 'office notarial', 'étude notariale'], activite: 'notariale' },
    { mots: ['banque', 'crédit', 'finance', 'établissement financier'], activite: 'financière' },
    { mots: ['assurance', 'courtier en assurance'], activite: 'd\'assurance' },
    { mots: ['agent immobilier', 'transaction immobilière', 'immobilier'], activite: 'immobilière' }
  ];
  
  const objetLower = objetSocial.toLowerCase();
  
  for (const { mots, activite } of motsClefs) {
    for (const mot of mots) {
      if (objetLower.includes(mot)) {
        return {
          code: 'ACTIVITE_REGLEMENTEE',
          message: `⚠️ Activité réglementée détectée (${activite}). Des clauses spécifiques ou des autorisations peuvent être nécessaires. Consultez un juriste spécialisé.`,
          field: 'objet_social',
          severity: 'warning'
        };
      }
    }
  }
  
  return null;
}

// Fonction principale de validation
export function validateStatutsData(data: ClientDataToValidate): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // Validation 1 : Cohérence capital
  const errCapital = validateCapitalCoherence(data.capital_social, data.nb_actions);
  if (errCapital) {
    if (errCapital.severity === 'error') errors.push(errCapital);
    else warnings.push(errCapital);
  }
  
  // Validation 2 : Libération minimum
  const errLiberation = validateLiberationMinimum(data.capital_social, data.montant_libere);
  if (errLiberation) {
    if (errLiberation.severity === 'error') errors.push(errLiberation);
    else warnings.push(errLiberation);
  }
  
  // Validation 3 : Durée société
  const errDuree = validateDureeSociete(data.duree_societe);
  if (errDuree) {
    if (errDuree.severity === 'error') errors.push(errDuree);
    else warnings.push(errDuree);
  }
  
  // Validation 4 : Activités réglementées
  const warnActivite = detectActivitesReglementees(data.objet_social);
  if (warnActivite) {
    warnings.push(warnActivite);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

