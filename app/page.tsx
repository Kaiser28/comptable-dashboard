'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText, 
  Shield,
  Building2,
  Users,
  Zap,
  ArrowRight,
  ChevronRight,
  Rocket,
  Calendar,
  Sparkles,
  TrendingUp,
  Scale,
  X,
  Phone,
  Gavel,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { supabaseClient } from '@/lib/supabase';
import { Toaster } from 'sonner';

export default function LandingPage() {
  const router = useRouter();
  const [placesRestantes, setPlacesRestantes] = useState(13);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    // Fetch places restantes
    // NOTE: beta_signups table removed - using hardcoded value for now
    const fetchPlaces = async () => {
      try {
        // const { count } = await supabaseClient
        //   .from('beta_signups')
        //   .select('*', { count: 'exact', head: true });
        // setPlacesRestantes(Math.max(0, 20 - (count || 0)));
        setPlacesRestantes(13); // Hardcoded: 13 places restantes sur 20
      } catch (error) {
        console.error('Erreur fetch places:', error);
      }
    };
    void fetchPlaces();

    // Scroll tracking
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // Track scroll depth
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent >= 25 && scrollPercent < 50) {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'scroll_depth', {
            event_category: 'Engagement',
            event_label: '25%',
          });
        }
      } else if (scrollPercent >= 50 && scrollPercent < 75) {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'scroll_depth', {
            event_category: 'Engagement',
            event_label: '50%',
          });
        }
      } else if (scrollPercent >= 75) {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'scroll_depth', {
            event_category: 'Engagement',
            event_label: '75%',
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePostulerClick = () => {
    window.location.href = '/signup-v2';
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'cta_click', {
        event_category: 'CTA',
        event_label: 'Démarrer essai gratuit',
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Sticky */}
      <header
        className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
          scrollY > 50
            ? 'bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm'
            : 'bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/40'
        }`}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-800 to-blue-600 text-white font-bold text-xl">
              L
            </div>
            <span className="text-xl font-bold text-gray-900">LexiGen</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#fonctionnalites" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Comment ça marche
            </Link>
            <Link href="#roadmap" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Roadmap
            </Link>
            <Link href="#faq" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              FAQ
          </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                  Se connecter
                </Button>
            </Link>
            <Link href="/signup-v2">
              <Button variant="ghost" size="sm">
                Démarrer mon essai gratuit
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* SECTION 1 - HERO */}
      <section className="relative overflow-hidden bg-white py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center animate-fade-in">
            {/* Badge nouveau */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                ✨ Nouveau : Génération automatique en 5 minutes
              </div>
            </div>

            {/* H1 */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
              Traitez plus de créations de SAS sans recruter
            </h1>

            {/* H2 */}
            <h2 className="text-xl sm:text-2xl text-gray-700 mb-8 leading-relaxed max-w-3xl mx-auto">
              Automatisez la génération des statuts, PV, DNC et annonces légales. Vos clients remplissent les infos, vous validez et personnalisez en quelques clics.
            </h2>

            {/* CTA */}
            <div className="flex justify-center mb-6">
              <Button 
                onClick={handlePostulerClick}
                size="lg" 
                className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-8 py-6 h-auto shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                Démarrer mon essai gratuit
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Badge sous CTA */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                14 jours gratuits
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Sans engagement
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Support inclus
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 - CRÉDIBILITÉ */}
      <section className="py-20 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
            Créé par un développeur expert en automatisation juridique
          </h2>
          <div className="prose prose-lg mx-auto text-center text-gray-700 leading-relaxed max-w-2xl">
            <p className="text-lg mb-4">
              LexiGen est né d'un constat simple : les experts-comptables perdent des heures sur des tâches répétitives à faible valeur ajoutée.
            </p>
            <p className="text-lg">
              Notre mission : automatiser la partie administrative pour que vous puissiez vous concentrer sur l'accompagnement de vos clients.
            </p>
            </div>

          {/* Encadré disclaimer */}
          <div className="mt-12 bg-white border-l-4 border-blue-600 rounded-lg p-6 shadow-sm max-w-3xl mx-auto">
            <div className="flex items-start gap-4">
              <Gavel className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-gray-900 mb-2">⚖️ Note importante</p>
                <p className="text-gray-700 text-sm leading-relaxed">
                  LexiGen fournit des templates génériques de documents juridiques. Vous restez responsable de la validation et de l'adaptation des documents à chaque situation client. LexiGen automatise la génération, pas le conseil juridique.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - ROI / AVANT-APRÈS */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-gray-900 mb-12">
            Le coût réel d'une création manuelle
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* COLONNE GAUCHE - Méthode manuelle */}
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-2xl text-red-900">❌ Méthode traditionnelle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">❌</span>
                    <span>2-3 heures par dossier</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">❌</span>
                    <span>Multiples allers-retours clients (infos manquantes)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">❌</span>
                    <span>Ressaisie manuelle dans chaque document</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">❌</span>
                    <span>Risque d'incohérence entre les documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">❌</span>
                    <span>Dossiers qui traînent pendant plusieurs semaines</span>
                  </li>
                </ul>
                <div className="pt-4 border-t border-red-200">
                  <p className="text-red-900 font-semibold">📉 Résultat : Vous refusez des missions rentables faute de temps</p>
                </div>
              </CardContent>
            </Card>

            {/* COLONNE DROITE - Avec LexiGen */}
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-2xl text-green-900">✅ Avec LexiGen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✅</span>
                    <span>Processus accéléré (collecte + génération + validation)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✅</span>
                    <span>Client remplit tout seul via formulaire self-service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✅</span>
                    <span>Génération instantanée de tous les documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✅</span>
                    <span>Cohérence garantie entre tous les documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✅</span>
                    <span>Livraison rapide = satisfaction client</span>
                  </li>
                </ul>
                <div className="pt-4 border-t border-green-200">
                  <p className="text-green-900 font-semibold">📈 Résultat : Acceptez plus de missions avec la même équipe</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* SECTION 4 - TRANSFORMATION */}
      <section className="py-20 sm:py-24 bg-gradient-to-br from-blue-900 via-blue-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <h2 className="text-center text-3xl sm:text-4xl font-bold mb-4">
            Ne vendez plus vos heures. Vendez votre expertise.
          </h2>
          <p className="text-center text-xl text-white/90 mb-12 max-w-3xl mx-auto">
            LexiGen ne fait pas gagner du temps. LexiGen transforme votre positionnement.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Rocket,
                title: 'Devenez le cabinet premium',
                desc: 'Livraison ultra-rapide vs plusieurs semaines pour vos concurrents. Vos clients apprécient votre réactivité et votre efficacité.',
                result: 'Vous vous démarquez de la concurrence',
              },
              {
                icon: TrendingUp,
                title: 'Scalez sans recruter',
                desc: 'Traitez plus de dossiers avec la même équipe. Vos collaborateurs se concentrent sur la validation et le conseil, pas sur la saisie répétitive.',
                result: 'Augmentez votre CA sans coût additionnel',
              },
              {
                icon: Scale,
                title: 'Cohérence garantie',
                desc: 'Données synchronisées entre tous les documents. Capital, durée du mandat, quorum... les informations sont cohérentes automatiquement.',
                result: 'Gain de temps sur la relecture et la validation',
              },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <Card key={idx} className="bg-white text-gray-900 h-full">
                  <CardHeader>
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl mb-3">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700 leading-relaxed">{card.desc}</p>
                    <div className="pt-4 border-t border-gray-200">
                      <p className="font-semibold text-blue-900">Résultat : {card.result}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 5 - FONCTIONNALITÉS */}
      <section id="fonctionnalites" className="py-20 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-center text-xl text-gray-700 mb-12">
            3 étapes. Quelques clics. 10+ documents prêts à personnaliser.
          </p>

          {/* Timeline 3 étapes */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  num: 1,
                  icon: FileText,
                  title: 'Votre client remplit le formulaire',
                  desc: [
                    'Vous envoyez un lien sécurisé',
                    'Client saisit : dénomination, capital, associés, etc.',
                    'Récupération auto des données SIRET',
                  ],
                  time: '~10 minutes pour le client',
                },
                {
                  num: 2,
                  icon: CheckCircle2,
                  title: 'Vous validez et personnalisez',
                  desc: [
                    'Vérification des données saisies',
                    'Vous personnalisez selon les besoins du client',
                    '1 clic = génération de tous les documents',
                  ],
                  time: 'Quelques minutes pour vous',
                },
                {
                  num: 3,
                  icon: Rocket,
                  title: 'Vous livrez le dossier complet',
                  desc: [
                    'Statuts SAS',
                    'PV de constitution',
                    'DNC (Déclaration de Non-Condamnation)',
                    'Annonce légale pré-remplie',
                    'Formulaire M0',
                    'Attestation de dépôt de capital',
                    '... 10+ documents au total',
                  ],
                  time: 'Export instantané PDF/Word',
                },
              ].map((step, idx) => {
                const Icon = step.icon;
              return (
                  <div key={idx} className="relative">
                    <div className="flex flex-col items-center text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xl mb-4 relative z-10">
                        {step.num}
                      </div>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">{step.title}</h3>
                      <ul className="text-sm text-gray-700 space-y-2 mb-4 text-left">
                        {step.desc.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs font-medium text-gray-600">⏱️ {step.time}</p>
                    </div>
                    {idx < 2 && (
                      <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-0.5 bg-gray-300" />
                    )}
                  </div>
              );
            })}
            </div>
          </div>

          {/* Liste complète fonctionnalités */}
          <div className="max-w-5xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Tout ce dont vous avez besoin
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {[
                  'Formulaire client self-service (branded)',
                  '10+ documents générés automatiquement',
                  'Cohérence des données garantie',
                  'Récupération SIRET automatique',
                  'Multi-utilisateurs (toute votre équipe)',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {[
                  'Dashboard de suivi des dossiers',
                  'Personnalisation des documents',
                  'Export PDF/Word instantané',
                  'Support dédié',
                  'Mises à jour régulières',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-center mt-12">
            <Link href="/signup-v2">
              <Button variant="outline" size="lg">
                Démarrer mon essai gratuit
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 6 - ROADMAP */}
      <section id="roadmap" className="py-20 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Roadmap 2025-2026 : Ce qui arrive
          </h2>
          <p className="text-center text-xl text-gray-700 mb-12">
            Découvrez les fonctionnalités à venir
          </p>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  badge: '✅ EN COURS',
                  badgeColor: 'bg-green-600',
                  title: 'NOVEMBRE 2025',
                  subtitle: 'Version actuelle',
                  items: [
                    '✓ Génération statuts SAS/SASU',
                    '✓ PV d\'AG ordinaire et extraordinaire',
                    '✓ Déclaration de Non-Condamnation (DNC)',
                    '✓ Cession d\'actions',
                    '✓ Courrier de reprise d\'entreprise',
                    '✓ Lettre de mission',
                    '✓ Augmentation de capital',
                    '✓ Réduction de capital',
                    '✓ Ordre de mouvement de titres',
                    '✓ Annonces légales pré-remplies',
                    '✓ Formulaires clients self-service',
                    '✓ Dashboard de suivi',
                    '✓ Multi-utilisateurs',
                  ],
                },
                {
                  badge: 'À VENIR',
                  badgeColor: 'bg-gray-600',
                  title: 'FÉVRIER 2026',
                  subtitle: 'V1.0 Lancement Public',
                  items: [
                    '→ Ouverture au public (79,99€ HT/mois)',
                    '→ Support SARL/EURL',
                    '→ Templates de clauses personnalisables',
                    '→ Plans Cabinet (149,99€) et Premium (249,99€)',
                  ],
                },
                {
                  badge: 'À VENIR',
                  badgeColor: 'bg-gray-600',
                  title: 'MAI 2026',
                  subtitle: 'V1.5',
                  items: [
                    '→ Intégration Infogreffe (dépôt automatique)',
                    '→ Signature électronique intégrée',
                    '→ API pour intégration logiciels métier',
                  ],
                },
                {
                  badge: 'À VENIR',
                  badgeColor: 'bg-gray-600',
                  title: 'Q4 2026',
                  subtitle: 'V2.0',
                  items: [
                    '→ Support SCI',
                    '→ Intégration comptable (Cegid, ACD, Sage)',
                    '→ App mobile (suivi dossiers)',
                  ],
                },
              ].map((jalon, idx) => (
                <Card key={idx} className="bg-gray-50 border-gray-200">
                <CardHeader>
                    <Badge className={`${jalon.badgeColor} text-white w-fit mb-2`}>
                      {jalon.badge}
                    </Badge>
                    <CardTitle className="text-lg font-bold text-gray-900">{jalon.title}</CardTitle>
                    <CardDescription className="font-semibold text-gray-700">{jalon.subtitle}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {jalon.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 - FAQ */}
      <section id="faq" className="py-20 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-gray-900 mb-12">
            Questions fréquentes
          </h2>
            <Accordion type="single" collapsible className="w-full">
            {[
              {
                q: 'Les documents sont-ils conformes juridiquement ?',
                a: 'LexiGen génère des documents à partir de templates génériques conformes aux pratiques courantes.\n\n⚖️ IMPORTANT : Vous restez responsable de la validation et de l\'adaptation des documents à chaque situation client. LexiGen automatise la génération, pas le conseil juridique.\n\nNous recommandons de faire relire vos premiers documents par un avocat spécialisé pour valider votre processus.',
              },
              {
                q: 'Mon logiciel comptable génère déjà des statuts, pourquoi LexiGen ?',
                a: 'Votre logiciel métier génère probablement UN document (les statuts). LexiGen génère les 10+ documents nécessaires (PV, DNC, annonce, M0, etc.)\n\nMais surtout : LexiGen permet à VOS CLIENTS de remplir les infos directement via un formulaire. Vous éliminez les multiples allers-retours.\n\nRésultat : vous ne touchez le dossier qu\'une seule fois, au lieu de 5-7 échanges avec la méthode manuelle.',
              },
              {
                q: 'Je peux personnaliser les documents ?',
                a: 'Oui, totalement. Vous pouvez ajuster chaque document généré selon les besoins du client (clauses d\'agrément, de préemption, etc.).\n\nLexiGen génère la structure de base avec les données saisies, vous personnalisez ensuite selon votre expertise.',
              },
              {
                q: 'C\'est sécurisé ? Où sont stockées les données ?',
                a: 'Hébergement en France (AWS Paris), certifié RGPD. Chiffrement des données en transit et au repos. Vous restez propriétaire à 100% des données de vos clients. Sauvegarde quotidienne automatique.',
              },
              {
                q: 'Combien de temps pour prendre en main l\'outil ?',
                a: 'Environ 30 minutes.\n\nOnboarding inclus : 1 call de formation avec notre équipe. Interface intuitive : si vous savez utiliser un formulaire Google, vous savez utiliser LexiGen.',
              },
              {
                q: 'Je peux annuler quand je veux ?',
                a: 'Oui, sans préavis, en 1 clic depuis votre dashboard. Aucun engagement de durée minimum.\n\n⚠️ Note : Si vous annulez puis revenez plus tard, vous perdez le tarif Beta Founder (39,99€) et passez au tarif public (79,99€+).',
              },
              {
                q: 'Combien coûte LexiGen après l\'essai ?',
                a: 'Programme Beta Founders : 39,99€ HT/mois à vie (réservé aux 20 premiers cabinets - novembre 2025 à janvier 2026)\n\nTarif public à partir de février 2026 : 79,99€ HT/mois minimum\n\nLes Beta Founders conservent leur tarif à 39,99€ HT/mois à vie, même après le lancement public.',
              },
              {
                q: 'Quand LexiGen sera disponible au public ?',
                a: 'Lancement public prévu en février 2026.\n\nProgramme Beta Founders : novembre 2025 - janvier 2026 → 20 places uniquement → Tarif : 39,99€ HT/mois à vie\n\nAprès février 2026 :\n→ Tarif public : 79,99€ HT/mois minimum (Plan Solo)\n→ Plans Cabinet (149,99€) et Premium (249,99€) disponibles\n→ Les Beta Founders conservent leur tarif à 39,99€ à vie',
              },
            ].map((item, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="bg-white border border-gray-200 rounded-lg mb-4 px-6">
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-orange-600 py-6">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 pb-6 whitespace-pre-line leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
            </Accordion>
        </div>
      </section>

      {/* SECTION 9 - CTA FINAL */}
      <section className="py-20 sm:py-24 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Prêt à récupérer 30h/mois ?
            </h2>
              <Button 
            onClick={handlePostulerClick}
                size="lg" 
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-10 py-7 h-auto shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
              >
            Démarrer mon essai gratuit
              </Button>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Sans engagement
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Réponse sous 48h
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Entretien 30 min gratuit
            </span>
          </div>
        </div>
      </section>

      {/* Toaster pour les notifications */}
      <Toaster position="top-right" richColors />
    </div>
  );
}
