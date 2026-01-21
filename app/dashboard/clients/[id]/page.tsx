'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Copy, Check, FileText, Users, Trash2, Upload, File, Mail } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AssociesList from "@/components/associes/AssociesList";
import { supabaseClient } from "@/lib/supabase";
import type { Client } from "@/types/database";
import { validateStatutsData, ValidationResult } from "@/lib/validateStatuts";
import { toast } from "sonner";

type ClientState = {
  data: Client | null;
  isLoading: boolean;
  error: string | null;
};

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [clientState, setClientState] = useState<ClientState>({
    data: null,
    isLoading: true,
    error: null,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationResult | null>(null);
  const [isGeneratingPV, setIsGeneratingPV] = useState(false);
  const [isGeneratingDNC, setIsGeneratingDNC] = useState(false);
  const [isGeneratingAnnonceLegale, setIsGeneratingAnnonceLegale] = useState(false);
  const [isGeneratingAttestationDepotFonds, setIsGeneratingAttestationDepotFonds] = useState(false);
  const [isGeneratingCourrierReprise, setIsGeneratingCourrierReprise] = useState(false);
  const [isGeneratingLettreMission, setIsGeneratingLettreMission] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // États pour les pièces jointes
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [piecesJointes, setPiecesJointes] = useState<Array<{
    id: string;
    nom_fichier: string;
    taille_fichier: number;
    url_fichier: string;
  }>>([]);
  const [isLoadingPiecesJointes, setIsLoadingPiecesJointes] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const clientId = params?.id;

    if (!clientId || typeof clientId !== "string") {
      setClientState({
        data: null,
        isLoading: false,
        error: "Identifiant du client invalide.",
      });
      return;
    }

    const fetchClient = async () => {
      try {
        const { data, error } = await supabaseClient
          .from("clients")
          .select("*")
          .eq("id", clientId)
          .single();

        if (error) {
          throw error;
        }

        if (isMounted) {
          setClientState({ data: data ?? null, isLoading: false, error: null });
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du client", error);
        if (isMounted) {
          setClientState({ data: null, isLoading: false, error: "Client introuvable." });
        }
      }
    };

    void fetchClient();

    return () => {
      isMounted = false;
    };
  }, [params]);

  // Reset l'état isSending quand on change de client
  // TEMPORAIREMENT DÉSACTIVÉ - Cause erreur "Cannot access 'client' before initialization"
  // useEffect(() => {
  //   setIsSending(false);
  // }, [clientState.data?.id]);

  // Charger les pièces jointes
  useEffect(() => {
    const clientId = params?.id;
    if (!clientId || typeof clientId !== "string") return;

    const fetchPiecesJointes = async () => {
      try {
        setIsLoadingPiecesJointes(true);
        console.log('🔍 Fetching pieces_jointes for client:', clientId);
        
        const { data, error } = await supabaseClient
          .from("pieces_jointes")
          .select("id, nom_fichier, taille_fichier, url_fichier")
          .eq("client_id", clientId)
          .order("id", { ascending: false });

        if (error) {
          console.error("❌ Erreur Supabase pieces_jointes:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }

        console.log('✅ pieces_jointes récupérées:', data?.length || 0, 'fichiers');
        setPiecesJointes(data || []);
      } catch (error) {
        console.error("❌ Erreur lors de la récupération des pièces jointes", error);
        // Ne pas bloquer l'interface en cas d'erreur, juste logger
        setPiecesJointes([]);
      } finally {
        setIsLoadingPiecesJointes(false);
      }
    };

    void fetchPiecesJointes();
  }, [params]);

  const formattedDates = useMemo(() => {
    if (!clientState.data) {
      return { createdAt: "", updatedAt: "" };
    }

    console.log('[DEBUG DATES]', {
      created_at: clientState.data.created_at,
      updated_at: clientState.data.updated_at,
      created_at_type: typeof clientState.data.created_at,
      updated_at_type: typeof clientState.data.updated_at
    });

    return {
      createdAt: clientState.data.created_at 
        ? new Date(clientState.data.created_at).toLocaleDateString("fr-FR")
        : "Non renseigné",
      updatedAt: clientState.data.updated_at
        ? new Date(clientState.data.updated_at).toLocaleDateString("fr-FR")
        : "Non renseigné",
    };
  }, [clientState.data]);

  if (clientState.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="text-sm text-muted-foreground">Chargement des informations client…</span>
      </div>
    );
  }

  if (clientState.error || !clientState.data) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Client introuvable</CardTitle>
            <CardDescription>
              {clientState.error ?? "Aucun client ne correspond à cette référence."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>Retour</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const client = clientState.data;

  async function handleGenerateStatuts(ignoreWarnings = false) {
    try {
      setIsGenerating(true);
      setGenerateError(null);
      setValidationErrors(null);

      // Validation des données (sauf si on ignore les warnings)
      if (!ignoreWarnings) {
        const validationResult = validateStatutsData({
          capital_social: client.capital_social ?? 0,
          nb_actions: (client as any).nb_actions ?? 0,
          montant_libere: (client as any).montant_libere ?? 0,
          duree_societe: (client as any).duree_societe ?? 0,
          objet_social: (client as any).objet_social || ''
        });

        // Si erreurs bloquantes, afficher la modal et arrêter
        if (!validationResult.isValid) {
          setValidationErrors(validationResult);
          setIsGenerating(false);
          return;
        }

        // Si seulement des warnings, afficher la modal mais permettre de continuer
        if (validationResult.warnings.length > 0) {
          setValidationErrors(validationResult);
          setIsGenerating(false);
          return;
        }
      }

      const response = await fetch("/api/generate-statuts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: params.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la génération");
      }

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Statuts-${client?.nom_entreprise || "document"}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setGenerateError(error?.message ?? "Une erreur est survenue");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGeneratePV() {
    if (!client) return;

    try {
      setIsGeneratingPV(true);

      const response = await fetch("/api/generate-pv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id })
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la génération du PV");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PV-Constitution-${client.nom_entreprise}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la génération du PV");
    } finally {
      setIsGeneratingPV(false);
    }
  }

  async function handleGenerateDNC() {
    if (!client) return;

    try {
      setIsGeneratingDNC(true);

      const response = await fetch("/api/generate-dnc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id })
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la génération de la DNC");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Declaration_Non_Condamnation_${client.nom_entreprise}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la génération de la Déclaration de Non-Condamnation");
    } finally {
      setIsGeneratingDNC(false);
    }
  }

  async function handleGenerateAnnonceLegale() {
    if (!client) return;

    try {
      setIsGeneratingAnnonceLegale(true);

      const response = await fetch("/api/generate-annonce-legale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id })
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la génération de l'Annonce Légale");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Annonce_Legale_${client.nom_entreprise}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la génération de l'Annonce Légale");
    } finally {
      setIsGeneratingAnnonceLegale(false);
    }
  }

  async function handleGenerateAttestationDepotFonds() {
    if (!client) return;

    try {
      setIsGeneratingAttestationDepotFonds(true);

      const response = await fetch("/api/generate-attestation-depot-fonds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id })
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la génération de l'Attestation de Dépôt des Fonds");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Attestation_Depot_Fonds_${client.nom_entreprise}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la génération de l'Attestation de Dépôt des Fonds");
    } finally {
      setIsGeneratingAttestationDepotFonds(false);
    }
  }

  async function handleGenerateCourrierReprise() {
    if (!client) return;

    try {
      setIsGeneratingCourrierReprise(true);

      const response = await fetch("/api/generate-courrier-reprise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: client.id })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Erreur lors de la génération du courrier de reprise" }));
        throw new Error(error.error || "Erreur lors de la génération du courrier de reprise");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Courrier_Reprise_${client.nom_entreprise}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Message de succès
      alert("✅ Courrier de reprise généré avec succès !");

    } catch (error: any) {
      console.error("Erreur:", error);
      const errorMessage = error?.message || "Erreur lors de la génération du courrier de reprise";
      alert(`❌ ${errorMessage}`);
    } finally {
      setIsGeneratingCourrierReprise(false);
    }
  }

  async function handleGenerateLettreMission() {
    if (!client) return;

    try {
      setIsGeneratingLettreMission(true);

      const response = await fetch("/api/generate-lettre-mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: client.id })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Erreur lors de la génération de la lettre de mission" }));
        throw new Error(error.error || "Erreur lors de la génération de la lettre de mission");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Lettre_Mission_${client.nom_entreprise}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Message de succès
      alert("✅ Lettre de mission générée avec succès !");

    } catch (error: any) {
      console.error("Erreur:", error);
      const errorMessage = error?.message || "Erreur lors de la génération de la lettre de mission";
      alert(`❌ ${errorMessage}`);
    } finally {
      setIsGeneratingLettreMission(false);
    }
  }

  async function handleCopyLink() {
    if (!client?.formulaire_token) return;

    const formUrl = `${window.location.origin}/formulaire/${client.formulaire_token}`;
    
    try {
      await navigator.clipboard.writeText(formUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
      // Fallback pour les navigateurs qui ne supportent pas clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = formUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  /**
   * Envoie le lien du formulaire par email au client
   * Appelle l'API /api/send-form-link avec le clientId
   */
  async function handleSendFormLink() {
    // Vérifier que le client existe et a un email
    if (!client?.id) {
      toast.error("Client introuvable");
      return;
    }

    if (!client?.email) {
      toast.error("Email client manquant. Veuillez renseigner l'email du client.");
      return;
    }

    try {
      setIsSending(true);

      // Appel API pour envoyer l'email
      const response = await fetch("/api/send-form-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: client.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Erreur de l'API
        const errorMessage = data.error || "Erreur lors de l'envoi de l'email";
        toast.error(`Erreur : ${errorMessage}`);
        console.error("Erreur API send-form-link:", data);
        return;
      }

      // Succès
      if (data.success) {
        toast.success("Email envoyé avec succès !");
      } else {
        toast.error("Erreur : L'envoi a échoué");
      }
    } catch (error) {
      // Erreur réseau ou autre
      console.error("Erreur lors de l'envoi de l'email:", error);
      toast.error(
        error instanceof Error
          ? `Erreur : ${error.message}`
          : "Erreur lors de l'envoi de l'email"
      );
    } finally {
      setIsSending(false);
    }
  }

  // Fonction pour formater la taille du fichier
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  // Fonction pour gérer l'upload
  async function handleUpload() {
    const clientId = params?.id;
    if (!clientId || typeof clientId !== "string" || !selectedFile) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`/api/clients/${clientId}/pieces-jointes`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur inconnue" }));
        let errorMessage = "Erreur lors de l'upload";

        if (response.status === 400) {
          errorMessage = errorData.error || "Type de fichier invalide";
        } else if (response.status === 413) {
          errorMessage = "Le fichier est trop volumineux (maximum 10 Mo)";
        } else if (response.status === 429) {
          errorMessage = "Trop de requêtes. Veuillez patienter quelques instants";
        } else {
          errorMessage = errorData.error || "Erreur lors de l'upload du fichier";
        }

        toast.error(errorMessage);
        return;
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success("Fichier uploadé avec succès");
        setSelectedFile(null);
        
        // Réinitialiser l'input file
        const fileInput = document.getElementById("file-input") as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }

        // Recharger la liste des pièces jointes
        const { data, error } = await supabaseClient
          .from("pieces_jointes")
          .select("id, nom_fichier, taille_fichier, url_fichier")
          .eq("client_id", clientId)
          .order("id", { ascending: false });

        if (error) {
          console.error("❌ Erreur rechargement pieces_jointes après upload:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
        } else if (data) {
          setPiecesJointes(data);
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      toast.error("Une erreur est survenue lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  }

  // Fonction pour supprimer une pièce jointe
  async function handleDeletePieceJointe(pieceId: string, urlFichier: string) {
    const clientId = params?.id;
    if (!clientId || typeof clientId !== "string") return;

    try {
      // Extraire le chemin du fichier depuis l'URL publique Supabase Storage
      // Format URL: https://[project].supabase.co/storage/v1/object/public/pieces-jointes/clients/[clientId]/[filename]
      const urlParts = urlFichier.split("/pieces-jointes/");
      const storagePath = urlParts.length > 1 ? urlParts[1] : null;

      if (!storagePath) {
        throw new Error("Impossible d'extraire le chemin du fichier depuis l'URL");
      }

      // Supprimer le fichier du storage
      const { error: storageError } = await supabaseClient.storage
        .from("pieces-jointes")
        .remove([storagePath]);

      if (storageError) {
        console.error("Erreur suppression storage:", storageError);
        // Continuer quand même pour supprimer l'enregistrement DB
      }

      // Supprimer l'enregistrement de la base de données
      const { error: deleteError } = await supabaseClient
        .from("pieces_jointes")
        .delete()
        .eq("id", pieceId);

      if (deleteError) {
        throw deleteError;
      }

      toast.success("Pièce jointe supprimée avec succès");

      // Recharger la liste
      const { data, error } = await supabaseClient
        .from("pieces_jointes")
        .select("id, nom_fichier, taille_fichier, url_fichier")
        .eq("client_id", clientId)
        .order("id", { ascending: false });

      if (error) {
        console.error("❌ Erreur rechargement pieces_jointes après suppression:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
      } else if (data) {
        setPiecesJointes(data);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de la pièce jointe");
    }
  }

  console.log('🔍 DEBUG isSending:', isSending, '| email:', client?.email);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <nav className="text-sm text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-1">
              <li>
                <Link href="/dashboard" className="hover:text-primary">
                  Dashboard
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/dashboard" className="hover:text-primary">
                  Clients
                </Link>
              </li>
              <li>/</li>
              <li className="font-medium text-foreground">{client.nom_entreprise}</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            {client.nom_entreprise}
          </h1>
          <p className="text-sm text-muted-foreground">
            Créé le {formattedDates.createdAt} • Dernière mise à jour le {formattedDates.updatedAt}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Retour
          </Button>
          <div className="flex gap-2">
            <Button onClick={() => router.push(`/dashboard/clients/${params.id}/edit`)}>
              Modifier
            </Button>
            <Button 
              variant="destructive" 
              onClick={async () => {
                if (!confirm(`Êtes-vous sûr de vouloir supprimer le client "${client.nom_entreprise}" ?\n\nCette action est irréversible et supprimera :\n- Le client\n- Tous les dossiers associés\n- Tous les documents\n- Toutes les pièces jointes`)) {
                  return;
                }
                
                try {
                  const { error } = await supabaseClient
                    .from('clients')
                    .delete()
                    .eq('id', params.id);
                  
                  if (error) {
                    console.error('Erreur suppression:', error);
                    alert('Erreur lors de la suppression du client');
                    return;
                  }
                  
                  toast.success('Client supprimé avec succès');
                  router.push('/dashboard/clients');
                } catch (error) {
                  console.error('Erreur:', error);
                  alert('Une erreur est survenue');
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="informations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="informations">Informations</TabsTrigger>
          <TabsTrigger value="associes" className="gap-2">
            <Users className="h-4 w-4" />
            Associés
          </TabsTrigger>
        </TabsList>

        <TabsContent value="informations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>Détails de l’entreprise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Nom</p>
              <p className="font-medium text-foreground">{client.nom_entreprise}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Forme juridique</p>
              <p className="font-medium text-foreground">
                {client.forme_juridique || "Non renseignée"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Capital social</p>
              <p className="font-medium text-foreground">
                {client.capital_social !== null && client.capital_social !== undefined
                  ? `${client.capital_social.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                      minimumFractionDigits: 0,
                    })}`
                  : "Non renseigné"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coordonnées</CardTitle>
            <CardDescription>Moyens de contacts du client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">{client.email || "Non renseigné"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Téléphone</p>
              <p className="font-medium text-foreground">{client.telephone || "Non renseigné"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Adresse</p>
              <p className="font-medium text-foreground whitespace-pre-line">
                {client.adresse || "Non renseignée"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations légales</CardTitle>
            <CardDescription>Statut juridique du client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">SIRET</p>
              <p className="font-medium text-foreground">{client.siret || "Non renseigné"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Statut</p>
              <Badge
                variant={
                  client.statut.toLowerCase() === "statuts générés"
                    ? "outline"
                    : client.statut.toLowerCase() === "formulaire rempli"
                    ? "default"
                    : "secondary"
                }
              >
                {client.statut}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formulaire client</CardTitle>
            <CardDescription>État d’avancement du formulaire partagé</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {client.formulaire_complete ? (
              <div className="space-y-2">
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  Formulaire complété
                </Badge>
                <p className="text-muted-foreground">
                  Formulaire complété le {formattedDates.updatedAt}.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Lien du formulaire</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/formulaire/${client.formulaire_token}`}
                      className="font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopyLink}
                      className="shrink-0"
                    >
                      {copiedLink ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {copiedLink && (
                    <p className="text-sm text-green-600">Lien copié dans le presse-papier !</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSendFormLink}
                  disabled={isSending || !client?.email}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {isSending ? "Envoi..." : "Envoyer le lien formulaire"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pièces jointes</CardTitle>
            <CardDescription>
              Téléversez et gérez les documents associés à ce client
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-input">Sélectionner un fichier</Label>
              <div
                className={`border-2 border-dashed rounded-md p-6 transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => {
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    // Vérifier le type de fichier
                    const validTypes = [".pdf", ".jpg", ".jpeg", ".png"];
                    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
                    if (validTypes.includes(fileExtension)) {
                      setSelectedFile(file);
                    } else {
                      toast.error("Format de fichier non accepté. Formats acceptés : PDF, JPG, JPEG, PNG");
                    }
                  }
                }}
              >
                <div className="flex flex-col items-center justify-center gap-2 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="font-medium text-foreground">
                      Glissez-déposez un fichier ici
                    </span>
                    <span className="text-muted-foreground"> ou </span>
                    <label
                      htmlFor="file-input"
                      className="font-medium text-primary cursor-pointer hover:underline"
                    >
                      parcourez
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formats acceptés : PDF, JPG, JPEG, PNG (max 10 Mo)
                  </p>
                </div>
                <Input
                  id="file-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                  }}
                  className="hidden"
                />
              </div>
              {selectedFile && (
                <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatFileSize(selectedFile.size)})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      const fileInput = document.getElementById("file-input") as HTMLInputElement;
                      if (fileInput) {
                        fileInput.value = "";
                      }
                    }}
                  >
                    ✕
                  </Button>
                </div>
              )}
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="w-full"
                size="default"
              >
                {isUploading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Uploader
                  </>
                )}
              </Button>
            </div>

            {isLoadingPiecesJointes ? (
              <div className="text-sm text-muted-foreground py-4">
                Chargement des pièces jointes...
              </div>
            ) : piecesJointes.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
                Aucune pièce jointe pour le moment
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Fichiers uploadés</Label>
                <div className="border rounded-md divide-y">
                  {piecesJointes.map((piece) => (
                    <div
                      key={piece.id}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <File className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{piece.nom_fichier}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatFileSize(piece.taille_fichier)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Êtes-vous sûr de vouloir supprimer ce fichier ?")) {
                              handleDeletePieceJointe(piece.id, piece.url_fichier);
                            }
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Générez automatiquement les statuts de cette société.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generateError && (
              <Alert variant="destructive">
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{generateError}</AlertDescription>
              </Alert>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Statuts SAS/SASU</TableCell>
                    <TableCell className="text-muted-foreground">
                      Le document sera généré au format Word modifiable (.docx)
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleGenerateStatuts()}
                        disabled={isGenerating || !client?.nom_entreprise}
                        size="sm"
                      >
                        {isGenerating ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Génération...
                          </>
                        ) : (
                          "Générer"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Procès-Verbal de Constitution</TableCell>
                    <TableCell className="text-muted-foreground">
                      Le PV constate officiellement la constitution de la société
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={handleGeneratePV}
                        disabled={isGeneratingPV || !client?.nom_entreprise}
                        variant="outline"
                        size="sm"
                      >
                        {isGeneratingPV ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Génération...
                          </>
                        ) : (
                          "Générer"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Déclaration Non-Condamnation</TableCell>
                    <TableCell className="text-muted-foreground">
                      Déclaration de non-condamnation du président
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={handleGenerateDNC}
                        disabled={isGeneratingDNC || !client?.nom_entreprise}
                        variant="outline"
                        size="sm"
                      >
                        {isGeneratingDNC ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Génération...
                          </>
                        ) : (
                          "Générer"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Annonce Légale</TableCell>
                    <TableCell className="text-muted-foreground">
                      Publication de la constitution au BODACC
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={handleGenerateAnnonceLegale}
                        disabled={isGeneratingAnnonceLegale || !client?.nom_entreprise}
                        variant="outline"
                        size="sm"
                      >
                        {isGeneratingAnnonceLegale ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Génération...
                          </>
                        ) : (
                          "Générer"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Attestation Dépôt Fonds</TableCell>
                    <TableCell className="text-muted-foreground">
                      Attestation de dépôt de capital
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={handleGenerateAttestationDepotFonds}
                        disabled={isGeneratingAttestationDepotFonds || !client?.nom_entreprise}
                        variant="outline"
                        size="sm"
                      >
                        {isGeneratingAttestationDepotFonds ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Génération...
                          </>
                        ) : (
                          "Générer"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {client.type_dossier === 'reprise' && (
                    <>
                      <TableRow>
                        <TableCell className="font-medium">Courrier de reprise de dossier</TableCell>
                        <TableCell className="text-muted-foreground">
                          Courrier conforme à l'article 163 du décret du 30 mars 2012
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={handleGenerateCourrierReprise}
                            disabled={isGeneratingCourrierReprise || !client?.nom_entreprise}
                            variant="outline"
                            size="sm"
                          >
                            {isGeneratingCourrierReprise ? (
                              <>
                                <span className="animate-spin mr-2">⏳</span>
                                Génération...
                              </>
                            ) : (
                              "Générer le courrier"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Lettre de mission comptable</TableCell>
                        <TableCell className="text-muted-foreground">
                          Définition de la mission comptable et des honoraires
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={handleGenerateLettreMission}
                            disabled={isGeneratingLettreMission || !client?.nom_entreprise}
                            variant="outline"
                            size="sm"
                          >
                            {isGeneratingLettreMission ? (
                              <>
                                <span className="animate-spin mr-2">⏳</span>
                                Génération...
                              </>
                            ) : (
                              "Générer la lettre"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="associes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Associés</CardTitle>
              <CardDescription>
                Liste des actionnaires de la société
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssociesList
                clientId={client.id || ''}
                clientData={{
                  capital_social: client.capital_social || 0,
                  nb_actions: (client as any).nb_actions || 0,
                  forme_juridique: client.forme_juridique,
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {validationErrors && (
        <AlertDialog open={!!validationErrors} onOpenChange={() => setValidationErrors(null)}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                {validationErrors.isValid ? (
                  <>⚠️ Avertissements détectés</>
                ) : (
                  <>❌ Impossible de générer les statuts</>
                )}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                {validationErrors.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-semibold text-red-600">
                      {validationErrors.errors.length} erreur(s) juridique(s) détectée(s) :
                    </p>
                    {validationErrors.errors.map((error, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="font-medium text-red-800">{error.code.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-red-700 mt-1">{error.message}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {validationErrors.warnings.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="font-semibold text-orange-600">
                      {validationErrors.warnings.length} avertissement(s) :
                    </p>
                    {validationErrors.warnings.map((warning, index) => (
                      <div key={index} className="bg-orange-50 border border-orange-200 rounded p-3">
                        <p className="text-sm text-orange-700">{warning.message}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {!validationErrors.isValid && (
                  <p className="text-sm text-gray-600 mt-4">
                    Veuillez corriger les erreurs dans les données du client avant de générer les statuts.
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction 
                onClick={() => {
                  if (validationErrors.isValid) {
                    // Si que des warnings, fermer modal et générer quand même
                    setValidationErrors(null);
                    handleGenerateStatuts(true);
                  } else {
                    // Si erreurs bloquantes, juste fermer la modal
                    setValidationErrors(null);
                  }
                }}
              >
                {validationErrors.isValid ? "Générer quand même" : "Corriger les données"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

// Cache bust: 1768993007
