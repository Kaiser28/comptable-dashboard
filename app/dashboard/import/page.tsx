'use client';

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Upload, Download, FileText, X } from "lucide-react";
import { supabaseClient } from "@/lib/supabase";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type CSVRow = Record<string, string>;
type CSVData = {
  columns: string[];
  rows: CSVRow[];
  totalRows: number;
  allRows: CSVRow[]; // Toutes les lignes pour la validation
};

type DBField = 
  | "activite_reglementee"
  | "activite_reglementee_details"
  | "adresse"
  | "banque_depot_capital"
  | "capital_social"
  | "code_ape"
  | "compte_pro_ouvert"
  | "date_cloture"
  | "date_debut_activite"
  | "duree_societe"
  | "email"
  | "expert_comptable_email"
  | "expert_comptable_nom"
  | "forme_juridique"
  | "montant_libere"
  | "nb_actions"
  | "nom_entreprise"
  | "objet_social"
  | "siret"
  | "telephone"
  | "type_siege"
  | "skip"; // "skip" = Ne pas importer

type ColumnMapping = Record<string, DBField>;

type ValidationError = {
  field: string;
  message: string;
};

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isMappingValid, setIsMappingValid] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);

  const handleDownloadTemplate = () => {
    // Créer un CSV modèle avec les colonnes principales (ordre alphabétique)
    const templateColumns = [
      "activite_reglementee",
      "activite_reglementee_details",
      "adresse",
      "banque_depot_capital",
      "capital_social",
      "code_ape",
      "compte_pro_ouvert",
      "date_cloture",
      "date_debut_activite",
      "duree_societe",
      "email",
      "expert_comptable_email",
      "expert_comptable_nom",
      "forme_juridique",
      "montant_libere",
      "nb_actions",
      "nom_entreprise",
      "objet_social",
      "siret",
      "telephone",
      "type_siege",
    ];

    const csvContent = [
      templateColumns.join(","),
      "false, , 123 Rue Exemple 75001 Paris, Banque Populaire, 10000, 6201Z, false, 31/12, 01/01/2024, 99, contact@exemple.fr, expert@cabinet.fr, Jean Dupont, SAS, 5000, 100, Exemple SAS, Activité de conseil, 12345678901234, 0123456789, Propriétaire",
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele_import_clients.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const parseFile = (file: File) => {
    setIsUploading(true);
    setError(null);
    setFileName(file.name);

    // Vérifier l'extension
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "csv" && extension !== "xlsx") {
      setError("Format de fichier non supporté. Veuillez utiliser un fichier .csv ou .xlsx");
      setIsUploading(false);
      return;
    }

    // Pour l'instant, on ne gère que le CSV
    if (extension === "xlsx") {
      setError("Le format Excel (.xlsx) sera bientôt supporté. Veuillez utiliser un fichier .csv pour l'instant.");
      setIsUploading(false);
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn("Erreurs de parsing CSV:", results.errors);
          // On continue quand même si on a des données
        }

        if (!results.data || results.data.length === 0) {
          setError("Le fichier CSV est vide ou ne contient pas de données valides.");
          setIsUploading(false);
          return;
        }

        // Extraire les colonnes depuis la première ligne
        const firstRow = results.data[0] as CSVRow;
        const columns = Object.keys(firstRow);

        // Limiter à 5 lignes pour la prévisualisation
        const previewRows = (results.data as CSVRow[]).slice(0, 5);
        const allRows = results.data as CSVRow[];

        setCsvData({
          columns,
          rows: previewRows,
          totalRows: results.data.length,
          allRows,
        });

        // Auto-détection intelligente des colonnes
        const autoMapping: ColumnMapping = {};
        columns.forEach((col) => {
          const colLower = col.toLowerCase().trim();
          
          // Correspondances exactes ou partielles (par ordre de priorité)
          if (colLower.includes("nom") && (colLower.includes("entreprise") || colLower.includes("societe") || colLower.includes("raison"))) {
            autoMapping[col] = "nom_entreprise";
          } else if (colLower.includes("forme") && colLower.includes("juridique")) {
            autoMapping[col] = "forme_juridique";
          } else if (colLower.includes("activite") && colLower.includes("reglementee") && colLower.includes("details")) {
            autoMapping[col] = "activite_reglementee_details";
          } else if (colLower.includes("activite") && colLower.includes("reglementee")) {
            autoMapping[col] = "activite_reglementee";
          } else if (colLower.includes("adresse") && !colLower.includes("siege")) {
            autoMapping[col] = "adresse";
          } else if (colLower.includes("banque") || colLower.includes("bank")) {
            autoMapping[col] = "banque_depot_capital";
          } else if (colLower.includes("capital")) {
            autoMapping[col] = "capital_social";
          } else if (colLower.includes("code") && (colLower.includes("ape") || colLower.includes("naf"))) {
            autoMapping[col] = "code_ape";
          } else if (colLower.includes("compte") && colLower.includes("pro")) {
            autoMapping[col] = "compte_pro_ouvert";
          } else if (colLower.includes("date") && colLower.includes("cloture")) {
            autoMapping[col] = "date_cloture";
          } else if (colLower.includes("date") && (colLower.includes("debut") || colLower.includes("creation"))) {
            autoMapping[col] = "date_debut_activite";
          } else if (colLower.includes("duree")) {
            autoMapping[col] = "duree_societe";
          } else if (colLower.includes("expert") && colLower.includes("comptable") && colLower.includes("email")) {
            autoMapping[col] = "expert_comptable_email";
          } else if (colLower.includes("expert") && colLower.includes("comptable") && colLower.includes("nom")) {
            autoMapping[col] = "expert_comptable_nom";
          } else if (colLower.includes("email") || colLower.includes("mail")) {
            autoMapping[col] = "email";
          } else if (colLower.includes("montant") && colLower.includes("libere")) {
            autoMapping[col] = "montant_libere";
          } else if (colLower.includes("nb") && colLower.includes("action")) {
            autoMapping[col] = "nb_actions";
          } else if (colLower.includes("objet") && colLower.includes("social")) {
            autoMapping[col] = "objet_social";
          } else if (colLower.includes("siret")) {
            autoMapping[col] = "siret";
          } else if (colLower.includes("telephone") || colLower.includes("tel") || colLower.includes("phone")) {
            autoMapping[col] = "telephone";
          } else if (colLower.includes("type") && colLower.includes("siege")) {
            autoMapping[col] = "type_siege";
          } else {
            // Si le nom de colonne correspond exactement à un champ DB
            const dbFields: DBField[] = [
              "activite_reglementee",
              "activite_reglementee_details",
              "adresse",
              "banque_depot_capital",
              "capital_social",
              "code_ape",
              "compte_pro_ouvert",
              "date_cloture",
              "date_debut_activite",
              "duree_societe",
              "email",
              "expert_comptable_email",
              "expert_comptable_nom",
              "forme_juridique",
              "montant_libere",
              "nb_actions",
              "nom_entreprise",
              "objet_social",
              "siret",
              "telephone",
              "type_siege",
            ];
            if (dbFields.includes(colLower as DBField)) {
              autoMapping[col] = colLower as DBField;
            } else {
              autoMapping[col] = "skip";
            }
          }
        });

        setColumnMapping(autoMapping);
        setIsMappingValid(false);
        setShowMapping(false);
        setValidationErrors([]);

        setIsUploading(false);
      },
      error: (error) => {
        setError(`Erreur lors de la lecture du fichier: ${error.message}`);
        setIsUploading(false);
      },
    });
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      parseFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      parseFile(file);
    }
  };

  const handleClearFile = () => {
    setCsvData(null);
    setFileName("");
    setError(null);
    setColumnMapping({});
    setValidationErrors([]);
    setIsMappingValid(false);
    setShowMapping(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleMappingChange = (csvColumn: string, dbField: DBField) => {
    setColumnMapping((prev) => ({
      ...prev,
      [csvColumn]: dbField,
    }));
    setIsMappingValid(false);
    setValidationErrors([]);
  };

  const validateMapping = () => {
    if (!csvData) return;

    const errors: ValidationError[] = [];

    // Vérifier que les champs requis sont mappés (en excluant "skip")
    const mappedFields = Object.values(columnMapping).filter(field => field !== "skip");
    if (!mappedFields.includes("nom_entreprise")) {
      errors.push({
        field: "nom_entreprise",
        message: "Le champ 'nom_entreprise' est requis et doit être mappé.",
      });
    }
    if (!mappedFields.includes("forme_juridique")) {
      errors.push({
        field: "forme_juridique",
        message: "Le champ 'forme_juridique' est requis et doit être mappé.",
      });
    }

    // Vérifier les données pour chaque ligne
    csvData.allRows.forEach((row, index) => {
      const rowNum = index + 1;

      // Trouver la colonne CSV mappée à nom_entreprise
      const nomEntrepriseCol = Object.keys(columnMapping).find(
        (col) => columnMapping[col] === "nom_entreprise"
      );
      if (nomEntrepriseCol && (!row[nomEntrepriseCol] || row[nomEntrepriseCol].trim() === "")) {
        errors.push({
          field: `ligne_${rowNum}`,
          message: `Ligne ${rowNum}: Le nom de l'entreprise est vide.`,
        });
      }

      // Trouver la colonne CSV mappée à forme_juridique
      const formeJuridiqueCol = Object.keys(columnMapping).find(
        (col) => columnMapping[col] === "forme_juridique"
      );
      if (formeJuridiqueCol) {
        const formeJuridique = row[formeJuridiqueCol]?.trim().toUpperCase();
        if (!formeJuridique) {
          errors.push({
            field: `ligne_${rowNum}`,
            message: `Ligne ${rowNum}: La forme juridique est vide.`,
          });
        } else if (!formeJuridique.includes("SAS") && !formeJuridique.includes("SASU")) {
          errors.push({
            field: `ligne_${rowNum}`,
            message: `Ligne ${rowNum}: La forme juridique doit contenir "SAS" ou "SASU" (valeur: "${row[formeJuridiqueCol]}").`,
          });
        }
      }

      // Vérifier capital_social si mappé
      const capitalSocialCol = Object.keys(columnMapping).find(
        (col) => columnMapping[col] === "capital_social"
      );
      if (capitalSocialCol && row[capitalSocialCol]) {
        const capitalValue = row[capitalSocialCol].trim();
        const capitalNum = parseFloat(capitalValue.replace(/[^\d.,]/g, "").replace(",", "."));
        if (isNaN(capitalNum) || capitalNum < 0) {
          errors.push({
            field: `ligne_${rowNum}`,
            message: `Ligne ${rowNum}: Le capital social doit être un nombre positif (valeur: "${capitalValue}").`,
          });
        }
      }
    });

    setValidationErrors(errors);
    setIsMappingValid(errors.length === 0);
    setShowMapping(true);

    if (errors.length === 0) {
      // Scroll vers le bouton Importer
      setTimeout(() => {
        const importButton = document.getElementById("import-button");
        if (importButton) {
          importButton.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 100);
    }
  };

  const handleImport = async () => {
    if (!csvData || !isMappingValid) {
      setImportError("Veuillez valider le mapping avant d'importer.");
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      // 1. Récupérer le cabinet_id de l'utilisateur connecté
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError || !user) {
        setImportError("Impossible de récupérer votre session. Veuillez vous reconnecter.");
        setIsImporting(false);
        return;
      }

      const cabinetId = user.id;

      // 2. Mapper les colonnes pour chaque ligne et créer les objets clients
      const clientsToInsert: any[] = [];

      csvData.allRows.forEach((row) => {
        const clientData: any = {
          cabinet_id: cabinetId,
          formulaire_token: crypto.randomUUID(),
          formulaire_complete: false,
          statut: "En attente",
          // Valeurs par défaut pour les champs obligatoires
          capital_social: 0,
          duree_societe: 99,
          objet_social: "",
          nb_actions: 0,
          montant_libere: 0,
        };

        // Mapper chaque colonne CSV vers le champ DB correspondant
        Object.entries(columnMapping).forEach(([csvColumn, dbField]) => {
          if (dbField === "skip") return; // Ignorer les colonnes non mappées

          const csvValue = row[csvColumn]?.trim() || "";

          // Conversion des types selon le champ
          switch (dbField) {
            case "capital_social":
            case "nb_actions":
            case "montant_libere":
            case "duree_societe":
              if (csvValue) {
                const numValue = parseFloat(csvValue.replace(/[^\d.,]/g, "").replace(",", "."));
                if (!isNaN(numValue)) {
                  clientData[dbField] = Math.round(numValue);
                }
              }
              break;

            case "activite_reglementee":
            case "compte_pro_ouvert":
              // Convertir en boolean
              if (csvValue) {
                const lowerValue = csvValue.toLowerCase();
                clientData[dbField] =
                  lowerValue === "true" ||
                  lowerValue === "1" ||
                  lowerValue === "oui" ||
                  lowerValue === "yes" ||
                  lowerValue === "vrai";
              } else {
                clientData[dbField] = false;
              }
              break;

            case "nom_entreprise":
            case "forme_juridique":
              // Champs requis - ne pas mettre null si vide
              if (csvValue) {
                clientData[dbField] = csvValue;
              }
              break;

            default:
              // Champs optionnels - mettre null si vide
              if (csvValue) {
                clientData[dbField] = csvValue;
              } else {
                clientData[dbField] = null;
              }
              break;
          }
        });

        // Vérifier que les champs requis sont présents
        if (!clientData.nom_entreprise || !clientData.forme_juridique) {
          console.warn("Ligne ignorée - champs requis manquants:", row);
          return;
        }

        clientsToInsert.push(clientData);
      });

      if (clientsToInsert.length === 0) {
        setImportError("Aucun client valide à importer. Vérifiez que les champs requis sont remplis.");
        setIsImporting(false);
        return;
      }

      // 3. Insérer en masse dans Supabase
      const { data, error } = await supabaseClient
        .from("clients")
        .insert(clientsToInsert)
        .select();

      if (error) {
        console.error("Erreur lors de l'import:", error);
        setImportError(
          error.message || `Erreur lors de l'import: ${error.code || "Erreur inconnue"}`
        );
        setIsImporting(false);
        return;
      }

      // 4. Succès - afficher le message et rediriger
      const importedCount = data?.length || clientsToInsert.length;
      setImportSuccess(importedCount);

      // Rediriger vers le dashboard après 2 secondes
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Erreur inattendue lors de l'import:", error);
      setImportError(
        error instanceof Error
          ? error.message
          : "Une erreur inattendue s'est produite lors de l'import."
      );
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Import CSV de clients</h1>
          <p className="text-muted-foreground">
            Importez vos clients existants depuis un fichier CSV ou Excel
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Retour
        </Button>
      </div>

      {/* Zone de téléchargement du modèle */}
      <Card>
        <CardHeader>
          <CardTitle>Modèle CSV</CardTitle>
          <CardDescription>
            Téléchargez un fichier modèle pour connaître le format attendu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleDownloadTemplate} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Télécharger le modèle CSV
          </Button>
        </CardContent>
      </Card>

      {/* Zone d'upload */}
      <Card>
        <CardHeader>
          <CardTitle>Importer un fichier</CardTitle>
          <CardDescription>
            Glissez-déposez votre fichier CSV ou cliquez pour sélectionner
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              {isUploading ? (
                <>
                  <div className="animate-spin text-2xl">⏳</div>
                  <p className="text-sm text-muted-foreground">
                    Lecture du fichier en cours...
                  </p>
                </>
              ) : csvData ? (
                <>
                  <FileText className="h-12 w-12 text-primary" />
                  <div className="space-y-1">
                    <p className="font-medium">{fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {csvData.totalRows} ligne(s) détectée(s)
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFile}
                    className="mt-2"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Changer de fichier
                  </Button>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="font-medium">
                      Glissez-déposez votre fichier ici
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ou cliquez pour sélectionner
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Formats acceptés: .csv, .xlsx
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Prévisualisation */}
      {csvData && (
        <Card>
          <CardHeader>
            <CardTitle>Prévisualisation des données</CardTitle>
            <CardDescription>
              {csvData.totalRows} ligne(s) au total - Affichage des 5 premières lignes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {csvData.columns.map((col) => (
                      <TableHead key={col} className="font-medium">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {csvData.columns.map((col) => (
                        <TableCell key={col} className="max-w-xs truncate">
                          {row[col] || "-"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {csvData.totalRows > 5 && (
              <p className="text-sm text-muted-foreground mt-4">
                ... et {csvData.totalRows - 5} autre(s) ligne(s)
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section de mapping */}
      {csvData && (
        <Card>
          <CardHeader>
            <CardTitle>Mapper les colonnes</CardTitle>
            <CardDescription>
              Associez chaque colonne CSV à un champ de la base de données
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {csvData.columns.map((csvColumn) => {
                const mappedField = columnMapping[csvColumn] || "skip";
                const isRequired = mappedField === "nom_entreprise" || mappedField === "forme_juridique";
                const isRequiredButNotMapped = 
                  (csvColumn.toLowerCase().includes("nom") && csvColumn.toLowerCase().includes("entreprise")) ||
                  (csvColumn.toLowerCase().includes("forme") && csvColumn.toLowerCase().includes("juridique"));

                return (
                  <div key={csvColumn} className="space-y-2">
                    <Label htmlFor={`mapping-${csvColumn}`} className="flex items-center gap-2">
                      <span>{csvColumn}</span>
                      {(isRequired || isRequiredButNotMapped) && (
                        <span className="text-red-500 text-xs">*</span>
                      )}
                    </Label>
                    <Select
                      value={mappedField}
                      onValueChange={(value) => handleMappingChange(csvColumn, value as DBField)}
                    >
                      <SelectTrigger id={`mapping-${csvColumn}`}>
                        <SelectValue placeholder="Sélectionner un champ..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activite_reglementee">Activité réglementée</SelectItem>
                        <SelectItem value="activite_reglementee_details">Détails activité réglementée</SelectItem>
                        <SelectItem value="adresse">Adresse</SelectItem>
                        <SelectItem value="banque_depot_capital">Banque dépôt capital</SelectItem>
                        <SelectItem value="capital_social">Capital social</SelectItem>
                        <SelectItem value="code_ape">Code APE</SelectItem>
                        <SelectItem value="compte_pro_ouvert">Compte pro ouvert</SelectItem>
                        <SelectItem value="date_cloture">Date clôture</SelectItem>
                        <SelectItem value="date_debut_activite">Date début activité</SelectItem>
                        <SelectItem value="duree_societe">Durée société</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="expert_comptable_email">Expert-comptable email</SelectItem>
                        <SelectItem value="expert_comptable_nom">Expert-comptable nom</SelectItem>
                        <SelectItem value="forme_juridique">
                          Forme juridique <span className="text-red-500">*</span>
                        </SelectItem>
                        <SelectItem value="montant_libere">Montant libéré</SelectItem>
                        <SelectItem value="nb_actions">Nombre d'actions</SelectItem>
                        <SelectItem value="nom_entreprise">
                          Nom entreprise <span className="text-red-500">*</span>
                        </SelectItem>
                        <SelectItem value="objet_social">Objet social</SelectItem>
                        <SelectItem value="siret">SIRET</SelectItem>
                        <SelectItem value="telephone">Téléphone</SelectItem>
                        <SelectItem value="type_siege">Type siège</SelectItem>
                        <SelectItem value="skip">Ne pas importer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>

            {validationErrors.length > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Erreurs de validation</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error.message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {isMappingValid && (
              <Alert className="mt-4 border-green-500 bg-green-50">
                <AlertTitle className="text-green-800">Mapping validé ✓</AlertTitle>
                <AlertDescription className="text-green-700">
                  Tous les champs requis sont mappés et les données sont valides. Vous pouvez maintenant importer.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4 mt-6">
              <Button onClick={validateMapping} variant="outline">
                Valider le mapping
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bouton d'import */}
      {csvData && showMapping && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {importSuccess !== null && (
              <Alert className="border-green-500 bg-green-50">
                <AlertTitle className="text-green-800">Import réussi ✓</AlertTitle>
                <AlertDescription className="text-green-700">
                  {importSuccess} client(s) importé(s) avec succès. Redirection en cours...
                </AlertDescription>
              </Alert>
            )}

            {importError && (
              <Alert variant="destructive">
                <AlertTitle>Erreur lors de l'import</AlertTitle>
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <Button
                id="import-button"
                disabled={!isMappingValid || isImporting || importSuccess !== null}
                onClick={handleImport}
                className="w-full"
                size="lg"
              >
                {isImporting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Import en cours...
                  </>
                ) : importSuccess !== null ? (
                  <>Import terminé</>
                ) : isMappingValid ? (
                  <>Importer {csvData.totalRows} client(s)</>
                ) : (
                  <>Importer (validation requise)</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

