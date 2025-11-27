'use client';

import { useEffect, useState } from 'react';
import { Users, User, Crown, Edit, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { AssocieForm } from './AssocieForm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface Associe {
  id: string;
  civilite?: string | null;
  nom?: string | null;
  prenom?: string | null;
  nombre_actions: number;
  montant_apport: number;
  pourcentage_capital: number;
  president?: boolean;
  directeur_general?: boolean;
}

interface AssociesListProps {
  clientId: string;
  clientData: {
    capital_social: number;
    nb_actions: number;
    forme_juridique?: string;
  };
}

export default function AssociesList({ clientId, clientData }: AssociesListProps) {
  const [associes, setAssocies] = useState<Associe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssocie, setEditingAssocie] = useState<Associe | null>(null);

  // Validation SASU : une SASU ne peut avoir qu'un seul associé
  const isSASU = clientData.forme_juridique === 'SASU';
  const canAddAssocie = !isSASU || associes.length === 0;
  const sasuLimitMessage = isSASU && associes.length >= 1
    ? "⚠️ Une SASU ne peut avoir qu'un seul associé unique"
    : null;

  const fetchAssocies = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/clients/${clientId}/associes`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        throw new Error(errorData.error || 'Erreur lors de la récupération des associés');
      }

      const data = await response.json();
      setAssocies(data || []);
    } catch (err: any) {
      console.error('Erreur récupération associés:', err);
      setError(err.message || 'Erreur lors de la récupération des associés');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchAssocies();
    }
  }, [clientId]);

  // Calculs pour l'affichage
  const valeurNominale =
    clientData.capital_social && clientData.nb_actions
      ? clientData.capital_social / clientData.nb_actions
      : 0;

  // Préparer les données pour le formulaire
  const formClientData = {
    nombre_actions: clientData.nb_actions,
    valeur_nominale: valeurNominale,
    capital_social: clientData.capital_social,
  };

  const totalActions = associes.reduce((sum, a) => sum + (a.nombre_actions || 0), 0);
  const totalMontant = associes.reduce((sum, a) => sum + (a.montant_apport || 0), 0);
  const totalPourcentage = associes.reduce((sum, a) => sum + (a.pourcentage_capital || 0), 0);
  const isComplete = totalPourcentage >= 99.99; // Tolérance pour les arrondis

  // Formatage
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace(/\u00A0/g, ' '); // Remplacer les espaces insécables par des espaces normaux
  };

  const formatPercentage = (percent: number) => {
    return `${percent.toFixed(2)}%`;
  };

  // Fonction pour ouvrir le dialog d'ajout (avec validation SASU)
  const handleOpenAddDialog = () => {
    if (!canAddAssocie) {
      toast.error("⚠️ Une SASU ne peut avoir qu'un seul associé unique");
      return;
    }
    setEditingAssocie(null);
    setIsDialogOpen(true);
  };

  // Fonction pour modifier un associé
  const handleEdit = (associe: Associe) => {
    console.log('🔧 Clic Modifier:', associe);
    setEditingAssocie(associe);
    setIsDialogOpen(true);
  };

  // Fonction pour supprimer un associé
  const handleDelete = async (associeId: string) => {
    console.log('🗑️ Clic Supprimer:', associeId);
    
    const associe = associes.find(a => a.id === associeId);
    const nomComplet = associe 
      ? `${associe.civilite || ''} ${associe.prenom || ''} ${associe.nom || ''}`.trim()
      : 'cet associé';
    
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${nomComplet} ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${clientId}/associes/${associeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      toast.success('Associé supprimé avec succès');
      fetchAssocies(); // Rafraîchir la liste
    } catch (err: any) {
      console.error('Erreur suppression associé:', err);
      toast.error(err.message || 'Erreur lors de la suppression de l\'associé');
    }
  };

  // États de chargement
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // État vide
  if (associes.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Users className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucun associé ajouté pour cette société</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Les associés sont les actionnaires qui détiennent des parts de la société
          </p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button 
                    onClick={handleOpenAddDialog}
                    disabled={!canAddAssocie}
                  >
                    Ajouter un associé
                  </Button>
                </span>
              </TooltipTrigger>
              {sasuLimitMessage && (
                <TooltipContent>
                  <p>{sasuLimitMessage}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          {sasuLimitMessage && (
            <p className="text-sm text-amber-600 mt-2">{sasuLimitMessage}</p>
          )}
        </div>

        {/* Formulaire modal d'ajout */}
        <AssocieForm
          clientId={clientId}
          clientData={formClientData}
          formeJuridique={clientData.forme_juridique}
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setEditingAssocie(null);
          }}
          onSuccess={() => {
            fetchAssocies(); // Recharge la liste
            setEditingAssocie(null);
          }}
          existingAssocies={[]}
          associeId={editingAssocie?.id}
          initialData={editingAssocie}
        />
      </>
    );
  }

  // Affichage avec données
  return (
    <div className="space-y-4">
      {/* Header avec infos capital et bouton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Capital :</span>{' '}
          {formatCurrency(clientData.capital_social)} |{' '}
          <span className="font-medium text-foreground">{clientData.nb_actions}</span> actions à{' '}
          <span className="font-medium text-foreground">{formatCurrency(valeurNominale)}</span>
        </div>
        <div className="flex flex-col items-end gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button 
                    onClick={handleOpenAddDialog}
                    disabled={!canAddAssocie}
                  >
                    Ajouter un associé
                  </Button>
                </span>
              </TooltipTrigger>
              {sasuLimitMessage && (
                <TooltipContent>
                  <p>{sasuLimitMessage}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          {sasuLimitMessage && (
            <p className="text-xs text-amber-600">{sasuLimitMessage}</p>
          )}
        </div>
      </div>

      {/* Tableau des associés */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom & Prénom</TableHead>
              <TableHead className="text-right">Actions</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="text-right">Pourcentage</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {associes.map((associe) => (
              <TableRow key={associe.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-muted p-1.5">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {associe.civilite && `${associe.civilite} `}
                        {associe.prenom} {associe.nom}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {associe.nombre_actions.toLocaleString('fr-FR')}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(associe.montant_apport)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Progress value={associe.pourcentage_capital} className="h-2" />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">
                      {formatPercentage(associe.pourcentage_capital)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {associe.president && (
                    <Badge variant="default" className="gap-1">
                      <Crown className="h-3 w-3" />
                      Président
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        console.log('🔧 CLIC MODIFIER');
                        handleEdit(associe);
                      }}
                      aria-label="Éditer l'associé"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        console.log('🗑️ CLIC SUPPRIMER');
                        handleDelete(associe.id);
                      }}
                      aria-label="Supprimer l'associé"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer avec totaux */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-4 border-t">
        <div className="text-sm">
          <span className="font-medium">Total :</span>{' '}
          <span className="font-semibold">{totalActions.toLocaleString('fr-FR')}</span> actions ({' '}
          <span className="font-semibold">{formatCurrency(totalMontant)}</span>) |{' '}
          <span className="font-semibold">{formatPercentage(totalPourcentage)}</span>
        </div>
        <div className="flex items-center gap-2">
          {isComplete ? (
            <>
              <span className="text-green-600">✅</span>
              <span className="text-sm text-green-600 font-medium">Capital complet</span>
            </>
          ) : (
            <>
              <span className="text-yellow-600">⚠️</span>
              <span className="text-sm text-yellow-600 font-medium">
                Capital incomplet ({formatPercentage(100 - totalPourcentage)} restant)
              </span>
            </>
          )}
        </div>
      </div>

      {/* Formulaire modal d'ajout/édition */}
      <AssocieForm
        clientId={clientId}
        clientData={formClientData}
        formeJuridique={clientData.forme_juridique}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingAssocie(null);
        }}
        onSuccess={() => {
          fetchAssocies(); // Recharge la liste
          setEditingAssocie(null);
        }}
        existingAssocies={associes.filter(a => a.id !== editingAssocie?.id)}
        associeId={editingAssocie?.id}
        initialData={editingAssocie}
      />
    </div>
  );
}

