'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft } from 'lucide-react';

export default function NewClientPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    denomination: '',
    siret: '',
    forme_juridique: '',
    adresse: '',
    code_postal: '',
    ville: '',
    email: '',
    telephone: '',
    representant_nom: '',
    representant_prenom: '',
    notes: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.denomination.trim()) {
        setError('La dénomination est obligatoire');
        setLoading(false);
        return;
      }

      const supabase = createClient();
      
      const { data, error: insertError } = await supabase
        .from('clients')
        .insert({
          denomination: formData.denomination.trim(),
          siret: formData.siret.trim() || null,
          forme_juridique: formData.forme_juridique.trim() || null,
          adresse: formData.adresse.trim() || null,
          code_postal: formData.code_postal.trim() || null,
          ville: formData.ville.trim() || null,
          email: formData.email.trim() || null,
          telephone: formData.telephone.trim() || null,
          representant_nom: formData.representant_nom.trim() || null,
          representant_prenom: formData.representant_prenom.trim() || null,
          notes: formData.notes.trim() || null,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[NEW CLIENT] Erreur:', insertError);
        setError('Erreur lors de la création du client');
        setLoading(false);
        return;
      }

      // Rediriger vers la liste des clients
      router.push('/dashboard/clients');
    } catch (err) {
      console.error('[NEW CLIENT] Erreur:', err);
      setError('Erreur inattendue');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/clients')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nouveau client</h1>
          <p className="text-muted-foreground">
            Créez un nouveau client pour votre cabinet
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du client</CardTitle>
          <CardDescription>
            Remplissez les informations de base du client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="denomination">
                Dénomination sociale <span className="text-destructive">*</span>
              </Label>
              <Input
                id="denomination"
                value={formData.denomination}
                onChange={(e) => setFormData({ ...formData, denomination: e.target.value })}
                placeholder="Ex: SARL DUPONT & ASSOCIÉS"
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="siret">SIRET</Label>
                <Input
                  id="siret"
                  value={formData.siret}
                  onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                  placeholder="12345678901234"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="forme_juridique">Forme juridique</Label>
                <Input
                  id="forme_juridique"
                  value={formData.forme_juridique}
                  onChange={(e) => setFormData({ ...formData, forme_juridique: e.target.value })}
                  placeholder="Ex: SARL, SAS, EURL..."
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                placeholder="Numéro et nom de rue"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code_postal">Code postal</Label>
                <Input
                  id="code_postal"
                  value={formData.code_postal}
                  onChange={(e) => setFormData({ ...formData, code_postal: e.target.value })}
                  placeholder="78000"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ville">Ville</Label>
                <Input
                  id="ville"
                  value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  placeholder="Versailles"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@client.fr"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="01 23 45 67 89"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="representant_nom">Nom du représentant</Label>
                <Input
                  id="representant_nom"
                  value={formData.representant_nom}
                  onChange={(e) => setFormData({ ...formData, representant_nom: e.target.value })}
                  placeholder="Dupont"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="representant_prenom">Prénom du représentant</Label>
                <Input
                  id="representant_prenom"
                  value={formData.representant_prenom}
                  onChange={(e) => setFormData({ ...formData, representant_prenom: e.target.value })}
                  placeholder="Jean"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes internes sur ce client..."
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/clients')}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Création...' : 'Créer le client'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
