'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, FolderOpen, FileText, Users, PlusCircle } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const [stats, setStats] = useState({
    clients: 0,
    dossiers: 0,
    documents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const supabase = createClient();

      // Compter les clients
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Compter les dossiers
      const { count: dossiersCount } = await supabase
        .from('dossiers')
        .select('*', { count: 'exact', head: true });

      // Compter les documents
      const { count: documentsCount } = await supabase
        .from('documents_generes')
        .select('*', { count: 'exact', head: true });

      setStats({
        clients: clientsCount || 0,
        dossiers: dossiersCount || 0,
        documents: documentsCount || 0,
      });
    } catch (err) {
      console.error('[DASHBOARD] Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Bienvenue {user?.email} ({role})
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.clients}
            </div>
            <p className="text-xs text-muted-foreground">
              Clients enregistrés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dossiers</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.dossiers}
            </div>
            <p className="text-xs text-muted-foreground">
              Dossiers en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.documents}
            </div>
            <p className="text-xs text-muted-foreground">
              Documents générés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>
            Gérez vos clients et dossiers en un clic
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Button
            variant="outline"
            className="h-20 justify-start"
            onClick={() => router.push('/dashboard/clients/new')}
          >
            <div className="flex items-center gap-3">
              <PlusCircle className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Nouveau client</div>
                <div className="text-xs text-muted-foreground">
                  Créer un nouveau client
                </div>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-20 justify-start"
            onClick={() => router.push('/dashboard/clients')}
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Voir les clients</div>
                <div className="text-xs text-muted-foreground">
                  Liste de tous les clients
                </div>
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Informations du cabinet */}
      <Card>
        <CardHeader>
          <CardTitle>Cabinet ACPM</CardTitle>
          <CardDescription>
            Informations du cabinet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Nom :</strong> ACPM Expertise Comptable</p>
            <p><strong>Localisation :</strong> MÉRÉ, Yvelines (78)</p>
            <p><strong>Email :</strong> contact@acpm-expertise.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
