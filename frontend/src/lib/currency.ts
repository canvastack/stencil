/**
 * Currency Configuration and Utilities
 * 
 * Provides centralized currency configuration and conversion utilities.
 * Primary source: Backend API config endpoint
 * Fallback: Environment variables
 */

import { exchangeRateService } from '@/services/api/exchangeRate';

/**
 * Get default exchange rate from backend config
 * Falls back to environment variable, then hardcoded 15750
 */
export const getDefaultExchangeRate = async (): Promise<number> => {
  try {
    const config = await exchangeRateService.getConfig();
    return config.default_exchange_rate;
  } catch (error) {
    console.warn('Failed to fetch exchange rate from backend, using env fallback');
    const envRate = import.meta.env.VITE_DEFAULT_EXCHANGE_RATE;
    const rate = envRate ? parseFloat(envRate) : 15750;
    
    if (isNaN(rate) || rate <= 0) {
      console.warn('Invalid VITE_DEFAULT_EXCHANGE_RATE, using fallback: 15750');
      return 15750;
    }
    
    return rate;
  }
};

/**
 * Synchronous version - uses env variable only
 * Use this when you can't await (e.g., in computed properties)
 */
export const getDefaultExchangeRateSync = (): number => {
  const envRate = import.meta.env.VITE_DEFAULT_EXCHANGE_RATE;
  const rate = envRate ? parseFloat(envRate) : 15750;
  
  if (isNaN(rate) || rate <= 0) {
    console.warn('Invalid VITE_DEFAULT_EXCHANGE_RATE, using fallback: 15750');
    return 15750;
  }
  
  return rate;
};

/**
 * Get default currency from environment variable
 * Falls back to 'IDR' if not configured
 */
export const getDefaultCurrency = (): string => {
  return import.meta.env.VITE_DEFAULT_CURRENCY || 'IDR';
};

/**
 * Get secondary currency from environment variable
 * Falls back to 'USD' if not configured
 */
export const getSecondaryCurrency = (): string => {
  return import.meta.env.VITE_SECONDARY_CURRENCY || 'USD';
};

/**
 * Format currency amount with proper locale and currency code
 */
export const formatCurrency = (
  amount: number,
  currency: 'IDR' | 'USD' = 'IDR'
): string => {
  if (isNaN(amount)) return currency === 'IDR' ? 'Rp 0' : '$0.00';

  if (currency === 'IDR') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
};

/**
 * Convert IDR to USD using provided exchange rate
 */
export const convertToUSD = (idrAmount: number, exchangeRate: number): number => {
  return idrAmount / exchangeRate;
};

/**
 * Convert USD to IDR using provided exchange rate
 */
export const convertToIDR = (usdAmount: number, exchangeRate: number): number => {
  return usdAmount * exchangeRate;
};
