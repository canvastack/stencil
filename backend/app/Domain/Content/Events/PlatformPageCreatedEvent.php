<?php

namespace App\Domain\Content\Events;

use App\Domain\Content\Entities\PlatformPage;
use App\Domain\Shared\Events\DomainEvent;

/**
 * Platform Page Created Event
 * 
 * Fired when a new platform page is created.
 * Can be used for notifications, analytics, etc.
 */
class PlatformPageCreatedEvent extends DomainEvent
{
    public function __construct(
        public readonly PlatformPage $page
    ) {
        parent::__construct();
    }

    public function toArray(): array
    {
        return [
            'event' => 'platform_page_created',
            'page_id' => $this->page->id,
            'page_uuid' => $this->page->uuid,
            'title' => $this->page->title,
            'slug' => $this->page->slug,
            'language' => $this->page->language,
            'status' => $this->page->status,
            'is_homepage' => $this->page->is_homepage,
            'created_by' => $this->page->created_by,
            'occurred_at' => $this->occurredAt->toISOString()
        ];
    }
}