# Configuration Landing Page LexiGen

## 📋 Prérequis

1. **Table Supabase** : ~~Créer la table `beta_signups` (voir `docs/beta-signups-table.sql`)~~ **DEPRECATED** - Utiliser `founders_applications` à la place
2. **Variables d'environnement** : Ajouter dans `.env.local`

## 🔧 Variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Google Analytics 4
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Hotjar
NEXT_PUBLIC_HOTJAR_ID=1234567

# Resend (pour emails automatiques)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Supabase (déjà configuré normalement)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
```

## 🗄️ Création de la table Supabase

1. Ouvrez Supabase Dashboard → SQL Editor
2. ~~Exécutez le script `docs/beta-signups-table.sql`~~ **DEPRECATED** - La table `beta_signups` n'est plus utilisée
3. ~~Vérifiez que la table `beta_signups` est créée avec les bonnes policies RLS~~ **DEPRECATED** - Utiliser `founders_applications` à la place

## 📧 Configuration Resend (optionnel)

Pour envoyer des emails automatiques après inscription :

1. Créez un compte sur [Resend.com](https://resend.com)
2. Ajoutez votre domaine (ou utilisez le domaine par défaut)
3. Copiez votre API key dans `.env.local`
4. L'email sera envoyé automatiquement après chaque inscription beta

## 🎨 Personnalisation

### Couleurs

Les couleurs principales sont définies dans Tailwind :
- **Orange** : `#FF6B35` (primary CTA)
- **Bleu** : `#0066CC` (section finale)
- **Vert** : `#22C55E` (success)
- **Rouge** : `#DC2626` (danger)

### Contenu

Modifiez le contenu directement dans `app/page.tsx` :
- Section Hero (ligne ~50)
- Section Genèse (ligne ~200)
- Section Features (ligne ~350)
- Section FAQ (ligne ~500)
- Footer (ligne ~600)

## 📊 Tracking

### Google Analytics 4

Les événements suivants sont trackés automatiquement :
- `cta_click` : Clic sur les boutons CTA
- `scroll_depth` : Profondeur de scroll (25%, 50%, 75%)
- `form_submit` : Soumission du formulaire beta

### Hotjar

Les heatmaps et enregistrements sont activés automatiquement si `NEXT_PUBLIC_HOTJAR_ID` est configuré.

## 🚀 Déploiement

1. **Vercel** (recommandé) :
   ```bash
   vercel --prod
   ```

2. Ajoutez les variables d'environnement dans Vercel Dashboard → Settings → Environment Variables

3. Vérifiez que le build passe sans erreur

## ✅ Checklist avant mise en production

- [ ] ~~Table `beta_signups` créée dans Supabase~~ **DEPRECATED** - Utiliser `founders_applications`
- [ ] Variables d'environnement configurées
- [ ] Google Analytics configuré et testé
- [ ] Hotjar configuré (optionnel)
- [ ] Resend configuré pour emails (optionnel)
- [ ] Test du formulaire d'inscription beta
- [ ] Test responsive mobile/tablet/desktop
- [ ] Vérification des liens et CTA
- [ ] Test de performance (< 3s chargement)

## 🐛 Dépannage

### Le formulaire ne fonctionne pas
- ~~Vérifiez que la table `beta_signups` existe~~ **DEPRECATED** - Vérifiez que la table `founders_applications` existe
- Vérifiez les policies RLS dans Supabase
- Vérifiez les logs dans la console navigateur

### Les emails ne sont pas envoyés
- Vérifiez que `RESEND_API_KEY` est configuré
- Vérifiez les logs serveur dans Vercel
- L'email est optionnel, l'inscription fonctionne sans

### Le tracking ne fonctionne pas
- Vérifiez que `NEXT_PUBLIC_GA_MEASUREMENT_ID` est configuré
- Ouvrez la console navigateur et vérifiez les erreurs
- Utilisez Google Tag Assistant pour déboguer

## 📝 Notes

- Le compteur de places restantes se met à jour automatiquement
- Maximum 50 places beta (configuré dans le code)
- Les inscriptions sont stockées dans Supabase avec timestamp
- Le modal se ferme automatiquement après inscription réussie

