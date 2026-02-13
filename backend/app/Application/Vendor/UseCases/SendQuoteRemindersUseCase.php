<?php

declare(strict_types=1);

namespace App\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\SendQuoteRemindersCommand;
use Illuminate\Support\Facades\DB;

/**
 * Use Case: Send Quote Reminders
 * 
 * Sends reminder emails to vendors for quotes that are about to expire.
 * This is typically executed by a scheduled job (daily).
 * 
 * Business Rules:
 * - Find quotes expiring within X days (default: 3 days)
 * - Only send reminders for 'sent' or 'pending_response' status
 * - Do not send reminders for closed quotes (closed_at is set)
 * - Do not send duplicate reminders (check last_reminder_sent_at in history)
 * - Send email notifications to vendors (handled by events)
 * - Update history JSON field with reminder timestamp
 * - Support tenant-specific or global reminders
 * - Support batch limiting for performance
 */
final class SendQuoteRemindersUseCase
{
    /**
     * Execute command to send quote reminders
     * 
     * @param SendQuoteRemindersCommand $command
     * @return array Reminder result with counts
     */
    public function execute(SendQuoteRemindersCommand $command): array
    {
        $now = now();
        $expiryThreshold = $now->copy()->addDays($command->daysBeforeExpiry);
        
        // Build query to find quotes needing reminders
        $query = DB::table('order_vendor_negotiations')
            ->whereIn('status', ['sent', 'pending_response']) // Only sent/pending quotes need reminders
            ->where('expires_at', '>', $now) // Not yet expired
            ->where('expires_at', '<=', $expiryThreshold) // Expiring soon
            ->whereNull('closed_at') // Not yet closed
            ->whereNull('deleted_at');

        // Apply tenant filter if specified
        if ($command->tenantId !== null) {
            $query->where('tenant_id', $command->tenantId);
        }

        // Apply limit if specified
        if ($command->limit !== null) {
            $query->limit($command->limit);
        }

        // Get quotes needing reminders
        $quotesNeedingReminders = $query->get();

        if ($quotesNeedingReminders->isEmpty()) {
            return [
                'reminders_sent' => 0,
                'quotes' => [],
                'executed_at' => $now,
            ];
        }

        $reminders = [];
        $remindersSent = 0;

        // Send reminder for each quote
        foreach ($quotesNeedingReminders as $quote) {
            // Check if reminder was already sent recently (within last 24 hours)
            // Use history JSON field to track reminders
            $history = json_decode($quote->history ?? '[]', true);
            
            // Find last reminder in history
            $lastReminder = null;
            foreach ($history as $entry) {
                if (isset($entry['action']) && $entry['action'] === 'reminder_sent') {
                    $lastReminder = $entry['timestamp'] ?? null;
                }
            }
            
            if ($lastReminder && now()->diffInHours($lastReminder) < 24) {
                continue; // Skip if reminder sent within last 24 hours
            }

            DB::transaction(function () use ($quote, $now, &$reminders, &$remindersSent, $history) {
                // Add reminder entry to history
                $history[] = [
                    'action' => 'reminder_sent',
                    'timestamp' => $now->toDateTimeString(),
                    'days_until_expiry' => now()->diffInDays($quote->expires_at),
                ];

                DB::table('order_vendor_negotiations')
                    ->where('id', $quote->id)
                    ->update([
                        'history' => json_encode($history),
                        'updated_at' => $now,
                    ]);

                $reminders[] = [
                    'id' => $quote->id,
                    'uuid' => $quote->uuid,
                    'tenant_id' => $quote->tenant_id,
                    'order_id' => $quote->order_id,
                    'vendor_id' => $quote->vendor_id,
                    'expires_at' => $quote->expires_at,
                    'days_until_expiry' => now()->diffInDays($quote->expires_at),
                    'reminder_sent_at' => $now,
                ];

                $remindersSent++;
            });
        }

        return [
            'reminders_sent' => $remindersSent,
            'quotes' => $reminders,
            'executed_at' => $now,
        ];
    }
}
