import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Content, ContentListItem, ContentFilters } from '@/types/cms';

type EditorMode = 'wysiwyg' | 'markdown';

interface ContentState {
  contents: ContentListItem[];
  currentContent: Content | null;
  filters: ContentFilters;
  editorMode: EditorMode;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  selectedContentIds: string[];

  setContents: (contents: ContentListItem[]) => void;
  setCurrentContent: (content: Content | null) => void;
  setFilters: (filters: ContentFilters) => void;
  setEditorMode: (mode: EditorMode) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedContentIds: (ids: string[]) => void;
  toggleContentSelection: (id: string) => void;
  selectAllContents: () => void;
  clearSelection: () => void;
  clearFilters: () => void;
  reset: () => void;
}

const initialState = {
  contents: [],
  currentContent: null,
  filters: {},
  editorMode: 'wysiwyg' as EditorMode,
  isLoading: false,
  isSaving: false,
  error: null,
  selectedContentIds: [],
};

export const useContentStore = create<ContentState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setContents: (contents) => set({ contents }),
        
        setCurrentContent: (content) => set({ currentContent: content }),
        
        setFilters: (filters) => set((state) => ({ 
          filters: { ...state.filters, ...filters } 
        })),
        
        setEditorMode: (mode) => set({ editorMode: mode }),
        
        setIsLoading: (isLoading) => set({ isLoading }),
        
        setIsSaving: (isSaving) => set({ isSaving }),
        
        setError: (error) => set({ error }),
        
        setSelectedContentIds: (ids) => set({ selectedContentIds: ids }),
        
        toggleContentSelection: (id) => set((state) => ({
          selectedContentIds: state.selectedContentIds.includes(id)
            ? state.selectedContentIds.filter((selectedId) => selectedId !== id)
            : [...state.selectedContentIds, id],
        })),
        
        selectAllContents: () => set((state) => ({
          selectedContentIds: state.contents.map((content) => content.uuid),
        })),
        
        clearSelection: () => set({ selectedContentIds: [] }),
        
        clearFilters: () => set({ filters: {} }),
        
        reset: () => set(initialState),
      }),
      {
        name: 'cms-content-storage',
        partialize: (state) => ({
          filters: state.filters,
          editorMode: state.editorMode,
        }),
      }
    ),
    { name: 'ContentStore' }
  )
);
