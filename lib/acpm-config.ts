/**
 * Configuration globale ACPM LexiGen
 * Version custom pour Cabinet ACPM Expertise Comptable
 */

export const ACPM_CONFIG = {
  // Informations du cabinet
  cabinet: {
    name: 'ACPM Expertise Comptable',
    shortName: 'ACPM',
    location: 'MÉRÉ, Yvelines (78)',
    email: 'contact@acpm-expertise.com',
    phone: '', // À compléter si nécessaire
    website: 'https://www.acpm-expertise.com',
  },

  // Configuration de l'application
  app: {
    name: 'ACPM LexiGen',
    tagline: 'Plateforme de génération de documents juridiques',
    description: 'Automatisation de la génération des statuts, PV, DNC et annonces légales pour le Cabinet ACPM',
    domain: 'lexigen.fr',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://lexigen.fr',
    logo: '/acpm-logo.png',
  },

  // Charte graphique ACPM
  branding: {
    colors: {
      primary: '#337ab7',
      secondary: '#2e6da4',
      tertiary: '#286090',
      success: '#0EDD0D',
      danger: '#B94A48',
      gray: '#bfbfbf',
    },
    logo: {
      light: '/acpm-logo.png',
      dark: '/acpm-logo.png', // Même logo pour le moment
      favicon: '/favicon.ico',
    },
  },

  // Features activées/désactivées
  features: {
    signup: false, // Pas d'inscription publique
    stripe: false, // Pas de paiement
    multiTenant: false, // Mono-tenant (un seul cabinet)
    betaProgram: false, // Pas de programme beta
    marketing: false, // Pas de landing page marketing
    publicAPI: false, // Pas d'API publique
  },

  // Rôles utilisateurs
  roles: {
    admin: {
      value: 'admin',
      label: 'Administrateur',
      description: 'Accès complet + gestion des utilisateurs',
      permissions: [
        'manage_users',
        'manage_clients',
        'manage_dossiers',
        'generate_documents',
        'view_audit_logs',
        'manage_settings',
      ],
    },
    collaborateur: {
      value: 'collaborateur',
      label: 'Collaborateur',
      description: 'Accès complet sauf gestion des utilisateurs',
      permissions: [
        'manage_clients',
        'manage_dossiers',
        'generate_documents',
        'view_audit_logs',
      ],
    },
  },

  // Utilisateurs par défaut
  defaultUsers: [
    {
      email: 'contact@acpm-expertise.com',
      role: 'admin',
      nom: 'Admin',
      prenom: 'ACPM',
    },
    {
      email: 'user1@acpm-expertise.com',
      role: 'collaborateur',
      nom: 'Collaborateur',
      prenom: '1',
    },
    {
      email: 'user2@acpm-expertise.com',
      role: 'collaborateur',
      nom: 'Collaborateur',
      prenom: '2',
    },
    {
      email: 'user3@acpm-expertise.com',
      role: 'collaborateur',
      nom: 'Collaborateur',
      prenom: '3',
    },
  ],

  // Types de documents supportés
  documentTypes: {
    statuts: {
      label: 'Statuts SAS/SASU',
      icon: 'FileText',
      enabled: true,
    },
    pv_constitution: {
      label: 'PV de constitution',
      icon: 'FileSignature',
      enabled: true,
    },
    pv_ag_ordinaire: {
      label: 'PV AG ordinaire',
      icon: 'Users',
      enabled: true,
    },
    pv_ag_extraordinaire: {
      label: 'PV AG extraordinaire',
      icon: 'AlertCircle',
      enabled: true,
    },
    dnc: {
      label: 'Déclaration de Non-Condamnation',
      icon: 'Shield',
      enabled: true,
    },
    annonce_legale: {
      label: 'Annonce légale',
      icon: 'Newspaper',
      enabled: true,
    },
    cession_actions: {
      label: 'Cession d\'actions',
      icon: 'ArrowRightLeft',
      enabled: true,
    },
    augmentation_capital: {
      label: 'Augmentation de capital',
      icon: 'TrendingUp',
      enabled: true,
    },
    reduction_capital: {
      label: 'Réduction de capital',
      icon: 'TrendingDown',
      enabled: true,
    },
    lettre_mission: {
      label: 'Lettre de mission',
      icon: 'Mail',
      enabled: true,
    },
    ordre_mouvement: {
      label: 'Ordre de mouvement',
      icon: 'RefreshCw',
      enabled: true,
    },
    courrier_reprise: {
      label: 'Courrier de reprise',
      icon: 'Building',
      enabled: true,
    },
    attestation_depot_fonds: {
      label: 'Attestation de dépôt de fonds',
      icon: 'Landmark',
      enabled: true,
    },
  },

  // Statuts de dossiers
  dossierStatuts: {
    brouillon: {
      label: 'Brouillon',
      color: 'gray',
      icon: 'FileEdit',
    },
    en_cours: {
      label: 'En cours',
      color: 'blue',
      icon: 'Clock',
    },
    valide: {
      label: 'Validé',
      color: 'green',
      icon: 'CheckCircle',
    },
    termine: {
      label: 'Terminé',
      color: 'emerald',
      icon: 'CheckCircle2',
    },
    archive: {
      label: 'Archivé',
      color: 'gray',
      icon: 'Archive',
    },
  },

  // Messages de l'interface
  messages: {
    welcome: 'Bienvenue sur ACPM LexiGen',
    loginTitle: 'Connexion à ACPM LexiGen',
    loginSubtitle: 'Accédez à votre espace de génération de documents',
    dashboardTitle: 'Tableau de bord',
    dashboardSubtitle: 'Gérez vos dossiers de création et modifications',
    noAccess: 'Accès refusé - Contactez votre administrateur',
    sessionExpired: 'Votre session a expiré - Reconnectez-vous',
  },

  // Navigation principale
  navigation: [
    {
      label: 'Tableau de bord',
      href: '/dashboard',
      icon: 'LayoutDashboard',
      roles: ['admin', 'collaborateur'],
    },
    {
      label: 'Clients',
      href: '/clients',
      icon: 'Users',
      roles: ['admin', 'collaborateur'],
    },
    {
      label: 'Dossiers',
      href: '/dossiers',
      icon: 'FolderOpen',
      roles: ['admin', 'collaborateur'],
    },
    {
      label: 'Documents',
      href: '/documents',
      icon: 'FileText',
      roles: ['admin', 'collaborateur'],
    },
    {
      label: 'Gestion des utilisateurs',
      href: '/admin/users',
      icon: 'UserCog',
      roles: ['admin'], // Uniquement admin
    },
    {
      label: 'Logs d\'activité',
      href: '/admin/logs',
      icon: 'Activity',
      roles: ['admin', 'collaborateur'],
    },
  ],

  // Support & Contact
  support: {
    email: 'support@lexigen.fr',
    phone: '',
    hours: 'Lundi - Vendredi, 9h - 18h',
  },
} as const;

// Helper functions
export function hasPermission(userRole: string, permission: string): boolean {
  const role = ACPM_CONFIG.roles[userRole as keyof typeof ACPM_CONFIG.roles];
  return role?.permissions.includes(permission) || false;
}

export function isAdmin(userRole: string): boolean {
  return userRole === 'admin';
}

export function canAccessRoute(userRole: string, route: string): boolean {
  const navItem = ACPM_CONFIG.navigation.find(item => item.href === route);
  return navItem?.roles.includes(userRole) || false;
}

export function getDocumentTypeLabel(type: string): string {
  const docType = ACPM_CONFIG.documentTypes[type as keyof typeof ACPM_CONFIG.documentTypes];
  return docType?.label || type;
}

export function getDossierStatutConfig(statut: string) {
  return ACPM_CONFIG.dossierStatuts[statut as keyof typeof ACPM_CONFIG.dossierStatuts];
}
