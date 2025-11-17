-- Migration: Ajout colonnes réduction de capital
-- Date: 2025-01-17
-- Description: Colonnes pour gérer les 3 modalités de réduction de capital

ALTER TABLE actes_juridiques
ADD COLUMN IF NOT EXISTS modalite_reduction TEXT CHECK (modalite_reduction IN ('rachat_annulation', 'reduction_valeur_nominale', 'coup_accordeon')),
ADD COLUMN IF NOT EXISTS montant_reduction NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS nouveau_capital_apres_reduction NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS nombre_actions_rachetees INTEGER,
ADD COLUMN IF NOT EXISTS prix_rachat_par_action NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS ancienne_valeur_nominale NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS nouvelle_valeur_nominale NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS motif_reduction TEXT,
ADD COLUMN IF NOT EXISTS coup_accordeon_augmentation_montant NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS coup_accordeon_nouveau_capital_final NUMERIC(15, 2);

-- Commentaires pour documentation
COMMENT ON COLUMN actes_juridiques.modalite_reduction IS 'Type de réduction: rachat_annulation, reduction_valeur_nominale, coup_accordeon';
COMMENT ON COLUMN actes_juridiques.montant_reduction IS 'Montant total de la réduction en euros';
COMMENT ON COLUMN actes_juridiques.nouveau_capital_apres_reduction IS 'Capital social après réduction';
COMMENT ON COLUMN actes_juridiques.nombre_actions_rachetees IS 'Nombre d''actions rachetées (modalité rachat)';
COMMENT ON COLUMN actes_juridiques.prix_rachat_par_action IS 'Prix unitaire de rachat (modalité rachat)';
COMMENT ON COLUMN actes_juridiques.ancienne_valeur_nominale IS 'Valeur nominale avant réduction (modalité valeur nominale)';
COMMENT ON COLUMN actes_juridiques.nouvelle_valeur_nominale IS 'Valeur nominale après réduction (modalité valeur nominale)';
COMMENT ON COLUMN actes_juridiques.motif_reduction IS 'Raison juridique de la réduction (pertes, remboursement, etc.)';
COMMENT ON COLUMN actes_juridiques.coup_accordeon_augmentation_montant IS 'Montant de l''augmentation après réduction à 1€ (coup d''accordéon)';
COMMENT ON COLUMN actes_juridiques.coup_accordeon_nouveau_capital_final IS 'Capital final après coup d''accordéon (réduction + augmentation)';
