-- Migration : Création de la table audit_logs
-- Phase 17 : Sécurisation complète - Logs d'audit

-- Créer la table audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabinet_id UUID REFERENCES cabinets(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'client_created', 'acte_generated', etc.
  resource_type TEXT, -- 'client', 'acte', 'associe', 'document'
  resource_id UUID,
  metadata JSONB DEFAULT '{}', -- Détails supplémentaires (flexible)
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance des requêtes
CREATE INDEX IF NOT EXISTS idx_audit_logs_cabinet ON audit_logs(cabinet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- RLS : Activer Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les experts peuvent voir les logs de leur cabinet uniquement
CREATE POLICY "Experts can view own cabinet audit logs"
  ON audit_logs FOR SELECT
  USING (
    cabinet_id IN (
      SELECT cabinet_id 
      FROM experts_comptables 
      WHERE user_id = auth.uid()
    )
  );

-- Politique RLS : Les experts peuvent insérer des logs (via API)
CREATE POLICY "Experts can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (
    cabinet_id IN (
      SELECT cabinet_id 
      FROM experts_comptables 
      WHERE user_id = auth.uid()
    )
  );

-- Commentaire sur la table
COMMENT ON TABLE audit_logs IS 'Logs d''audit pour traçabilité et sécurité - Phase 17';
COMMENT ON COLUMN audit_logs.action IS 'Type d''action effectuée (client_created, acte_generated, etc.)';
COMMENT ON COLUMN audit_logs.metadata IS 'Détails supplémentaires de l''action en JSON';

