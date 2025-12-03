<?php

namespace App\Application\Content\UseCases;

use App\Application\Content\Commands\CreatePlatformPageCommand;
use App\Domain\Content\Entities\PlatformPage;
use App\Domain\Content\Repositories\PlatformPageRepositoryInterface;
use App\Domain\Shared\Events\EventDispatcher;
use App\Domain\Content\Events\PlatformPageCreatedEvent;
use Illuminate\Support\Str;

/**
 * Create Platform Page Use Case
 * 
 * Handles the business logic for creating platform pages.
 * Orchestrates validation, creation, and event dispatch.
 */
class CreatePlatformPageUseCase
{
    public function __construct(
        private readonly PlatformPageRepositoryInterface $pageRepository,
        private readonly EventDispatcher $eventDispatcher
    ) {}

    public function execute(CreatePlatformPageCommand $command): PlatformPage
    {
        // Validate business rules
        $this->validateCommand($command);

        // Prepare data for creation
        $data = $this->preparePageData($command);

        // Create the page
        $page = $this->pageRepository->create($data);

        // Handle homepage logic
        if ($command->is_homepage) {
            $this->setAsHomepage($page);
        }

        // Dispatch domain event
        $this->eventDispatcher->dispatch(new PlatformPageCreatedEvent($page));

        return $page;
    }

    private function validateCommand(CreatePlatformPageCommand $command): void
    {
        // Check for duplicate slug within language
        if ($command->slug) {
            $existingPage = $this->pageRepository->findBySlug($command->slug, $command->language);
            if ($existingPage) {
                throw new \InvalidArgumentException("A page with slug '{$command->slug}' already exists for language '{$command->language}'");
            }
        }

        // Validate parent exists if specified
        if ($command->parent_id) {
            $parent = $this->pageRepository->findById($command->parent_id);
            if (!$parent) {
                throw new \InvalidArgumentException("Parent page with ID {$command->parent_id} not found");
            }
        }

        // Validate status
        $validStatuses = ['draft', 'published', 'archived'];
        if (!in_array($command->status, $validStatuses)) {
            throw new \InvalidArgumentException("Invalid status '{$command->status}'. Must be one of: " . implode(', ', $validStatuses));
        }
    }

    private function preparePageData(CreatePlatformPageCommand $command): array
    {
        $data = $command->toArray();

        // Generate UUID if not provided
        if (!isset($data['uuid'])) {
            $data['uuid'] = (string) Str::uuid();
        }

        // Generate slug if not provided
        if (!$data['slug']) {
            $data['slug'] = Str::slug($command->title);
            
            // Ensure slug uniqueness
            $originalSlug = $data['slug'];
            $counter = 1;
            while ($this->pageRepository->findBySlug($data['slug'], $command->language)) {
                $data['slug'] = $originalSlug . '-' . $counter;
                $counter++;
            }
        }

        // Set published_at if status is published
        if ($command->status === 'published' && !isset($data['published_at'])) {
            $data['published_at'] = now();
        }

        return $data;
    }

    private function setAsHomepage(PlatformPage $page): void
    {
        // Remove homepage flag from other pages in same language
        $currentHomepage = $this->pageRepository->findHomepage($page->language);
        if ($currentHomepage && $currentHomepage->id !== $page->id) {
            $this->pageRepository->update($currentHomepage, ['is_homepage' => false]);
        }
    }
}