<?php

declare(strict_types=1);

namespace App\Application\Vendor\Commands;

/**
 * Command: Send Quote Reminders
 * 
 * Represents the intent to send reminder emails to vendors for quotes
 * that are about to expire (within 3 days).
 * This is typically executed by a scheduled job.
 */
final class SendQuoteRemindersCommand
{
    public function __construct(
        public readonly ?int $tenantId = null, // Optional: send reminders for specific tenant only
        public readonly int $daysBeforeExpiry = 3, // Days before expiry to send reminder
        public readonly ?int $limit = null // Optional: limit number of reminders per run
    ) {
    }
}
