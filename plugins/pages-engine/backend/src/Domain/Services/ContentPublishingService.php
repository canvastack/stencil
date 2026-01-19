<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Services;

use Plugins\PagesEngine\Domain\Entities\Content;
use Plugins\PagesEngine\Domain\ValueObjects\ContentStatus;
use DateTime;
use InvalidArgumentException;

final class ContentPublishingService
{
    public function canPublish(Content $content): bool
    {
        if ($content->getTitle() === '') {
            return false;
        }

        if (empty($content->getContent())) {
            return false;
        }

        return true;
    }

    public function canSchedule(Content $content, DateTime $publishAt): bool
    {
        if (!$this->canPublish($content)) {
            return false;
        }

        if ($publishAt <= new DateTime()) {
            return false;
        }

        return true;
    }

    public function shouldAutoPublish(Content $content): bool
    {
        if (!$content->isScheduled()) {
            return false;
        }

        $scheduledDate = $content->getScheduledPublishAt();

        if ($scheduledDate === null) {
            return false;
        }

        return $scheduledDate <= new DateTime();
    }

    public function publish(Content $content): void
    {
        if (!$this->canPublish($content)) {
            throw new InvalidArgumentException('Content cannot be published: missing required fields');
        }

        $content->publish();
    }

    public function schedule(Content $content, DateTime $publishAt): void
    {
        if (!$this->canSchedule($content, $publishAt)) {
            throw new InvalidArgumentException('Content cannot be scheduled');
        }

        $content->schedule($publishAt);
    }

    public function unpublish(Content $content): void
    {
        if (!$content->isPublished()) {
            throw new InvalidArgumentException('Content is not published');
        }

        $content->unpublish();
    }

    public function archive(Content $content): void
    {
        if ($content->isArchived()) {
            throw new InvalidArgumentException('Content is already archived');
        }

        $content->archive();
    }
}
