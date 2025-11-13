'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, FileText, FileCog, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { ActeJuridique, Client } from "@/types/database";

type ActeWithRelations = ActeJuridique & {
  client: { nom_entreprise: string; siret?: string } | null;
  cedant: { nom: string; prenom: string } | null;
};

const formatDate = (dateString: string): string => {
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

export default function ActesPage() {
  const router = useRouter();
  const [actes, setActes] = useState<ActeWithRelations[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cabinetId, setCabinetId] = useState<string | null>(null);

  // Filtres
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatut, setFilterStatut] = useState<string>('all');

  // Suppression
  const [acteToDelete, setActeToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Génération
  const [generatingActeCessionId, setGeneratingActeCessionId] = useState<string | null>(null);
  const [generatingOMTId, setGeneratingOMTId] = useState<string | null>(null);

  // Fetch cabinet_id et données
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer le cabinet_id
        const { data: cabinetIdData, error: cabinetIdError } = await supabaseClient.rpc(
          "get_user_cabinet_id"
        );

        if (cabinetIdError || !cabinetIdData) {
          throw new Error("Impossible de récupérer le cabinet. Veuillez vous reconnecter.");
        }

        setCabinetId(cabinetIdData);

        // Fetch actes avec relations
        const { data: actesData, error: actesError } = await supabaseClient
          .from("actes_juridiques")
          .select(`
            *,
            client:clients(nom_entreprise, siret),
            cedant:associes(nom, prenom)
          `)
          .eq("cabinet_id", cabinetIdData)
          .order("date_acte", { ascending: false });

        if (actesError) {
          throw actesError;
        }

        // Fetch clients pour le filtre
        const { data: clientsData, error: clientsError } = await supabaseClient
          .from("clients")
          .select("*")
          .eq("cabinet_id", cabinetIdData)
          .order("nom_entreprise", { ascending: true });

        if (clientsError) {
          throw clientsError;
        }

        setActes((actesData || []) as ActeWithRelations[]);
        setClients(clientsData || []);
      } catch (err: any) {
        console.error("Erreur récupération données:", err);
        setError(err.message || "Erreur lors du chargement des actes.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, []);

  // Filtrer les actes
  const filteredActes = useMemo(() => {
    return actes.filter((acte) => {
      if (filterClient !== 'all' && acte.client_id !== filterClient) return false;
      if (filterType !== 'all' && acte.type !== filterType) return false;
      if (filterStatut !== 'all' && acte.statut !== filterStatut) return false;
      return true;
    });
  }, [actes, filterClient, filterType, filterStatut]);

  // Générer l'acte de cession
  const handleGenerateActeCession = async (acte: ActeWithRelations) => {
    if (!acte.id) return;

    setGeneratingActeCessionId(acte.id);

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

      alert('✅ Acte de cession généré');
    } catch (err: any) {
      console.error('Erreur génération acte de cession:', err);
      alert(`❌ ${err.message || 'Erreur lors de la génération de l\'acte de cession'}`);
    } finally {
      setGeneratingActeCessionId(null);
    }
  };

  // Générer l'ordre de mouvement de titres
  const handleGenerateOMT = async (acte: ActeWithRelations) => {
    if (!acte.id) return;

    setGeneratingOMTId(acte.id);

    try {
      const response = await fetch('/api/generate-ordre-mouvement', {
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
      a.download = `Ordre_Mouvement_Titres_${acte.client?.nom_entreprise || 'document'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('✅ Ordre de mouvement généré');
    } catch (err: any) {
      console.error('Erreur génération OMT:', err);
      alert(`❌ ${err.message || 'Erreur lors de la génération de l\'ordre de mouvement'}`);
    } finally {
      setGeneratingOMTId(null);
    }
  };

  // Supprimer acte
  const handleDelete = async () => {
    if (!acteToDelete) return;

    setIsDeleting(true);

    try {
      const { error } = await supabaseClient
        .from("actes_juridiques")
        .delete()
        .eq("id", acteToDelete);

      if (error) {
        throw error;
      }

      setActes((prev) => prev.filter((a) => a.id !== acteToDelete));
      setActeToDelete(null);
      alert('✅ Acte supprimé avec succès !');
    } catch (err: any) {
      console.error('Erreur suppression:', err);
      alert(`❌ ${err.message || 'Erreur lors de la suppression'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Rendre le contenu des parties/montant selon le type
  const renderPartiesMontant = (acte: ActeWithRelations) => {
    if (acte.type === 'cession_actions') {
      const cedant = acte.cedant;
      const cessionnaire = acte.cessionnaire_nom;
      const prixTotal = acte.prix_total;
      
      if (cedant && cessionnaire && prixTotal) {
        return `${cedant.prenom} ${cedant.nom} → ${cessionnaire} • ${prixTotal.toFixed(2)}€`;
      }
      return '—';
    }
    // Pour les autres types, on pourrait afficher le nombre d'associés
    return '—';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center">
            <span className="text-sm text-muted-foreground">Chargement des actes juridiques…</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Actes juridiques</h1>
          <p className="text-muted-foreground mt-2">
            Gérez tous les actes juridiques de votre cabinet
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/actes/create">
            <Plus className="mr-2 h-4 w-4" />
            Nouvel acte
          </Link>
        </Button>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Client</label>
              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id!}>
                      {client.nom_entreprise}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="cession_actions">Cession d'actions</SelectItem>
                  <SelectItem value="augmentation_capital">Augmentation capital</SelectItem>
                  <SelectItem value="ag_ordinaire">AG Ordinaire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select value={filterStatut} onValueChange={setFilterStatut}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="validé">Validé</SelectItem>
                  <SelectItem value="signé">Signé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      {filteredActes.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Aucun acte juridique</CardTitle>
            <CardDescription>
              {actes.length === 0
                ? "Créez votre premier acte juridique pour commencer."
                : "Aucun acte ne correspond aux filtres sélectionnés."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {actes.length === 0 && (
              <Button asChild>
                <Link href="/dashboard/actes/create">Créer le premier acte</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Parties / Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActes.map((acte) => (
                  <TableRow key={acte.id}>
                    <TableCell>{formatDate(acte.date_acte)}</TableCell>
                    <TableCell>{getTypeBadge(acte.type)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{acte.client?.nom_entreprise || '—'}</div>
                        {acte.client?.siret && (
                          <div className="text-sm text-muted-foreground">{acte.client.siret}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{renderPartiesMontant(acte)}</TableCell>
                    <TableCell>{getStatutBadge(acte.statut)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/actes/${acte.id}`)}
                          >
                            Voir détail
                          </DropdownMenuItem>
                          {acte.type === 'cession_actions' ? (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleGenerateActeCession(acte)}
                                disabled={generatingActeCessionId === acte.id || generatingOMTId === acte.id}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                {generatingActeCessionId === acte.id ? 'Génération...' : 'Générer l\'acte de cession'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleGenerateOMT(acte)}
                                disabled={generatingActeCessionId === acte.id || generatingOMTId === acte.id}
                              >
                                <FileCog className="mr-2 h-4 w-4" />
                                {generatingOMTId === acte.id ? 'Génération...' : 'Générer l\'ordre de mouvement'}
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem disabled>
                              <FileText className="mr-2 h-4 w-4" />
                              Génération non disponible
                            </DropdownMenuItem>
                          )}
                          {acte.statut === 'brouillon' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => router.push(`/dashboard/actes/${acte.id}/edit`)}
                              >
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setActeToDelete(acte.id!)}
                                className="text-destructive"
                              >
                                Supprimer
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmation suppression */}
      <AlertDialog open={!!acteToDelete} onOpenChange={(open) => !open && setActeToDelete(null)}>
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

