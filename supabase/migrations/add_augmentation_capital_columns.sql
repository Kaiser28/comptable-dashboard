-- Migration: Ajout des colonnes spécifiques à l'augmentation de capital
ALTER TABLE actes_juridiques
ADD COLUMN IF NOT EXISTS ancien_capital NUMERIC,
ADD COLUMN IF NOT EXISTS nouveau_capital NUMERIC,
ADD COLUMN IF NOT EXISTS montant_augmentation NUMERIC,
ADD COLUMN IF NOT EXISTS modalite TEXT CHECK (modalite IN ('numeraire', 'nature', 'reserves')),
ADD COLUMN IF NOT EXISTS description_apport TEXT,
ADD COLUMN IF NOT EXISTS nombre_nouvelles_actions INTEGER,
ADD COLUMN IF NOT EXISTS nouveaux_associes JSONB,
ADD COLUMN IF NOT EXISTS quorum NUMERIC,
ADD COLUMN IF NOT EXISTS votes_pour INTEGER,
ADD COLUMN IF NOT EXISTS votes_contre INTEGER;

