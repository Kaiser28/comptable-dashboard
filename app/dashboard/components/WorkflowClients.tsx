'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  Download,
  MessageSquare,
  Eye,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Plus,
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
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabaseClient } from "@/lib/supabase";
import Link from "next/link";

type ActeStatut = 'brouillon' | 'validé' | 'signé';
type ActeType =
  | 'statuts'
  | 'pv_constitution'
  | 'ag_ordinaire'
  | 'cession_actions'
  | 'augmentation_capital'
  | 'reduction_capital'
  | 'lettre_mission'
  | 'courrier_article_163'
  | string;

type ActeJuridiqueWithClient = {
  id: string;
  client_id: string;
  cabinet_id: string;
  type: ActeType;
  statut: ActeStatut;
  priorite?: 'urgent' | 'normal' | null;
  date_acte?: string | null;
  date_derniere_action?: string | null;
  notes_internes?: string | null;
  document_genere_url?: string | null;
  actions_requises?: string | null;
  created_at: string;
  updated_at: string;
  // Données client jointes
  client?: {
    id: string;
    nom_entreprise: string;
    forme_juridique?: string | null;
  } | null;
};

type ClientWithActes = {
  id: string;
  nom_entreprise: string;
  denomination?: string;
  forme_juridique?: string | null;
  actes: ActeJuridiqueWithClient[];
  nbTotal: number;
  nbSignes: number;
  nbValides: number;
  nbBrouillons: number;
  nbUrgents: number;
  pourcentageCompletion: number;
};

// Fonction de formatage de date relative (fallback si date-fns n'est pas installé)
// Pour utiliser date-fns : npm install date-fns
const formatRelativeTime = (date: Date): string => {
  try {
    // Essayer d'utiliser date-fns si disponible
    const { formatDistanceToNow } = require("date-fns");
    const { fr } = require("date-fns/locale/fr");
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  } catch {
    // Fallback si date-fns n'est pas installé
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays === 1) return "il y a 1 jour";
    return `il y a ${diffDays} jours`;
  }
};

const getActeLabel = (type: ActeType): string => {
  const labels: Record<string, string> = {
    statuts: '📄 Statuts',
    ag_ordinaire: '📋 AG Ordinaire',
    pv_constitution: '📋 PV Constitution',
    cession_actions: '🔄 Cession d\'actions',
    augmentation_capital: '📈 Augmentation capital',
    reduction_capital: '📉 Réduction capital',
    lettre_mission: '📧 Lettre mission',
    courrier_article_163: '📧 Lettre reprise',
  };

  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
};

const getStatutEmoji = (statut: ActeStatut): string => {
  const emojis: Record<ActeStatut, string> = {
    brouillon: '📝',
    validé: '✅',
    signé: '✍️',
  };
  return emojis[statut] || '⚪';
};

const getStatutLabel = (statut: ActeStatut): string => {
  const labels: Record<ActeStatut, string> = {
    brouillon: 'Brouillon',
    validé: 'Validé',
    signé: 'Signé',
  };
  return labels[statut] || statut;
};

