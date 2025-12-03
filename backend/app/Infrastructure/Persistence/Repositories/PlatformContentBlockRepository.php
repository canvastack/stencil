<?php

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Content\Entities\PlatformContentBlock;
use App\Domain\Content\Repositories\PlatformContentBlockRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Platform Content Block Repository Implementation
 * 
 * Eloquent implementation for platform content blocks/templates.
 */
class PlatformContentBlockRepository implements PlatformContentBlockRepositoryInterface
{
    public function findAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = PlatformContentBlock::query();

        // Apply filters
        if (!empty($filters['category'])) {
            $query->byCategory($filters['category']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (isset($filters['is_template'])) {
            $query->where('is_template', $filters['is_template']);
        }

        if (isset($filters['is_reusable'])) {
            $query->reusable();
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'ILIKE', '%' . $filters['search'] . '%')
                  ->orWhere('description', 'ILIKE', '%' . $filters['search'] . '%')
                  ->orWhere('identifier', 'ILIKE', '%' . $filters['search'] . '%');
            });
        }

        // Apply sorting
        $sortBy = $filters['sort_by'] ?? 'name';
        $sortOrder = $filters['sort_order'] ?? 'asc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }

    public function findById(int $id): ?PlatformContentBlock
    {
        return PlatformContentBlock::find($id);
    }

    public function findByIdentifier(string $identifier): ?PlatformContentBlock
    {
        return PlatformContentBlock::where('identifier', $identifier)->first();
    }

    public function findActive(): Collection
    {
        return PlatformContentBlock::active()
                                  ->orderBy('name', 'asc')
                                  ->get();
    }

    public function findAvailableTemplates(): Collection
    {
        return PlatformContentBlock::templates()
                                  ->active()
                                  ->select(['id', 'name', 'identifier', 'description', 'category', 'schema', 'default_content'])
                                  ->orderBy('category', 'asc')
                                  ->orderBy('name', 'asc')
                                  ->get();
    }

    public function findByCategory(string $category): Collection
    {
        return PlatformContentBlock::byCategory($category)
                                  ->active()
                                  ->orderBy('name', 'asc')
                                  ->get();
    }

    public function create(array $data): PlatformContentBlock
    {
        return PlatformContentBlock::create($data);
    }

    public function update(PlatformContentBlock $block, array $data): PlatformContentBlock
    {
        $block->update($data);
        return $block->fresh();
    }

    public function delete(PlatformContentBlock $block): bool
    {
        return $block->delete();
    }

    public function getCategories(): Collection
    {
        return PlatformContentBlock::select('category')
                                  ->distinct()
                                  ->whereNotNull('category')
                                  ->orderBy('category', 'asc')
                                  ->pluck('category');
    }

    public function search(string $query, int $perPage = 15): LengthAwarePaginator
    {
        return PlatformContentBlock::where('name', 'ILIKE', '%' . $query . '%')
                                  ->orWhere('description', 'ILIKE', '%' . $query . '%')
                                  ->orWhere('identifier', 'ILIKE', '%' . $query . '%')
                                  ->orderBy('name', 'asc')
                                  ->paginate($perPage);
    }

    public function getUsageStatistics(): array
    {
        // This would require querying tenant schemas to count usage
        // For now, return basic statistics
        $total = PlatformContentBlock::count();
        $active = PlatformContentBlock::active()->count();
        $templates = PlatformContentBlock::templates()->count();
        $reusable = PlatformContentBlock::reusable()->count();

        $byCategory = PlatformContentBlock::select('category')
                                         ->selectRaw('count(*) as count')
                                         ->groupBy('category')
                                         ->pluck('count', 'category')
                                         ->toArray();

        return [
            'total' => $total,
            'active' => $active,
            'templates' => $templates,
            'reusable' => $reusable,
            'by_category' => $byCategory,
            'created_this_month' => PlatformContentBlock::whereMonth('created_at', now()->month)
                                                       ->whereYear('created_at', now()->year)
                                                       ->count(),
        ];
    }
}