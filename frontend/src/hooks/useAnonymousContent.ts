import { useState, useEffect, useCallback } from 'react';
import { anonymousApiClient, AnonymousApiResponse } from '@/services/api/anonymousApiClient';
import { useGlobalContext } from '@/contexts/GlobalContext';

export interface UseAnonymousContentOptions {
  /** Whether to automatically fetch content when hook is called */
  autoFetch?: boolean;
  /** Whether to show fallback content when API fails */
  useFallback?: boolean;
  /** Cache duration in milliseconds */
  cacheDuration?: number;
}

export interface UseAnonymousContentReturn<T> {
  /** Content data */
  content: T | null;
  /** Whether content is loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Whether using fallback content */
  isFallback: boolean;
  /** Manually refetch content */
  refetch: () => Promise<void>;
  /** Clear content and error state */
  clear: () => void;
}

const DEFAULT_OPTIONS: UseAnonymousContentOptions = {
  autoFetch: true,
  useFallback: true,
  cacheDuration: 5 * 60 * 1000 // 5 minutes
};

// Simple in-memory cache for anonymous content
const contentCache = new Map<string, { data: any; timestamp: number }>();

export const useAnonymousContent = <T = any>(
  contentType: string,
  slug?: string,
  options: UseAnonymousContentOptions = DEFAULT_OPTIONS
): UseAnonymousContentReturn<T> => {
  const [content, setContent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  
  const globalContext = useGlobalContext();
  const config = { ...DEFAULT_OPTIONS, ...options };

  // Create cache key
  const cacheKey = slug ? `${contentType}-${slug}` : contentType;

  // Check if we have cached content
  const getCachedContent = useCallback((): T | null => {
    if (!config.cacheDuration) return null;
    
    const cached = contentCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < config.cacheDuration) {
      console.log(`useAnonymousContent: Using cached content for ${cacheKey}`);
      return cached.data;
    }
    
    return null;
  }, [cacheKey, config.cacheDuration]);

  // Cache content
  const setCachedContent = useCallback((data: T) => {
    if (config.cacheDuration) {
      contentCache.set(cacheKey, { data, timestamp: Date.now() });
    }
  }, [cacheKey, config.cacheDuration]);

  // Fetch content from API
  const fetchContent = useCallback(async (): Promise<void> => {
    // Only fetch for anonymous users or when explicitly requested
    if (globalContext.userType !== 'anonymous' && config.autoFetch) {
      console.log('useAnonymousContent: Not anonymous user, skipping fetch');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setIsFallback(false);

      // Check cache first
      const cachedContent = getCachedContent();
      if (cachedContent) {
        setContent(cachedContent);
        setIsLoading(false);
        return;
      }

      console.log(`useAnonymousContent: Fetching ${contentType}${slug ? `/${slug}` : ''}`);
      
      const response: AnonymousApiResponse<T> = await anonymousApiClient.getPlatformContent<T>(contentType, slug);
      
      if (response.success && response.data) {
        setContent(response.data);
        setCachedContent(response.data);
        console.log(`useAnonymousContent: Successfully fetched ${contentType}`);
      } else if (config.useFallback) {
        console.log(`useAnonymousContent: API returned no data, using fallback for ${contentType}`);
        setIsFallback(true);
        // The anonymous client already handles fallbacks internally
        setContent(response.data);
      } else {
        setError('Content not available');
      }
    } catch (err) {
      console.error(`useAnonymousContent: Error fetching ${contentType}:`, err);
      
      if (config.useFallback) {
        console.log(`useAnonymousContent: Using fallback content due to error for ${contentType}`);
        setIsFallback(true);
        
        // Try to get fallback content from API client
        try {
          const fallbackResponse = await anonymousApiClient.getPlatformContent<T>(contentType, slug);
          setContent(fallbackResponse.data);
        } catch (fallbackError) {
          console.error('useAnonymousContent: Fallback also failed:', fallbackError);
          setError('Content temporarily unavailable');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      }
    } finally {
      setIsLoading(false);
    }
  }, [contentType, slug, globalContext.userType, config, getCachedContent, setCachedContent]);

  // Refetch content
  const refetch = useCallback(async (): Promise<void> => {
    // Clear cache for this content
    contentCache.delete(cacheKey);
    await fetchContent();
  }, [cacheKey, fetchContent]);

  // Clear content
  const clear = useCallback(() => {
    setContent(null);
    setError(null);
    setIsFallback(false);
    contentCache.delete(cacheKey);
  }, [cacheKey]);

  // Auto-fetch content on mount and when dependencies change
  useEffect(() => {
    if (config.autoFetch) {
      fetchContent();
    }
  }, [fetchContent, config.autoFetch]);

  // Clear content when user context changes from anonymous
  useEffect(() => {
    if (globalContext.userType !== 'anonymous') {
      console.log('useAnonymousContent: User no longer anonymous, clearing content');
      clear();
    }
  }, [globalContext.userType, clear]);

  return {
    content,
    isLoading,
    error,
    isFallback,
    refetch,
    clear
  };
};