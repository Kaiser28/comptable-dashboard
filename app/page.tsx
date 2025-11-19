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
  Mail,
  Calendar,
  Sparkles,
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
import { BetaModal } from '@/components/landing/BetaModal';
import { supabaseClient } from '@/lib/supabase';

export default function LandingPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [placesRestantes, setPlacesRestantes] = useState(50);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {

    // Fetch places restantes
    const fetchPlaces = async () => {
      try {
        const { count } = await supabaseClient
          .from('beta_signups')
          .select('*', { count: 'exact', head: true });
        setPlacesRestantes(Math.max(0, 50 - (count || 0)));
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

  const handleCTAClick = () => {
    setModalOpen(true);
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'cta_click', {
        event_category: 'CTA',
        event_label: 'Beta Founder',
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
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-600 to-orange-500 text-white font-bold text-xl">
              L
            </div>
            <span className="text-xl font-bold text-gray-900">LexiGen</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-gray-600 hover:text-gray-900">
              Fonctionnalités
            </Link>
            <Link href="#roadmap" className="text-sm text-gray-600 hover:text-gray-900">
              Roadmap
            </Link>
            <Link href="#faq" className="text-sm text-gray-600 hover:text-gray-900">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push('/login')} variant="ghost" size="sm">
              Se connecter
            </Button>
            <Button
              onClick={handleCTAClick}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              size="sm"
            >
              Beta Founder
            </Button>
          </div>
        </div>
      </header>

      {/* SECTION 1 - HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-50 py-20 sm:py-32">
        <div className="absolute inset-0 bg-grid-orange-100/50 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            {/* Badge Beta */}
            <div className="flex justify-center mb-6">
              <Badge className="bg-orange-600 text-white px-4 py-2 text-sm font-semibold">
                🚀 Beta privée - 50 places
              </Badge>
            </div>

            {/* H1 */}
            <h1 className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6 animate-slide-up">
              2 heures. C'est le temps perdu à créer des statuts SAS manuellement.
            </h1>

            {/* H2 */}
            <h2 className="text-center text-xl sm:text-2xl md:text-3xl text-gray-700 mb-8 max-w-3xl mx-auto animate-slide-up">
              LexiGen automatise en 20 minutes. Formulaires clients + 10+ docs + validations juridiques.
            </h2>

            {/* CTA géant */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button
                onClick={handleCTAClick}
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-10 py-7 h-auto shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                Devenir Beta Founder (50 places)
                <Rocket className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Compteur */}
            <div className="text-center">
              <p className="text-lg text-gray-600">
                ⏰ Plus que <span className="font-bold text-orange-600">{placesRestantes}</span> places
              </p>
            </div>

            {/* Vidéo démo placeholder */}
            <div className="mt-12 rounded-xl overflow-hidden shadow-2xl border-4 border-orange-200 animate-fade-in">
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Vidéo démo à venir</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 - CRÉDIBILITÉ */}
      <section className="py-12 bg-white border-y border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">
                RGPD + Hébergé France
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - GENÈSE */}
      <section className="py-20 sm:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="prose prose-lg mx-auto">
              <p className="text-lg text-gray-700 leading-relaxed">
                <strong>Septembre 2025 :</strong> Un Expert-Comptable me demande une solution automatisée pour créer des statuts SAS. Les solutions existantes coûtent 4500€, trop cher pour un cabinet de taille moyenne.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mt-4">
                J'ai créé LexiGen : un SaaS accessible à <strong>49€/mois</strong> qui automatise toute la chaîne de création de documents juridiques.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xl">
                L
              </div>
              <div>
                <p className="font-semibold text-gray-900">L'équipe LexiGen</p>
                <p className="text-sm text-gray-600">Fondateurs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 - PROBLÈME */}
      <section className="py-20 sm:py-32 bg-red-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-gray-900 mb-12">
            Les problèmes que vous rencontrez
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Clock, title: '2-3h/dossier', desc: 'Temps perdu sur chaque création' },
              { icon: Mail, title: '10+ emails/client', desc: 'Allers-retours interminables' },
              { icon: AlertTriangle, title: 'Risques erreurs', desc: 'Erreurs de saisie coûteuses' },
              { icon: FileText, title: '6750€/mois perdus', desc: 'Coût d\'opportunité énorme' },
            ].map((problem, idx) => {
              const Icon = problem.icon;
              return (
                <Card key={idx} className="bg-white border-red-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Icon className="h-10 w-10 text-red-600 mb-2" />
                    <CardTitle className="text-xl text-red-900">{problem.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{problem.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 5 - SOLUTION (Avant/Après) */}
      <section className="py-20 sm:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-gray-900 mb-12">
            Avant vs Après LexiGen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Avant - Gauche gris */}
            <Card className="bg-gray-100 border-gray-300">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Avant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">10 étapes manuelles</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                    <li>Récupération infos client</li>
                    <li>Rédaction statuts</li>
                    <li>Vérification données</li>
                    <li>Génération PV</li>
                    <li>Etc.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">⏱️ 2-3h par dossier</p>
                </div>
                <div>
                  <p className="font-semibold text-red-600">😰 Stress élevé</p>
                </div>
              </CardContent>
            </Card>

            {/* Après - Droite couleur */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300">
              <CardHeader>
                <CardTitle className="text-2xl text-orange-900">Après LexiGen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="font-semibold text-orange-900">6 clics seulement</p>
                  <ul className="list-disc list-inside text-orange-800 space-y-1 text-sm">
                    <li>Formulaire client auto</li>
                    <li>Génération instantanée</li>
                    <li>Validation automatique</li>
                    <li>Téléchargement docs</li>
                    <li>C'est tout !</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-orange-900">⚡ 20 minutes</p>
                </div>
                <div>
                  <p className="font-semibold text-green-600">✨ Zéro erreur</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* GIF démo placeholder */}
          <div className="mt-12 rounded-xl overflow-hidden shadow-xl border-2 border-orange-200 max-w-4xl mx-auto">
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-center">
                <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">GIF démo à venir</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 - FEATURES */}
      <section id="features" className="py-20 sm:py-32 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-gray-900 mb-12">
            Fonctionnalités complètes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: FileText,
                title: 'Formulaires clients self-service',
                desc: 'Vos clients remplissent leurs infos directement via un lien sécurisé',
              },
              {
                icon: Zap,
                title: 'Génération 10+ docs auto',
                desc: 'Statuts, PV, DNC, Annonces légales... tout est généré automatiquement',
              },
              {
                icon: Shield,
                title: 'Validations juridiques',
                desc: 'Vérification automatique de la cohérence des données saisies',
              },
              {
                icon: Building2,
                title: 'Enrichissement SIRET',
                desc: 'Récupération automatique des données depuis le SIRET',
              },
              {
                icon: Users,
                title: 'Collab multi-users',
                desc: 'Plusieurs experts peuvent travailler dans le même cabinet',
              },
              {
                icon: Sparkles,
                title: 'Dashboard intelligent',
                desc: 'Suivi en temps réel de tous vos dossiers et documents',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="bg-white hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                  <CardHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                      <Icon className="h-6 w-6 text-orange-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.desc}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 7 - OFFRE BETA FOUNDER */}
      <section className="py-20 sm:py-32 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Devenez Beta Founder de LexiGen
            </h2>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 text-left">
              <ul className="space-y-4 text-lg">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
                  <span>Accès gratuit 1 mois complet</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
                  <span>Prix bloqué à vie <strong>29€/mois</strong> (vs 59€)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
                  <span>Priorité support</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
                  <span>Badge Founder exclusif</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
                  <span>Accès anticipé nouvelles features</span>
                </li>
              </ul>
            </div>
            <Button
              onClick={handleCTAClick}
              size="lg"
              className="bg-white text-orange-600 hover:bg-gray-100 text-lg px-10 py-7 h-auto shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              Je deviens Beta Founder 🚀
            </Button>
            <p className="mt-6 text-orange-100 text-lg">
              ⏰ Plus que <span className="font-bold">{placesRestantes}</span> places disponibles
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 8 - ROADMAP */}
      <section id="roadmap" className="py-20 sm:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-gray-900 mb-12">
            Roadmap 2025
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-orange-200" />
              
              <div className="space-y-12">
                {[
                  { month: 'Jan', title: 'Beta 50 cabinets', desc: 'Lancement beta privée avec 50 cabinets sélectionnés' },
                  { month: 'Fév', title: 'API Infogreffe', desc: 'Intégration API Infogreffe pour dépôt automatique' },
                  { month: 'Mars', title: 'Annonces légales + SARL/EURL', desc: 'Support SARL/EURL et génération annonces légales' },
                  { month: 'Avril', title: 'Ouverture publique', desc: 'Lancement public avec tarifs complets' },
                ].map((item, idx) => (
                  <div key={idx} className="relative flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-white font-bold text-sm z-10 relative">
                        {idx + 1}
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-semibold text-orange-600">{item.month}</span>
                        <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                      </div>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9 - FAQ */}
      <section id="faq" className="py-20 sm:py-32 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-gray-900 mb-12">
            Questions fréquentes
          </h2>
          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="w-full">
              {[
                {
                  q: 'Les documents générés sont-ils conformes juridiquement ?',
                  a: 'LexiGen génère des documents basés sur des modèles standards. Nous ne garantissons pas la conformité juridique des documents générés. Il est essentiel de faire relire et valider tous les documents par un professionnel du droit (avocat ou expert-comptable) avant tout dépôt officiel.',
                },
                {
                  q: 'Puis-je personnaliser les documents générés ?',
                  a: 'Absolument ! Les documents sont générés au format Word (.docx) et sont entièrement modifiables. Vous pouvez ajouter des clauses spécifiques, modifier le texte ou adapter selon vos besoins.',
                },
                {
                  q: 'Mes données sont-elles sécurisées ?',
                  a: 'Oui, LexiGen est conforme RGPD et hébergé en France. Toutes les données sont chiffrées et nous ne partageons jamais vos informations avec des tiers.',
                },
                {
                  q: 'Est-ce compliqué à utiliser ?',
                  a: 'Non ! LexiGen a été conçu pour être simple. En 6 clics, vous générez tous les documents. Aucune formation n\'est nécessaire.',
                },
                {
                  q: 'Que se passe-t-il après le 1 mois gratuit ?',
                  a: 'Après le mois gratuit, vous passez automatiquement au tarif Beta Founder à 29€/mois (bloqué à vie). Vous pouvez annuler à tout moment sans engagement.',
                },
                {
                  q: 'Puis-je importer mes clients existants ?',
                  a: 'Oui, vous pouvez importer vos clients via CSV ou les ajouter manuellement. L\'import CSV est disponible dès votre inscription.',
                },
                {
                  q: 'Y a-t-il une limite au nombre d\'utilisateurs ?',
                  a: 'Non, le nombre d\'utilisateurs est illimité dans votre cabinet. Tous vos collaborateurs peuvent utiliser LexiGen.',
                },
                {
                  q: 'Quelles formes juridiques sont supportées ?',
                  a: 'Actuellement SAS et SASU. SARL et EURL arriveront en mars 2025 selon notre roadmap.',
                },
              ].map((item, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`}>
                  <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-orange-600">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700 pt-2">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* SECTION 10 - CTA FINAL */}
      <section className="py-20 sm:py-32 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Prêt à récupérer 30h/mois ?
            </h2>
            <Button
              onClick={handleCTAClick}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-10 py-7 h-auto shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              Devenir Beta Founder 🚀
            </Button>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Sans engagement
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Sans CB
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Annulation 1 clic
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Branding */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-600 to-orange-500 text-white font-bold text-xl">
                  L
                </div>
                <span className="text-xl font-bold text-white">LexiGen</span>
              </div>
              <p className="text-sm">
                Automatisation juridique pour experts-comptables
              </p>
            </div>

            {/* Liens */}
            <div>
              <h3 className="font-semibold text-white mb-4">Navigation</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#features" className="hover:text-white transition-colors">
                    Comment ça marche
                  </Link>
                </li>
                <li>
                  <Link href="#roadmap" className="hover:text-white transition-colors">
                    Tarifs
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="mailto:contact@lexigen.fr" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Légal */}
            <div>
              <h3 className="font-semibold text-white mb-4">Légal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    CGU
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    RGPD
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>LexiGen © 2025</p>
          </div>
        </div>
      </footer>

      {/* Modal */}
      <BetaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        placesRestantes={placesRestantes}
      />
    </div>
  );
}
