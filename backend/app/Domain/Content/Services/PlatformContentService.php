<?php

declare(strict_types=1);

namespace App\Domain\Content\Services;

use App\Domain\Content\Entities\PlatformPage;
use App\Domain\Content\Repositories\PlatformPageRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class PlatformContentService
{
    public function __construct(
        private PlatformPageRepositoryInterface $platformPageRepository
    ) {}

    public function getAllPages(): Collection
    {
        return $this->platformPageRepository->findAll();
    }

    public function getPublishedPages(): Collection
    {
        return $this->platformPageRepository->findPublished();
    }

    public function getPageBySlug(string $slug): ?PlatformPage
    {
        return $this->platformPageRepository->findBySlug($slug);
    }

    public function getPagesByType(string $type): Collection
    {
        return $this->platformPageRepository->findByType($type);
    }

    public function getHomepage(): ?PlatformPage
    {
        return $this->platformPageRepository->findHomepage();
    }

    public function createPage(array $data): PlatformPage
    {
        // Validate required fields
        $this->validatePageData($data);
        
        // Ensure slug is unique
        $slug = $this->generateUniqueSlug($data['slug'] ?? $data['title']);
        $data['slug'] = $slug;

        return $this->platformPageRepository->create($data);
    }

    public function updatePage(string $slug, array $data): ?PlatformPage
    {
        $page = $this->platformPageRepository->findBySlug($slug);
        
        if (!$page) {
            return null;
        }

        return $this->platformPageRepository->update($page, $data);
    }

    public function deletePage(string $slug): bool
    {
        $page = $this->platformPageRepository->findBySlug($slug);
        
        if (!$page) {
            return false;
        }

        return $this->platformPageRepository->delete($page);
    }

    public function publishPage(string $slug): ?PlatformPage
    {
        $page = $this->platformPageRepository->findBySlug($slug);
        
        if (!$page) {
            return null;
        }

        return $this->platformPageRepository->publish($page);
    }

    public function archivePage(string $slug): ?PlatformPage
    {
        $page = $this->platformPageRepository->findBySlug($slug);
        
        if (!$page) {
            return null;
        }

        return $this->platformPageRepository->archive($page);
    }

    public function updatePageContent(string $slug, array $content): ?PlatformPage
    {
        $page = $this->platformPageRepository->findBySlug($slug);
        
        if (!$page) {
            return null;
        }

        $page->updateContent($content);
        
        return $page;
    }

    private function validatePageData(array $data): void
    {
        if (empty($data['title'])) {
            throw new \InvalidArgumentException('Page title is required');
        }

        if (empty($data['content'])) {
            throw new \InvalidArgumentException('Page content is required');
        }
    }

    private function generateUniqueSlug(string $title): string
    {
        $slug = str($title)->slug();
        $originalSlug = $slug;
        $counter = 1;

        while ($this->platformPageRepository->findBySlug($slug)) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}