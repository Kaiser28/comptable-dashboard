'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Type pour le contexte Cabinet (ACPM mono-tenant)
 * Cabinet ID n'est plus nécessaire car mono-tenant
 */
interface CabinetContextType {
  /** Toujours true pour mono-tenant */
  loading: boolean;
  /** Toujours null pour mono-tenant */
  error: string | null;
}

/**
 * Context pour le cabinet (simplifié pour mono-tenant)
 */
const CabinetContext = createContext<CabinetContextType | undefined>(undefined);

/**
 * Props pour le Provider
 */
interface CabinetProviderProps {
  children: ReactNode;
}

/**
 * Provider pour le contexte Cabinet (ACPM mono-tenant)
 * Plus besoin de charger cabinet_id car mono-tenant
 */
export function CabinetProvider({ children }: CabinetProviderProps) {
  const value: CabinetContextType = {
    loading: false,
    error: null,
  };

  return <CabinetContext.Provider value={value}>{children}</CabinetContext.Provider>;
}

/**
 * Hook pour utiliser le contexte Cabinet (ACPM mono-tenant)
 * 
 * @returns {CabinetContextType} Le contexte Cabinet simplifié
 * @throws Error si utilisé en dehors du Provider
 * 
 * @example
 * ```tsx
 * const { loading, error } = useCabinet();
 * // Plus besoin de cabinetId pour ACPM mono-tenant
 * ```
 */
export function useCabinet(): CabinetContextType {
  const context = useContext(CabinetContext);

  if (context === undefined) {
    throw new Error('useCabinet must be used within a CabinetProvider');
  }

  return context;
}

