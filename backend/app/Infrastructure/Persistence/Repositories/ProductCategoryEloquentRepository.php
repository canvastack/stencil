<?php

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Product\Entities\ProductCategory;
use App\Domain\Product\Repositories\ProductCategoryRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\ProductCategoryEloquentModel;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class ProductCategoryEloquentRepository implements ProductCategoryRepositoryInterface
{
    public function __construct(
        private ProductCategoryEloquentModel $model
    ) {
    }

    public function findById(int $id): ?ProductCategory
    {
        $category = $this->model->find($id);
        return $category ? $this->toDomainEntity($category) : null;
    }

    public function findBySlug(string $slug): ?ProductCategory
    {
        $category = $this->model->where('slug', $slug)->first();
        return $category ? $this->toDomainEntity($category) : null;
    }

    public function findAll(): Collection
    {
        $categories = $this->model->orderBy('order')->get();
        return $categories->map(fn($category) => $this->toDomainEntity($category));
    }

    public function findByParent(?int $parentId, bool $activeOnly = true): Collection
    {
        $query = $this->model->where('parent_id', $parentId);
        
        if ($activeOnly) {
            $query->where('is_active', true);
        }
        
        $categories = $query->orderBy('order')->get();
        return $categories->map(fn($category) => $this->toDomainEntity($category));
    }

    public function findRootCategories(bool $activeOnly = true): Collection
    {
        return $this->findByParent(null, $activeOnly);
    }

    public function findActiveCategories(): Collection
    {
        $categories = $this->model->where('is_active', true)->orderBy('order')->get();
        return $categories->map(fn($category) => $this->toDomainEntity($category));
    }

    public function search(string $query, int $limit = 20): Collection
    {
        $categories = $this->model
            ->where('name', 'LIKE', "%{$query}%")
            ->orWhere('description', 'LIKE', "%{$query}%")
            ->where('is_active', true)
            ->orderBy('order')
            ->limit($limit)
            ->get();
            
        return $categories->map(fn($category) => $this->toDomainEntity($category));
    }

    public function getHierarchy(bool $activeOnly = true): array
    {
        $query = $this->model->newQuery();
        
        if ($activeOnly) {
            $query->where('is_active', true);
        }
        
        $categories = $query->orderBy('order')->get();
        
        return $this->buildHierarchy($categories, null);
    }

    public function getDescendants(int $categoryId): array
    {
        $descendants = [];
        $children = $this->model->where('parent_id', $categoryId)->get();
        
        foreach ($children as $child) {
            $descendants[] = $child->id;
            $descendants = array_merge($descendants, $this->getDescendants($child->id));
        }
        
        return $descendants;
    }

    public function getAncestors(int $categoryId): array
    {
        $ancestors = [];
        $category = $this->model->find($categoryId);
        
        while ($category && $category->parent_id) {
            $parent = $this->model->find($category->parent_id);
            if ($parent) {
                array_unshift($ancestors, $parent->id);
                $category = $parent;
            } else {
                break;
            }
        }
        
        return $ancestors;
    }

    public function getBreadcrumb(int $categoryId): array
    {
        $breadcrumb = [];
        $category = $this->model->find($categoryId);
        
        while ($category) {
            array_unshift($breadcrumb, [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug
            ]);
            
            if ($category->parent_id) {
                $category = $this->model->find($category->parent_id);
            } else {
                break;
            }
        }
        
        return $breadcrumb;
    }

    public function getProductsCount(int $categoryId): int
    {
        return $this->model->find($categoryId)?->products()?->count() ?? 0;
    }

    public function getProducts(
        int $categoryId, 
        bool $includeSubcategories = false, 
        ?string $status = null, 
        string $sortBy = 'name', 
        string $sortOrder = 'asc',
        int $perPage = 20
    ): LengthAwarePaginator {
        $category = $this->model->find($categoryId);
        
        if (!$category) {
            return new LengthAwarePaginator([], 0, $perPage);
        }
        
        $query = $category->products();
        
        if ($status) {
            $query->where('status', $status);
        }
        
        if ($includeSubcategories) {
            $descendants = $this->getDescendants($categoryId);
            if (!empty($descendants)) {
                $query->orWhereIn('category_id', $descendants);
            }
        }
        
        return $query->orderBy($sortBy, $sortOrder)->paginate($perPage);
    }

    public function save(ProductCategory $category): ProductCategory
    {
        $eloquentCategory = $this->model->newInstance($category->toArray());
        $eloquentCategory->save();
        
        return $this->toDomainEntity($eloquentCategory);
    }

    public function update(ProductCategory $category): ProductCategory
    {
        $eloquentCategory = $this->model->find($category->getId());
        
        if (!$eloquentCategory) {
            throw new \InvalidArgumentException("Category with ID {$category->getId()} not found");
        }
        
        $eloquentCategory->update($category->toArray());
        
        return $this->toDomainEntity($eloquentCategory);
    }

    public function delete(int $id): bool
    {
        $category = $this->model->find($id);
        return $category ? $category->delete() : false;
    }

    public function exists(int $id): bool
    {
        return $this->model->where('id', $id)->exists();
    }

    public function findWithChildren(int $categoryId): ?ProductCategory
    {
        $category = $this->model->with('children')->find($categoryId);
        return $category ? $this->toDomainEntity($category) : null;
    }

    public function findWithProducts(int $categoryId): ?ProductCategory
    {
        $category = $this->model->with('products')->find($categoryId);
        return $category ? $this->toDomainEntity($category) : null;
    }

    public function reorder(array $categoryOrders): bool
    {
        try {
            foreach ($categoryOrders as $order) {
                $this->model->where('id', $order['id'])
                    ->update(['order' => $order['order']]);
            }
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function moveToParent(int $categoryId, ?int $newParentId): bool
    {
        $category = $this->model->find($categoryId);
        
        if (!$category) {
            return false;
        }
        
        // Prevent circular references
        if ($newParentId && in_array($newParentId, $this->getDescendants($categoryId))) {
            return false;
        }
        
        $category->parent_id = $newParentId;
        return $category->save();
    }

    public function getMaxOrder(?int $parentId = null): int
    {
        return $this->model->where('parent_id', $parentId)->max('order') ?? 0;
    }

    public function countByStatus(string $status): int
    {
        if ($status === 'active') {
            return $this->model->where('is_active', true)->count();
        } elseif ($status === 'inactive') {
            return $this->model->where('is_active', false)->count();
        }
        
        return $this->model->count();
    }

    /**
     * Convert Eloquent model to domain entity
     */
    private function toDomainEntity(ProductCategoryEloquentModel $category): ProductCategory
    {
        return ProductCategory::fromArray([
            'id' => $category->id,
            'tenant_id' => $category->tenant_id,
            'name' => $category->name,
            'slug' => $category->slug,
            'description' => $category->description,
            'parent_id' => $category->parent_id,
            'image' => $category->image,
            'order' => $category->order,
            'is_active' => $category->is_active,
            'created_at' => $category->created_at,
            'updated_at' => $category->updated_at,
        ]);
    }

    /**
     * Build hierarchical array from flat collection
     */
    private function buildHierarchy(Collection $categories, ?int $parentId = null): array
    {
        $result = [];
        
        $filtered = $categories->where('parent_id', $parentId);
        
        foreach ($filtered as $category) {
            $categoryArray = $category->toArray();
            $categoryArray['children'] = $this->buildHierarchy($categories, $category->id);
            $result[] = $categoryArray;
        }
        
        return $result;
    }
}