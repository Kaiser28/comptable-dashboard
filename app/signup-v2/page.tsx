'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function SignupV2Page() {
  const [loading, setLoading] = useState(false);
  const [acceptedCGV, setAcceptedCGV] = useState(false);
  
  const [formData, setFormData] = useState({
    nom_cabinet: '',
    email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedCGV) {
      toast.error('Vous devez accepter les conditions générales');
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch('/api/stripe/create-checkout-session-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL Stripe manquante');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la redirection');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-800 to-blue-600 text-white font-bold text-xl">
              L
            </div>
            <h1 className="text-2xl font-bold text-gray-900">LexiGen</h1>
          </div>
          <CardTitle>Démarrer mon essai gratuit</CardTitle>
          <CardDescription>
            14 jours gratuits • Sans engagement
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom_cabinet">Nom de votre cabinet *</Label>
              <Input
                id="nom_cabinet"
                required
                value={formData.nom_cabinet}
                onChange={(e) => setFormData({ ...formData, nom_cabinet: e.target.value })}
                placeholder="Cabinet Martin & Associés"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email professionnel *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@cabinet.fr"
                disabled={loading}
              />
            </div>

            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
              <p className="font-semibold">✅ 14 jours gratuits</p>
              <p className="text-xs mt-1">
                Puis 39,99€ HT/mois • Annulation en 1 clic
              </p>
            </div>

            {/* CHECKBOX CGV/CGU */}
            <div className="border-t pt-4">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="accept-cgv"
                  checked={acceptedCGV}
                  onChange={(e) => setAcceptedCGV(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="accept-cgv" className="text-xs text-gray-700">
                  J&apos;accepte les{' '}
                  <a href="/cgv" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                    CGV
                  </a>
                  , les{' '}
                  <a href="/cgu" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                    CGU
                  </a>
                  {' '}et la{' '}
                  <a href="/confidentialite" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                    Politique de Confidentialité
                  </a>
                </label>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={!acceptedCGV || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirection...
                </>
              ) : (
                'Continuer vers le paiement →'
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Votre compte sera créé après la validation du paiement
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Déjà inscrit ?{' '}
            <Link href="/login" className="font-medium text-gray-900 underline-offset-4 hover:underline">
              Connectez-vous
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

