<?php

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Content\Entities\PlatformPage;
use App\Domain\Content\Repositories\PlatformPageRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Platform Page Repository Implementation
 * 
 * Eloquent implementation of the platform page repository interface.
 * Handles all database operations for platform pages.
 */
class PlatformPageRepository implements PlatformPageRepositoryInterface
{
    public function findAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = PlatformPage::query();

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

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'ILIKE', '%' . $filters['search'] . '%')
                  ->orWhere('description', 'ILIKE', '%' . $filters['search'] . '%')
                  ->orWhere('slug', 'ILIKE', '%' . $filters['search'] . '%');
            });
        }

        // Include relationships
        $query->with(['createdBy:id,name', 'currentVersion', 'parent:id,title', 'children:id,title,parent_id']);

        // Apply sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }

    public function findByUuid(string $uuid): ?PlatformPage
    {
        return PlatformPage::with(['createdBy', 'currentVersion', 'parent', 'children'])
                          ->where('uuid', $uuid)
                          ->first();
    }

    public function findBySlug(string $slug, string $language = 'en'): ?PlatformPage
    {
        return PlatformPage::with(['createdBy', 'currentVersion'])
                          ->where('slug', $slug)
                          ->where('language', $language)
                          ->first();
    }

    public function findHomepage(string $language = 'en'): ?PlatformPage
    {
        return PlatformPage::homepage()
                          ->byLanguage($language)
                          ->with(['createdBy', 'currentVersion'])
                          ->first();
    }

    public function findPublished(array $filters = []): Collection
    {
        $query = PlatformPage::published();

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
        return PlatformPage::where('status', $status)
                          ->with(['createdBy:id,name', 'currentVersion'])
                          ->orderBy('updated_at', 'desc')
                          ->paginate($perPage);
    }

    public function create(array $data): PlatformPage
    {
        return PlatformPage::create($data);
    }

    public function update(PlatformPage $page, array $data): PlatformPage
    {
        $page->update($data);
        return $page->fresh(['createdBy', 'currentVersion']);
    }

    public function delete(PlatformPage $page): bool
    {
        return $page->delete();
    }

    public function findOrCreate(string $slug, array $data): PlatformPage
    {
        $language = $data['language'] ?? 'en';
        
        $page = $this->findBySlug($slug, $language);
        
        if (!$page) {
            $data['slug'] = $slug;
            $page = $this->create($data);
        }

        return $page;
    }

    public function search(string $query, int $perPage = 15): LengthAwarePaginator
    {
        return PlatformPage::where('title', 'ILIKE', '%' . $query . '%')
                          ->orWhere('description', 'ILIKE', '%' . $query . '%')
                          ->orWhere('slug', 'ILIKE', '%' . $query . '%')
                          ->orWhereJsonContains('content', $query)
                          ->with(['createdBy:id,name', 'currentVersion'])
                          ->orderBy('updated_at', 'desc')
                          ->paginate($perPage);
    }

    public function getPageTree(string $language = 'en'): Collection
    {
        // Get all pages for the language, ordered by sort_order and title
        return PlatformPage::byLanguage($language)
                          ->with(['parent', 'children' => function ($query) {
                              $query->orderBy('sort_order', 'asc')->orderBy('title', 'asc');
                          }])
                          ->orderBy('sort_order', 'asc')
                          ->orderBy('title', 'asc')
                          ->get();
    }

    public function getAvailableTemplates(): Collection
    {
        // Platform pages that can serve as templates for tenants
        return PlatformPage::published()
                          ->where('template', '!=', 'custom')
                          ->select(['id', 'uuid', 'title', 'slug', 'description', 'template', 'language'])
                          ->orderBy('title', 'asc')
                          ->get();
    }

    public function updateOrder(array $orderMapping): bool
    {
        // Update sort order for multiple pages
        foreach ($orderMapping as $id => $order) {
            PlatformPage::where('id', $id)->update(['sort_order' => $order]);
        }

        return true;
    }

    public function getStatistics(): array
    {
        $total = PlatformPage::count();
        $published = PlatformPage::where('status', 'published')->count();
        $draft = PlatformPage::where('status', 'draft')->count();
        $archived = PlatformPage::where('status', 'archived')->count();

        $byLanguage = PlatformPage::select('language')
                                 ->selectRaw('count(*) as count')
                                 ->groupBy('language')
                                 ->pluck('count', 'language')
                                 ->toArray();

        return [
            'total' => $total,
            'published' => $published,
            'draft' => $draft,
            'archived' => $archived,
            'by_language' => $byLanguage,
            'created_this_month' => PlatformPage::whereMonth('created_at', now()->month)
                                               ->whereYear('created_at', now()->year)
                                               ->count(),
        ];
    }
}