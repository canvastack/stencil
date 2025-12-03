// Phase 4 CMS Hook for Admin Pages Integration
// Following Hexagonal Architecture + Use Cases patterns

import { useState, useEffect, useCallback } from 'react';
import { cmsService } from '@/services/cms/cmsService';

interface CMSPage {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  description?: string;
  content: Record<string, any>;
  template: string;
  meta_data?: Record<string, any>;
  status: 'draft' | 'published' | 'archived';
  is_homepage: boolean;
  sort_order: number;
  language: string;
  parent_id?: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

interface CMSPageVersion {
  id: number;
  page_id: number;
  version_number: number;
  content: Record<string, any>;
  meta_data?: Record<string, any>;
  change_description?: string;
  created_by: number;
  is_current: boolean;
  created_at: string;
}

interface UseCMSPageOptions {
  enableVersioning?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

interface UseCMSPageReturn {
  page: CMSPage | null;
  content: Record<string, any>;
  versions: CMSPageVersion[];
  loading: boolean;
  saving: boolean;
  error: Error | null;
  hasChanges: boolean;
  
  // Content management
  updateContent: (newContent: Record<string, any>) => void;
  saveChanges: () => Promise<boolean>;
  resetChanges: () => void;
  
  // Page management (following Phase 4 Use Cases)
  createPage: (pageData: {
    title: string;
    slug?: string;
    description?: string;
    content: Record<string, any>;
    template?: string;
    meta_data?: Record<string, any>;
    status?: 'draft' | 'published' | 'archived';
  }) => Promise<boolean>;
  updatePage: (pageData: Partial<CMSPage>) => Promise<boolean>;
  deletePage: () => Promise<boolean>;
  
  // Versioning (Phase 4 Content Versioning)
  loadVersions: () => Promise<void>;
  restoreVersion: (versionId: number) => Promise<boolean>;
  createVersion: (description?: string) => Promise<boolean>;
  
  // Publishing
  publish: () => Promise<boolean>;
  unpublish: () => Promise<boolean>;
  
  // Preview
  getPreviewUrl: () => string;
}

export const useCMSPage = (
  slug: string, 
  options: UseCMSPageOptions = {}
): UseCMSPageReturn => {
  const {
    enableVersioning = true,
    autoSave = false,
    autoSaveDelay = 2000
  } = options;

  // State
  const [page, setPage] = useState<CMSPage | null>(null);
  const [content, setContent] = useState<Record<string, any>>({});
  const [originalContent, setOriginalContent] = useState<Record<string, any>>({});
  const [versions, setVersions] = useState<CMSPageVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // Computed state
  const hasChanges = JSON.stringify(content) !== JSON.stringify(originalContent);

  // Load page data
  const loadPage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await cmsService.getPageBySlug(slug);
      const pageData = response.data;
      
      setPage(pageData);
      setContent(pageData.content);
      setOriginalContent(pageData.content);

      // Load versions if enabled
      if (enableVersioning) {
        try {
          const versionsResponse = await cmsService.getPageVersions(pageData.uuid);
          setVersions(versionsResponse.data);
        } catch (versionError) {
          console.warn('Failed to load page versions:', versionError);
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load page');
      setError(error);
      console.error('Error loading page:', error);
    } finally {
      setLoading(false);
    }
  }, [slug, enableVersioning]);

