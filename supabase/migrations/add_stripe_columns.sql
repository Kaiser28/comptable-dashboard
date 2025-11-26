-- Ajouter colonnes Stripe à la table cabinets
ALTER TABLE cabinets 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- Index pour les recherches par customer_id
CREATE INDEX IF NOT EXISTS idx_cabinets_stripe_customer 
ON cabinets(stripe_customer_id);

