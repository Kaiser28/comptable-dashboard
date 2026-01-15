'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Users, 
  UserCog, 
  Mail, 
  Shield, 
  CheckCircle2, 
  XCircle,
  Edit,
  Key,
  ArrowLeft,
  Activity
} from 'lucide-react';
import { ACPM_CONFIG } from '@/lib/acpm-config';
import {
  getCurrentUser,
  getAllUsers,
  updateUser,
  sendPasswordResetEmail,
  formatUserName,
  getRoleBadgeColor,
  getRoleLabel,
  logAction,
  type AcpmUser
} from '@/lib/acpm-users';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AcpmUser | null>(null);
  const [users, setUsers] = useState<AcpmUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<AcpmUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state pour édition
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    role: 'collaborateur' as 'admin' | 'collaborateur',
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Vérifier que l'utilisateur est admin
      const user = await getCurrentUser();
      setCurrentUser(user);

      if (!user || user.role !== 'admin') {
        toast.error('Accès refusé', {
          description: 'Vous devez être administrateur pour accéder à cette page',
        });
        router.push('/dashboard');
        return;
      }

      // Charger tous les utilisateurs
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur', {
        description: 'Impossible de charger les utilisateurs',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: AcpmUser) => {
    setEditingUser(user);
    setFormData({
      nom: user.nom,
      prenom: user.prenom,
      telephone: user.telephone || '',
      role: user.role,
      is_active: user.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const result = await updateUser(editingUser.id, formData);

      if (result.success) {
        toast.success('Utilisateur mis à jour', {
          description: `${formatUserName(formData)} a été modifié avec succès`,
        });
        await logAction('update_user', 'user', editingUser.id, formData);
        setIsEditDialogOpen(false);
        loadData(); // Recharger la liste
      } else {
        toast.error('Erreur', {
          description: result.error || 'Impossible de mettre à jour l\'utilisateur',
        });
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error('Erreur', {
        description: 'Une erreur est survenue',
      });
    }
  };

  const handleResetPassword = async (userEmail: string) => {
    try {
      const result = await sendPasswordResetEmail(userEmail);

      if (result.success) {
        toast.success('Email envoyé', {
          description: `Un email de réinitialisation a été envoyé à ${userEmail}`,
        });
        await logAction('reset_password_request', 'user', userEmail);
      } else {
        toast.error('Erreur', {
          description: result.error || 'Impossible d\'envoyer l\'email',
        });
      }
    } catch (error) {
      console.error('Erreur reset password:', error);
      toast.error('Erreur', {
        description: 'Une erreur est survenue',
      });
    }
  };

  if (loading) {
    return (
      <div className=\"min-h-screen flex items-center justify-center bg-gray-50\">
        <div className=\"text-center\">
          <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4\" style={{ borderColor: ACPM_CONFIG.branding.colors.primary }} />
          <p className=\"text-gray-600\">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className=\"min-h-screen bg-gray-50\">
      {/* Header */}
      <header className=\"bg-white border-b border-gray-200\">
        <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6\">
          <div className=\"flex items-center justify-between\">
            <div className=\"flex items-center gap-4\">
              <Image 
                src={ACPM_CONFIG.branding.logo.light}
                alt={ACPM_CONFIG.cabinet.name}
                width={40}
                height={40}
                className=\"object-contain\"
              />
              <div>
                <h1 className=\"text-2xl font-bold text-gray-900\">{ACPM_CONFIG.app.name}</h1>
                <p className=\"text-sm text-gray-600\">Administration - Gestion des utilisateurs</p>
              </div>
            </div>
            <Button 
              variant=\"outline\" 
              onClick={() => router.push('/dashboard')}
              className=\"flex items-center gap-2\"
            >
              <ArrowLeft className=\"h-4 w-4\" />
              Retour au dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">
        {/* Stats */}
        <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6 mb-8\">
          <Card>
            <CardHeader className=\"flex flex-row items-center justify-between space-y-0 pb-2\">
              <CardTitle className=\"text-sm font-medium\">Total utilisateurs</CardTitle>
              <Users className=\"h-4 w-4 text-muted-foreground\" />
            </CardHeader>
            <CardContent>
              <div className=\"text-2xl font-bold\">{users.length}</div>
              <p className=\"text-xs text-muted-foreground\">
                {users.filter(u => u.is_active).length} actifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className=\"flex flex-row items-center justify-between space-y-0 pb-2\">
              <CardTitle className=\"text-sm font-medium\">Administrateurs</CardTitle>
              <Shield className=\"h-4 w-4 text-muted-foreground\" />
            </CardHeader>
            <CardContent>
              <div className=\"text-2xl font-bold\">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <p className=\"text-xs text-muted-foreground\">Accès complet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className=\"flex flex-row items-center justify-between space-y-0 pb-2\">
              <CardTitle className=\"text-sm font-medium\">Collaborateurs</CardTitle>
              <UserCog className=\"h-4 w-4 text-muted-foreground\" />
            </CardHeader>
            <CardContent>
              <div className=\"text-2xl font-bold\">
                {users.filter(u => u.role === 'collaborateur').length}
              </div>
              <p className=\"text-xs text-muted-foreground\">Accès standard</p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des utilisateurs */}
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center gap-2\">
              <Users className=\"h-5 w-5\" />
              Utilisateurs ACPM
            </CardTitle>
            <CardDescription>
              Gérer les accès et informations des utilisateurs de la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className=\"space-y-4\">
              {users.map((user) => (
                <div 
                  key={user.id}
                  className=\"flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow\"
                  style={{ borderColor: user.role === 'admin' ? ACPM_CONFIG.branding.colors.primary + '40' : '#e5e7eb' }}
                >
                  <div className=\"flex-1\">
                    <div className=\"flex items-center gap-3 mb-2\">
                      <h3 className=\"font-semibold text-gray-900\">
                        {formatUserName(user)}
                      </h3>
                      <Badge 
                        style={{ 
                          backgroundColor: getRoleBadgeColor(user.role), 
                          color: 'white' 
                        }}
                      >
                        {getRoleLabel(user.role)}
                      </Badge>
                      {user.is_active ? (
                        <CheckCircle2 className=\"h-4 w-4\" style={{ color: ACPM_CONFIG.branding.colors.success }} />
                      ) : (
                        <XCircle className=\"h-4 w-4 text-gray-400\" />
                      )}
                    </div>
                    <div className=\"flex items-center gap-4 text-sm text-gray-600\">
                      <span className=\"flex items-center gap-1\">
                        <Mail className=\"h-3 w-3\" />
                        {user.email}
                      </span>
                      {user.telephone && (
                        <span>{user.telephone}</span>
                      )}
                    </div>
                  </div>

                  <div className=\"flex items-center gap-2\">
                    <Button
                      variant=\"outline\"
                      size=\"sm\"
                      onClick={() => handleEditClick(user)}
                      className=\"flex items-center gap-1\"
                    >
                      <Edit className=\"h-3 w-3\" />
                      Modifier
                    </Button>
                    <Button
                      variant=\"outline\"
                      size=\"sm\"
                      onClick={() => handleResetPassword(user.email)}
                      className=\"flex items-center gap-1\"
                    >
                      <Key className=\"h-3 w-3\" />
                      Reset MDP
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Dialog Edition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifier les informations de {editingUser && formatUserName(editingUser)}
            </DialogDescription>
          </DialogHeader>
          
          <div className=\"space-y-4 py-4\">
            <div className=\"grid grid-cols-2 gap-4\">
              <div>
                <Label htmlFor=\"prenom\">Prénom</Label>
                <Input
                  id=\"prenom\"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor=\"nom\">Nom</Label>
                <Input
                  id=\"nom\"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor=\"telephone\">Téléphone (optionnel)</Label>
              <Input
                id=\"telephone\"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder=\"+33 6 12 34 56 78\"
              />
            </div>

            <div>
              <Label htmlFor=\"role\">Rôle</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: 'admin' | 'collaborateur') => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=\"admin\">Administrateur</SelectItem>
                  <SelectItem value=\"collaborateur\">Collaborateur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className=\"flex items-center space-x-2\">
              <input
                type=\"checkbox\"
                id=\"is_active\"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className=\"rounded\"
              />
              <Label htmlFor=\"is_active\" className=\"cursor-pointer\">
                Compte actif
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant=\"outline\" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSaveUser}
              style={{ backgroundColor: ACPM_CONFIG.branding.colors.primary }}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