  // Auto-save logic
  useEffect(() => {
    if (autoSave && hasChanges) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }

      const timer = setTimeout(() => {
        saveChanges();
      }, autoSaveDelay);

      setAutoSaveTimer(timer);

      return () => clearTimeout(timer);
    }
  }, [content, autoSave, autoSaveDelay, hasChanges]);

  // Load page on mount
  useEffect(() => {
    loadPage();
  }, [loadPage]);

  // Content management functions
  const updateContent = useCallback((newContent: Record<string, any>) => {
    setContent(newContent);
  }, []);

  const saveChanges = useCallback(async (): Promise<boolean> => {
    if (!page || !hasChanges) return true;

    try {
      setSaving(true);
      setError(null);

      const response = await cmsService.updatePage(page.uuid, {
        content,
        create_version: enableVersioning,
        change_description: enableVersioning ? 
          `Content updated via admin panel at ${new Date().toLocaleString()}` : 
          undefined
      });

      const updatedPage = response.data;
      setPage(updatedPage);
      setOriginalContent(content);

      // Reload versions if versioning is enabled
      if (enableVersioning) {
        await loadVersions();
      }

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save changes');
      setError(error);
      console.error('Error saving changes:', error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [page, content, hasChanges, enableVersioning]);

  const resetChanges = useCallback(() => {
    setContent(originalContent);
    setError(null);
  }, [originalContent]);

  // Page management functions (Phase 4 Use Cases)
  const createPage = useCallback(async (pageData: {
    title: string;
    slug?: string;
    description?: string;
    content: Record<string, any>;
    template?: string;
    meta_data?: Record<string, any>;
    status?: 'draft' | 'published' | 'archived';
  }): Promise<boolean> => {
    try {
      setSaving(true);
      setError(null);

      const response = await cmsService.createPage(pageData);
      const newPage = response.data;
      
      setPage(newPage);
      setContent(newPage.content);
      setOriginalContent(newPage.content);

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create page');
      setError(error);
      console.error('Error creating page:', error);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const updatePage = useCallback(async (pageData: Partial<CMSPage>): Promise<boolean> => {
    if (!page) return false;

    try {
      setSaving(true);
      setError(null);

      const response = await cmsService.updatePage(page.uuid, pageData);
      const updatedPage = response.data;
      
      setPage(updatedPage);

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update page');
      setError(error);
      console.error('Error updating page:', error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [page]);

  const deletePage = useCallback(async (): Promise<boolean> => {
    if (!page) return false;

    try {
      setSaving(true);
      setError(null);

      await cmsService.deletePage(page.uuid);
      
      // Clear local state
      setPage(null);
      setContent({});
      setOriginalContent({});
      setVersions([]);

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete page');
      setError(error);
      console.error('Error deleting page:', error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [page]);

  // Versioning functions
  const loadVersions = useCallback(async (): Promise<void> => {
    if (!page || !enableVersioning) return;

    try {
      const response = await cmsService.getPageVersions(page.uuid);
      setVersions(response.data);
    } catch (err) {
      console.error('Error loading versions:', err);
    }
  }, [page, enableVersioning]);

  const restoreVersion = useCallback(async (versionNumber: number): Promise<boolean> => {
    if (!page) return false;

    try {
      setSaving(true);
      setError(null);

      const response = await cmsService.restorePageVersion(page.uuid, versionNumber);
      const restoredPage = response.data;
      
      setPage(restoredPage);
      setContent(restoredPage.content);
      setOriginalContent(restoredPage.content);
      
      // Reload versions
      await loadVersions();

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to restore version');
      setError(error);
      console.error('Error restoring version:', error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [page, loadVersions]);

  const createVersion = useCallback(async (description?: string): Promise<boolean> => {
    if (!page) return false;

    return saveChanges();
  }, [page, saveChanges]);

  // Publishing functions
  const publish = useCallback(async (): Promise<boolean> => {
    return updatePage({ 
      status: 'published',
      published_at: new Date().toISOString()
    });
  }, [updatePage]);

  const unpublish = useCallback(async (): Promise<boolean> => {
    return updatePage({ 
      status: 'draft',
      published_at: undefined
    });
  }, [updatePage]);

  // Preview function
  const getPreviewUrl = useCallback((): string => {
    if (!page) return '';
    return `/${page.slug}?preview=true&version=draft`;
  }, [page]);

  return {
    page,
    content,
    versions,
    loading,
    saving,
    error,
    hasChanges,
    
    // Content management
    updateContent,
    saveChanges,
    resetChanges,
    
    // Page management
    createPage,
    updatePage,
    deletePage,
    
    // Versioning
    loadVersions,
    restoreVersion,
    createVersion,
    
    // Publishing
    publish,
    unpublish,
    
    // Preview
    getPreviewUrl,
  };
};