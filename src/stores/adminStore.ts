import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
}

interface AdminState {
  user: User | null;
  sidebarCollapsed: boolean;
  currentPage: string;
  
  // Actions
  setUser: (user: User | null) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentPage: (page: string) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      user: null,
      sidebarCollapsed: false,
      currentPage: 'dashboard',

      setUser: (user) => set({ user }),
      
      toggleSidebar: () => 
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      setSidebarCollapsed: (collapsed) => 
        set({ sidebarCollapsed: collapsed }),
      
      setCurrentPage: (page) => 
        set({ currentPage: page }),
      
      logout: () => 
        set({ user: null, currentPage: 'dashboard' }),
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({ 
        sidebarCollapsed: state.sidebarCollapsed 
      }),
    }
  )
);
