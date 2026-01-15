#!/bin/bash

# Test rapide de la configuration Supabase ACPM
echo "🔍 Vérification de la configuration Supabase ACPM..."
echo ""

# Vérifier que les variables sont bien définies
if [ -f .env.local ]; then
  echo "✅ Fichier .env.local trouvé"
  
  # Extraire l'URL
  URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2)
  echo "   Supabase URL: $URL"
  echo ""
else
  echo "❌ Fichier .env.local non trouvé"
  exit 1
fi

echo "📋 Prochaines étapes à vérifier sur Supabase Dashboard:"
echo ""
echo "1. Aller sur: https://supabase.com/dashboard/project/fdbljadwgeuaqhfgelsd"
echo ""
echo "2. SQL Editor > Exécuter ce test:"
echo "   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
echo "   👉 Vous devriez voir 6 tables: users, clients, dossiers, documents_generes, audit_logs, parametres"
echo ""
echo "3. SQL Editor > Vérifier les utilisateurs:"
echo "   SELECT * FROM users;"
echo "   👉 Vous devriez voir 4 utilisateurs (si créés via le schéma SQL)"
echo ""
echo "4. Authentication > Users"
echo "   👉 Créer les 4 utilisateurs dans Supabase Auth si pas encore fait:"
echo "   - contact@acpm-expertise.com (Admin) - MDP: AcpmAdmin2025!"
echo "   - user1@acpm-expertise.com (Collab) - MDP: AcpmUser1_2025!"
echo "   - user2@acpm-expertise.com (Collab) - MDP: AcpmUser2_2025!"
echo "   - user3@acpm-expertise.com (Collab) - MDP: AcpmUser3_2025!"
echo "   ⚠️ Cocher 'Auto Confirm User' pour chaque"
echo ""
echo "✅ Une fois fait, retournez ici et dites-moi 'c'est fait' !"
