-- =====================================================
-- ACPM LexiGen - Schéma de base de données mono-tenant
-- Version custom pour Cabinet ACPM
-- =====================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: users (4 utilisateurs ACPM)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'collaborateur')),
  nom TEXT,
  prenom TEXT,
  telephone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- TABLE: clients (clients du cabinet ACPM)
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  denomination TEXT NOT NULL,
  siret TEXT,
  forme_juridique TEXT,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  email TEXT,
  telephone TEXT,
  representant_nom TEXT,
  representant_prenom TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX idx_clients_denomination ON clients(denomination);
CREATE INDEX idx_clients_siret ON clients(siret);
CREATE INDEX idx_clients_created_by ON clients(created_by);

-- =====================================================
-- TABLE: dossiers (dossiers de création SAS)
-- =====================================================
CREATE TABLE IF NOT EXISTS dossiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  numero_dossier TEXT UNIQUE NOT NULL, -- Format: ACPM-2025-0001
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'en_cours', 'valide', 'termine', 'archive')),
  type_operation TEXT NOT NULL, -- 'creation_sas', 'modification', 'augmentation_capital', etc.
  
  -- Données du formulaire client (JSONB pour flexibilité)
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Métadonnées
  created_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id), -- Collaborateur assigné
  validated_by UUID REFERENCES users(id), -- Qui a validé
  validated_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche et tri
CREATE INDEX idx_dossiers_client_id ON dossiers(client_id);
CREATE INDEX idx_dossiers_numero ON dossiers(numero_dossier);
CREATE INDEX idx_dossiers_statut ON dossiers(statut);
CREATE INDEX idx_dossiers_created_by ON dossiers(created_by);
CREATE INDEX idx_dossiers_assigned_to ON dossiers(assigned_to);
CREATE INDEX idx_dossiers_created_at ON dossiers(created_at DESC);

-- =====================================================
-- TABLE: documents_generes (documents générés)
-- =====================================================
CREATE TABLE IF NOT EXISTS documents_generes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE,
  type_document TEXT NOT NULL, -- 'statuts', 'pv_constitution', 'dnc', 'annonce_legale', etc.
  nom_fichier TEXT NOT NULL,
  file_url TEXT, -- URL de stockage (Vercel Blob ou autre)
  file_size INTEGER, -- Taille en bytes
  format TEXT DEFAULT 'docx', -- 'docx', 'pdf'
  
  -- Métadonnées
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1, -- Pour versionning
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX idx_documents_dossier_id ON documents_generes(dossier_id);
CREATE INDEX idx_documents_type ON documents_generes(type_document);
CREATE INDEX idx_documents_generated_by ON documents_generes(generated_by);

-- =====================================================
-- TABLE: audit_logs (logs d'activité)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL, -- 'login', 'create_dossier', 'generate_document', 'update_user', etc.
  entity_type TEXT, -- 'dossier', 'client', 'document', 'user'
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb, -- Données supplémentaires (avant/après, etc.)
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche et reporting
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- TABLE: parametres (paramètres du cabinet)
-- =====================================================
CREATE TABLE IF NOT EXISTS parametres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cle TEXT UNIQUE NOT NULL,
  valeur JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_parametres_cle ON parametres(cle);

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour générer un numéro de dossier unique
CREATE OR REPLACE FUNCTION generate_numero_dossier()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  new_numero TEXT;
BEGIN
  current_year := TO_CHAR(NOW(), 'YYYY');
  
  -- Récupérer le dernier numéro de l'année
  SELECT COALESCE(MAX(CAST(SPLIT_PART(numero_dossier, '-', 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM dossiers
  WHERE numero_dossier LIKE 'ACPM-' || current_year || '-%';
  
  -- Formatter: ACPM-2025-0001
  new_numero := 'ACPM-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN new_numero;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour auto-générer le numéro de dossier
CREATE OR REPLACE FUNCTION auto_numero_dossier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_dossier IS NULL OR NEW.numero_dossier = '' THEN
    NEW.numero_dossier := generate_numero_dossier();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_numero_dossier
BEFORE INSERT ON dossiers
FOR EACH ROW
EXECUTE FUNCTION auto_numero_dossier();

-- Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_dossiers_updated_at
BEFORE UPDATE ON dossiers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERTION DES DONNÉES INITIALES
-- =====================================================

-- Insérer les 4 utilisateurs ACPM
-- Note: Les mots de passe seront gérés par Supabase Auth
INSERT INTO users (email, role, nom, prenom) VALUES
  ('contact@acpm-expertise.com', 'admin', 'Admin', 'ACPM'),
  ('user1@acpm-expertise.com', 'collaborateur', 'Collaborateur', '1'),
  ('user2@acpm-expertise.com', 'collaborateur', 'Collaborateur', '2'),
  ('user3@acpm-expertise.com', 'collaborateur', 'Collaborateur', '3')
ON CONFLICT (email) DO NOTHING;

-- Insérer des paramètres par défaut
INSERT INTO parametres (cle, valeur, description) VALUES
  ('cabinet_info', '{"nom": "ACPM Expertise Comptable", "adresse": "MÉRÉ, Yvelines (78)", "email": "contact@acpm-expertise.com", "telephone": "", "siret": ""}'::jsonb, 'Informations du cabinet'),
  ('branding', '{"couleur_primaire": "#337ab7", "couleur_secondaire": "#2e6da4", "logo_url": "/acpm-logo.png"}'::jsonb, 'Charte graphique'),
  ('notifications', '{"email_nouveau_dossier": true, "email_validation": true}'::jsonb, 'Paramètres de notifications')
ON CONFLICT (cle) DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - Sécurité des données
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents_generes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametres ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut tout voir (mono-tenant)
-- Les utilisateurs authentifiés ACPM peuvent accéder à toutes les données

CREATE POLICY "ACPM users can view all users"
  ON users FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "ACPM admins can manage users"
  ON users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "ACPM users can view all clients"
  ON clients FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "ACPM users can manage clients"
  ON clients FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "ACPM users can view all dossiers"
  ON dossiers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "ACPM users can manage dossiers"
  ON dossiers FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "ACPM users can view all documents"
  ON documents_generes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "ACPM users can manage documents"
  ON documents_generes FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "ACPM users can view audit logs"
  ON audit_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "ACPM users can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "ACPM users can view parameters"
  ON parametres FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "ACPM admins can manage parameters"
  ON parametres FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE users IS 'Utilisateurs du cabinet ACPM (4 personnes: 1 admin + 3 collaborateurs)';
COMMENT ON TABLE clients IS 'Clients du cabinet ACPM (~200 clients)';
COMMENT ON TABLE dossiers IS 'Dossiers de création SAS et autres opérations juridiques';
COMMENT ON TABLE documents_generes IS 'Documents générés (statuts, PV, DNC, etc.)';
COMMENT ON TABLE audit_logs IS 'Logs d''activité pour traçabilité et sécurité';
COMMENT ON TABLE parametres IS 'Paramètres de configuration du cabinet';

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
