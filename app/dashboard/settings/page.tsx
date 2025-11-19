'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Upload, X, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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
import { supabaseClient } from "@/lib/supabase";
import { cabinetSchema, type CabinetFormData } from "@/lib/validations/cabinet";

type CabinetData = {
  id: string;
  nom_cabinet: string | null;
  logo_url: string | null;
  adresse_ligne1: string | null;
  adresse_ligne2: string | null;
  code_postal: string | null;
  ville: string | null;
  pays: string | null;
  telephone: string | null;
  email_contact: string | null;
  siret: string | null;
};

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cabinetId, setCabinetId] = useState<string | null>(null);
  const [cabinetData, setCabinetData] = useState<CabinetData | null>(null);
  
  // États du formulaire
  const [formData, setFormData] = useState<CabinetFormData>({
    nom_cabinet: "",
    siret: "",
    telephone: "",
    email_contact: "",
    adresse_ligne1: "",
    adresse_ligne2: "",
    code_postal: "",
    ville: "",
    pays: "France",
  });

  // États pour le logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // États pour les erreurs
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger les données du cabinet
  useEffect(() => {
    const fetchCabinetData = async () => {
      try {
        setIsLoading(true);

        // Récupérer l'utilisateur actuel
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) {
          toast.error("Erreur d'authentification");
          router.push("/login");
          return;
        }

        // Récupérer le cabinet_id via experts_comptables
        const { data: expertComptable, error: expertError } = await supabaseClient
          .from("experts_comptables")
          .select("cabinet_id")
          .eq("user_id", user.id)
          .single();

        if (expertError || !expertComptable?.cabinet_id) {
          toast.error("Cabinet introuvable");
          router.push("/dashboard");
          return;
        }

        const id = expertComptable.cabinet_id;
        setCabinetId(id);

        // Récupérer les données du cabinet
        const { data: cabinet, error: cabinetError } = await supabaseClient
          .from("cabinets")
          .select("*")
          .eq("id", id)
          .single();

        if (cabinetError) {
          console.error("Erreur récupération cabinet:", cabinetError);
          toast.error("Erreur lors du chargement des données");
          return;
        }

        if (cabinet) {
          setCabinetData(cabinet);
          setFormData({
            nom_cabinet: cabinet.nom_cabinet || "",
            siret: cabinet.siret || "",
            telephone: cabinet.telephone || "",
            email_contact: cabinet.email_contact || "",
            adresse_ligne1: cabinet.adresse_ligne1 || "",
            adresse_ligne2: cabinet.adresse_ligne2 || "",
            code_postal: cabinet.code_postal || "",
            ville: cabinet.ville || "",
            pays: cabinet.pays || "France",
          });
          setCurrentLogoUrl(cabinet.logo_url);
        }
      } catch (error) {
        console.error("Erreur lors du chargement:", error);
        toast.error("Une erreur est survenue");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCabinetData();
  }, [router]);

  // Gérer le changement de fichier logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      toast.error("Format de fichier non accepté. Formats acceptés : PNG, JPEG, JPG");
      return;
    }

    // Vérifier la taille (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux. Taille maximale : 2 Mo");
      return;
    }

    setLogoFile(file);

    // Créer une preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Supprimer le logo sélectionné
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    const fileInput = document.getElementById("logo-input") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Upload du logo vers Supabase Storage
  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !cabinetId) return null;

    try {
      setIsUploadingLogo(true);

      // Déterminer l'extension
      const extension = logoFile.name.split(".").pop()?.toLowerCase() || "png";
      const storagePath = `${cabinetId}/logo.${extension}`;

      // Supprimer l'ancien logo s'il existe
      if (currentLogoUrl) {
        try {
          // Extraire le chemin depuis l'URL publique Supabase Storage
          // Format URL: https://[project].supabase.co/storage/v1/object/public/cabinet-logos/[cabinetId]/[filename]
          const urlParts = currentLogoUrl.split("/cabinet-logos/");
          if (urlParts.length > 1) {
            const oldPath = urlParts[1];
            await supabaseClient.storage
              .from("cabinet-logos")
              .remove([oldPath]);
          }
        } catch (error) {
          console.warn("Erreur lors de la suppression de l'ancien logo:", error);
          // Continuer quand même pour uploader le nouveau logo
        }
      }

      // Upload du nouveau logo
      const { data, error } = await supabaseClient.storage
        .from("cabinet-logos")
        .upload(storagePath, logoFile, {
          contentType: logoFile.type,
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // Récupérer l'URL publique
      const { data: urlData } = supabaseClient.storage
        .from("cabinet-logos")
        .getPublicUrl(storagePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Erreur upload logo:", error);
      throw error;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!cabinetId) {
      toast.error("Cabinet introuvable");
      return;
    }

    // Validation avec Zod
    const validationResult = cabinetSchema.safeParse(formData);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    try {
      setIsSaving(true);

      // Upload du logo si un nouveau fichier est sélectionné
      let logoUrl = currentLogoUrl;
      if (logoFile) {
        logoUrl = await uploadLogo();
        if (!logoUrl) {
          toast.error("Erreur lors de l'upload du logo");
          return;
        }
      }

      // Mettre à jour le cabinet
      const { error: updateError } = await supabaseClient
        .from("cabinets")
        .update({
          nom_cabinet: validationResult.data.nom_cabinet,
          siret: validationResult.data.siret || null,
          telephone: validationResult.data.telephone || null,
          email_contact: validationResult.data.email_contact || null,
          adresse_ligne1: validationResult.data.adresse_ligne1,
          adresse_ligne2: validationResult.data.adresse_ligne2 || null,
          code_postal: validationResult.data.code_postal,
          ville: validationResult.data.ville,
          pays: validationResult.data.pays,
          logo_url: logoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cabinetId);

      if (updateError) {
        throw updateError;
      }

      toast.success("Paramètres sauvegardés avec succès");
      
      // Mettre à jour les données locales
      setCurrentLogoUrl(logoUrl);
      setLogoFile(null);
      setLogoPreview(null);
      
      // Réinitialiser l'input file
      const fileInput = document.getElementById("logo-input") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde des paramètres");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="text-sm text-muted-foreground">Chargement des paramètres...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-semibold">Paramètres du cabinet</h1>
            <p className="text-sm text-muted-foreground">
              Gérez les informations et le logo de votre cabinet
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/settings/equipe">
            <Users className="h-4 w-4 mr-2" />
            Gérer l'équipe
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Colonne gauche : Formulaire */}
          <div className="space-y-6">
            {/* Section Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>Informations de base du cabinet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nom_cabinet">
                    Nom du cabinet <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nom_cabinet"
                    value={formData.nom_cabinet}
                    onChange={(e) =>
                      setFormData({ ...formData, nom_cabinet: e.target.value })
                    }
                    placeholder="Ex: Cabinet Expert-Comptable"
                    className={errors.nom_cabinet ? "border-destructive" : ""}
                  />
                  {errors.nom_cabinet && (
                    <p className="text-sm text-destructive">{errors.nom_cabinet}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siret">SIRET</Label>
                  <Input
                    id="siret"
                    value={formData.siret}
                    onChange={(e) =>
                      setFormData({ ...formData, siret: e.target.value })
                    }
                    placeholder="12345678901234"
                    maxLength={14}
                    className={errors.siret ? "border-destructive" : ""}
                  />
                  {errors.siret && (
                    <p className="text-sm text-destructive">{errors.siret}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) =>
                      setFormData({ ...formData, telephone: e.target.value })
                    }
                    placeholder="01 23 45 67 89"
                    className={errors.telephone ? "border-destructive" : ""}
                  />
                  {errors.telephone && (
                    <p className="text-sm text-destructive">{errors.telephone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_contact">Email de contact</Label>
                  <Input
                    id="email_contact"
                    type="email"
                    value={formData.email_contact}
                    onChange={(e) =>
                      setFormData({ ...formData, email_contact: e.target.value })
                    }
                    placeholder="contact@cabinet.fr"
                    className={errors.email_contact ? "border-destructive" : ""}
                  />
                  {errors.email_contact && (
                    <p className="text-sm text-destructive">{errors.email_contact}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section Adresse */}
            <Card>
              <CardHeader>
                <CardTitle>Adresse</CardTitle>
                <CardDescription>Adresse postale du cabinet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adresse_ligne1">
                    Adresse ligne 1 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="adresse_ligne1"
                    value={formData.adresse_ligne1}
                    onChange={(e) =>
                      setFormData({ ...formData, adresse_ligne1: e.target.value })
                    }
                    placeholder="123 Rue de la République"
                    className={errors.adresse_ligne1 ? "border-destructive" : ""}
                  />
                  {errors.adresse_ligne1 && (
                    <p className="text-sm text-destructive">{errors.adresse_ligne1}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adresse_ligne2">Adresse ligne 2 (optionnel)</Label>
                  <Input
                    id="adresse_ligne2"
                    value={formData.adresse_ligne2}
                    onChange={(e) =>
                      setFormData({ ...formData, adresse_ligne2: e.target.value })
                    }
                    placeholder="Bâtiment A, Bureau 201"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code_postal">
                      Code postal <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="code_postal"
                      value={formData.code_postal}
                      onChange={(e) =>
                        setFormData({ ...formData, code_postal: e.target.value })
                      }
                      placeholder="75001"
                      maxLength={5}
                      className={errors.code_postal ? "border-destructive" : ""}
                    />
                    {errors.code_postal && (
                      <p className="text-sm text-destructive">{errors.code_postal}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ville">
                      Ville <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="ville"
                      value={formData.ville}
                      onChange={(e) =>
                        setFormData({ ...formData, ville: e.target.value })
                      }
                      placeholder="Paris"
                      className={errors.ville ? "border-destructive" : ""}
                    />
                    {errors.ville && (
                      <p className="text-sm text-destructive">{errors.ville}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pays">
                    Pays <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pays"
                    value={formData.pays}
                    onChange={(e) =>
                      setFormData({ ...formData, pays: e.target.value })
                    }
                    placeholder="France"
                    className={errors.pays ? "border-destructive" : ""}
                  />
                  {errors.pays && (
                    <p className="text-sm text-destructive">{errors.pays}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne droite : Logo */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Logo</CardTitle>
                <CardDescription>Logo du cabinet (max 2 Mo)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preview du logo */}
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8">
                  {logoPreview || currentLogoUrl ? (
                    <div className="relative">
                      <img
                        src={logoPreview || currentLogoUrl || ""}
                        alt="Logo du cabinet"
                        className="max-h-48 max-w-full object-contain"
                      />
                      {logoPreview && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                          onClick={handleRemoveLogo}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Upload className="mx-auto h-12 w-12 mb-2" />
                      <p className="text-sm">Aucun logo</p>
                    </div>
                  )}
                </div>

                {/* Input file */}
                <div className="space-y-2">
                  <Label htmlFor="logo-input">Changer le logo</Label>
                  <Input
                    id="logo-input"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleLogoChange}
                    disabled={isUploadingLogo}
                  />
                  <p className="text-xs text-muted-foreground">
                    Formats acceptés : PNG, JPEG, JPG (max 2 Mo)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bouton de soumission */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSaving || isUploadingLogo}>
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Sauvegarde...
              </>
            ) : (
              "Enregistrer les modifications"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

