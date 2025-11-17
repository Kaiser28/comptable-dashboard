-- Migration : Ajout des colonnes pour la gestion des apports en nature
-- dans le cadre des augmentations de capital
-- Date : 2024

-- Colonne indiquant si l'augmentation de capital inclut des apports en nature
ALTER TABLE actes_juridiques
ADD COLUMN IF NOT EXISTS apport_nature BOOLEAN DEFAULT false;

COMMENT ON COLUMN actes_juridiques.apport_nature IS 'Indique si l''augmentation de capital inclut des apports en nature (true) ou uniquement des apports en numéraire/réserves (false)';

-- Description détaillée des biens apportés en nature
ALTER TABLE actes_juridiques
ADD COLUMN IF NOT EXISTS apport_nature_description TEXT NULL;

COMMENT ON COLUMN actes_juridiques.apport_nature_description IS 'Description détaillée des biens, droits ou créances apportés en nature à la société';

-- Valeur totale des apports en nature
ALTER TABLE actes_juridiques
ADD COLUMN IF NOT EXISTS apport_nature_montant_total DECIMAL(15,2) NULL;

COMMENT ON COLUMN actes_juridiques.apport_nature_montant_total IS 'Valeur totale estimée ou évaluée des apports en nature en euros';

-- Pourcentage que représentent les apports en nature par rapport au nouveau capital social
ALTER TABLE actes_juridiques
ADD COLUMN IF NOT EXISTS apport_nature_pourcentage_capital DECIMAL(5,2) NULL;

COMMENT ON COLUMN actes_juridiques.apport_nature_pourcentage_capital IS 'Pourcentage que représentent les apports en nature par rapport au nouveau capital social après augmentation';

-- Indique si un commissaire aux apports est obligatoire selon les règles légales
ALTER TABLE actes_juridiques
ADD COLUMN IF NOT EXISTS commissaire_obligatoire BOOLEAN DEFAULT false;

COMMENT ON COLUMN actes_juridiques.commissaire_obligatoire IS 'Indique si un commissaire aux apports est obligatoire (si apports nature > 30 000€ ou > 50% du capital)';

-- Nom du commissaire aux apports désigné
ALTER TABLE actes_juridiques
ADD COLUMN IF NOT EXISTS commissaire_nom VARCHAR(200) NULL;

COMMENT ON COLUMN actes_juridiques.commissaire_nom IS 'Nom et qualité du commissaire aux apports désigné pour évaluer les apports en nature';

-- URL ou chemin vers le rapport d'évaluation du commissaire aux apports
ALTER TABLE actes_juridiques
ADD COLUMN IF NOT EXISTS commissaire_rapport_url TEXT NULL;

COMMENT ON COLUMN actes_juridiques.commissaire_rapport_url IS 'Lien vers le rapport d''évaluation établi par le commissaire aux apports (document stocké ou URL externe)';

-- Indique si au moins un bien apporté a une valeur supérieure à 30 000€
ALTER TABLE actes_juridiques
ADD COLUMN IF NOT EXISTS bien_superieur_30k BOOLEAN DEFAULT false;

COMMENT ON COLUMN actes_juridiques.bien_superieur_30k IS 'Indique si au moins un bien apporté en nature a une valeur supérieure à 30 000€ (seuil légal pour commissaire obligatoire)';

-- Détails structurés des apports en nature sous forme JSON
ALTER TABLE actes_juridiques
ADD COLUMN IF NOT EXISTS apports_nature_details JSONB NULL;

COMMENT ON COLUMN actes_juridiques.apports_nature_details IS 'Tableau JSON détaillant chaque apport en nature : [{type: string, description: string, valeur: number, apporteur: string}]';

