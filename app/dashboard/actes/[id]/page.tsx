'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ChevronRight, FileText, FileCog, Edit, Trash2, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabaseClient } from "@/lib/supabase";
import type { ActeJuridique, Client, Associe } from "@/types/database";

type ActeWithRelations = ActeJuridique & {
  cedant: Associe | Associe[] | null;
  client: Client | null;
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Non renseignée";
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'cession_actions':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Cession d'actions</Badge>;
    case 'augmentation_capital':
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Augmentation capital</Badge>;
    case 'ag_ordinaire':
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">AG Ordinaire</Badge>;
    default:
      return <Badge>{type}</Badge>;
  }
};

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case 'brouillon':
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Brouillon</Badge>;
    case 'validé':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Validé</Badge>;
    case 'signé':
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Signé</Badge>;
    default:
      return <Badge>{statut}</Badge>;
  }
};

const formatAdresse = (adresse: any): string => {
  if (!adresse) return "Non renseignée";
  if (typeof adresse === "string") return adresse;
  const parts = [
    adresse.numero_voie,
    adresse.type_voie,
    adresse.nom_voie || adresse.libelle_voie,
    adresse.code_postal,
    adresse.ville
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Non renseignée";
};

const formatMontant = (montant: number | null | undefined): string => {
  if (montant === null || montant === undefined) return "0,00";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(montant);
};

const getModaliteBadge = (modalite: string | null | undefined) => {
  switch (modalite) {
    case 'numeraire':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Apport en numéraire</Badge>;
    case 'nature':
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Apport en nature</Badge>;
    case 'reserves':
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Incorporation de réserves</Badge>;
    default:
      return <Badge>{modalite || "Non renseigné"}</Badge>;
  }
};

export default function ActeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const acteId = params.id as string;

  const [acte, setActe] = useState<ActeWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [generatingActeCessionId, setGeneratingActeCessionId] = useState(false);
  const [generatingOMTId, setGeneratingOMTId] = useState(false);
  const [generatingAugmentationId, setGeneratingAugmentationId] = useState(false);

  // Fetch acte avec relations
  useEffect(() => {
    const fetchActe = async () => {
      try {
        const { data: acteData, error: acteError } = await supabaseClient
          .from("actes_juridiques")
          .select(`
            *,
            cedant:associes(*),
            client:clients(*)
          `)
          .eq("id", acteId)
          .single();

        if (acteError || !acteData) {
          alert("Acte introuvable");
          router.push("/dashboard/actes");
          return;
        }

        setActe(acteData as unknown as ActeWithRelations);
      } catch (err: any) {
        console.error("Erreur récupération acte:", err);
        setError(err.message || "Erreur lors du chargement de l'acte");
      } finally {
        setIsLoading(false);
      }
    };

    if (acteId) {
      void fetchActe();
    }
  }, [acteId, router]);

  // Supprimer acte
  const handleDelete = async () => {
    if (!acte?.id) return;

    setIsDeleting(true);

    try {
      const { error: deleteError } = await supabaseClient
        .from("actes_juridiques")
        .delete()
        .eq("id", acte.id);

      if (deleteError) {
        throw deleteError;
      }

      alert("✅ Acte supprimé avec succès");
      router.push("/dashboard/actes");
    } catch (err: any) {
      console.error("Erreur suppression:", err);
      alert(`❌ ${err.message || "Erreur lors de la suppression"}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Générer l'acte de cession
  const handleGenerateActeCession = async () => {
    if (!acte?.id) return;

    setGeneratingActeCessionId(true);

    try {
      const response = await fetch('/api/generate-cession-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acte_id: acte.id }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erreur lors de la génération' }));
        throw new Error(error.error || 'Erreur lors de la génération');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Acte_Cession_${acte.client?.nom_entreprise || 'document'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Acte de cession généré');
    } catch (err: any) {
      console.error('Erreur génération acte de cession:', err);
      toast.error(err.message || 'Erreur lors de la génération de l\'acte de cession');
    } finally {
      setGeneratingActeCessionId(false);
    }
  };

  // Générer l'ordre de mouvement de titres
  const handleGenerateOMT = async () => {
    if (!acte?.id) return;

    setGeneratingOMTId(true);

    try {
      const response = await fetch('/api/generate-ordre-mouvement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acte_id: acte.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur génération' }));
        throw new Error(errorData.error || 'Erreur génération');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ordre_Mouvement_Titres_${acte.client?.nom_entreprise || 'document'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Ordre de mouvement généré');
    } catch (err: any) {
      console.error('Erreur génération OMT:', err);
      toast.error(err.message || 'Erreur lors de la génération de l\'ordre de mouvement');
    } finally {
      setGeneratingOMTId(false);
    }
  };

  // Générer le PV d'augmentation de capital
  const handleGenerateAugmentationCapital = async () => {
    if (!acte?.id) return;

    setGeneratingAugmentationId(true);

    try {
      const response = await fetch('/api/generate-augmentation-capital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acte_id: acte.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur génération' }));
        throw new Error(errorData.error || 'Erreur génération');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PV_Augmentation_Capital_${acte.client?.nom_entreprise || 'Client'}_${new Date(acte.date_acte).toLocaleDateString('fr-FR').replace(/\//g, '-')}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('PV d\'augmentation de capital généré');
    } catch (error: any) {
      console.error('Erreur génération PV augmentation:', error);
      toast.error(error.message || 'Erreur lors de la génération');
    } finally {
      setGeneratingAugmentationId(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="flex min-h-[200px] items-center justify-center">
          <span className="text-sm text-muted-foreground">Chargement de l'acte...</span>
        </div>
      </div>
    );
  }

  if (error || !acte) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error || "Acte introuvable"}</p>
            <Button variant="outline" onClick={() => router.push("/dashboard/actes")} className="mt-4">
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cedant = Array.isArray(acte.cedant) ? acte.cedant[0] : acte.cedant;
  const client = acte.client;

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/dashboard/actes" className="hover:text-foreground">
          Actes juridiques
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Détail</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            Acte juridique - {getTypeBadge(acte.type)}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            {getStatutBadge(acte.statut)}
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/actes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Link>
        </Button>
      </div>

      {/* Cards en grille */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1 - Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Type</Label>
              <div className="mt-1">{getTypeBadge(acte.type)}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Date de l'acte</Label>
              <p className="mt-1">{formatDate(acte.date_acte)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Statut</Label>
              <div className="mt-1">{getStatutBadge(acte.statut)}</div>
            </div>
            {client && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Client</Label>
                <p className="mt-1 font-medium">{client.nom_entreprise}</p>
                {client.siret && (
                  <p className="text-sm text-muted-foreground">SIRET : {client.siret}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2 - Le Cédant (si cession) */}
        {acte.type === 'cession_actions' && cedant && (
          <Card>
            <CardHeader>
              <CardTitle>Le Cédant</CardTitle>
              <CardDescription>Associé qui cède ses actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Nom complet</Label>
                <p className="mt-1 font-medium">
                  {cedant.civilite} {cedant.prenom} {cedant.nom}
                </p>
              </div>
              {cedant.date_naissance && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date de naissance</Label>
                  <p className="mt-1">{formatDate(cedant.date_naissance)}</p>
                </div>
              )}
              {cedant.nationalite && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nationalité</Label>
                  <p className="mt-1">{cedant.nationalite}</p>
                </div>
              )}
              {cedant.adresse && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Adresse</Label>
                  <p className="mt-1">{formatAdresse(cedant.adresse)}</p>
                </div>
              )}
              {cedant.nombre_actions !== null && cedant.nombre_actions !== undefined && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Actions détenues</Label>
                  <p className="mt-1 font-medium">{cedant.nombre_actions} action{cedant.nombre_actions > 1 ? 's' : ''}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Card 3 - Le Cessionnaire (si cession) */}
        {acte.type === 'cession_actions' && acte.cessionnaire_nom && (
          <Card>
            <CardHeader>
              <CardTitle>Le Cessionnaire</CardTitle>
              <CardDescription>Nouveau propriétaire des actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Nom complet</Label>
                <p className="mt-1 font-medium">
                  {acte.cessionnaire_civilite} {acte.cessionnaire_prenom} {acte.cessionnaire_nom}
                </p>
              </div>
              {acte.cessionnaire_nationalite && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nationalité</Label>
                  <p className="mt-1">{acte.cessionnaire_nationalite}</p>
                </div>
              )}
              {acte.cessionnaire_adresse && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Adresse</Label>
                  <p className="mt-1">{acte.cessionnaire_adresse}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Card 4 - Détails de la cession (si cession) */}
        {acte.type === 'cession_actions' && (
          <Card>
            <CardHeader>
              <CardTitle>Détails de la cession</CardTitle>
              <CardDescription>Informations sur la transaction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {acte.nombre_actions !== null && acte.nombre_actions !== undefined && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nombre d'actions cédées</Label>
                  <p className="mt-1 font-medium">{acte.nombre_actions} action{acte.nombre_actions > 1 ? 's' : ''}</p>
                </div>
              )}
              {acte.prix_unitaire !== null && acte.prix_unitaire !== undefined && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Prix unitaire</Label>
                  <p className="mt-1">{acte.prix_unitaire.toFixed(2)}€</p>
                </div>
              )}
              {acte.prix_total !== null && acte.prix_total !== undefined && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Prix total</Label>
                  <p className="mt-1 text-lg font-bold">{acte.prix_total.toFixed(2)}€</p>
                </div>
              )}
              {acte.date_agrement && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date d'agrément</Label>
                  <p className="mt-1">{formatDate(acte.date_agrement)}</p>
                </div>
              )}
              {acte.modalites_paiement && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Modalités de paiement</Label>
                  <p className="mt-1 whitespace-pre-wrap">{acte.modalites_paiement}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cards pour Augmentation de Capital */}
        {acte.type === 'augmentation_capital' && (
          <>
            {/* Card - Capital Social */}
            <Card>
              <CardHeader>
                <CardTitle>Capital Social</CardTitle>
                <CardDescription>Évolution du capital social</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {acte.ancien_capital !== null && acte.ancien_capital !== undefined && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Capital actuel</Label>
                    <p className="mt-1 text-lg">{formatMontant(acte.ancien_capital)} €</p>
                  </div>
                )}
                {acte.montant_augmentation !== null && acte.montant_augmentation !== undefined && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Augmentation</Label>
                    <p className="mt-1 text-lg font-bold text-green-600">
                      +{formatMontant(acte.montant_augmentation)} €
                    </p>
                  </div>
                )}
                {acte.nouveau_capital !== null && acte.nouveau_capital !== undefined && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nouveau capital</Label>
                    <p className="mt-1 text-2xl font-bold">{formatMontant(acte.nouveau_capital)} €</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card - Modalités */}
            <Card>
              <CardHeader>
                <CardTitle>Modalités</CardTitle>
                <CardDescription>Détails de l'augmentation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {acte.modalite && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Type d'augmentation</Label>
                    <div className="mt-1">{getModaliteBadge(acte.modalite)}</div>
                  </div>
                )}
                {acte.modalite === 'nature' && acte.description_apport && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Description de l'apport</Label>
                    <p className="mt-1 whitespace-pre-wrap">{acte.description_apport}</p>
                  </div>
                )}
                {acte.nombre_nouvelles_actions !== null && acte.nombre_nouvelles_actions !== undefined && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nouvelles actions créées</Label>
                    <p className="mt-1 font-medium">{acte.nombre_nouvelles_actions} action{acte.nombre_nouvelles_actions > 1 ? 's' : ''}</p>
                  </div>
                )}
                {acte.nouveau_capital !== null && acte.nouveau_capital !== undefined && 
                 acte.nombre_nouvelles_actions !== null && acte.nombre_nouvelles_actions !== undefined &&
                 client && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Valeur nominale</Label>
                    <p className="mt-1 font-medium">
                      {formatMontant(
                        acte.nouveau_capital / ((client.nb_actions || 0) + acte.nombre_nouvelles_actions)
                      )} €
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card - Assemblée Générale */}
            <Card>
              <CardHeader>
                <CardTitle>Assemblée Générale</CardTitle>
                <CardDescription>Quorum et résultats du vote</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {acte.quorum !== null && acte.quorum !== undefined && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Quorum</Label>
                    <p className="mt-1 font-medium">{acte.quorum}%</p>
                  </div>
                )}
                {acte.votes_pour !== null && acte.votes_pour !== undefined && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Votes POUR</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <p className="font-medium">{acte.votes_pour}</p>
                    </div>
                  </div>
                )}
                {acte.votes_contre !== null && acte.votes_contre !== undefined && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Votes CONTRE</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <p className="font-medium">{acte.votes_contre}</p>
                    </div>
                  </div>
                )}
                {acte.votes_pour !== null && acte.votes_pour !== undefined &&
                 acte.votes_contre !== null && acte.votes_contre !== undefined && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Résultat</Label>
                    <div className="mt-1">
                      {acte.votes_pour > acte.votes_contre ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">ADOPTÉE</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">REJETÉE</Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card - Nouveaux Associés */}
            {acte.nouveaux_associes && Array.isArray(acte.nouveaux_associes) && acte.nouveaux_associes.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Nouveaux Associés</CardTitle>
                  <CardDescription>Associés créés par cette augmentation</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Prénom</TableHead>
                        <TableHead className="text-right">Apport (€)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {acte.nouveaux_associes.map((associe: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{associe.nom || "-"}</TableCell>
                          <TableCell>{associe.prenom || "-"}</TableCell>
                          <TableCell className="text-right">{formatMontant(associe.apport)}</TableCell>
                          <TableCell className="text-right">{associe.nombre_actions || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Section Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {acte.statut === 'brouillon' && (
              <>
                <Button asChild>
                  <Link href={`/dashboard/actes/${acte.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              </>
            )}
            {acte.type === 'cession_actions' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleGenerateActeCession}
                  disabled={generatingActeCessionId || generatingOMTId}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {generatingActeCessionId ? 'Génération...' : 'Générer l\'acte de cession'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGenerateOMT}
                  disabled={generatingActeCessionId || generatingOMTId}
                >
                  <FileCog className="mr-2 h-4 w-4" />
                  {generatingOMTId ? 'Génération...' : 'Générer l\'ordre de mouvement'}
                </Button>
              </>
            )}
            {acte.type === 'augmentation_capital' && (
              <Button
                variant="outline"
                onClick={handleGenerateAugmentationCapital}
                disabled={generatingAugmentationId}
              >
                <FileText className="mr-2 h-4 w-4" />
                {generatingAugmentationId ? 'Génération...' : 'Générer le PV d\'augmentation'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmation suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet acte ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

