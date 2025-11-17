'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface AssocieFormProps {
  clientId: string;
  clientData: {
    nombre_actions: number;
    valeur_nominale: number;
    capital_social: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingAssocies?: Array<{ nombre_actions: number }>;
  associeId?: string;
  initialData?: {
    id?: string;
    civilite?: string | null;
    nom?: string | null;
    prenom?: string | null;
    date_naissance?: string | null;
    lieu_naissance?: string | null;
    nationalite?: string | null;
    adresse?: string | null;
    email?: string | null;
    telephone?: string | null;
    profession?: string | null;
    nombre_actions?: number;
    type_apport?: string | null;
    president?: boolean;
  } | null;
}

interface FormData {
  civilite: 'M.' | 'Mme' | '';
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  nationalite: string;
  adresse: string;
  email: string;
  telephone: string;
  profession: string;
  nombre_actions: string;
  type_apport: 'numeraire' | 'nature' | '';
  president: boolean;
}

export function AssocieForm({
  clientId,
  clientData,
  isOpen,
  onClose,
  onSuccess,
  existingAssocies = [],
  associeId,
  initialData,
}: AssocieFormProps) {
  const [formData, setFormData] = useState<FormData>({
    civilite: 'M.',
    nom: '',
    prenom: '',
    date_naissance: '',
    lieu_naissance: '',
    nationalite: 'Française',
    adresse: '',
    email: '',
    telephone: '',
    profession: '',
    nombre_actions: '',
    type_apport: 'numeraire',
    president: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Calculer les actions disponibles
  // En mode édition, les actions de l'associé actuel ne doivent pas être comptées comme utilisées
  const totalActionsUtilisees = existingAssocies.reduce(
    (sum, a) => sum + (a.nombre_actions || 0),
    0
  );
  const actionsDisponibles = clientData.nombre_actions - totalActionsUtilisees;
  
  // En mode édition, ajouter les actions actuelles de l'associé aux actions disponibles pour la validation
  const actionsDisponiblesPourValidation = associeId && initialData?.nombre_actions
    ? actionsDisponibles + initialData.nombre_actions
    : actionsDisponibles;

  // Calculs automatiques
  const nombreActionsNum = parseFloat(formData.nombre_actions) || 0;
  const montantApport = nombreActionsNum * clientData.valeur_nominale;
  const pourcentageCapital =
    clientData.nombre_actions > 0
      ? (nombreActionsNum / clientData.nombre_actions) * 100
      : 0;

  // Validation en temps réel
  const nombreActionsValide =
    nombreActionsNum > 0 && nombreActionsNum <= actionsDisponiblesPourValidation;
  const canSubmit =
    formData.civilite &&
    formData.nom.trim() &&
    formData.prenom.trim() &&
    nombreActionsValide &&
    !isSubmitting;

  // Réinitialiser ou pré-remplir le formulaire quand le dialog s'ouvre
  useEffect(() => {
    if (isOpen) {
      if (initialData && associeId) {
        // Mode édition : pré-remplir avec les données existantes
        setFormData({
          civilite: (initialData.civilite as 'M.' | 'Mme') || 'M.',
          nom: initialData.nom || '',
          prenom: initialData.prenom || '',
          date_naissance: initialData.date_naissance || '',
          lieu_naissance: initialData.lieu_naissance || '',
          nationalite: initialData.nationalite || 'Française',
          adresse: initialData.adresse || '',
          email: initialData.email || '',
          telephone: initialData.telephone || '',
          profession: initialData.profession || '',
          nombre_actions: initialData.nombre_actions?.toString() || '',
          type_apport: (initialData.type_apport as 'numeraire' | 'nature') || 'numeraire',
          president: initialData.president || false,
        });
      } else {
        // Mode création : formulaire vide
        setFormData({
          civilite: 'M.',
          nom: '',
          prenom: '',
          date_naissance: '',
          lieu_naissance: '',
          nationalite: 'Française',
          adresse: '',
          email: '',
          telephone: '',
          profession: '',
          nombre_actions: '',
          type_apport: 'numeraire',
          president: false,
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData, associeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.civilite) {
      newErrors.civilite = 'La civilité est requise';
    }
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }
    if (!formData.nombre_actions || parseFloat(formData.nombre_actions) <= 0) {
      newErrors.nombre_actions = 'Le nombre d\'actions doit être supérieur à 0';
    } else if (nombreActionsNum > actionsDisponiblesPourValidation) {
      newErrors.nombre_actions = `Seulement ${actionsDisponiblesPourValidation} action(s) disponible(s)`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    console.log('📤 Données envoyées:', formData);

    try {
      const url = associeId
        ? `/api/clients/${clientId}/associes/${associeId}`
        : `/api/clients/${clientId}/associes`;
      const method = associeId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          civilite: formData.civilite,
          nom: formData.nom.trim(),
          prenom: formData.prenom.trim(),
          date_naissance: formData.date_naissance || null,
          lieu_naissance: formData.lieu_naissance || null,
          Nationalite: formData.nationalite || 'Française', // Majuscule !
          adresse: formData.adresse || null,
          email: formData.email || null,
          telephone: formData.telephone || null,
          profession: formData.profession || null,
          nombre_actions: nombreActionsNum,
          type_apport: formData.type_apport || 'numeraire',
          president: formData.president,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur' }));
        throw new Error(errorData.error || `Erreur lors de la ${associeId ? 'modification' : 'création'}`);
      }

      toast.success(associeId ? 'Associé modifié avec succès' : 'Associé ajouté avec succès');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(`Erreur ${associeId ? 'modification' : 'création'} associé:`, error);
      toast.error(error.message || `Erreur lors de la ${associeId ? 'modification' : 'création'} de l'associé`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{associeId ? 'Modifier l\'associé' : 'Ajouter un nouvel associé'}</DialogTitle>
          <DialogDescription>
            {associeId 
              ? 'Modifiez les informations de l\'associé'
              : 'Remplissez les informations de l\'associé qui détient des parts de la société'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1 - IDENTITÉ */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Identité</h3>

            <div className="space-y-2">
              <Label>
                Civilité <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={formData.civilite}
                onValueChange={(value) =>
                  setFormData({ ...formData, civilite: value as 'M.' | 'Mme' })
                }
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="M." id="civilite-m" />
                  <Label htmlFor="civilite-m" className="cursor-pointer">
                    M.
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Mme" id="civilite-mme" />
                  <Label htmlFor="civilite-mme" className="cursor-pointer">
                    Mme
                  </Label>
                </div>
              </RadioGroup>
              {errors.civilite && (
                <p className="text-sm text-red-500">{errors.civilite}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="DUPONT"
                  required
                />
                {errors.nom && <p className="text-sm text-red-500">{errors.nom}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prenom">
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  placeholder="Jean"
                  required
                />
                {errors.prenom && <p className="text-sm text-red-500">{errors.prenom}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_naissance">Date de naissance</Label>
                <Input
                  id="date_naissance"
                  type="date"
                  value={formData.date_naissance}
                  onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lieu_naissance">Lieu de naissance</Label>
                <Input
                  id="lieu_naissance"
                  value={formData.lieu_naissance}
                  onChange={(e) => setFormData({ ...formData, lieu_naissance: e.target.value })}
                  placeholder="Paris"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationalite">Nationalité</Label>
              <Input
                id="nationalite"
                value={formData.nationalite}
                onChange={(e) => setFormData({ ...formData, nationalite: e.target.value })}
                placeholder="Française"
              />
            </div>
          </div>

          {/* SECTION 2 - COORDONNÉES */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Coordonnées</h3>

            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                placeholder="123 Rue de la République, 75001 Paris"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jean.dupont@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profession">Profession</Label>
              <Input
                id="profession"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                placeholder="Entrepreneur"
              />
            </div>
          </div>

          {/* SECTION 3 - PARTICIPATION AU CAPITAL */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Participation au capital</h3>

            <div className="space-y-2">
              <Label htmlFor="nombre_actions">
                Nombre d'actions <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre_actions"
                type="number"
                min="1"
                max={actionsDisponiblesPourValidation}
                value={formData.nombre_actions}
                onChange={(e) => setFormData({ ...formData, nombre_actions: e.target.value })}
                placeholder="100"
                required
              />
              <p className="text-xs text-muted-foreground">
                Actions disponibles : <span className="font-medium">{actionsDisponiblesPourValidation}</span> sur{' '}
                <span className="font-medium">{clientData.nombre_actions}</span> au total
                {associeId && initialData?.nombre_actions && (
                  <span className="text-blue-600"> (incluant les {initialData.nombre_actions} actions actuelles)</span>
                )}
              </p>
              {errors.nombre_actions && (
                <p className="text-sm text-red-500">{errors.nombre_actions}</p>
              )}
              {nombreActionsNum > actionsDisponiblesPourValidation && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Seulement {actionsDisponiblesPourValidation} action(s) disponible(s) sur{' '}
                    {clientData.nombre_actions} au total
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type_apport">Type d'apport</Label>
              <Select
                value={formData.type_apport}
                onValueChange={(value) =>
                  setFormData({ ...formData, type_apport: value as 'numeraire' | 'nature' })
                }
              >
                <SelectTrigger id="type_apport">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="numeraire">Numéraire</SelectItem>
                  <SelectItem value="nature">Nature</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Calculs automatiques */}
            {nombreActionsNum > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Montant de l'apport :</span>
                  <Badge variant="outline" className="text-blue-900 font-semibold">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(montantApport)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Pourcentage du capital :</span>
                  <Badge variant="outline" className="text-blue-900 font-semibold">
                    {pourcentageCapital.toFixed(2)}%
                  </Badge>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Calcul automatique : {nombreActionsNum} actions ×{' '}
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(clientData.valeur_nominale)}{' '}
                  ={' '}
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(montantApport)}
                </p>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="president"
                checked={formData.president}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, president: checked === true })
                }
              />
              <Label htmlFor="president" className="cursor-pointer">
                Président de la société
              </Label>
            </div>
            {formData.president && (
              <Alert>
                <AlertDescription>
                  ⚠️ Si cet associé est désigné comme président, les autres associés ne seront plus
                  présidents.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

