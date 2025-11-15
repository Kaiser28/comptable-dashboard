-- Migration: Ajout des colonnes pour Assemblée Générale Ordinaire
-- Description: Colonnes spécifiques pour les actes de type 'ag_ordinaire' (approbation des comptes annuels)

-- Colonnes spécifiques AG Ordinaire
ALTER TABLE public.actes_juridiques
  -- Date de l'assemblée générale ordinaire
  ADD COLUMN IF NOT EXISTS date_ag DATE,
  
  -- Heure de l'assemblée générale (format: "14:00")
  ADD COLUMN IF NOT EXISTS heure_ag TIME,
  
  -- Lieu de l'assemblée générale
  ADD COLUMN IF NOT EXISTS lieu_ag TEXT,
  
  -- Exercice clos (format: "2024" ou "01/01/2024-31/12/2024")
  ADD COLUMN IF NOT EXISTS exercice_clos VARCHAR(10),
  
  -- Résultat net de l'exercice en euros (peut être négatif en cas de perte)
  ADD COLUMN IF NOT EXISTS resultat_exercice DECIMAL(15,2),
  
  -- Affectation du résultat (report nouveau, réserves, dividendes, ou mixte)
  ADD COLUMN IF NOT EXISTS affectation_resultat VARCHAR(50) CHECK (affectation_resultat IN ('report_nouveau', 'reserves', 'dividendes', 'mixte')),
  
  -- Montant des dividendes distribués (si affectation = dividendes ou mixte)
  ADD COLUMN IF NOT EXISTS montant_dividendes DECIMAL(15,2),
  
  -- Montant mis en réserves (si affectation = reserves ou mixte)
  ADD COLUMN IF NOT EXISTS montant_reserves DECIMAL(15,2),
  
  -- Montant reporté à nouveau (si affectation = report_nouveau ou mixte)
  ADD COLUMN IF NOT EXISTS montant_report DECIMAL(15,2),
  
  -- Quitus accordé au président (par défaut: true)
  ADD COLUMN IF NOT EXISTS quitus_president BOOLEAN DEFAULT true,
  
  -- Nombre de votes POUR l'approbation des comptes annuels
  ADD COLUMN IF NOT EXISTS votes_pour_comptes INTEGER,
  
  -- Nombre de votes CONTRE l'approbation des comptes annuels (par défaut: 0)
  ADD COLUMN IF NOT EXISTS votes_contre_comptes INTEGER DEFAULT 0,
  
  -- Nombre de votes ABSTENTION pour l'approbation des comptes annuels (par défaut: 0)
  ADD COLUMN IF NOT EXISTS votes_abstention_comptes INTEGER DEFAULT 0;

-- Commentaires pour documentation
COMMENT ON COLUMN public.actes_juridiques.date_ag IS 'Date de l''assemblée générale ordinaire';
COMMENT ON COLUMN public.actes_juridiques.exercice_clos IS 'Exercice clos (format: "2024" ou "01/01/2024-31/12/2024")';
COMMENT ON COLUMN public.actes_juridiques.resultat_exercice IS 'Résultat net de l''exercice en euros (peut être négatif en cas de perte)';
COMMENT ON COLUMN public.actes_juridiques.affectation_resultat IS 'Affectation du résultat: report_nouveau, reserves, dividendes, ou mixte';
COMMENT ON COLUMN public.actes_juridiques.montant_dividendes IS 'Montant des dividendes distribués (si affectation = dividendes ou mixte)';
COMMENT ON COLUMN public.actes_juridiques.montant_reserves IS 'Montant mis en réserves (si affectation = reserves ou mixte)';
COMMENT ON COLUMN public.actes_juridiques.montant_report IS 'Montant reporté à nouveau (si affectation = report_nouveau ou mixte)';
COMMENT ON COLUMN public.actes_juridiques.quitus_president IS 'Quitus accordé au président pour sa gestion (par défaut: true)';
COMMENT ON COLUMN public.actes_juridiques.votes_pour_comptes IS 'Nombre de votes POUR l''approbation des comptes annuels';
COMMENT ON COLUMN public.actes_juridiques.votes_contre_comptes IS 'Nombre de votes CONTRE l''approbation des comptes annuels';
COMMENT ON COLUMN public.actes_juridiques.votes_abstention_comptes IS 'Nombre de votes ABSTENTION pour l''approbation des comptes annuels';

