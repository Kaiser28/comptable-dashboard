'use client';

import { useEffect, useState } from "react";
import { Users, CheckCircle, Clock, FileText, ArrowUp, ArrowDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabaseClient } from "@/lib/supabase";

type StatsData = {
  totalClients: number;
  totalClientsPrevious: number;
  activeClients: number;
  activeClientsPrevious: number;
  pendingClients: number;
  pendingClientsPrevious: number;
  documentsGenerated: number;
  documentsGeneratedPrevious: number;
};

type ChartData = {
  date: string;
  count: number;
}[];

type ActivityItem = {
  type: 'client_created' | 'form_completed' | 'document_generated';
  clientName: string;
  timestamp: string;
};

export default function DashboardStats() {
  const [isLoading, setIsLoading] = useState(true);
  const [cabinetId, setCabinetId] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [chartData, setChartData] = useState<ChartData>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);

        // Récupérer l'utilisateur actuel
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) {
          toast.error("Erreur d'authentification");
          return;
        }

        // ACPM mono-tenant : pas besoin de cabinet_id
        // RLS gère automatiquement les permissions

        // Calculer les dates pour la comparaison (30 jours)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Fetch toutes les stats en parallèle
        const [
          totalClientsResult,
          totalClientsPreviousResult,
          activeClientsResult,
          activeClientsPreviousResult,
          pendingClientsResult,
          pendingClientsPreviousResult,
          documentsResult,
          documentsPreviousResult,
          chartDataResult,
          activityResult,
        ] = await Promise.all([
          // Total clients actuel
          supabaseClient
            .from("clients")
            .select("id", { count: "exact", head: true })
,
          
          // Total clients il y a 30 jours
          supabaseClient
            .from("clients")
            .select("id", { count: "exact", head: true })

            .lte("created_at", thirtyDaysAgo.toISOString()),
          
          // Clients actifs (formulaire rempli)
          supabaseClient
            .from("clients")
            .select("id", { count: "exact", head: true })

            .ilike("statut", "%formulaire rempli%"),
          
          // Clients actifs il y a 30 jours
          supabaseClient
            .from("clients")
            .select("id", { count: "exact", head: true })

            .ilike("statut", "%formulaire rempli%")
            .lte("created_at", thirtyDaysAgo.toISOString()),
          
          // Clients en attente
          supabaseClient
            .from("clients")
            .select("id", { count: "exact", head: true })

            .ilike("statut", "%en attente%"),
          
          // Clients en attente il y a 30 jours
          supabaseClient
            .from("clients")
            .select("id", { count: "exact", head: true })

            .ilike("statut", "%en attente%")
            .lte("created_at", thirtyDaysAgo.toISOString()),
          
          // Documents générés (on utilise une approximation basée sur les clients avec statuts générés)
          supabaseClient
            .from("clients")
            .select("id", { count: "exact", head: true })

            .ilike("statut", "%statuts générés%"),
          
          // Documents générés il y a 30 jours
          supabaseClient
            .from("clients")
            .select("id", { count: "exact", head: true })

            .ilike("statut", "%statuts générés%")
            .lte("updated_at", thirtyDaysAgo.toISOString()),
          
          // Données pour le graphique (7 derniers jours)
          supabaseClient
            .from("clients")
            .select("created_at")

            .gte("created_at", sevenDaysAgo.toISOString()),
          
          // Activité récente (5 dernières actions)
          supabaseClient
            .from("clients")
            .select("nom_entreprise, statut, created_at, updated_at, formulaire_complete")

            .order("created_at", { ascending: false })
            .limit(10),
        ]);

        // Traiter les résultats
        const statsData: StatsData = {
          totalClients: totalClientsResult.count || 0,
          totalClientsPrevious: totalClientsPreviousResult.count || 0,
          activeClients: activeClientsResult.count || 0,
          activeClientsPrevious: activeClientsPreviousResult.count || 0,
          pendingClients: pendingClientsResult.count || 0,
          pendingClientsPrevious: pendingClientsPreviousResult.count || 0,
          documentsGenerated: documentsResult.count || 0,
          documentsGeneratedPrevious: documentsPreviousResult.count || 0,
        };

        setStats(statsData);

        // Traiter les données du graphique
        if (chartDataResult.data) {
          const dailyCounts: Record<string, number> = {};
          
          chartDataResult.data.forEach((client) => {
            const date = new Date(client.created_at).toLocaleDateString("fr-FR", {
              weekday: "short",
              day: "numeric",
            });
            dailyCounts[date] = (dailyCounts[date] || 0) + 1;
          });

          const formattedChartData: ChartData = Object.entries(dailyCounts)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => {
              // Trier par date (approximation simple)
              return a.date.localeCompare(b.date);
            });

          setChartData(formattedChartData);
        }

        // Traiter l'activité récente
        if (activityResult.data) {
          const activities: ActivityItem[] = [];
          
          activityResult.data.forEach((client) => {
            // Client créé
            activities.push({
              type: 'client_created',
              clientName: client.nom_entreprise,
              timestamp: client.created_at,
            });

            // Formulaire complété
            if (client.formulaire_complete && client.updated_at !== client.created_at) {
              activities.push({
                type: 'form_completed',
                clientName: client.nom_entreprise,
                timestamp: client.updated_at,
              });
            }

            // Document généré
            if (client.statut?.toLowerCase().includes("statuts générés")) {
              activities.push({
                type: 'document_generated',
                clientName: client.nom_entreprise,
                timestamp: client.updated_at,
              });
            }
          });

          // Trier par timestamp et prendre les 5 plus récents
          const sortedActivities = activities
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5);

          setRecentActivity(sortedActivities);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error);
        toast.error("Erreur lors du chargement des statistiques");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStats();
  }, []);

  const calculateVariation = (current: number, previous: number): { percentage: number; trend: 'up' | 'down' | 'stable' } => {
    if (previous === 0) {
      return current > 0 ? { percentage: 100, trend: 'up' } : { percentage: 0, trend: 'stable' };
    }
    
    const percentage = Math.round(((current - previous) / previous) * 100);
    
    if (percentage > 0) return { percentage, trend: 'up' };
    if (percentage < 0) return { percentage: Math.abs(percentage), trend: 'down' };
    return { percentage: 0, trend: 'stable' };
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return "il y a moins d'1h";
    }
    if (diffHours < 24) {
      return `il y a ${diffHours}h`;
    }
    if (diffDays === 1) {
      return "il y a 1 jour";
    }
    return `il y a ${diffDays} jours`;
  };

  const getActivityLabel = (type: ActivityItem['type']): string => {
    switch (type) {
      case 'client_created':
        return 'Client créé';
      case 'form_completed':
        return 'Formulaire rempli';
      case 'document_generated':
        return 'Document généré';
      default:
        return 'Action';
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const totalVariation = calculateVariation(stats.totalClients, stats.totalClientsPrevious);
  const activeVariation = calculateVariation(stats.activeClients, stats.activeClientsPrevious);
  const pendingVariation = calculateVariation(stats.pendingClients, stats.pendingClientsPrevious);
  const documentsVariation = calculateVariation(stats.documentsGenerated, stats.documentsGeneratedPrevious);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 - Total Clients */}
        <Card className="border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300 hover:scale-105 animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 uppercase tracking-wide">Total Clients</CardTitle>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white">
              <Users className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 tabular-nums">{stats.totalClients}</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {totalVariation.trend === 'up' && (
                <>
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600 font-medium">{totalVariation.percentage}%</span>
                </>
              )}
              {totalVariation.trend === 'down' && (
                <>
                  <ArrowDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600 font-medium">{totalVariation.percentage}%</span>
                </>
              )}
              {totalVariation.trend === 'stable' && (
                <span>Stable</span>
              )}
              <span>vs 30j</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 - Clients Actifs */}
        <Card className="border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300 hover:scale-105 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 uppercase tracking-wide">Clients Actifs</CardTitle>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
              <CheckCircle className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 tabular-nums">{stats.activeClients}</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {activeVariation.trend === 'up' && (
                <>
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600 font-medium">{activeVariation.percentage}%</span>
                </>
              )}
              {activeVariation.trend === 'down' && (
                <>
                  <ArrowDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600 font-medium">{activeVariation.percentage}%</span>
                </>
              )}
              {activeVariation.trend === 'stable' && (
                <span className="text-slate-500">Stable</span>
              )}
              <span className="text-slate-500">vs 30j</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 - En Attente */}
        <Card className="border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300 hover:scale-105 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 uppercase tracking-wide">En Attente</CardTitle>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-white">
              <Clock className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 tabular-nums">{stats.pendingClients}</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {pendingVariation.trend === 'up' && (
                <>
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600 font-medium">{pendingVariation.percentage}%</span>
                </>
              )}
              {pendingVariation.trend === 'down' && (
                <>
                  <ArrowDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600 font-medium">{pendingVariation.percentage}%</span>
                </>
              )}
              {pendingVariation.trend === 'stable' && (
                <span className="text-slate-500">Stable</span>
              )}
              <span className="text-slate-500">vs 30j</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4 - Documents Générés */}
        <Card className="border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300 hover:scale-105 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 uppercase tracking-wide">Documents Générés</CardTitle>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white">
              <FileText className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 tabular-nums">{stats.documentsGenerated}</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {documentsVariation.trend === 'up' && (
                <>
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600 font-medium">{documentsVariation.percentage}%</span>
                </>
              )}
              {documentsVariation.trend === 'down' && (
                <>
                  <ArrowDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600 font-medium">{documentsVariation.percentage}%</span>
                </>
              )}
              {documentsVariation.trend === 'stable' && (
                <span className="text-slate-500">Stable</span>
              )}
              <span className="text-slate-500">vs 30j</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique et Timeline */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Graphique Évolution */}
        <Card>
          <CardHeader>
            <CardTitle>Clients créés - 7 derniers jours</CardTitle>
            <CardDescription>Évolution du nombre de clients créés</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis
                    dataKey="date"
                    style={{ fontSize: '12px' }}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    style={{ fontSize: '12px' }}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Aucune donnée sur les 7 derniers jours
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline Activité Récente */}
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>5 dernières actions du cabinet</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3 overflow-y-auto max-h-[300px]">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground">•</span>
                    <div className="flex-1">
                      <span className="font-medium">{getActivityLabel(activity.type)}</span>
                      {' '}
                      <span className="text-muted-foreground">{activity.clientName}</span>
                      {' '}
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                Aucune activité récente
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

