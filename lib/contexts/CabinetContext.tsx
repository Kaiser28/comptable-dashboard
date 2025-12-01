'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Type pour le contexte Cabinet
 */
interface CabinetContextType {
  /** ID du cabinet de l'utilisateur connecté */
  cabinetId: string | null;
  /** État de chargement */
  loading: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** Fonction pour recharger le cabinet_id */
  refetch: () => Promise<void>;
}

/**
 * Context pour le cabinet_id
 */
const CabinetContext = createContext<CabinetContextType | undefined>(undefined);

/**
 * Props pour le Provider
 */
interface CabinetProviderProps {
  children: ReactNode;
}

/**
 * Provider pour le contexte Cabinet
 * Charge automatiquement le cabinet_id au mount via Supabase client
 */
export function CabinetProvider({ children }: CabinetProviderProps) {
  const router = useRouter();
  const [cabinetId, setCabinetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fonction pour charger le cabinet_id depuis Supabase
   */
  const loadCabinetId = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // 1. Récupérer l'utilisateur connecté
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('[CABINET CONTEXT] Erreur récupération utilisateur:', userError);
        setError('Utilisateur non authentifié');
        setLoading(false);
        return;
      }

      // 2. Récupérer le cabinet_id via experts_comptables
      const { data: expertComptable, error: expertError } = await supabase
        .from('experts_comptables')
        .select('cabinet_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (expertError) {
        console.error('[CABINET CONTEXT] Erreur récupération expert_comptable:', expertError);
        setError(`Erreur lors de la récupération du cabinet: ${expertError.message}`);
        setLoading(false);
        return;
      }

      if (!expertComptable || !expertComptable.cabinet_id) {
        console.error('[CABINET CONTEXT] Cabinet non trouvé pour user_id:', user.id);
        setError('Cabinet non trouvé pour cet utilisateur');
        setLoading(false);
        return;
      }

      // 3. Stocker le cabinet_id
      setCabinetId(expertComptable.cabinet_id);
      setLoading(false);
      console.log('[CABINET CONTEXT] Cabinet ID chargé:', expertComptable.cabinet_id);
    } catch (err: any) {
      console.error('[CABINET CONTEXT] Erreur inattendue:', err);
      setError(err?.message || 'Erreur inattendue lors du chargement du cabinet');
      setLoading(false);
    }
  };

  /**
   * Fonction pour recharger le cabinet_id
   */
  const refetch = async () => {
    await loadCabinetId();
  };

  // Charger le cabinet_id au mount
  useEffect(() => {
    void loadCabinetId();
  }, []);

  // Rediriger vers /login si erreur d'authentification
  useEffect(() => {
    if (error && error.includes('non authentifié')) {
      console.log('[CABINET CONTEXT] Redirection vers /login');
      router.push('/login');
    }
  }, [error, router]);

  const value: CabinetContextType = {
    cabinetId,
    loading,
    error,
    refetch,
  };

  return <CabinetContext.Provider value={value}>{children}</CabinetContext.Provider>;
}

/**
 * Hook pour utiliser le contexte Cabinet
 * 
 * @returns {CabinetContextType} Le contexte Cabinet avec cabinetId, loading, error, refetch
 * @throws Error si utilisé en dehors du Provider
 * 
 * @example
 * ```tsx
 * const { cabinetId, loading, error } = useCabinet();
 * 
 * if (loading) return <Skeleton />;
 * if (error) return <Error message={error} />;
 * if (!cabinetId) return <NoCabinet />;
 * 
 * // Utiliser cabinetId pour les queries
 * ```
 */
export function useCabinet(): CabinetContextType {
  const context = useContext(CabinetContext);

  if (context === undefined) {
    throw new Error('useCabinet must be used within a CabinetProvider');
  }

  return context;
}

