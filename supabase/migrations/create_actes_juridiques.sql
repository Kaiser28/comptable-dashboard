-- Migration: Création de la table actes_juridiques
-- Date: 2024
-- Description: Table pour gérer les actes juridiques post-création (cession d'actions, augmentation de capital, AG ordinaire)

-- Créer la table actes_juridiques
CREATE TABLE IF NOT EXISTS actes_juridiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('cession_actions', 'augmentation_capital', 'ag_ordinaire')),
  date_acte DATE NOT NULL,
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'validé', 'signé')),
  
  -- Colonnes spécifiques pour cession d'actions
  cedant_id UUID REFERENCES associes(id) ON DELETE SET NULL,
  cessionnaire_nom TEXT,
  cessionnaire_prenom TEXT,
  cessionnaire_adresse TEXT,
  cessionnaire_nationalite TEXT,
  nombre_actions INTEGER CHECK (nombre_actions > 0),
  prix_unitaire NUMERIC(10, 2) CHECK (prix_unitaire > 0),
  prix_total NUMERIC(10, 2) CHECK (prix_total > 0),
  date_agrement DATE,
  modalites_paiement TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer un index sur client_id pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_actes_juridiques_client_id ON actes_juridiques(client_id);

-- Créer un index sur cabinet_id pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_actes_juridiques_cabinet_id ON actes_juridiques(cabinet_id);

-- Créer un index sur type pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_actes_juridiques_type ON actes_juridiques(type);

-- Créer un index sur cedant_id pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_actes_juridiques_cedant_id ON actes_juridiques(cedant_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_actes_juridiques_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER trigger_update_actes_juridiques_updated_at
  BEFORE UPDATE ON actes_juridiques
  FOR EACH ROW
  EXECUTE FUNCTION update_actes_juridiques_updated_at();

-- RLS Policies: Isolation par cabinet_id
-- Les utilisateurs ne peuvent voir que les actes de leur cabinet

-- Activer RLS
ALTER TABLE actes_juridiques ENABLE ROW LEVEL SECURITY;

-- Policy: Les experts-comptables peuvent voir les actes de leur cabinet
CREATE POLICY "Experts can view actes of their cabinet"
  ON actes_juridiques
  FOR SELECT
  USING (
    cabinet_id IN (
      SELECT cabinet_id 
      FROM experts_comptables 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Les experts-comptables peuvent créer des actes pour leur cabinet
CREATE POLICY "Experts can create actes for their cabinet"
  ON actes_juridiques
  FOR INSERT
  WITH CHECK (
    cabinet_id IN (
      SELECT cabinet_id 
      FROM experts_comptables 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Les experts-comptables peuvent modifier les actes de leur cabinet
CREATE POLICY "Experts can update actes of their cabinet"
  ON actes_juridiques
  FOR UPDATE
  USING (
    cabinet_id IN (
      SELECT cabinet_id 
      FROM experts_comptables 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    cabinet_id IN (
      SELECT cabinet_id 
      FROM experts_comptables 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Les experts-comptables peuvent supprimer les actes de leur cabinet
CREATE POLICY "Experts can delete actes of their cabinet"
  ON actes_juridiques
  FOR DELETE
  USING (
    cabinet_id IN (
      SELECT cabinet_id 
      FROM experts_comptables 
      WHERE user_id = auth.uid()
    )
  );

