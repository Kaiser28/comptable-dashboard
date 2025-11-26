'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle } from 'lucide-react';

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    password: '',
  });

  // Récupérer les infos de la session Stripe
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      toast.error('Session Stripe manquante');
      router.push('/');
      return;
    }

    // Récupérer les données depuis la session Stripe
    fetch(`/api/stripe/session?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }
        setSessionData(data);
      })
      .catch(error => {
        console.error('[ONBOARDING]', error);
        toast.error('Impossible de récupérer les informations');
      });
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!sessionData) {
        throw new Error('Données manquantes');
      }

      const supabase = createClient();

      // Vérifier si l'utilisateur existe déjà
      const { data: existingUser } = await supabase
        .from('experts_comptables')
        .select('user_id')
        .eq('email', sessionData.email)
        .maybeSingle();

      if (existingUser) {
        // Le compte existe déjà, on se connecte
        console.log('[ONBOARDING] Compte existant, connexion...');
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: sessionData.email,
          password: formData.password,
        });

        if (signInError) {
          throw new Error('Mot de passe incorrect. Contactez le support.');
        }
      } else {
        // Le compte n'existe pas encore, on le crée via l'API serveur
        console.log('[ONBOARDING] Création du compte via API...');
        
        const response = await fetch('/api/auth/create-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: sessionData.email,
            password: formData.password,
            nom_cabinet: sessionData.nom_cabinet,
            prenom: formData.prenom || '',
            nom: formData.nom || '',
            stripe_customer_id: sessionData.customer_id,
            stripe_subscription_id: sessionData.subscription_id || null,
            trial_end_date: sessionData.trial_end 
              ? new Date(sessionData.trial_end * 1000).toISOString() 
              : null,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Erreur lors de la création du compte');
        }

        console.log('[ONBOARDING] Compte créé avec succès:', data.user);

        // Se connecter avec le mot de passe après création
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: sessionData.email,
          password: formData.password,
        });

        if (signInError) {
          console.error('[ONBOARDING] Erreur connexion après création:', signInError);
          throw new Error('Compte créé mais erreur de connexion. Essayez de vous connecter manuellement.');
        }
      }

      // Rediriger vers le dashboard
      toast.success('✅ Connexion réussie ! Bienvenue sur LexiGen');

      // Attendre un peu que la session soit bien établie
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      router.push('/dashboard');

    } catch (error: any) {
      console.error('[ONBOARDING]', error);
      toast.error(error.message || 'Impossible de finaliser l\'inscription');
      setLoading(false);
    }
  };

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Paiement confirmé !</CardTitle>
          <CardDescription>
            Finalisez votre compte en quelques clics
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-6 p-3 bg-blue-50 rounded-lg text-sm">
            <p className="font-semibold text-blue-900">{sessionData.nom_cabinet}</p>
            <p className="text-blue-700">{sessionData.email}</p>
            <p className="text-xs text-blue-600 mt-1">
              ✅ 14 jours d'essai gratuit activé
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  required
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  placeholder="Jean"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Martin"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Créer un mot de passe *</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 8 caractères"
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                'Accéder à mon dashboard →'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

