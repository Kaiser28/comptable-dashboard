'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Building2 } from 'lucide-react';

interface Client {
  id: string;
  denomination: string;
  siret: string | null;
  forme_juridique: string | null;
  email: string | null;
  telephone: string | null;
  ville: string | null;
  created_at: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[CLIENTS] Erreur:', fetchError);
        setError('Erreur lors du chargement des clients');
        return;
      }

      setClients(data || []);
    } catch (err) {
      console.error('[CLIENTS] Erreur:', err);
      setError('Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Chargement des clients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Gérez vos clients et leurs dossiers
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/clients/new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouveau client
        </Button>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Aucun client pour le moment</p>
            <Button onClick={() => router.push('/dashboard/clients/new')}>
              Créer votre premier client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => router.push(`/dashboard/clients/${client.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {client.denomination}
                </CardTitle>
                <CardDescription>
                  {client.forme_juridique && (
                    <span className="mr-4">{client.forme_juridique}</span>
                  )}
                  {client.siret && (
                    <span className="text-xs">SIRET: {client.siret}</span>
                  )}
                </CardDescription>
              </CardHeader>
              {(client.email || client.telephone || client.ville) && (
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {client.email && <p>📧 {client.email}</p>}
                    {client.telephone && <p>📞 {client.telephone}</p>}
                    {client.ville && <p>📍 {client.ville}</p>}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
