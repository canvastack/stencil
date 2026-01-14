import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Category, CategoryListItem, CategoryTreeNode } from '@/types/cms';

interface CategoryFilters {
  search?: string;
  parent_id?: string | null;
}

interface CategoryState {
  categories: CategoryListItem[];
  categoryTree: CategoryTreeNode[];
  currentCategory: Category | null;
  filters: CategoryFilters;
  expandedNodes: Set<string>;
  selectedCategoryId: string | null;
  isLoading: boolean;
  error: string | null;

  setCategories: (categories: CategoryListItem[]) => void;
  setCategoryTree: (tree: CategoryTreeNode[]) => void;
  setCurrentCategory: (category: Category | null) => void;
  setFilters: (filters: CategoryFilters) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedCategoryId: (id: string | null) => void;
  toggleNode: (nodeId: string) => void;
  expandNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  clearFilters: () => void;
  reset: () => void;
}

const initialState = {
  categories: [],
  categoryTree: [],
  currentCategory: null,
  filters: {},
  expandedNodes: new Set<string>(),
  selectedCategoryId: null,
  isLoading: false,
  error: null,
};

export const useCategoryStore = create<CategoryState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setCategories: (categories) => set({ categories }),
        
        setCategoryTree: (tree) => set({ categoryTree: tree }),
        
        setCurrentCategory: (category) => set({ currentCategory: category }),
        
        setFilters: (filters) => set((state) => ({ 
          filters: { ...state.filters, ...filters } 
        })),
        
        setIsLoading: (isLoading) => set({ isLoading }),
        
        setError: (error) => set({ error }),
        
        setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
        
        toggleNode: (nodeId) => set((state) => {
          const expandedNodes = new Set(state.expandedNodes);
          if (expandedNodes.has(nodeId)) {
            expandedNodes.delete(nodeId);
          } else {
            expandedNodes.add(nodeId);
          }
          return { expandedNodes };
        }),
        
        expandNode: (nodeId) => set((state) => {
          const expandedNodes = new Set(state.expandedNodes);
          expandedNodes.add(nodeId);
          return { expandedNodes };
        }),
        
        collapseNode: (nodeId) => set((state) => {
          const expandedNodes = new Set(state.expandedNodes);
          expandedNodes.delete(nodeId);
          return { expandedNodes };
        }),
        
        expandAll: () => {
          const allNodeIds = new Set<string>();
          const traverseTree = (nodes: CategoryTreeNode[]) => {
            nodes.forEach((node) => {
              allNodeIds.add(node.uuid);
              if (node.children && node.children.length > 0) {
                traverseTree(node.children);
              }
            });
          };
          traverseTree(get().categoryTree);
          set({ expandedNodes: allNodeIds });
        },
        
        collapseAll: () => set({ expandedNodes: new Set<string>() }),
        
        clearFilters: () => set({ filters: {} }),
        
        reset: () => set(initialState),
      }),
      {
        name: 'cms-category-storage',
        partialize: (state) => ({
          filters: state.filters,
          expandedNodes: Array.from(state.expandedNodes),
        }),
        merge: (persistedState: any, currentState) => ({
          ...currentState,
          ...(persistedState as object),
          expandedNodes: new Set(persistedState?.expandedNodes || []),
        }),
      }
    ),
    { name: 'CategoryStore' }
  )
);
