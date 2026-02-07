import { useState, useEffect } from 'react';
import { quoteService, Quote } from '@/services/tenant/quoteService';
import { handleApiError } from '@/lib/api/error-handler';

interface UseDuplicateQuoteCheckResult {
  checking: boolean;
  hasActiveQuote: boolean;
  existingQuote: Quote | null;
  error: string | null;
}

/**
 * Custom hook to check for existing active quotes for a given order.
 * 
 * This hook prevents duplicate quote creation by checking if an active quote
 * already exists for the specified order. Active quotes are those with status:
 * draft, open, sent, or countered.
 * 
 * @param orderId - UUID of the order to check for existing quotes
 * @returns Object containing checking state, hasActiveQuote flag, existingQuote data, and error
 * 
 * @example
 * ```tsx
 * const { checking, hasActiveQuote, existingQuote } = useDuplicateQuoteCheck(orderId);
 * 
 * if (checking) {
 *   return <LoadingSpinner />;
 * }
 * 
 * if (hasActiveQuote && existingQuote) {
 *   // Open modal in EDIT mode with existing quote
 *   return <QuoteForm mode="edit" initialData={existingQuote} />;
 * } else {
 *   // Open modal in CREATE mode
 *   return <QuoteForm mode="create" />;
 * }
 * ```
 */
export const useDuplicateQuoteCheck = (orderId?: string): UseDuplicateQuoteCheckResult => {
  const [checking, setChecking] = useState(false);
  const [hasActiveQuote, setHasActiveQuote] = useState(false);
  const [existingQuote, setExistingQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state if no orderId provided
    if (!orderId) {
      setChecking(false);
      setHasActiveQuote(false);
      setExistingQuote(null);
      setError(null);
      return;
    }

    let isMounted = true;

    const checkExistingQuote = async () => {
      setChecking(true);
      setError(null);

      try {
        console.log('[useDuplicateQuoteCheck] Starting API call', {
          orderId,
          status: ['draft', 'sent', 'pending_response', 'countered'],
        });
        
        // Call backend API check-existing endpoint
        // This endpoint specifically checks for active quotes
        // Active statuses: draft, sent, pending_response, countered
        // Terminal statuses (not checked): accepted, rejected, expired
        const response = await quoteService.checkExisting({
          order_id: orderId,
          status: ['draft', 'sent', 'pending_response', 'countered'], // Active statuses only
        });

        console.log('[useDuplicateQuoteCheck] API response received', {
          response,
          responseType: typeof response,
          responseKeys: response ? Object.keys(response) : [],
          hasActiveQuote: response?.has_active_quote,
          quote: response?.quote,
        });

        // Only update state if component is still mounted
        if (isMounted) {
          // Response is already { has_active_quote, quote } from quoteService
          console.log('[useDuplicateQuoteCheck] Setting state', {
            hasActiveQuote: response?.has_active_quote || false,
            quote: response?.quote || null,
          });
          
          setHasActiveQuote(response?.has_active_quote || false);
          setExistingQuote(response?.quote || null);
          setChecking(false);
        }
      } catch (err) {
        if (isMounted) {
          const apiError = handleApiError(err);
          setError(apiError.message);
          setHasActiveQuote(false);
          setExistingQuote(null);
          setChecking(false);
          
          // Log error for debugging but don't show toast (non-critical operation)
          console.error('Failed to check for existing quote:', apiError);
        }
      }
    };

    checkExistingQuote();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  return {
    checking,
    hasActiveQuote,
    existingQuote,
    error,
  };
};

export default useDuplicateQuoteCheck;
