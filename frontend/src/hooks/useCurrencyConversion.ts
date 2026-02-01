/**
 * Currency Conversion Hook
 * 
 * Provides real-time currency conversion functionality using the exchange rate system.
 * Fetches current exchange rate and provides conversion utilities for displaying
 * prices in both IDR and USD.
 * 
 * @example
 * ```tsx
 * const { convertToUSD, formatIDR, formatUSD, exchangeRate, isLoading } = useCurrencyConversion();
 * 
 * // Convert IDR to USD
 * const usdAmount = convertToUSD(150000); // Returns USD amount
 * 
 * // Format for display
 * const idrDisplay = formatIDR(150000); // "Rp 150.000"
 * const usdDisplay = formatUSD(usdAmount); // "$10.00"
 * ```
 */

import { useQuery } from '@tanstack/react-query';
import { exchangeRateService } from '@/services/api/exchangeRate';

interface CurrencyConversionResult {
  /** Current exchange rate (1 USD = X IDR) */
  exchangeRate: number | null;
  /** Convert IDR amount to USD */
  convertToUSD: (idrAmount: number) => number;
  /** Convert USD amount to IDR */
  convertToIDR: (usdAmount: number) => number;
  /** Format IDR amount for display */
  formatIDR: (amount: number) => string;
  /** Format USD amount for display */
  formatUSD: (amount: number) => string;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Last updated timestamp */
  lastUpdated: Date | null;
  /** Rate source (manual, api, cached) */
  source: string | null;
}

export function useCurrencyConversion(): CurrencyConversionResult {
  // Fetch current exchange rate settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['exchangeRateSettings'],
    queryFn: () => exchangeRateService.getSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const exchangeRate = settings?.current_rate || null;
  const lastUpdated = settings?.last_updated_at ? new Date(settings.last_updated_at) : null;
  const source = settings?.mode || null;

  /**
   * Convert IDR amount to USD
   * @param idrAmount Amount in IDR (Rupiah)
   * @returns Amount in USD
   */
  const convertToUSD = (idrAmount: number): number => {
    if (!exchangeRate || exchangeRate === 0) return 0;
    return idrAmount / exchangeRate;
  };

  /**
   * Convert USD amount to IDR
   * @param usdAmount Amount in USD
   * @returns Amount in IDR (Rupiah)
   */
  const convertToIDR = (usdAmount: number): number => {
    if (!exchangeRate) return 0;
    return usdAmount * exchangeRate;
  };

  /**
   * Format IDR amount for display
   * @param amount Amount in IDR
   * @returns Formatted string (e.g., "Rp 150.000")
   */
  const formatIDR = (amount: number): string => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  /**
   * Format USD amount for display
   * @param amount Amount in USD
   * @returns Formatted string (e.g., "$10.00")
   */
  const formatUSD = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return {
    exchangeRate,
    convertToUSD,
    convertToIDR,
    formatIDR,
    formatUSD,
    isLoading,
    error: error as Error | null,
    lastUpdated,
    source,
  };
}
