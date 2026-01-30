import { useState, useCallback } from 'react';

interface UseDeleteLoadingOptions {
  onDelete?: (id: string) => Promise<void>;
  onSuccess?: (id: string) => void;
  onError?: (id: string, error: any) => void;
}

export const useDeleteLoading = (options: UseDeleteLoadingOptions = {}) => {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const isDeleting = useCallback((id: string) => {
    return deletingIds.has(id);
  }, [deletingIds]);

  const startDelete = useCallback((id: string) => {
    setDeletingIds(prev => new Set(prev).add(id));
  }, []);

  const endDelete = useCallback((id: string) => {
    setDeletingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (deletingIds.has(id)) {
      return; // Already deleting
    }

    try {
      startDelete(id);
      
      if (options.onDelete) {
        await options.onDelete(id);
      }
      
      options.onSuccess?.(id);
    } catch (error) {
      console.error(`Delete failed for ID ${id}:`, error);
      options.onError?.(id, error);
    } finally {
      endDelete(id);
    }
  }, [deletingIds, startDelete, endDelete, options]);

  const clearAll = useCallback(() => {
    setDeletingIds(new Set());
  }, []);

  return {
    deletingIds,
    isDeleting,
    startDelete,
    endDelete,
    handleDelete,
    clearAll,
  };
};

export default useDeleteLoading;