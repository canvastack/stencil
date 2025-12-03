<?php

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Content\Entities\Page;
use App\Domain\Content\Entities\PlatformContentBlock;
use App\Domain\Content\Repositories\PageRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Tenant Page Repository Implementation
 * 
 * Eloquent implementation of the tenant page repository interface.
 * All operations are automatically tenant-scoped via schema-per-tenant.
 */
class PageRepository implements PageRepositoryInterface
{
    public function findAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Page::query();

        // Apply filters
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['language'])) {
            $query->byLanguage($filters['language']);
        }

        if (isset($filters['parent_id'])) {
            $query->where('parent_id', $filters['parent_id']);
        }

        if (isset($filters['is_homepage'])) {
            $query->where('is_homepage', $filters['is_homepage']);
        }

        if (!empty($filters['template'])) {
            $query->where('template', $filters['template']);
        }

        if (isset($filters['platform_template_id'])) {
            $query->fromPlatformTemplate($filters['platform_template_id']);
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'ILIKE', '%' . $filters['search'] . '%')
                  ->orWhere('description', 'ILIKE', '%' . $filters['search'] . '%')
                  ->orWhere('slug', 'ILIKE', '%' . $filters['search'] . '%');
            });
        }

        // Include relationships
        $query->with(['currentVersion', 'parent:id,title', 'children:id,title,parent_id']);

        // Apply sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }

    public function findByUuid(string $uuid): ?Page
    {
        return Page::with(['currentVersion', 'parent', 'children'])
                   ->where('uuid', $uuid)
                   ->first();
    }

    public function findBySlug(string $slug, string $language = 'id'): ?Page
    {
        return Page::with(['currentVersion'])
                   ->where('slug', $slug)
                   ->where('language', $language)
                   ->first();
    }

    public function findHomepage(string $language = 'id'): ?Page
    {
        return Page::homepage()
                   ->byLanguage($language)
                   ->with(['currentVersion'])
                   ->first();
    }

    public function findPublished(array $filters = []): Collection
    {
        $query = Page::published();

        if (!empty($filters['language'])) {
            $query->byLanguage($filters['language']);
        }

        return $query->with(['currentVersion'])
                    ->orderBy('sort_order', 'asc')
                    ->orderBy('title', 'asc')
                    ->get();
    }

    public function findByStatus(string $status, int $perPage = 15): LengthAwarePaginator
    {
        return Page::where('status', $status)
                   ->with(['currentVersion'])
                   ->orderBy('updated_at', 'desc')
                   ->paginate($perPage);
    }

    public function findByPlatformTemplate(int $templateId): Collection
    {
        return Page::fromPlatformTemplate($templateId)
                   ->with(['currentVersion'])
                   ->orderBy('created_at', 'desc')
                   ->get();
    }

    public function create(array $data): Page
    {
        return Page::create($data);
    }

    public function createFromPlatformTemplate(int $templateId, array $data): Page
    {
        // Get the platform template
        $template = PlatformContentBlock::on('landlord')->find($templateId);
        
        if (!$template || !$template->isAvailableToTenants()) {
            throw new \InvalidArgumentException("Platform template not available: {$templateId}");
        }

        // Merge template content if not provided
        if (empty($data['content']) && !empty($template->default_content)) {
            $data['content'] = $template->default_content;
        }

        // Set template identifier
        if (empty($data['template'])) {
            $data['template'] = $template->identifier;
        }

        // Set platform template reference
        $data['platform_template_id'] = $templateId;

        return $this->create($data);
    }

    public function update(Page $page, array $data): Page
    {
        $page->update($data);
        return $page->fresh(['currentVersion']);
    }

    public function delete(Page $page): bool
    {
        return $page->delete();
    }

    public function findOrCreate(string $slug, array $data): Page
    {
        $language = $data['language'] ?? 'id';
        
        $page = $this->findBySlug($slug, $language);
        
        if (!$page) {
            $data['slug'] = $slug;
            $page = $this->create($data);
        }

        return $page;
    }

    public function search(string $query, int $perPage = 15): LengthAwarePaginator
    {
        return Page::where('title', 'ILIKE', '%' . $query . '%')
                   ->orWhere('description', 'ILIKE', '%' . $query . '%')
                   ->orWhere('slug', 'ILIKE', '%' . $query . '%')
                   ->orWhereJsonContains('content', $query)
                   ->with(['currentVersion'])
                   ->orderBy('updated_at', 'desc')
                   ->paginate($perPage);
    }

    public function getPageTree(string $language = 'id'): Collection
    {
        // Get all pages for the language, ordered by sort_order and title
        return Page::byLanguage($language)
                   ->with(['parent', 'children' => function ($query) {
                       $query->orderBy('sort_order', 'asc')->orderBy('title', 'asc');
                   }])
                   ->orderBy('sort_order', 'asc')
                   ->orderBy('title', 'asc')
                   ->get();
    }

    public function updateOrder(array $orderMapping): bool
    {
        // Update sort order for multiple pages
        foreach ($orderMapping as $id => $order) {
            Page::where('id', $id)->update(['sort_order' => $order]);
        }

        return true;
    }

    public function getStatistics(): array
    {
        $total = Page::count();
        $published = Page::where('status', 'published')->count();
        $draft = Page::where('status', 'draft')->count();
        $archived = Page::where('status', 'archived')->count();

        $byLanguage = Page::select('language')
                         ->selectRaw('count(*) as count')
                         ->groupBy('language')
                         ->pluck('count', 'language')
                         ->toArray();

        $fromTemplates = Page::whereNotNull('platform_template_id')
                            ->count();

        return [
            'total' => $total,
            'published' => $published,
            'draft' => $draft,
            'archived' => $archived,
            'by_language' => $byLanguage,
            'from_templates' => $fromTemplates,
            'custom_pages' => $total - $fromTemplates,
            'created_this_month' => Page::whereMonth('created_at', now()->month)
                                       ->whereYear('created_at', now()->year)
                                       ->count(),
        ];
    }

    public function getPagesNeedingTemplateUpdates(): Collection
    {
        // Find pages that reference platform templates
        // This would require checking if template has been updated
        // For now, return pages with platform_template_id
        return Page::whereNotNull('platform_template_id')
                   ->with(['currentVersion'])
                   ->get();
    }
}