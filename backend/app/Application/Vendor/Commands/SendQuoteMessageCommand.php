<?php

declare(strict_types=1);

namespace App\Application\Vendor\Commands;

/**
 * Command: Send Quote Message
 * 
 * Represents the intent to send a message in a quote communication thread.
 */
final class SendQuoteMessageCommand
{
    public function __construct(
        public readonly string $quoteUuid,
        public readonly int $vendorId,
        public readonly int $tenantId,
        public readonly string $message,
        public readonly array $attachments = []
    ) {
    }
}
