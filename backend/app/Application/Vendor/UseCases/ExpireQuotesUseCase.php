<?php

declare(strict_types=1);

namespace App\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\ExpireQuotesCommand;
use Illuminate\Support\Facades\DB;

/**
 * Use Case: Expire Quotes
 * 
 * Automatically expires quotes that have passed their expiration date.
 * This is typically executed by a scheduled job (hourly).
 * 
 * Business Rules:
 * - Find quotes with expires_at in the past
 * - Only expire quotes in 'sent' or 'pending_response' status
 * - Update status to 'expired'
 * - Set closed_at timestamp
 * - Send notifications to vendors and admins (handled by events)
 * - Support tenant-specific or global expiration
 * - Support batch limiting for performance
 */
final class ExpireQuotesUseCase
{
    /**
     * Execute command to expire quotes
     * 
     * @param ExpireQuotesCommand $command
     * @return array Expiration result with counts
     */
    public function execute(ExpireQuotesCommand $command): array
    {
        $now = now();
        
        // Build query to find expired quotes
        $query = DB::table('order_vendor_negotiations')
            ->whereIn('status', ['sent', 'pending_response'])
            ->where('expires_at', '<', $now)
            ->whereNull('deleted_at');

        // Apply tenant filter if specified
        if ($command->tenantId !== null) {
            $query->where('tenant_id', $command->tenantId);
        }

        // Apply limit if specified
        if ($command->limit !== null) {
            $query->limit($command->limit);
        }

        // Get quotes to expire
        $quotesToExpire = $query->get();

        if ($quotesToExpire->isEmpty()) {
            return [
                'expired_count' => 0,
                'quotes' => [],
                'executed_at' => $now,
            ];
        }

        $expiredQuotes = [];
        $expiredCount = 0;

        // Expire each quote
        foreach ($quotesToExpire as $quote) {
            DB::transaction(function () use ($quote, $now, &$expiredQuotes, &$expiredCount) {
                // Update quote status
                DB::table('order_vendor_negotiations')
                    ->where('id', $quote->id)
                    ->update([
                        'status' => 'expired',
                        'closed_at' => $now,
                        'updated_at' => $now,
                    ]);

                $expiredQuotes[] = [
                    'id' => $quote->id,
                    'uuid' => $quote->uuid,
                    'tenant_id' => $quote->tenant_id,
                    'order_id' => $quote->order_id,
                    'vendor_id' => $quote->vendor_id,
                    'expires_at' => $quote->expires_at,
                    'closed_at' => $now,
                ];

                $expiredCount++;
            });
        }

        return [
            'expired_count' => $expiredCount,
            'quotes' => $expiredQuotes,
            'executed_at' => $now,
        ];
    }
}
