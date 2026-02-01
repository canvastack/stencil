/**
 * Currency Display Component
 * 
 * Displays monetary amounts with optional currency conversion between IDR and USD.
 * Supports multiple display modes: IDR only, USD only, or both currencies.
 * 
 * @example
 * ```tsx
 * // Display IDR with USD equivalent
 * <CurrencyDisplay amount={150000} mode="both" />
 * // Output: Rp 150.000 ($10.00)
 * 
 * // Display only IDR
 * <CurrencyDisplay amount={150000} mode="idr" />
 * // Output: Rp 150.000
 * 
 * // Display only USD
 * <CurrencyDisplay amount={150000} mode="usd" />
 * // Output: $10.00
 * ```
 */

import React from 'react';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CurrencyDisplayProps {
  /** Amount in IDR (Rupiah) */
  amount: number;
  /** Display mode: 'idr' | 'usd' | 'both' */
  mode?: 'idr' | 'usd' | 'both';
  /** Show exchange rate info on hover */
  showRateInfo?: boolean;
  /** Custom className */
  className?: string;
  /** Primary currency text size */
  primarySize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  /** Secondary currency text size (for 'both' mode) */
  secondarySize?: 'xs' | 'sm' | 'base';
  /** Show loading skeleton */
  showSkeleton?: boolean;
}

export function CurrencyDisplay({
  amount,
  mode = 'both',
  showRateInfo = true,
  className,
  primarySize = 'base',
  secondarySize = 'sm',
  showSkeleton = true,
}: CurrencyDisplayProps) {
  const { convertToUSD, formatIDR, formatUSD, exchangeRate, isLoading, lastUpdated } = useCurrencyConversion();

  // Show skeleton while loading
  if (isLoading && showSkeleton) {
    return <span className={cn('inline-block h-6 w-32 bg-muted animate-pulse rounded', className)} />;
  }

  const idrFormatted = formatIDR(amount);
  const usdAmount = convertToUSD(amount);
  const usdFormatted = formatUSD(usdAmount);

  const primarySizeClass = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  }[primarySize];

  const secondarySizeClass = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
  }[secondarySize];

  // Build title for hover info
  const title = showRateInfo && exchangeRate
    ? `Exchange Rate: 1 USD = Rp ${exchangeRate.toLocaleString('id-ID')}\nLast Updated: ${lastUpdated?.toLocaleString('id-ID') || 'N/A'}`
    : undefined;

  if (mode === 'idr') {
    return (
      <span className={cn(primarySizeClass, className)} title={title}>
        {idrFormatted}
      </span>
    );
  }

  if (mode === 'usd') {
    return (
      <span className={cn(primarySizeClass, className)} title={title}>
        {usdFormatted}
      </span>
    );
  }

  // mode === 'both'
  return (
    <span className={cn('inline-flex items-baseline gap-1.5', className)} title={title}>
      <span className={primarySizeClass}>{idrFormatted}</span>
      <span className={cn(secondarySizeClass, 'text-muted-foreground')}>
        ({usdFormatted})
      </span>
    </span>
  );
}

/**
 * Compact Currency Display
 * 
 * A more compact version that shows USD in parentheses with smaller text.
 * Useful for tables and lists where space is limited.
 */
export function CompactCurrencyDisplay({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) {
  return (
    <CurrencyDisplay
      amount={amount}
      mode="both"
      primarySize="base"
      secondarySize="xs"
      className={className}
    />
  );
}

/**
 * Large Currency Display
 * 
 * A larger version for prominent display like order totals.
 */
export function LargeCurrencyDisplay({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) {
  return (
    <CurrencyDisplay
      amount={amount}
      mode="both"
      primarySize="2xl"
      secondarySize="base"
      className={cn('font-bold', className)}
    />
  );
}
