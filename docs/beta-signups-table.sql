-- ⚠️ DEPRECATED - Cette table n'est plus utilisée
-- Utiliser la table `founders_applications` à la place
-- Ce fichier est conservé à titre de référence historique uniquement

-- Création de la table beta_signups pour LexiGen
-- Table pour stocker les inscriptions Beta Founder
-- À exécuter dans Supabase SQL Editor

-- CREATE TABLE IF NOT EXISTS beta_signups (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   prenom TEXT NOT NULL,
--   email TEXT NOT NULL UNIQUE,
--   cabinet TEXT,
--   nb_creations_mois TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Index pour recherche rapide par email
-- CREATE INDEX IF NOT EXISTS idx_beta_signups_email ON beta_signups(email);

-- Index pour tri par date
-- CREATE INDEX IF NOT EXISTS idx_beta_signups_created_at ON beta_signups(created_at DESC);

-- Trigger pour mettre à jour updated_at automatiquement
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = NOW();
--   RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- CREATE TRIGGER update_beta_signups_updated_at
--   BEFORE UPDATE ON beta_signups
--   FOR EACH ROW
--   EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Permettre la lecture publique pour le comptage
-- ALTER TABLE beta_signups ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture publique pour compter les inscriptions
-- CREATE POLICY "Public read access for counting"
--   ON beta_signups
--   FOR SELECT
--   USING (true);

-- Policy: Insertion publique (pour l'API)
-- CREATE POLICY "Public insert access"
--   ON beta_signups
--   FOR INSERT
--   WITH CHECK (true);

-- Commentaires
-- COMMENT ON TABLE beta_signups IS 'Inscriptions Beta Founder pour LexiGen';
-- COMMENT ON COLUMN beta_signups.prenom IS 'Prénom de l''expert-comptable';
-- COMMENT ON COLUMN beta_signups.email IS 'Email de contact (unique)';
-- COMMENT ON COLUMN beta_signups.cabinet IS 'Nom du cabinet (optionnel)';
-- COMMENT ON COLUMN beta_signups.nb_creations_mois IS 'Nombre de créations par mois (1-5, 6-10, 11-20, 20+)';
