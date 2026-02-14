<?php

if (!function_exists('formatCurrency')) {
    /**
     * Format currency amount in Indonesian Rupiah
     * 
     * @param int $amount Amount in cents
     * @param string $currency Currency code (default: IDR)
     * @return string Formatted currency string
     */
    function formatCurrency(int $amount, string $currency = 'IDR'): string
    {
        $amountInRupiah = $amount / 100;
        
        if ($currency === 'IDR') {
            return 'Rp ' . number_format($amountInRupiah, 0, ',', '.');
        }
        
        // For other currencies, use standard formatting
        return $currency . ' ' . number_format($amountInRupiah, 2, '.', ',');
    }
}
