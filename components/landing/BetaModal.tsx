'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface BetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  placesRestantes: number;
}

export function BetaModal({ isOpen, onClose, placesRestantes }: BetaModalProps) {
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [cabinet, setCabinet] = useState('');
  const [nbCreations, setNbCreations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [acceptedCGV, setAcceptedCGV] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedCGV) {
      alert('Vous devez accepter les CGV/CGU pour continuer');
      return;
    }

    if (!prenom || !email) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);

    try {
      // NOTE: /api/beta-signup removed - using /api/candidature-founders instead
      const response = await fetch('/api/candidature-founders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom_nom: prenom,
          email,
          nom_cabinet: cabinet || undefined,
          nb_creations: nbCreations || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      setIsSuccess(true);
      toast.success('🎉 Inscription réussie !');
      
      // Track event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'form_submit', {
          event_category: 'Beta Signup',
          event_label: 'Beta Founder',
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'inscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {isSuccess ? (
          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                <span className="text-4xl">🎉</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Bienvenue {prenom} !
              </h2>
              <p className="text-gray-600 mb-4">
                Votre inscription à la Beta Founder a bien été enregistrée.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Check votre email : accès envoyé
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-left">
              <p className="font-semibold text-orange-900 mb-2">Vos avantages Beta Founder :</p>
              <ul className="space-y-1 text-orange-800">
                <li>✓ 1 mois gratuit</li>
                <li>✓ Sans CB</li>
                <li>✓ Annulation 1 clic</li>
              </ul>
            </div>
            <Button onClick={onClose} className="mt-6 w-full">
              Fermer
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Devenir Beta Founder
              </h2>
              <p className="text-gray-600">
                Rejoignez les 50 premiers cabinets et bénéficiez d'avantages exclusifs
              </p>
              {placesRestantes > 0 && (
                <p className="text-sm text-orange-600 font-medium mt-2">
                  ⏰ Plus que {placesRestantes} places
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="prenom">
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="prenom"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cabinet">Cabinet</Label>
                <Input
                  id="cabinet"
                  value={cabinet}
                  onChange={(e) => setCabinet(e.target.value)}
                  className="mt-1"
                  placeholder="Nom de votre cabinet"
                />
              </div>

              <div>
                <Label htmlFor="nb_creations">Nombre de créations/mois</Label>
                <Select value={nbCreations} onValueChange={setNbCreations}>
                  <SelectTrigger id="nb_creations" className="mt-1">
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5">1-5 créations</SelectItem>
                    <SelectItem value="6-10">6-10 créations</SelectItem>
                    <SelectItem value="11-20">11-20 créations</SelectItem>
                    <SelectItem value="20+">20+ créations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <p className="font-semibold mb-2">✓ 1 mois gratuit</p>
              <p className="font-semibold mb-2">✓ Sans CB</p>
              <p className="font-semibold">✓ Annulation 1 clic</p>
            </div>

            {/* Checkbox d'acceptation CGV/CGU */}
            <div className="flex items-start gap-2 mb-4 mt-6">
              <input 
                type="checkbox" 
                id="accept-cgv" 
                checked={acceptedCGV}
                onChange={(e) => setAcceptedCGV(e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <label htmlFor="accept-cgv" className="text-sm text-gray-600">
                J'accepte les{' '}
                <a href="/cgv" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  CGV
                </a>
                ,{' '}
                <a href="/cgu" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  CGU
                </a>
                {' '}et la{' '}
                <a href="/confidentialite" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  politique de confidentialité
                </a>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={!acceptedCGV || isSubmitting}
              className={`w-full py-3 rounded-lg ${
                !acceptedCGV || isSubmitting 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-orange-600 hover:bg-orange-700'
              } text-white font-semibold transition-colors`}
            >
              {isSubmitting ? 'Traitement...' : 'Rejoindre le programme Founders'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

