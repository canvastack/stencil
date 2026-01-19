import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Comment, CommentListItem, CommentFilters } from '@/types/cms';

type ModerationTab = 'pending' | 'approved' | 'rejected' | 'spam' | 'all';

interface CommentState {
  comments: CommentListItem[];
  currentComment: Comment | null;
  filters: CommentFilters;
  activeTab: ModerationTab;
  selectedCommentIds: string[];
  isLoading: boolean;
  error: string | null;

  setComments: (comments: CommentListItem[]) => void;
  setCurrentComment: (comment: Comment | null) => void;
  setFilters: (filters: CommentFilters) => void;
  setActiveTab: (tab: ModerationTab) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedCommentIds: (ids: string[]) => void;
  toggleCommentSelection: (id: string) => void;
  selectAllComments: () => void;
  clearSelection: () => void;
  clearFilters: () => void;
  reset: () => void;
}

const initialState = {
  comments: [],
  currentComment: null,
  filters: {},
  activeTab: 'pending' as ModerationTab,
  selectedCommentIds: [],
  isLoading: false,
  error: null,
};

export const useCommentStore = create<CommentState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setComments: (comments) => set({ comments }),
        
        setCurrentComment: (comment) => set({ currentComment: comment }),
        
        setFilters: (filters) => set((state) => ({ 
          filters: { ...state.filters, ...filters } 
        })),
        
        setActiveTab: (tab) => set({ activeTab: tab, selectedCommentIds: [] }),
        
        setIsLoading: (isLoading) => set({ isLoading }),
        
        setError: (error) => set({ error }),
        
        setSelectedCommentIds: (ids) => set({ selectedCommentIds: ids }),
        
        toggleCommentSelection: (id) => set((state) => ({
          selectedCommentIds: state.selectedCommentIds.includes(id)
            ? state.selectedCommentIds.filter((selectedId) => selectedId !== id)
            : [...state.selectedCommentIds, id],
        })),
        
        selectAllComments: () => set((state) => ({
          selectedCommentIds: state.comments.map((comment) => comment.uuid),
        })),
        
        clearSelection: () => set({ selectedCommentIds: [] }),
        
        clearFilters: () => set({ filters: {} }),
        
        reset: () => set(initialState),
      }),
      {
        name: 'cms-comment-storage',
        partialize: (state) => ({
          filters: state.filters,
          activeTab: state.activeTab,
        }),
      }
    ),
    { name: 'CommentStore' }
  )
);
