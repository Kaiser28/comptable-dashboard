'use client';

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { supabaseClient } from "@/lib/supabase";
import type { Client } from "@/types/database";

type ClientWithProgress = Client & {
  formattedCreatedAt: string;
  nbActesTotal: number;
  nbActesSignes: number;
  progressText: string;
};

type SortField = 'nom_entreprise' | 'created_at' | 'statut';
type SortDirection = 'asc' | 'desc';

const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const statusBadgeVariant = (status: string): "default" | "secondary" | "outline" => {
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus === "en attente") return "secondary";
  if (normalizedStatus === "formulaire rempli") return "default";
  if (normalizedStatus === "statuts générés") return "outline";
  return "secondary";
};

export default function ClientsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [cabinetId, setCabinetId] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientWithProgress[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientWithProgress | null>(null);
  const itemsPerPage = 50;

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Récupérer l'utilisateur actuel
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !user) {
        router.push("/login");
        return;
      }

      // Récupérer le cabinet_id
      const { data: expertComptable, error: expertError } = await supabaseClient
        .from("experts_comptables")
        .select("cabinet_id")
        .eq("user_id", user.id)
        .single();

      if (expertError || !expertComptable?.cabinet_id) {
        toast.error("Erreur lors de la récupération du cabinet");
        return;
      }

      const id = expertComptable.cabinet_id;
      setCabinetId(id);

      // Récupérer tous les clients avec leurs actes
      const [clientsResult, actesResult] = await Promise.all([
        supabaseClient
          .from("clients")
          .select("*")
          .eq("cabinet_id", id)
          .order("created_at", { ascending: false }),
        supabaseClient
          .from("actes_juridiques")
          .select("id, client_id, statut")
          .eq("cabinet_id", id),
      ]);

      if (clientsResult.error) {
        throw clientsResult.error;
      }

      // Calculer le progress pour chaque client
      const actesByClient = new Map<string, { total: number; signes: number }>();
      (actesResult.data || []).forEach((acte: any) => {
        const clientId = acte.client_id;
        if (!actesByClient.has(clientId)) {
          actesByClient.set(clientId, { total: 0, signes: 0 });
        }
        const stats = actesByClient.get(clientId)!;
        stats.total++;
        if (acte.statut === 'signé') {
          stats.signes++;
        }
      });

      const clientsWithProgress = (clientsResult.data || []).map((client) => {
        const stats = actesByClient.get(client.id || '') || { total: 0, signes: 0 };
        return {
          ...client,
          formattedCreatedAt: formatDate(client.created_at),
          nbActesTotal: stats.total,
          nbActesSignes: stats.signes,
          progressText: stats.total > 0 ? `${stats.signes}/${stats.total}` : "0/0",
        } as ClientWithProgress;
      });

      setClients(clientsWithProgress);
    } catch (error) {
      console.error("Erreur lors du chargement des clients:", error);
      toast.error("Erreur lors du chargement des clients");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedClients = useMemo(() => {
    let filtered = [...clients];

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.nom_entreprise.toLowerCase().includes(query) ||
          client.forme_juridique?.toLowerCase().includes(query) ||
          client.siret?.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query)
      );
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((client) => {
        const statut = client.statut?.toLowerCase() || "";
        if (statusFilter === "en_attente") {
          return statut.includes("en attente");
        }
        if (statusFilter === "formulaire_recu") {
          return statut.includes("formulaire rempli");
        }
        if (statusFilter === "termine") {
          return statut.includes("statuts générés");
        }
        return true;
      });
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === "nom_entreprise") {
        aValue = a.nom_entreprise.toLowerCase();
        bValue = b.nom_entreprise.toLowerCase();
      } else if (sortField === "created_at") {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      } else if (sortField === "statut") {
        aValue = a.statut || "";
        bValue = b.statut || "";
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [clients, searchQuery, statusFilter, sortField, sortDirection]);

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedClients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedClients, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedClients.length / itemsPerPage);

  const handleDelete = async () => {
    if (!clientToDelete || !cabinetId) return;

    try {
      const { error } = await supabaseClient
        .from("clients")
        .delete()
        .eq("id", clientToDelete.id)
        .eq("cabinet_id", cabinetId);

      if (error) throw error;

      toast.success("Client supprimé avec succès");
      setDeleteDialogOpen(false);
      setClientToDelete(null);
      void fetchData();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression du client");
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des clients</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filteredAndSortedClients.length} client{filteredAndSortedClients.length > 1 ? 's' : ''} au total
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un client
            </Link>
          </Button>
        </header>

        {/* Barre de recherche et filtres */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 border-2 border-slate-200 focus:border-blue-500 focus:shadow-lg transition-all duration-200"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="en_attente">En attente</SelectItem>
              <SelectItem value="formulaire_recu">Formulaire rempli</SelectItem>
              <SelectItem value="termine">Terminé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tableau */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filteredAndSortedClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {!searchQuery && statusFilter === "all" ? (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-6">
                  <Users className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Aucun client pour le moment
                </h3>
                <p className="text-slate-600 mb-6">
                  Créez votre premier client pour commencer
                </p>
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                >
                  <Link href="/dashboard/clients/new">
                    <Plus className="mr-2 h-5 w-5" />
                    Ajouter un client
                  </Link>
                </Button>
              </>
            ) : (
              <p className="text-lg font-medium text-muted-foreground">
                Aucun client ne correspond à vos critères
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100">
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">
                      <button
                        onClick={() => handleSort('nom_entreprise')}
                        className="flex items-center gap-2 hover:text-slate-900 transition-colors"
                      >
                        Nom
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">SIRET</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">
                      <button
                        onClick={() => handleSort('statut')}
                        className="flex items-center gap-2 hover:text-slate-900 transition-colors"
                      >
                        Statut workflow
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">Email</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">Progress documents</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">
                      <button
                        onClick={() => handleSort('created_at')}
                        className="flex items-center gap-2 hover:text-slate-900 transition-colors"
                      >
                        Date création
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 py-4 px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client) => (
                    <TableRow 
                      key={client.id}
                      className="hover:bg-blue-50 transition-colors border-b border-slate-200"
                    >
                      <TableCell className="font-medium py-4 px-6">
                        {client.nom_entreprise}
                        {client.forme_juridique && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            ({client.forme_juridique})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6">{client.siret || "—"}</TableCell>
                      <TableCell className="py-4 px-6">
                        {client.statut ? (
                          client.statut.toLowerCase() === "statuts générés" ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 px-3 py-1 text-xs font-semibold shadow-sm">
                              {client.statut}
                            </Badge>
                          ) : (
                            <Badge variant={statusBadgeVariant(client.statut)} className="px-3 py-1 text-xs font-semibold shadow-sm">
                              {client.statut}
                            </Badge>
                          )
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6">{client.email || "—"}</TableCell>
                      <TableCell className="py-4 px-6">
                        <Badge variant="outline" className="px-3 py-1 text-xs font-semibold shadow-sm">{client.progressText} fait</Badge>
                      </TableCell>
                      <TableCell className="py-4 px-6">{client.formattedCreatedAt}</TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                            className="h-9 w-9 p-0 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}
                            className="h-9 w-9 p-0 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setClientToDelete(client);
                              setDeleteDialogOpen(true);
                            }}
                            className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} sur {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Dialog de confirmation suppression */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le client ?</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer {clientToDelete?.nom_entreprise} ? Cette action
                est irréversible et supprimera également tous les actes associés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

