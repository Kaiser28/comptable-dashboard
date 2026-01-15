# 🚀 Guide de configuration Supabase pour ACPM LexiGen

## Étape 1 : Créer un nouveau projet Supabase

1. Allez sur https://supabase.com/dashboard
2. Cliquez sur **"New Project"**
3. Configurez le projet :
   - **Name**: `acpm-lexigen`
   - **Database Password**: Choisissez un mot de passe fort (notez-le !)
   - **Region**: `Europe West (Paris)` - closest to France
   - **Pricing Plan**: Free tier (ou Pro si besoin de plus de ressources)
4. Cliquez sur **"Create new project"**
5. Attendez ~2 minutes que le projet soit provisionné

---

## Étape 2 : Exécuter le schéma SQL

1. Dans le dashboard Supabase, allez dans **"SQL Editor"** (menu de gauche)
2. Cliquez sur **"+ New query"**
3. Copiez-collez le contenu du fichier `supabase/migrations/00_acpm_schema.sql`
4. Cliquez sur **"Run"** (ou Ctrl+Enter)
5. Vérifiez qu'il n'y a pas d'erreurs

---

## Étape 3 : Créer les 4 utilisateurs ACPM dans Supabase Auth

### Option A : Via l'interface Supabase (RECOMMANDÉ)

1. Allez dans **"Authentication" > "Users"**
2. Cliquez sur **"Add user" > "Create new user"**
3. Créez les 4 utilisateurs un par un :

#### Utilisateur 1 - Admin
- **Email**: `contact@acpm-expertise.com`
- **Password**: `AcpmAdmin2025!` (temporaire, à changer)
- **Auto Confirm User**: ✅ Coché

#### Utilisateur 2 - Collaborateur 1
- **Email**: `user1@acpm-expertise.com`
- **Password**: `AcpmUser1_2025!` (temporaire, à changer)
- **Auto Confirm User**: ✅ Coché

#### Utilisateur 3 - Collaborateur 2
- **Email**: `user2@acpm-expertise.com`
- **Password**: `AcpmUser2_2025!` (temporaire, à changer)
- **Auto Confirm User**: ✅ Coché

#### Utilisateur 4 - Collaborateur 3
- **Email**: `user3@acpm-expertise.com`
- **Password**: `AcpmUser3_2025!` (temporaire, à changer)
- **Auto Confirm User**: ✅ Coché

### Option B : Via SQL (Alternative)

```sql
-- Créer les utilisateurs dans auth.users (nécessite service_role)
-- Note: Les mots de passe seront hashés automatiquement
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES
  (
    'contact@acpm-expertise.com',
    crypt('AcpmAdmin2025!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin"}',
    NOW(),
    NOW()
  ),
  (
    'user1@acpm-expertise.com',
    crypt('AcpmUser1_2025!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"collaborateur"}',
    NOW(),
    NOW()
  ),
  (
    'user2@acpm-expertise.com',
    crypt('AcpmUser2_2025!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"collaborateur"}',
    NOW(),
    NOW()
  ),
  (
    'user3@acpm-expertise.com',
    crypt('AcpmUser3_2025!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"collaborateur"}',
    NOW(),
    NOW()
  );
```

---

## Étape 4 : Récupérer les clés API

1. Allez dans **"Settings" > "API"**
2. Notez ces 3 valeurs :

### Project URL
```
https://xxxxxxxxxxxxx.supabase.co
```

### anon / public key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTU3NjAwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### service_role key (SECRET - ne jamais exposer côté client)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDE1NTc2MDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Étape 5 : Configurer les variables d'environnement

### En local (.env.local)

1. Créez un fichier `.env.local` à la racine du projet
2. Copiez le contenu de `.env.example`
3. Remplacez les valeurs par celles récupérées ci-dessus :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Sur Vercel (Production)

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet `saas-statuts-juridiques`
3. Allez dans **"Settings" > "Environment Variables"**
4. Ajoutez les 3 variables ci-dessus avec les valeurs Supabase
5. **Important** : Cochez **"Production"**, **"Preview"**, et **"Development"**

---

## Étape 6 : Vérifier la configuration

### Test SQL

Dans le SQL Editor de Supabase, exécutez :

```sql
-- Vérifier que les tables sont créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Vérifier que les 4 utilisateurs sont bien dans la table users
SELECT email, role, nom, prenom 
FROM users 
ORDER BY role DESC, email;

-- Vérifier les paramètres du cabinet
SELECT cle, valeur 
FROM parametres;
```

Résultat attendu :
- 6 tables : `audit_logs`, `clients`, `documents_generes`, `dossiers`, `parametres`, `users`
- 4 utilisateurs dans la table `users`
- 3 paramètres dans la table `parametres`

---

## Étape 7 : Test de connexion

1. Lancez l'app en local : `npm run dev`
2. Allez sur http://localhost:3000/login
3. Testez la connexion avec :
   - Email: `contact@acpm-expertise.com`
   - Password: `AcpmAdmin2025!`
4. Vous devriez être redirigé vers le dashboard

---

## 🔒 Sécurité : Changer les mots de passe

**IMPORTANT** : Les mots de passe temporaires doivent être changés immédiatement après la première connexion.

### Via l'interface admin (après implémentation de la page admin)

1. Se connecter en tant qu'admin
2. Aller dans **"Gestion des utilisateurs"**
3. Cliquer sur chaque utilisateur
4. Générer un nouveau mot de passe ou permettre à l'utilisateur de le changer

### Via Supabase Dashboard

1. Allez dans **"Authentication" > "Users"**
2. Cliquez sur un utilisateur
3. Cliquez sur **"Reset password"**
4. Supabase enverra un email de réinitialisation

---

## 📊 Monitoring et maintenance

### Logs d'activité

Les logs d'activité sont automatiquement enregistrés dans la table `audit_logs`. Vous pouvez les consulter avec :

```sql
SELECT 
  u.email,
  al.action,
  al.entity_type,
  al.created_at,
  al.details
FROM audit_logs al
LEFT JOIN users u ON u.id = al.user_id
ORDER BY al.created_at DESC
LIMIT 50;
```

### Sauvegardes

Supabase fait des sauvegardes automatiques quotidiennes. Pour une sauvegarde manuelle :

1. Allez dans **"Database" > "Backups"**
2. Cliquez sur **"Create backup"**

---

## ✅ Checklist finale

- [ ] Projet Supabase créé (`acpm-lexigen`)
- [ ] Schéma SQL exécuté sans erreurs
- [ ] 4 utilisateurs créés dans Supabase Auth
- [ ] 4 utilisateurs présents dans la table `users`
- [ ] Clés API récupérées (URL, anon_key, service_role_key)
- [ ] Variables d'environnement configurées (local + Vercel)
- [ ] Test de connexion réussi
- [ ] Mots de passe temporaires notés (à changer après livraison)

---

## 🆘 Besoin d'aide ?

- Documentation Supabase : https://supabase.com/docs
- Support Supabase : https://supabase.com/support
- Contact développeur : [votre email]

---

**Prochaine étape** : Intégration du logo ACPM et rebranding de l'interface 🎨
