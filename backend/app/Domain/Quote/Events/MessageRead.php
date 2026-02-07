<?php

declare(strict_types=1);

namespace App\Domain\Quote\Events;

use App\Domain\Quote\Entities\Message;

/**
 * Domain event fired when a message is marked as read
 * 
 * Triggers:
 * - Update unread count for user
 * - Analytics tracking
 */
class MessageRead
{
    public function __construct(
        public readonly Message $message
    ) {}
}
