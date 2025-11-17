'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Copy, Check, FileText, Users } from "lucide-react";

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

  const formattedDates = useMemo(() => {
    if (!clientState.data) {
      return { createdAt: "", updatedAt: "" };
    }

    return {
      createdAt: new Date(clientState.data.created_at).toLocaleDateString("fr-FR"),
      updatedAt: new Date(clientState.data.updated_at).toLocaleDateString("fr-FR"),
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

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Retour
          </Button>
          <Button onClick={() => router.push(`/dashboard/clients/${params.id}/edit`)}>
            Modifier
          </Button>
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
                {client.capital_social !== null
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
                <Button variant="outline" className="w-full">
                  Envoyer le lien formulaire
                </Button>
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

