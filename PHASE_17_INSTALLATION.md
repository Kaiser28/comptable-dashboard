# Phase 17 : Installation des dépendances

## ⚠️ IMPORTANT

Les dépendances doivent être installées manuellement car PowerShell bloque l'exécution de scripts.

## Commandes à exécuter

Ouvrez un terminal PowerShell en **mode administrateur** ou utilisez **Git Bash** / **CMD** :

```bash
npm install zod dompurify isomorphic-dompurify lru-cache @types/dompurify
```

## Vérification

Après installation, vérifiez que les packages sont bien dans `package.json` :

- `zod` (validation)
- `dompurify` (sanitization)
- `isomorphic-dompurify` (sanitization SSR)
- `lru-cache` (rate limiting)
- `@types/dompurify` (types TypeScript)

## Migration Supabase

Exécutez la migration SQL dans Supabase Dashboard :

1. Allez dans **SQL Editor**
2. Copiez le contenu de `supabase/migrations/create_audit_logs_table.sql`
3. Exécutez la requête

## Variables d'environnement

Ajoutez dans `.env.local` (si pas déjà présent) :

```env
# Optionnel : Token pour bypass rate limit du bot d'audit
BOT_SECRET_TOKEN=votre_token_secret_minimum_32_caracteres
```

## Prochaines étapes

Une fois les dépendances installées :

1. ✅ Fichiers utilitaires créés (`lib/env.ts`, `lib/sanitize.ts`, etc.)
2. ⏳ Modifier les routes API pour utiliser validation + sanitization
3. ⏳ Ajouter rate limiting dans les routes sensibles
4. ⏳ Ajouter logs d'audit dans les actions critiques

