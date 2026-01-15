#!/bin/bash

# Configuration
VERCEL_TOKEN=$(cat .vercel-token)
PROJECT_NAME="acpm-lexigen"
REPO="Sferia78/saas-statuts-juridiques"

echo "🚀 Déploiement ACPM LexiGen sur Vercel..."
echo ""

# Installation de Vercel CLI si nécessaire
if ! command -v vercel &> /dev/null; then
    echo "📦 Installation de Vercel CLI..."
    npm install -g vercel
fi

# Connexion avec le token
echo "🔑 Authentification Vercel..."
export VERCEL_TOKEN=$VERCEL_TOKEN

# Link du projet
echo "🔗 Configuration du projet..."
vercel link --yes --token=$VERCEL_TOKEN --scope=sferia78 --project=$PROJECT_NAME 2>/dev/null || true

# Configuration des variables d'environnement
echo "⚙️ Configuration des variables d'environnement..."

# Supabase (OBLIGATOIRES)
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development --token=$VERCEL_TOKEN << ENVEOF
https://fdbljadwgeuaqhfgelsd.supabase.co
ENVEOF

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development --token=$VERCEL_TOKEN << ENVEOF
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYmxqYWR3Z2V1YXFoZmdlbHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODgxNTksImV4cCI6MjA4NDA2NDE1OX0.iKKOk-StpUr3bGFnpBKFEkXcoTwCcKp2lc8utlxIfJ0
ENVEOF

vercel env add SUPABASE_SERVICE_ROLE_KEY production preview development --token=$VERCEL_TOKEN << ENVEOF
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYmxqYWR3Z2V1YXFoZmdlbHNkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ4ODE1OSwiZXhwIjoyMDg0MDY0MTU5fQ.mkFQwO9x4TD5ZV8s9iDXcjPwr8l1RVr0MmwH_SkpbwI
ENVEOF

# Configuration ACPM
vercel env add NEXT_PUBLIC_APP_NAME production preview development --token=$VERCEL_TOKEN << ENVEOF
ACPM LexiGen
ENVEOF

vercel env add NEXT_PUBLIC_APP_URL production preview development --token=$VERCEL_TOKEN << ENVEOF
https://lexigen.fr
ENVEOF

vercel env add NEXT_PUBLIC_CABINET_NAME production preview development --token=$VERCEL_TOKEN << ENVEOF
ACPM Expertise Comptable
ENVEOF

vercel env add NEXT_PUBLIC_CABINET_EMAIL production preview development --token=$VERCEL_TOKEN << ENVEOF
contact@acpm-expertise.com
ENVEOF

vercel env add NEXT_PUBLIC_CABINET_LOCATION production preview development --token=$VERCEL_TOKEN << ENVEOF
MÉRÉ, Yvelines (78)
ENVEOF

# Branding
vercel env add NEXT_PUBLIC_PRIMARY_COLOR production preview development --token=$VERCEL_TOKEN << ENVEOF
#337ab7
ENVEOF

vercel env add NEXT_PUBLIC_SECONDARY_COLOR production preview development --token=$VERCEL_TOKEN << ENVEOF
#2e6da4
ENVEOF

# Features (désactivées)
vercel env add NEXT_PUBLIC_ENABLE_SIGNUP production preview development --token=$VERCEL_TOKEN << ENVEOF
false
ENVEOF

vercel env add NEXT_PUBLIC_ENABLE_STRIPE production preview development --token=$VERCEL_TOKEN << ENVEOF
false
ENVEOF

vercel env add NEXT_PUBLIC_ENABLE_MULTI_TENANT production preview development --token=$VERCEL_TOKEN << ENVEOF
false
ENVEOF

# Mode production
vercel env add NODE_ENV production preview development --token=$VERCEL_TOKEN << ENVEOF
production
ENVEOF

echo ""
echo "🚀 Déploiement en cours..."
vercel --prod --yes --token=$VERCEL_TOKEN

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "🌐 URLs de déploiement :"
echo "   - Production : https://acpm-lexigen.vercel.app"
echo "   - Domaine personnalisé : https://lexigen.fr (à configurer)"
echo ""
echo "📋 Prochaines étapes :"
echo "   1. Tester la connexion : https://acpm-lexigen.vercel.app/login"
echo "   2. Configurer le domaine lexigen.fr dans Vercel"
echo "   3. Vérifier que tout fonctionne"
