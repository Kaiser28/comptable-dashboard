'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, UserPlus, Shield, Trash2, ToggleLeft, ToggleRight, Mail } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

type TeamMember = {
  id: string;
  user_id: string;
  email: string;
  nom: string | null;
  prenom: string | null;
  role: 'admin' | 'collaborateur';
  is_active: boolean;
  permissions: {
    clients?: {
      read?: boolean;
      write?: boolean;
      delete?: boolean;
    };
  } | null;
  created_at: string;
  created_by: string | null;
};

export default function EquipePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [cabinetId, setCabinetId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  // États pour l'invitation
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNom, setInviteNom] = useState("");
  const [invitePrenom, setInvitePrenom] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  // États pour les dialogs de confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Récupérer l'utilisateur actuel
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) {
          toast.error("Erreur d'authentification");
          router.push("/login");
          return;
        }

        setCurrentUserId(user.id);

        // Récupérer les infos de l'expert-comptable
        const { data: expertComptable, error: expertError } = await supabaseClient
          .from("experts_comptables")
          .select("id, role, cabinet_id")
          .eq("user_id", user.id)
          .single();

        if (expertError || !expertComptable) {
          toast.error("Expert-comptable introuvable");
          router.push("/dashboard");
          return;
        }

        // Vérifier que l'utilisateur est admin
        if (expertComptable.role !== "admin") {
          toast.error("Accès refusé. Seuls les administrateurs peuvent gérer l'équipe.");
          router.push("/dashboard/settings");
          return;
        }

        setIsAdmin(true);
        setCabinetId(expertComptable.cabinet_id);

        // Charger les membres de l'équipe
        await loadTeamMembers(expertComptable.cabinet_id);
      } catch (error) {
        console.error("Erreur lors du chargement:", error);
        toast.error("Une erreur est survenue");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [router]);

  const loadTeamMembers = async (cabinetId: string) => {
    try {
      const { data, error } = await supabaseClient
        .from("experts_comptables")
        .select("*")
        .eq("cabinet_id", cabinetId)
        .order("role", { ascending: true }) // Admin en premier
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      setTeamMembers(data || []);
    } catch (error) {
      console.error("Erreur chargement équipe:", error);
      toast.error("Erreur lors du chargement de l'équipe");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail || !inviteNom) {
      toast.error("Email et nom sont requis");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      toast.error("Email invalide");
      return;
    }

    try {
      setIsInviting(true);

      const response = await fetch("/api/invite-collaborateur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          nom: inviteNom,
          prenom: invitePrenom || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'invitation");
      }

      toast.success(`Invitation envoyée à ${inviteEmail}`);
      
      // Réinitialiser le formulaire
      setInviteEmail("");
      setInviteNom("");
      setInvitePrenom("");

      // Recharger la liste
      if (cabinetId) {
        await loadTeamMembers(cabinetId);
      }
    } catch (error) {
      console.error("Erreur invitation:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleTogglePermission = async (
    memberId: string,
    permission: 'read' | 'write' | 'delete',
    currentValue: boolean
  ) => {
    if (!cabinetId) return;

    try {
      const member = teamMembers.find((m) => m.id === memberId);
      if (!member) return;

      const currentPermissions = member.permissions || {};
      const clientsPermissions = currentPermissions.clients || {};

      const updatedPermissions = {
        ...currentPermissions,
        clients: {
          ...clientsPermissions,
          [permission]: !currentValue,
        },
      };

      const { error } = await supabaseClient
        .from("experts_comptables")
        .update({ permissions: updatedPermissions })
        .eq("id", memberId);

      if (error) {
        throw error;
      }

      toast.success("Permissions mises à jour");
      
      // Recharger la liste
      await loadTeamMembers(cabinetId);
    } catch (error) {
      console.error("Erreur mise à jour permissions:", error);
      toast.error("Erreur lors de la mise à jour des permissions");
    }
  };

  const handleToggleActive = async (memberId: string, currentStatus: boolean) => {
    if (!cabinetId) return;

    try {
      const { error } = await supabaseClient
        .from("experts_comptables")
        .update({ is_active: !currentStatus })
        .eq("id", memberId);

      if (error) {
        throw error;
      }

      toast.success(`Collaborateur ${!currentStatus ? 'réactivé' : 'désactivé'}`);
      
      // Recharger la liste
      await loadTeamMembers(cabinetId);
    } catch (error) {
      console.error("Erreur toggle active:", error);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const handleDeleteClick = (member: TeamMember) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete || !cabinetId) return;

    try {
      const { error } = await supabaseClient
        .from("experts_comptables")
        .delete()
        .eq("id", memberToDelete.id);

      if (error) {
        throw error;
      }

      toast.success("Collaborateur supprimé");
      setDeleteDialogOpen(false);
      setMemberToDelete(null);

      // Recharger la liste
      await loadTeamMembers(cabinetId);
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression du collaborateur");
    }
  };

  const getFullName = (member: TeamMember): string => {
    const parts = [member.prenom, member.nom].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : member.email;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="text-sm text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-semibold">Gestion de l'équipe</h1>
          <p className="text-sm text-muted-foreground">
            Invitez et gérez les collaborateurs de votre cabinet
          </p>
        </div>
      </div>

      {/* Section Invitation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Inviter un collaborateur
          </CardTitle>
          <CardDescription>
            Un email d'invitation sera envoyé au collaborateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="invite-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborateur@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-nom">
                  Nom <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="invite-nom"
                  value={inviteNom}
                  onChange={(e) => setInviteNom(e.target.value)}
                  placeholder="Dupont"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-prenom">Prénom</Label>
                <Input
                  id="invite-prenom"
                  value={invitePrenom}
                  onChange={(e) => setInvitePrenom(e.target.value)}
                  placeholder="Jean"
                />
              </div>
            </div>
            <Button type="submit" disabled={isInviting}>
              {isInviting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Envoi...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer l'invitation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Section Équipe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Équipe ({teamMembers.length})
          </CardTitle>
          <CardDescription>
            Liste des membres de votre cabinet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun membre dans l'équipe
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => {
                    const isCurrentUser = member.user_id === currentUserId;
                    const isAdminMember = member.role === "admin";
                    const permissions = member.permissions?.clients || {};
                    const canModify = !isAdminMember && !isCurrentUser;

                    return (
                      <TableRow
                        key={member.id}
                        className={isAdminMember ? "bg-muted/50" : ""}
                      >
                        <TableCell className="font-medium">
                          {getFullName(member)}
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={isAdminMember ? "default" : "secondary"}
                            className={
                              isAdminMember
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                : ""
                            }
                          >
                            {isAdminMember ? "Admin" : "Collaborateur"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={member.is_active ? "default" : "destructive"}
                            className={
                              member.is_active
                                ? "bg-green-100 text-green-700 hover:bg-green-100"
                                : ""
                            }
                          >
                            {member.is_active ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isAdminMember ? (
                            <span className="text-sm text-muted-foreground">
                              Toutes les permissions
                            </span>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={permissions.read ?? false}
                                  onCheckedChange={() =>
                                    handleTogglePermission(
                                      member.id,
                                      "read",
                                      permissions.read ?? false
                                    )
                                  }
                                  disabled={!canModify}
                                />
                                <span className="text-sm">Lecture</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={permissions.write ?? false}
                                  onCheckedChange={() =>
                                    handleTogglePermission(
                                      member.id,
                                      "write",
                                      permissions.write ?? false
                                    )
                                  }
                                  disabled={!canModify}
                                />
                                <span className="text-sm">Écriture</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={permissions.delete ?? false}
                                  onCheckedChange={() =>
                                    handleTogglePermission(
                                      member.id,
                                      "delete",
                                      permissions.delete ?? false
                                    )
                                  }
                                  disabled={!canModify}
                                />
                                <span className="text-sm">Suppression</span>
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {canModify && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleToggleActive(member.id, member.is_active)
                                  }
                                >
                                  {member.is_active ? (
                                    <ToggleLeft className="h-4 w-4" />
                                  ) : (
                                    <ToggleRight className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteClick(member)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {!canModify && (
                              <span className="text-xs text-muted-foreground">
                                {isCurrentUser ? "Vous" : "Non modifiable"}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmation suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le collaborateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {memberToDelete ? getFullName(memberToDelete) : ""} de l'équipe ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

