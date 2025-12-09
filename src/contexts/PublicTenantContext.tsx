import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export interface PublicTenantContextType {
  tenantSlug: string | null;
  tenantId: string | null;
  tenantData: any | null;
  isLoading: boolean;
  error: string | null;
  setTenantFromUrl: (slug: string) => void;
}

const PublicTenantContext = createContext<PublicTenantContextType | undefined>(undefined);

interface PublicTenantProviderProps {
  children: ReactNode;
}

export const PublicTenantProvider: React.FC<PublicTenantProviderProps> = ({ children }) => {
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantData, setTenantData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const location = useLocation();

  const extractTenantFromUrl = (pathname: string): string | null => {
    const pathSegments = pathname.split('/').filter(segment => segment);
    const reservedRoutes = ['admin', 'platform', 'login', 'register', 'forgot-password', 'reset-password', 'verify-email'];
    
    if (pathSegments.length > 0 && !reservedRoutes.includes(pathSegments[0])) {
      const potentialTenantSlug = pathSegments[0];
      if (/^[a-zA-Z0-9\-_]+$/.test(potentialTenantSlug)) {
        return potentialTenantSlug;
      }
    }
    return null;
  };

  const fetchTenantData = async (slug: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const mockTenantData = {
        id: `tenant-${slug}`,
        slug: slug,
        name: slug.charAt(0).toUpperCase() + slug.slice(1).replace('-', ' '),
        domain: null,
        status: 'active'
      };
      
      setTenantData(mockTenantData);
      setTenantId(mockTenantData.id);
      
    } catch (err) {
      setError(`Failed to load tenant data for ${slug}`);
      console.error('PublicTenantContext: Failed to fetch tenant data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const currentTenantSlug = extractTenantFromUrl(location.pathname);
    
    if (currentTenantSlug && currentTenantSlug !== tenantSlug) {
      console.log('PublicTenantContext: Detected tenant slug from URL:', currentTenantSlug);
      setTenantSlug(currentTenantSlug);
      fetchTenantData(currentTenantSlug);
    } else if (!currentTenantSlug && tenantSlug) {
      setTenantSlug(null);
      setTenantId(null);
      setTenantData(null);
      setError(null);
    }
  }, [location.pathname, tenantSlug]);

  const setTenantFromUrl = (slug: string) => {
    setTenantSlug(slug);
    fetchTenantData(slug);
  };

  const value: PublicTenantContextType = {
    tenantSlug,
    tenantId,
    tenantData,
    isLoading,
    error,
    setTenantFromUrl,
  };

  return (
    <PublicTenantContext.Provider value={value}>
      {children}
    </PublicTenantContext.Provider>
  );
};

export const usePublicTenant = () => {
  const context = useContext(PublicTenantContext);
  if (context === undefined) {
    throw new Error('usePublicTenant must be used within a PublicTenantProvider');
  }
  return context;
};