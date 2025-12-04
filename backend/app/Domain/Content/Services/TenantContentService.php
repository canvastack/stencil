<?php

declare(strict_types=1);

namespace App\Domain\Content\Services;

use App\Domain\Content\Entities\TenantPage;
use App\Domain\Content\Repositories\TenantPageRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class TenantContentService
{
    public function __construct(
        private TenantPageRepositoryInterface $tenantPageRepository
    ) {}

    public function getAllPages(): Collection
    {
        return $this->tenantPageRepository->findAll();
    }

    public function getPublishedPages(): Collection
    {
        return $this->tenantPageRepository->findPublished();
    }

    public function getPageBySlug(string $slug): ?TenantPage
    {
        return $this->tenantPageRepository->findBySlug($slug);
    }

    public function getPagesByType(string $type): Collection
    {
        return $this->tenantPageRepository->findByType($type);
    }

    public function getHomepage(): ?TenantPage
    {
        return $this->tenantPageRepository->findHomepage();
    }

    public function createPage(array $data): TenantPage
    {
        // Validate required fields
        $this->validatePageData($data);
        
        // Ensure slug is unique within tenant
        $slug = $this->generateUniqueSlug($data['slug'] ?? $data['title']);
        $data['slug'] = $slug;

        return $this->tenantPageRepository->create($data);
    }

    public function updatePage(string $slug, array $data): ?TenantPage
    {
        $page = $this->tenantPageRepository->findBySlug($slug);
        
        if (!$page) {
            return null;
        }

        return $this->tenantPageRepository->update($page, $data);
    }

    public function deletePage(string $slug): bool
    {
        $page = $this->tenantPageRepository->findBySlug($slug);
        
        if (!$page) {
            return false;
        }

        return $this->tenantPageRepository->delete($page);
    }

    public function publishPage(string $slug): ?TenantPage
    {
        $page = $this->tenantPageRepository->findBySlug($slug);
        
        if (!$page) {
            return null;
        }

        return $this->tenantPageRepository->publish($page);
    }

    public function archivePage(string $slug): ?TenantPage
    {
        $page = $this->tenantPageRepository->findBySlug($slug);
        
        if (!$page) {
            return null;
        }

        return $this->tenantPageRepository->archive($page);
    }

    public function updatePageContent(string $slug, array $content): ?TenantPage
    {
        $page = $this->tenantPageRepository->findBySlug($slug);
        
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

        while ($this->tenantPageRepository->findBySlug($slug)) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}