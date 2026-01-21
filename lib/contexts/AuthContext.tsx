'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

/**
 * Type pour le contexte Auth (ACPM mono-tenant)
 */
interface AuthContextType {
  user: User | null;
  role: 'admin' | 'collaborateur' | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

/**
 * Context pour l'authentification
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Props pour le Provider
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider pour le contexte Auth (ACPM mono-tenant)
 * Charge l'utilisateur et son rôle depuis Supabase
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'collaborateur' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      
      // Vérifier l'authentification
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        // Ne pas rediriger pendant le SSR
        if (typeof window !== 'undefined') {
          router.push('/login');
        }
        return;
      }

      setUser(authUser);

      // Récupérer le rôle depuis la table users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('email', authUser.email)
        .single();
      
      if (userError || !userData) {
        console.error('[AUTH CONTEXT] Erreur récupération rôle:', userError);
        setRole('collaborateur'); // Par défaut
      } else {
        setRole(userData.role as 'admin' | 'collaborateur');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('[AUTH CONTEXT] Erreur:', err);
      setError('Erreur lors de la récupération des informations utilisateur');
      setLoading(false);
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
  };

  useEffect(() => {
    loadUser();

    // Écouter les changements d'auth
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        loadUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole(null);
        if (typeof window !== 'undefined') {
          router.push('/login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    role,
    loading,
    error,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook pour utiliser le contexte Auth
 * 
 * @returns {AuthContextType} Le contexte Auth
 * @throws Error si utilisé en dehors du Provider
 * 
 * @example
 * ```tsx
 * const { user, role, loading, signOut } = useAuth();
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
