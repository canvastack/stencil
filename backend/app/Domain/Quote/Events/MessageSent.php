<?php

declare(strict_types=1);

namespace App\Domain\Quote\Events;

use App\Domain\Quote\Entities\Message;

/**
 * Domain event fired when a message is sent in a quote thread
 * 
 * Triggers:
 * - Notification to recipient (admin or vendor)
 * - Email notification
 * - In-app notification creation
 */
class MessageSent
{
    public function __construct(
        public readonly Message $message
    ) {}
}
