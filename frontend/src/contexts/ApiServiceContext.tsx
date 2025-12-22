import React, { createContext, useContext, useMemo } from 'react';
import { apiServices } from '@/services/api';

interface ApiServiceContextType {
  services: typeof apiServices;
}

const ApiServiceContext = createContext<ApiServiceContextType | undefined>(undefined);

interface ApiServiceProviderProps {
  children: React.ReactNode;
}

export const ApiServiceProvider: React.FC<ApiServiceProviderProps> = ({ children }) => {
  const value = useMemo<ApiServiceContextType>(() => ({
    services: apiServices,
  }), []);

  return (
    <ApiServiceContext.Provider value={value}>
      {children}
    </ApiServiceContext.Provider>
  );
};

export const useApiServices = () => {
  const context = useContext(ApiServiceContext);
  if (context === undefined) {
    throw new Error('useApiServices must be used within ApiServiceProvider');
  }
  return context.services;
};

export const useAuth = () => {
  const services = useApiServices();
  return services.auth;
};

export const useOrders = () => {
  const services = useApiServices();
  return services.orders;
};

export const useCustomers = () => {
  const services = useApiServices();
  return services.customers;
};

export const useVendors = () => {
  const services = useApiServices();
  return services.vendors;
};
