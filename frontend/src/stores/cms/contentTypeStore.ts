import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ContentType, ContentTypeListItem } from '@/types/cms';

interface ContentTypeFilters {
  search?: string;
  status?: 'active' | 'inactive';
}

interface ContentTypeState {
  contentTypes: ContentTypeListItem[];
  currentContentType: ContentType | null;
  filters: ContentTypeFilters;
  isLoading: boolean;
  error: string | null;

  setContentTypes: (contentTypes: ContentTypeListItem[]) => void;
  setCurrentContentType: (contentType: ContentType | null) => void;
  setFilters: (filters: ContentTypeFilters) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearFilters: () => void;
  reset: () => void;
}

const initialState = {
  contentTypes: [],
  currentContentType: null,
  filters: {},
  isLoading: false,
  error: null,
};

export const useContentTypeStore = create<ContentTypeState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setContentTypes: (contentTypes) => set({ contentTypes }),
        
        setCurrentContentType: (contentType) => set({ currentContentType: contentType }),
        
        setFilters: (filters) => set((state) => ({ 
          filters: { ...state.filters, ...filters } 
        })),
        
        setIsLoading: (isLoading) => set({ isLoading }),
        
        setError: (error) => set({ error }),
        
        clearFilters: () => set({ filters: {} }),
        
        reset: () => set(initialState),
      }),
      {
        name: 'cms-content-type-storage',
        partialize: (state) => ({
          filters: state.filters,
        }),
      }
    ),
    { name: 'ContentTypeStore' }
  )
);
