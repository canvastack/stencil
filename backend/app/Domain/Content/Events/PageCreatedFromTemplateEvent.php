<?php

namespace App\Domain\Content\Events;

use App\Domain\Content\Entities\Page;
use App\Domain\Content\Entities\PlatformContentBlock;
use App\Domain\Shared\Events\DomainEvent;

/**
 * Page Created From Template Event
 * 
 * Fired when a tenant page is created from a platform template.
 * Useful for tracking template usage analytics.
 */
class PageCreatedFromTemplateEvent extends DomainEvent
{
    public function __construct(
        public readonly Page $page,
        public readonly PlatformContentBlock $template
    ) {
        parent::__construct();
    }

    public function toArray(): array
    {
        return [
            'event' => 'page_created_from_template',
            'page_id' => $this->page->id,
            'page_uuid' => $this->page->uuid,
            'title' => $this->page->title,
            'slug' => $this->page->slug,
            'language' => $this->page->language,
            'status' => $this->page->status,
            'template_id' => $this->template->id,
            'template_identifier' => $this->template->identifier,
            'template_name' => $this->template->name,
            'occurred_at' => $this->occurredAt->toISOString()
        ];
    }
}