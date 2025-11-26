'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface BetaSignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BetaSignupModal({ open, onOpenChange }: BetaSignupModalProps) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    nom_cabinet: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Rediriger vers Stripe
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL Stripe manquante');
      }

    } catch (error: any) {
      console.error('[BETA SIGNUP]', error);
      toast.error(error.message || 'Erreur lors de la redirection');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Démarrer mon essai gratuit</DialogTitle>
          <DialogDescription>
            2 infos • 14 jours gratuits • Carte bancaire requise
          </DialogDescription>
        </DialogHeader>

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

          <Button type="submit" className="w-full" disabled={loading}>
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
      </DialogContent>
    </Dialog>
  );
}