export default function WorkflowClients() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [cabinetId, setCabinetId] = useState<string | null>(null);
  const [documentsUrgents, setDocumentsUrgents] = useState<ActeJuridiqueWithClient[]>([]);
  const [clientsAvecActes, setClientsAvecActes] = useState<ClientWithActes[]>([]);
  const [isAllClientsExpanded, setIsAllClientsExpanded] = useState(false);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedActeForNotes, setSelectedActeForNotes] = useState<ActeJuridiqueWithClient | null>(null);
  const [notesText, setNotesText] = useState('');

  const refreshData = async () => {
    if (!cabinetId) return;
    await Promise.all([
      fetchDocumentsUrgents(cabinetId),
      fetchClientsAvecActes(cabinetId),
    ]);
  };

  useEffect(() => {
    void fetchData();
    
    // Refresh toutes les 30 secondes
    const interval = setInterval(() => {
      void fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Pré-remplir les notes dans le Dialog quand l'acte sélectionné change
  useEffect(() => {
    if (selectedActeForNotes?.notes_internes) {
      setNotesText(selectedActeForNotes.notes_internes);
    } else {
      setNotesText('');
    }
  }, [selectedActeForNotes]);

  const fetchData = async () => {
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

      // Récupérer les documents urgents et les clients avec actes en parallèle
      await Promise.all([
        fetchDocumentsUrgents(id),
        fetchClientsAvecActes(id),
      ]);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocumentsUrgents = async (cabinetId: string) => {
    try {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const fiveDaysAgoISO = fiveDaysAgo.toISOString();

      // Requête avec JOIN sur clients
      // Note: Si priorite ou date_derniere_action n'existent pas, utiliser des fallbacks
      const { data, error } = await supabaseClient
        .from("actes_juridiques")
        .select(`
          *,
          client:clients!actes_juridiques_client_id_fkey (
            id,
            nom_entreprise,
            forme_juridique
          )
        `)
        .eq("cabinet_id", cabinetId)
        .or(`priorite.eq.urgent,and(statut.eq.brouillon,updated_at.lt.${fiveDaysAgoISO})`)
        .order("updated_at", { ascending: true })
        .limit(10);

      if (error) {
        console.error("Erreur récupération documents urgents:", error);
        return;
      }

      setDocumentsUrgents((data || []) as ActeJuridiqueWithClient[]);
    } catch (error) {
      console.error("Erreur fetchDocumentsUrgents:", error);
    }
  };

  const fetchClientsAvecActes = async (cabinetId: string) => {
    try {
      // Récupérer tous les actes avec leurs clients
      const { data: actes, error: actesError } = await supabaseClient
        .from("actes_juridiques")
        .select(`
          *,
          client:clients!actes_juridiques_client_id_fkey (
            id,
            nom_entreprise,
            forme_juridique
          )
        `)
        .eq("cabinet_id", cabinetId)
        .order("updated_at", { ascending: false });

      if (actesError) {
        console.error("Erreur récupération actes:", actesError);
        return;
      }

      // Grouper par client
      const clientsMap = new Map<string, ClientWithActes>();

      (actes || []).forEach((acte: any) => {
        const clientId = acte.client_id;
        const client = acte.client;

        if (!client) return;

        if (!clientsMap.has(clientId)) {
          clientsMap.set(clientId, {
            id: clientId,
            nom_entreprise: client.nom_entreprise || 'Client inconnu',
            denomination: client.nom_entreprise || 'Client inconnu',
            forme_juridique: client.forme_juridique,
            actes: [],
            nbTotal: 0,
            nbSignes: 0,
            nbValides: 0,
            nbBrouillons: 0,
            nbUrgents: 0,
            pourcentageCompletion: 0,
          });
        }

        const clientData = clientsMap.get(clientId)!;
        clientData.actes.push(acte as ActeJuridiqueWithClient);
        clientData.nbTotal++;
        
        // Compter par statut
        if (acte.statut === 'signé') {
          clientData.nbSignes++;
        } else if (acte.statut === 'validé') {
          clientData.nbValides++;
        } else if (acte.statut === 'brouillon') {
          clientData.nbBrouillons++;
        }
        
        // Compter les urgents
        if (acte.priorite === 'urgent') {
          clientData.nbUrgents++;
        }
      });

      // Calculer le pourcentage de complétion pour chaque client
      const clientsArray = Array.from(clientsMap.values()).map((client) => ({
        ...client,
        pourcentageCompletion: client.nbTotal > 0
          ? Math.round((client.nbSignes / client.nbTotal) * 100)
          : 0,
      }));

      // Trier par pourcentage de complétion ASC (moins avancés en premier)
      clientsArray.sort((a, b) => a.pourcentageCompletion - b.pourcentageCompletion);

      // Limiter à 5 clients max pour la vue synthèse
      setClientsAvecActes(clientsArray.slice(0, 5));
    } catch (error) {
      console.error("Erreur fetchClientsAvecActes:", error);
    }
  };

  const handleValider = async (acteId: string) => {
    if (!cabinetId) return;

    try {
      const { error } = await supabaseClient
        .from('actes_juridiques')
        .update({ 
          statut: 'validé',
          date_derniere_action: new Date().toISOString(),
          actions_requises: 'Faire signer par le client'
        })
        .eq('id', acteId);
      
      if (error) throw error;
      
      toast.success('Document validé');
      await refreshData();
    } catch (error) {
      toast.error('Erreur lors de la validation');
      console.error(error);
    }
  };

  const handleMarquerSigne = async (acteId: string) => {
    if (!cabinetId) return;

    try {
      const { error } = await supabaseClient
        .from('actes_juridiques')
        .update({ 
          statut: 'signé',
          date_derniere_action: new Date().toISOString(),
          actions_requises: 'Document finalisé'
        })
        .eq('id', acteId);
      
      if (error) throw error;
      
      toast.success('Document marqué comme signé');
      await refreshData();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  };

  const handleRenvoiBrouillon = async (acteId: string) => {
    if (!cabinetId) return;

    try {
      const { error } = await supabaseClient
        .from('actes_juridiques')
        .update({ 
          statut: 'brouillon',
          date_derniere_action: new Date().toISOString(),
          actions_requises: 'Valider le document'
        })
        .eq('id', acteId);
      
      if (error) throw error;
      
      toast.success('Document renvoyé en brouillon');
      await refreshData();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  };

  const handleNotes = (acte: ActeJuridiqueWithClient) => {
    setSelectedActeForNotes(acte);
    setNotesText(acte.notes_internes || '');
    setNotesDialogOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!cabinetId || !selectedActeForNotes) return;

    try {
      const { error } = await supabaseClient
        .from('actes_juridiques')
        .update({ notes_internes: notesText })
        .eq('id', selectedActeForNotes.id);
      
      if (error) throw error;
      
      toast.success('Notes enregistrées');
      setNotesDialogOpen(false);
      setSelectedActeForNotes(null);
      setNotesText('');
      await refreshData();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
      console.error(error);
    }
  };

  const handleDownloadDocument = async (acte: ActeJuridiqueWithClient) => {
    if (!acte.document_genere_url) {
      toast.error("Document non disponible");
      return;
    }

    // Télécharger le document
    window.open(acte.document_genere_url, '_blank');
  };

  const renderDocumentCard = (acte: ActeJuridiqueWithClient, isUrgent: boolean = false) => {
    const statutEmoji = getStatutEmoji(acte.statut);
    const statutLabel = getStatutLabel(acte.statut);
    const acteLabel = getActeLabel(acte.type);
    const clientName = acte.client?.nom_entreprise || 'Client inconnu';
    const formeJuridique = acte.client?.forme_juridique || '';
    const derniereAction = acte.date_derniere_action || acte.updated_at || acte.created_at;
    const timeAgo = formatRelativeTime(new Date(derniereAction));

    const getProchaineAction = (statut: ActeStatut): string => {
      const actions: Record<ActeStatut, string> = {
        brouillon: 'Valider le document',
        validé: 'Faire signer le document',
        signé: 'Document terminé',
      };
      return actions[statut] || 'Action à définir';
    };

    return (
      <Card
        key={acte.id}
        className={`w-full max-w-full overflow-hidden shadow-md hover:shadow-lg border transition-all duration-200 p-3 sm:p-4 ${
          isUrgent
            ? 'border-red-200 bg-gradient-to-r from-red-50 to-orange-50 hover:border-red-400'
            : acte.statut === 'brouillon'
            ? 'border-orange-200 hover:border-orange-400'
            : acte.statut === 'validé'
            ? 'border-blue-200 hover:border-blue-400'
            : 'border-green-200 bg-green-50/50 hover:border-green-400'
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <CardTitle className="text-base sm:text-lg break-words">
                  {acteLabel} - {clientName} {formeJuridique ? `(${formeJuridique})` : ''}
                </CardTitle>
                {isUrgent && (
                  <Badge variant="destructive" className="bg-red-600 flex-shrink-0">
                    URGENT
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={`px-3 py-1 text-xs font-semibold shadow-sm ${
                    acte.statut === 'brouillon'
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                      : acte.statut === 'validé'
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                      : 'bg-green-100 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {statutEmoji} {statutLabel}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{statutLabel === 'Brouillon' ? `${statutLabel} depuis ${timeAgo}` : `Dernière action : ${timeAgo}`}</p>
            <p>Prochaine action : {getProchaineAction(acte.statut)}</p>
          </div>

                {acte.notes_internes && (
                  <div className="mt-2 p-2 bg-blue-50 border-l-2 border-blue-400 rounded max-w-full overflow-auto">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-blue-900 text-xs">Notes internes :</p>
                        <p className="text-blue-800 whitespace-pre-wrap break-words text-xs sm:text-sm">{acte.notes_internes}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-2 flex-wrap">
            {acte.statut === 'brouillon' && (
              <>
                <Button 
                  size="sm" 
                  onClick={() => handleValider(acte.id)}
                  className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto"
                >
                  Valider
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleNotes(acte)}
                  className="w-full sm:w-auto"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Notes
                </Button>
                
                {acte.document_genere_url && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open(acte.document_genere_url || '', '_blank')}
                    className="w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Télécharger
                  </Button>
                )}
              </>
            )}

            {acte.statut === 'validé' && (
              <>
                <Button 
                  size="sm"
                  onClick={() => handleMarquerSigne(acte.id)}
                  className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Marquer signé
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleRenvoiBrouillon(acte.id)}
                  className="w-full sm:w-auto"
                >
                  Renvoyer en brouillon
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleNotes(acte)}
                  className="w-full sm:w-auto"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Notes
                </Button>
              </>
            )}

            {acte.statut === 'signé' && (
              <>
                <Badge className="bg-green-500 text-white hover:bg-green-500 w-full sm:w-auto text-center">
                  ✅ Document signé
                </Badge>
                
                {acte.document_genere_url && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open(acte.document_genere_url || '', '_blank')}
                    className="w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Télécharger
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const toggleClient = (clientId: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  const renderClientCard = (client: ClientWithActes) => {
    const isExpanded = expandedClients.has(client.id);
    const denomination = client.denomination || client.nom_entreprise;

    return (
      <div 
        key={client.id} 
        className="bg-white rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200"
      >
        {/* Header - toujours visible */}
        <div 
          className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => toggleClient(client.id)}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Gauche : Nom + badges */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                {denomination}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs sm:text-sm text-slate-600">
                  {client.nbSignes}/{client.nbTotal} fait
                </span>
                {client.nbUrgents > 0 && (
                  <Badge variant="destructive" className="text-xs bg-red-600">
                    ⚠️ {client.nbUrgents} urgent{client.nbUrgents > 1 ? 's' : ''}
                  </Badge>
                )}
                {client.nbTotal === client.nbSignes && client.nbTotal > 0 && (
                  <Badge className="text-xs bg-green-500 text-white">
                    🎉 Terminé
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Droite : Progress + bouton expand */}
            <div className="flex items-center gap-4 ml-4 flex-shrink-0">
              {/* Progress bar */}
              <div className="hidden sm:block w-32">
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-500"
                    style={{ width: `${client.pourcentageCompletion}%` }}
                  />
                </div>
                <span className="text-xs text-slate-600 mt-1 block text-center">
                  {client.pourcentageCompletion}%
                </span>
              </div>
              
              {/* Bouton expand */}
              <Button 
                variant="ghost" 
                size="sm"
                className="flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleClient(client.id);
                }}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    <span className="ml-1 hidden sm:inline">Réduire</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    <span className="ml-1 hidden sm:inline">Voir détails</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Résumé une ligne - Visible quand collapsed */}
          {!isExpanded && (
            <div className="mt-2 text-xs sm:text-sm text-slate-600">
              {client.nbSignes > 0 && `✅ ${client.nbSignes} signé${client.nbSignes > 1 ? 's' : ''}`}
              {client.nbValides > 0 && ` • ⏳ ${client.nbValides} validé${client.nbValides > 1 ? 's' : ''}`}
              {client.nbBrouillons > 0 && ` • 📝 ${client.nbBrouillons} brouillon${client.nbBrouillons > 1 ? 's' : ''}`}
            </div>
          )}
        </div>
        
        {/* Contenu expanded - Visible uniquement si expanded */}
        {isExpanded && (
          <div className="border-t border-slate-200 p-4 space-y-3 animate-slide-down">
            {client.actes.map((acte) => {
              const statutEmoji = getStatutEmoji(acte.statut);
              const statutLabel = getStatutLabel(acte.statut);
              const acteLabel = getActeLabel(acte.type);
              const derniereAction = acte.date_derniere_action || acte.updated_at || acte.created_at;
              const timeAgo = formatRelativeTime(new Date(derniereAction));

              return (
                <div
                  key={acte.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex-shrink-0">{statutEmoji}</span>
                      <span className="text-xs sm:text-sm font-medium text-slate-700 break-words">{acteLabel}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">- {statutLabel}</span>
                      {acte.statut === 'brouillon' && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">({timeAgo})</span>
                      )}
                    </div>

                    {acte.notes_internes && (
                      <div className="mt-2 p-2 bg-blue-50 border-l-2 border-blue-400 rounded max-w-full overflow-auto">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-blue-900 text-xs">Notes internes :</p>
                            <p className="text-blue-800 whitespace-pre-wrap break-words text-xs sm:text-sm">{acte.notes_internes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap flex-shrink-0">
                    {acte.statut === 'brouillon' && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => handleValider(acte.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto"
                        >
                          Valider
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleNotes(acte)}
                          className="w-full sm:w-auto"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Notes
                        </Button>
                        {acte.document_genere_url && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(acte.document_genere_url || '', '_blank')}
                            className="w-full sm:w-auto"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Télécharger
                          </Button>
                        )}
                      </>
                    )}

                    {acte.statut === 'validé' && (
                      <>
                        <Button 
                          size="sm"
                          onClick={() => handleMarquerSigne(acte.id)}
                          className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Marquer signé
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRenvoiBrouillon(acte.id)}
                          className="w-full sm:w-auto"
                        >
                          Renvoyer en brouillon
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleNotes(acte)}
                          className="w-full sm:w-auto"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Notes
                        </Button>
                      </>
                    )}

                    {acte.statut === 'signé' && (
                      <>
                        <Badge className="bg-green-500 text-white hover:bg-green-500 w-full sm:w-auto text-center">
                          ✅ Document signé
                        </Badge>
                        {acte.document_genere_url && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(acte.document_genere_url || '', '_blank')}
                            className="w-full sm:w-auto"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Télécharger
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Bouton voir détails client */}
            <div className="pt-2">
              <Link href={`/dashboard/clients/${client.id}`}>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  Voir détails client
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
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

  const topClients = clientsAvecActes.slice(0, 5);
  const allClients = isAllClientsExpanded ? clientsAvecActes : topClients;

  return (
    <div className="space-y-6">
      {/* Section DOCUMENTS URGENTS */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            DOCUMENTS URGENTS ({documentsUrgents.length})
          </CardTitle>
          <CardDescription>Documents nécessitant une attention immédiate</CardDescription>
        </CardHeader>
        <CardContent>
          {documentsUrgents.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Aucun document urgent
              </h3>
              <p className="text-slate-600">
                Tous vos documents sont à jour ! 🎉
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {documentsUrgents.map((acte) => renderDocumentCard(acte, true))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section VUE PAR CLIENT */}
      <Card className="bg-slate-50 rounded-lg p-3 sm:p-6 border border-slate-200 shadow-lg overflow-hidden">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                VUE PAR CLIENT ({clientsAvecActes.length})
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Suivi des actes par client avec progression</CardDescription>
            </div>
            {clientsAvecActes.length > 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAllClientsExpanded(!isAllClientsExpanded)}
                className="w-full sm:w-auto transition-all duration-300"
              >
                {isAllClientsExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Réduire
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Voir tous les clients
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="overflow-hidden">
          {clientsAvecActes.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-6">
                <FileText className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Aucun client pour le moment
              </h3>
              <p className="text-slate-600 mb-6">
                Créez votre premier client pour commencer
              </p>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium">
                <Plus className="mr-2 h-5 w-5" />
                Ajouter un client
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">
                {allClients.map((client) => renderClientCard(client))}
              </div>
              {clientsAvecActes.length > 5 && !isAllClientsExpanded && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAllClientsExpanded(true)}
                    className="w-full sm:w-auto"
                  >
                    Voir plus de clients ({clientsAvecActes.length - 5} restants)
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Bouton "Voir tous les clients" */}
      <div className="mt-4 text-center">
        <Link href="/dashboard/clients">
          <Button 
            variant="outline" 
            size="lg"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            Voir tous les clients
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Dialog Notes */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notes internes</DialogTitle>
            <DialogDescription>
              {selectedActeForNotes && (
                <>
                  {getActeLabel(selectedActeForNotes.type)} - {selectedActeForNotes.client?.nom_entreprise || 'Client inconnu'}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="Ajoutez vos notes internes..."
            rows={6}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setNotesDialogOpen(false);
                setSelectedActeForNotes(null);
                setNotesText('');
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleSaveNotes}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
