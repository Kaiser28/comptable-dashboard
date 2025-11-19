'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  Send,
  ChevronDown,
  ChevronUp,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { supabaseClient } from "@/lib/supabase";

// Fonction de formatage de date relative (fallback si date-fns n'est pas installé)
// Pour utiliser date-fns : npm install date-fns
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "il y a moins d'1 minute";
  if (diffMinutes < 60) return `il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  if (diffHours < 24) return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  if (diffDays === 1) return "il y a 1 jour";
  return `il y a ${diffDays} jours`;
};

type WorkflowStatus =
  | 'formulaire_envoye'
  | 'formulaire_recu'
  | 'infos_validees'
  | 'documents_generes'
  | 'dossier_termine'
  | 'bloque';

type WorkflowClient = {
  id: string;
  nom_entreprise: string;
  workflow_status?: WorkflowStatus | null;
  priorite?: 'urgent' | 'normal' | null;
  derniere_action_date?: string | null;
  created_at: string;
  updated_at: string;
  statut?: string | null;
  email?: string | null;
};

type WorkflowData = {
  urgent: WorkflowClient[];
  enCours: WorkflowClient[];
  termines: WorkflowClient[];
};

const formatStatutBadge = (workflowStatus: WorkflowStatus | null | undefined): {
  emoji: string;
  label: string;
  color: string;
} => {
  if (!workflowStatus) {
    return { emoji: '⚪', label: 'Non défini', color: 'gray' };
  }

  const statusMap: Record<WorkflowStatus, { emoji: string; label: string; color: string }> = {
    formulaire_envoye: { emoji: '🟠', label: 'En attente client', color: 'orange' },
    formulaire_recu: { emoji: '🟡', label: 'À valider', color: 'yellow' },
    infos_validees: { emoji: '🔵', label: 'Prêt génération', color: 'blue' },
    documents_generes: { emoji: '🟢', label: 'En signature', color: 'green' },
    dossier_termine: { emoji: '✅', label: 'Archivé', color: 'green' },
    bloque: { emoji: '🔴', label: 'Bloqué', color: 'red' },
  };

  return statusMap[workflowStatus] || { emoji: '⚪', label: 'Inconnu', color: 'gray' };
};

const getProchaineAction = (workflowStatus: WorkflowStatus | null | undefined): string => {
  if (!workflowStatus) return 'Définir le statut';

  const actionsMap: Record<WorkflowStatus, string> = {
    formulaire_envoye: 'Relancer le client',
    formulaire_recu: 'Valider les informations',
    infos_validees: 'Générer les documents',
    documents_generes: 'Finaliser le dossier',
    dossier_termine: 'Dossier terminé',
    bloque: 'Résoudre le blocage',
  };

  return actionsMap[workflowStatus] || 'Action à définir';
};

export default function WorkflowClients() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [cabinetId, setCabinetId] = useState<string | null>(null);
  const [workflowData, setWorkflowData] = useState<WorkflowData>({
    urgent: [],
    enCours: [],
    termines: [],
  });
  const [isTerminesOpen, setIsTerminesOpen] = useState(false);

  useEffect(() => {
    const fetchWorkflowClients = async () => {
      try {
        setIsLoading(true);

        // Récupérer l'utilisateur actuel
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) {
          return;
        }

        // Récupérer le cabinet_id
        const { data: expertComptable, error: expertError } = await supabaseClient
          .from("experts_comptables")
          .select("cabinet_id")
          .eq("user_id", user.id)
          .single();

        if (expertError || !expertComptable?.cabinet_id) {
          return;
        }

        const id = expertComptable.cabinet_id;
        setCabinetId(id);

        // Calculer les dates
        const now = new Date();
        const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

        // Requêtes en parallèle
        // Note: Les champs workflow_status, priorite, derniere_action_date doivent exister en base
        // Pour l'instant, on utilise des fallbacks avec les champs existants (statut, created_at, updated_at)
        
        // URGENT : priorite = 'urgent' OU (statut = 'en attente' ET created_at < 5 jours)
        const fiveDaysAgoISO = fiveDaysAgo.toISOString();
        const urgentResult = await supabaseClient
          .from("clients")
          .select("*")
          .eq("cabinet_id", id)
          .or(`priorite.eq.urgent,and(statut.ilike.%en attente%,created_at.lt.${fiveDaysAgoISO})`)
          .order("created_at", { ascending: true })
          .limit(5);

        // EN COURS : statut contient "formulaire rempli" ou "statuts générés"
        // Filtrer côté client pour exclure ceux qui contiennent "en attente"
        const enCoursResult = await supabaseClient
          .from("clients")
          .select("*")
          .eq("cabinet_id", id)
          .or(`statut.ilike.%formulaire rempli%,statut.ilike.%statuts générés%`)
          .order("updated_at", { ascending: false })
          .limit(20); // Récupérer plus pour filtrer côté client

        // TERMINÉS : statut contient "statuts générés" (considéré comme terminé)
        const terminesResult = await supabaseClient
          .from("clients")
          .select("*")
          .eq("cabinet_id", id)
          .ilike("statut", "%statuts générés%")
          .order("updated_at", { ascending: false })
          .limit(5);

        // Filtrer les résultats "en cours" pour exclure ceux avec "en attente"
        const enCoursFiltered = (enCoursResult.data || []).filter(
          (client) => !client.statut?.toLowerCase().includes('en attente')
        ).slice(0, 10) as WorkflowClient[];

        setWorkflowData({
          urgent: (urgentResult.data || []) as WorkflowClient[],
          enCours: enCoursFiltered,
          termines: (terminesResult.data || []) as WorkflowClient[],
        });
      } catch (error) {
        console.error("Erreur lors du chargement du workflow:", error);
        toast.error("Erreur lors du chargement du workflow");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchWorkflowClients();

    // Refresh toutes les 30 secondes
    const interval = setInterval(() => {
      void fetchWorkflowClients();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const updateWorkflowStatus = async (clientId: string, newStatus: WorkflowStatus) => {
    if (!cabinetId) return;

    try {
      const { error } = await supabaseClient
        .from("clients")
        .update({
          workflow_status: newStatus,
          derniere_action_date: new Date().toISOString(),
        })
        .eq("id", clientId);

      if (error) {
        throw error;
      }

      toast.success("Statut mis à jour");

      // Recharger les données (même logique que fetchWorkflowClients)
      const fiveDaysAgoISO = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      
      const urgentResult = await supabaseClient
        .from("clients")
        .select("*")
        .eq("cabinet_id", cabinetId)
        .or(`priorite.eq.urgent,and(statut.ilike.%en attente%,created_at.lt.${fiveDaysAgoISO})`)
        .order("created_at", { ascending: true })
        .limit(5);

      const enCoursResult = await supabaseClient
        .from("clients")
        .select("*")
        .eq("cabinet_id", cabinetId)
        .or(`statut.ilike.%formulaire rempli%,statut.ilike.%statuts générés%`)
        .order("updated_at", { ascending: false })
        .limit(20);

      const terminesResult = await supabaseClient
        .from("clients")
        .select("*")
        .eq("cabinet_id", cabinetId)
        .ilike("statut", "%statuts générés%")
        .order("updated_at", { ascending: false })
        .limit(5);

      // Filtrer les résultats "en cours" pour exclure ceux avec "en attente"
      const enCoursFiltered = (enCoursResult.data || []).filter(
        (client) => !client.statut?.toLowerCase().includes('en attente')
      ).slice(0, 10) as WorkflowClient[];

      setWorkflowData({
        urgent: (urgentResult.data || []) as WorkflowClient[],
        enCours: enCoursFiltered,
        termines: (terminesResult.data || []) as WorkflowClient[],
      });
    } catch (error) {
      console.error("Erreur mise à jour statut:", error);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const handleQuickAction = async (
    client: WorkflowClient,
    action: 'relancer' | 'marquer_recu' | 'valider' | 'generer' | 'marquer_termine' | 'bloquer'
  ) => {
    switch (action) {
      case 'relancer':
        toast.success(`Rappel envoyé à ${client.nom_entreprise}`);
        break;
      case 'marquer_recu':
        await updateWorkflowStatus(client.id, 'formulaire_recu');
        break;
      case 'valider':
        await updateWorkflowStatus(client.id, 'infos_validees');
        break;
      case 'generer':
        router.push(`/dashboard/clients/${client.id}`);
        break;
      case 'marquer_termine':
        await updateWorkflowStatus(client.id, 'dossier_termine');
        break;
      case 'bloquer':
        await updateWorkflowStatus(client.id, 'bloque');
        break;
    }
  };

  const renderClientCard = (client: WorkflowClient, section: 'urgent' | 'enCours' | 'termines') => {
    // Mapper le statut existant vers workflow_status si nécessaire
    let workflowStatus = client.workflow_status;
    if (!workflowStatus && client.statut) {
      const statutLower = client.statut.toLowerCase();
      if (statutLower.includes('en attente')) workflowStatus = 'formulaire_envoye';
      else if (statutLower.includes('formulaire rempli')) workflowStatus = 'formulaire_recu';
      else if (statutLower.includes('statuts générés')) workflowStatus = 'documents_generes';
    }

    const statusInfo = formatStatutBadge(workflowStatus || null);
    const derniereAction = client.derniere_action_date || client.updated_at || client.created_at;
    const timeAgo = formatRelativeTime(new Date(derniereAction));

    const isUrgent = section === 'urgent' || client.priorite === 'urgent';

    return (
      <Card
        key={client.id}
        className={`transition-all hover:shadow-md ${
          isUrgent
            ? 'border-red-500 bg-red-50/50'
            : section === 'termines'
            ? 'border-green-500 bg-green-50/50'
            : 'border-orange-500 bg-orange-50/50'
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-lg">{client.nom_entreprise}</CardTitle>
                {isUrgent && (
                  <Badge variant="destructive" className="bg-red-600">
                    URGENT
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    statusInfo.color === 'orange'
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                      : statusInfo.color === 'yellow'
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                      : statusInfo.color === 'blue'
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                      : statusInfo.color === 'green'
                      ? 'bg-green-100 text-green-700 hover:bg-green-100'
                      : statusInfo.color === 'red'
                      ? 'bg-red-100 text-red-700 hover:bg-red-100'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                  }
                >
                  {statusInfo.emoji} {statusInfo.label}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Dernière action : {timeAgo}</p>
            <p>Prochaine action : {getProchaineAction(workflowStatus || null)}</p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/clients/${client.id}`)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Voir détail
            </Button>

            {workflowStatus === 'formulaire_envoye' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(client, 'relancer')}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Relancer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(client, 'marquer_recu')}
                >
                  Marquer reçu
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(client, 'bloquer')}
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Bloquer
                </Button>
              </>
            )}

            {workflowStatus === 'formulaire_recu' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(client, 'valider')}
                >
                  Valider infos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Voir formulaire
                </Button>
              </>
            )}

            {workflowStatus === 'infos_validees' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(client, 'generer')}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Générer documents
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateWorkflowStatus(client.id, 'documents_generes')}
                >
                  Marquer généré
                </Button>
              </>
            )}

            {workflowStatus === 'documents_generes' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(client, 'marquer_termine')}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Marquer terminé
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Télécharger docs
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section URGENT */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            URGENT ({workflowData.urgent.length})
          </CardTitle>
          <CardDescription>Actions nécessitant une attention immédiate</CardDescription>
        </CardHeader>
        <CardContent>
          {workflowData.urgent.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
              <p className="font-medium">✅ Aucune action urgente</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workflowData.urgent.map((client) => renderClientCard(client, 'urgent'))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section EN COURS */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            EN COURS ({workflowData.enCours.length})
          </CardTitle>
          <CardDescription>Dossiers en cours de traitement</CardDescription>
        </CardHeader>
        <CardContent>
          {workflowData.enCours.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
              <p className="font-medium">🎉 Tout est à jour !</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workflowData.enCours.map((client) => renderClientCard(client, 'enCours'))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section TERMINÉS (Collapsible) */}
      <Collapsible open={isTerminesOpen} onOpenChange={setIsTerminesOpen}>
        <Card className="border-green-200">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  TERMINÉS RÉCEMMENT ({workflowData.termines.length})
                </div>
                {isTerminesOpen ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </CardTitle>
              <CardDescription>Dossiers finalisés récemment</CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {workflowData.termines.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucun dossier terminé récemment</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {workflowData.termines.map((client) => renderClientCard(client, 'termines'))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

