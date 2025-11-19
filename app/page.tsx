'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Users, 
  Mail, 
  FileText, 
  Upload, 
  Search, 
  CheckCircle2, 
  Building2,
  Shield,
  FileCheck,
  Zap,
  ArrowRight,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabaseClient } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      setIsLoggedIn(!!user);
    };
    void checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header Sticky */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              LexiGen
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            {isLoggedIn ? (
              <Button onClick={() => router.push('/dashboard')} variant="default">
                Tableau de bord
              </Button>
            ) : (
              <>
                <Button 
                  onClick={() => router.push('/login')} 
                  variant="outline"
                  className="border-gray-300 text-gray-900 hover:bg-gray-50"
                >
                  Se connecter
                </Button>
                <Button onClick={() => router.push('/signup')} variant="default">
                  S'inscrire
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* SECTION 1 - Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 py-20 sm:py-32">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Logo LexiGen centré */}
            <div className="mb-8 flex items-center justify-center gap-3">
              <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold text-3xl">
                L
              </div>
              <h1 className="text-4xl font-bold text-white">LexiGen</h1>
            </div>
            
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Générez vos documents juridiques en{' '}
              <span className="text-blue-200">3 clics</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100 sm:text-xl">
              La plateforme SaaS qui fait gagner 10h/semaine aux experts-comptables
            </p>
            
            {/* Bullet points */}
            <div className="mx-auto mt-8 max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="flex items-start gap-3 text-blue-100">
                <span className="text-2xl">⚡</span>
                <p className="text-sm sm:text-base">Statuts SAS/SASU générés en 2 minutes</p>
              </div>
              <div className="flex items-start gap-3 text-blue-100">
                <span className="text-2xl">📋</span>
                <p className="text-sm sm:text-base">PV, AG, cessions automatisées</p>
              </div>
              <div className="flex items-start gap-3 text-blue-100">
                <span className="text-2xl">✅</span>
                <p className="text-sm sm:text-base">Conformité juridique garantie</p>
              </div>
              <div className="flex items-start gap-3 text-blue-100">
                <span className="text-2xl">🔒</span>
                <p className="text-sm sm:text-base">Sécurisé et certifié</p>
              </div>
            </div>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button 
                onClick={() => router.push('/signup')}
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6 h-auto"
              >
                Démarrer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                onClick={() => router.push('/login')}
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8 py-6 h-auto"
              >
                Se connecter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 - Problème/Solution */}
      <section className="py-20 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Marre de passer 2h à créer des statuts manuellement ?
          </h2>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
            {/* Problèmes */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-red-600">Les problèmes</h3>
              <div className="space-y-4">
                {[
                  "2 heures par création de statuts",
                  "Risques d'erreurs de saisie",
                  "Mise à jour manuelle des modèles",
                  "Perte de temps sur des tâches répétitives"
                ].map((problem, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-red-500 text-xl">❌</span>
                    <p className="text-gray-700">{problem}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Solutions */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-green-600">La solution LexiGen</h3>
              <div className="space-y-4">
                {[
                  "5 minutes par création de statuts",
                  "Génération automatique sans erreur",
                  "Modèles toujours à jour et conformes",
                  "Focus sur votre expertise, pas sur la saisie"
                ].map((solution, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">{solution}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - Comment ça marche */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            3 étapes simples
          </h2>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                icon: Users,
                title: "Créez votre client",
                description: "Ajoutez les informations de l'entreprise et des associés via notre formulaire ou import CSV."
              },
              {
                step: "2",
                icon: Mail,
                title: "Envoyez le formulaire",
                description: "Le client complète ses informations directement via un lien sécurisé."
              },
              {
                step: "3",
                icon: FileText,
                title: "Générez les documents",
                description: "Téléchargez les statuts, PV, DNC et autres documents en un clic au format Word."
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card key={idx} className="text-center">
                  <CardHeader>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                      <Icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold">
                      {item.step}
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{item.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4 - Fonctionnalités */}
      <section className="py-20 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Tout ce dont vous avez besoin
          </h2>
          <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Upload,
                title: "Import CSV",
                description: "Importez vos clients en masse depuis un fichier CSV ou Excel"
              },
              {
                icon: Search,
                title: "API Pappers",
                description: "Enrichissement automatique des données via le SIRET"
              },
              {
                icon: FileCheck,
                title: "5 documents",
                description: "Statuts, PV, DNC, Annonce légale, Attestation de dépôt"
              },
              {
                icon: Building2,
                title: "Multi-expert",
                description: "Plusieurs experts peuvent travailler dans le même cabinet"
              },
              {
                icon: Shield,
                title: "Conformité",
                description: "Validation automatique des données selon la réglementation"
              },
              {
                icon: FileText,
                title: "Word modifiable",
                description: "Documents générés au format .docx, prêts à personnaliser"
              }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="border-2 hover:border-blue-500 transition-colors">
                  <CardHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 5 - Pricing */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Tarifs simples et transparents
          </h2>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                name: "Découverte",
                description: "Parfait pour tester la solution"
              },
              {
                name: "Pro",
                description: "Idéal pour les cabinets en croissance"
              },
              {
                name: "Expert",
                description: "Pour les cabinets à fort volume"
              }
            ].map((plan, idx) => (
              <Card key={idx} className="text-center">
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="mt-2 text-base">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full mt-6" 
                    variant="default"
                    onClick={() => window.location.href = 'mailto:contact@sferia.fr?subject=Demande de devis LexiGen'}
                  >
                    Demander un devis
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 - FAQ */}
      <section className="py-20 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Questions fréquentes
          </h2>
          <div className="mx-auto mt-16 max-w-3xl">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left font-semibold">
                  Les documents générés sont-ils fiables ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Nos modèles s'appuient sur les standards juridiques français et intègrent des validations automatiques (capital, durée de société, cohérence des données). Toutefois, nous recommandons une relecture par un professionnel du droit avant tout dépôt officiel.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left font-semibold">
                  Puis-je modifier les documents après génération ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Absolument ! Les documents sont générés au format Word (.docx) et sont entièrement modifiables. 
                  Vous pouvez personnaliser le contenu, ajouter des clauses spécifiques ou adapter le texte selon vos besoins.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left font-semibold">
                  Combien de temps prend la génération d'un document ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  La génération est instantanée ! Une fois les données du client complétées, 
                  vous pouvez générer tous les documents (statuts, PV, DNC, etc.) en quelques secondes. 
                  Le téléchargement se fait automatiquement au format Word.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left font-semibold">
                  Y a-t-il des frais cachés ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Non, nos tarifs sont transparents et sans frais cachés. 
                  Vous payez uniquement ce qui est indiqué dans votre forfait. 
                  Pas de frais de transaction, pas de frais d'activation, pas d'engagement.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* SECTION 7 - CTA Final */}
      <section className="py-20 sm:py-32 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Prêt à automatiser vos créations de société ?
            </h2>
            <p className="mt-6 text-lg leading-8 text-blue-100">
              Rejoignez les centaines d'experts-comptables qui font confiance à LexiGen
            </p>
            <div className="mt-10">
              <Button 
                onClick={() => router.push('/signup')}
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-10 py-6 h-auto"
              >
                Créer mon compte gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="mt-4 text-sm text-blue-200">
                Sans engagement • Sans carte bancaire
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-600">
              LexiGen © 2025 - Un outil SFERIA
            </p>
            <nav className="flex flex-wrap items-center gap-6 text-sm">
              <Link href="#" className="text-gray-600 hover:text-gray-900">
                Mentions légales
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900">
                CGV
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
