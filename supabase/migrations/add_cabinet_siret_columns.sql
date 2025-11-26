-- Ajouter colonnes SIRET, adresse, code_naf à la table cabinets
ALTER TABLE cabinets
ADD COLUMN IF NOT EXISTS siret TEXT,
ADD COLUMN IF NOT EXISTS adresse TEXT,
ADD COLUMN IF NOT EXISTS code_naf TEXT;

-- Index pour les recherches par SIRET
CREATE INDEX IF NOT EXISTS idx_cabinets_siret 
ON cabinets(siret);

