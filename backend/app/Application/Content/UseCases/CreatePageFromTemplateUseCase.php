<?php

namespace App\Application\Content\UseCases;

use App\Application\Content\Commands\CreatePageFromTemplateCommand;
use App\Domain\Content\Entities\Page;
use App\Domain\Content\Repositories\PageRepositoryInterface;
use App\Domain\Content\Repositories\PlatformContentBlockRepositoryInterface;
use App\Domain\Shared\Events\EventDispatcher;
use App\Domain\Content\Events\PageCreatedFromTemplateEvent;
use Illuminate\Support\Str;

/**
 * Create Page From Template Use Case
 * 
 * Handles creating tenant pages from platform templates with customizations.
 * Manages template inheritance and content merging.
 */
class CreatePageFromTemplateUseCase
{
    public function __construct(
        private readonly PageRepositoryInterface $pageRepository,
        private readonly PlatformContentBlockRepositoryInterface $templateRepository,
        private readonly EventDispatcher $eventDispatcher
    ) {}

    public function execute(CreatePageFromTemplateCommand $command): Page
    {
        // Validate the template exists and is available
        $template = $this->validateAndGetTemplate($command->platform_template_id);

        // Validate other business rules
        $this->validateCommand($command);

        // Merge template content with customizations
        $mergedContent = $this->mergeTemplateContent($template, $command->customizations);

        // Prepare page data
        $data = $this->preparePageData($command, $template, $mergedContent);

        // Create the page using repository
        $page = $this->pageRepository->createFromPlatformTemplate(
            $command->platform_template_id, 
            $data
        );

        // Handle homepage logic
        if ($command->is_homepage) {
            $this->setAsHomepage($page);
        }

        // Dispatch domain event
        $this->eventDispatcher->dispatch(new PageCreatedFromTemplateEvent($page, $template));

        return $page;
    }

    private function validateAndGetTemplate(int $templateId): \App\Domain\Content\Entities\PlatformContentBlock
    {
        $template = $this->templateRepository->findById($templateId);
        
        if (!$template) {
            throw new \InvalidArgumentException("Platform template with ID {$templateId} not found");
        }

        if (!$template->isAvailableToTenants()) {
            throw new \InvalidArgumentException("Template '{$template->name}' is not available to tenants");
        }

        return $template;
    }

    private function validateCommand(CreatePageFromTemplateCommand $command): void
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

    private function mergeTemplateContent(
        \App\Domain\Content\Entities\PlatformContentBlock $template, 
        array $customizations
    ): array {
        // Start with template's default content
        $baseContent = $template->default_content ?? [];

        // Recursively merge customizations
        return $this->deepMergeArrays($baseContent, $customizations);
    }

    private function deepMergeArrays(array $base, array $customizations): array
    {
        foreach ($customizations as $key => $value) {
            if (is_array($value) && isset($base[$key]) && is_array($base[$key])) {
                $base[$key] = $this->deepMergeArrays($base[$key], $value);
            } else {
                $base[$key] = $value;
            }
        }

        return $base;
    }

    private function preparePageData(
        CreatePageFromTemplateCommand $command, 
        \App\Domain\Content\Entities\PlatformContentBlock $template,
        array $mergedContent
    ): array {
        // Generate UUID
        $uuid = (string) Str::uuid();

        // Generate slug if not provided
        $slug = $command->slug ?: Str::slug($command->title);
        
        // Ensure slug uniqueness
        $originalSlug = $slug;
        $counter = 1;
        while ($this->pageRepository->findBySlug($slug, $command->language)) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return [
            'uuid' => $uuid,
            'title' => $command->title,
            'slug' => $slug,
            'description' => $command->description,
            'content' => $mergedContent,
            'template' => $template->identifier,
            'meta_data' => $command->meta_data,
            'status' => $command->status,
            'is_homepage' => $command->is_homepage,
            'sort_order' => $command->sort_order,
            'language' => $command->language,
            'parent_id' => $command->parent_id,
            'platform_template_id' => $command->platform_template_id,
            'published_at' => $command->status === 'published' ? now() : null,
        ];
    }

    private function setAsHomepage(Page $page): void
    {
        // Remove homepage flag from other pages in same language
        $currentHomepage = $this->pageRepository->findHomepage($page->language);
        if ($currentHomepage && $currentHomepage->id !== $page->id) {
            $this->pageRepository->update($currentHomepage, ['is_homepage' => false]);
        }
    }
}