<?php

namespace App\Infrastructure\Persistence\Repositories\Product;

use App\Domain\Product\Entities\ProductCategory;
use App\Domain\Product\Enums\ProductMaterial;
use App\Domain\Product\Enums\ProductQuality;
use App\Domain\Product\ValueObjects\ProductCategoryName;
use App\Domain\Product\ValueObjects\ProductCategorySlug;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory as ProductCategoryModel;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use RuntimeException;

class ProductCategoryEloquentRepository
{
    private ProductCategoryModel $categoryModel;

    private Tenant $tenantModel;

    private array $tenantUuidMap = [];

    public function __construct(
        ?ProductCategoryModel $categoryModel = null,
        ?Tenant $tenantModel = null,
    ) {
        $this->categoryModel = $categoryModel ?? new ProductCategoryModel();
        $this->tenantModel = $tenantModel ?? new Tenant();
    }

    public function save(ProductCategory $category): ProductCategory
    {
        $tenantContext = $this->currentTenantContext();
        $tenantUuid = $tenantContext['uuid'] ?? $category->getTenantId()->getValue();
        $tenant = $this->resolveTenant(
            $tenantUuid,
            $tenantContext['name'] ?? null,
            $tenantContext['slug'] ?? null,
            $tenantContext['id'] ?? null,
        );

        $parentId = null;
        $parentUuid = $category->getParentId()?->getValue();
        if ($parentUuid) {
            $parentId = $this->categoryIdFromUuid($parentUuid);
        }

        $attributes = $this->mapDomainToAttributes($tenant->id, $parentId, $category);

        $eloquentCategory = $this->categoryModel->newQuery()->updateOrCreate(
            ['uuid' => $category->getId()->getValue()],
            $attributes,
        );

        return $this->mapModelToDomain($eloquentCategory->fresh(['tenant', 'parent']));
    }

    public function findById(string $uuid): ?ProductCategory
    {
        if (!Str::isUuid($uuid)) {
            return null;
        }

        $category = $this->baseQuery()
            ->where('uuid', $uuid)
            ->first();

        return $category ? $this->mapModelToDomain($category) : null;
    }

    public function findBySlug(string $tenantUuid, string $slug): ?ProductCategory
    {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);

        if (!$tenantId) {
            return null;
        }

        $category = $this->baseQuery()
            ->where('tenant_id', $tenantId)
            ->where('slug', $slug)
            ->first();

        return $category ? $this->mapModelToDomain($category) : null;
    }

    public function findRootCategories(string $tenantUuid): array
    {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);

        if (!$tenantId) {
            return [];
        }

        return $this->mapCollection(
            $this->baseQuery()
                ->where('tenant_id', $tenantId)
                ->whereNull('parent_id')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
        );
    }

    public function findChildren(string $parentUuid): array
    {
        if (!Str::isUuid($parentUuid)) {
            return [];
        }

        $parentId = $this->categoryIdFromUuid($parentUuid);

        if (!$parentId) {
            return [];
        }

        return $this->mapCollection(
            $this->baseQuery()
                ->where('parent_id', $parentId)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
        );
    }

    public function findActiveCategories(string $tenantUuid): array
    {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);

        if (!$tenantId) {
            return [];
        }

        return $this->mapCollection(
            $this->baseQuery()
                ->where('tenant_id', $tenantId)
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
        );
    }

    public function findFeaturedCategories(string $tenantUuid): array
    {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);

        if (!$tenantId) {
            return [];
        }

        return $this->mapCollection(
            $this->baseQuery()
                ->where('tenant_id', $tenantId)
                ->where('is_featured', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
        );
    }

    public function findByMaterial(string $tenantUuid, ProductMaterial $material): array
    {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);

        if (!$tenantId) {
            return [];
        }

        return $this->mapCollection(
            $this->baseQuery()
                ->where('tenant_id', $tenantId)
                ->whereJsonContains('allowed_materials', $material->value)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
        );
    }

    public function findByLevel(string $tenantUuid, int $level): array
    {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);

        if (!$tenantId) {
            return [];
        }

        return $this->mapCollection(
            $this->baseQuery()
                ->where('tenant_id', $tenantId)
                ->where('level', $level)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
        );
    }

    public function searchByName(string $tenantUuid, string $query): array
    {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);

        if (!$tenantId) {
            return [];
        }

        return $this->mapCollection(
            $this->baseQuery()
                ->where('tenant_id', $tenantId)
                ->where(function (Builder $builder) use ($query): void {
                    $like = "%{$query}%";
                    $builder
                        ->where('name', 'ilike', $like)
                        ->orWhere('description', 'ilike', $like);
                })
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
        );
    }

    public function countByTenant(string $tenantUuid): int
    {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);

        if (!$tenantId) {
            return 0;
        }

        return (int) $this->baseQuery()
            ->where('tenant_id', $tenantId)
            ->count();
    }

    public function slugExists(string $tenantUuid, string $slug): bool
    {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);

        if (!$tenantId) {
            return false;
        }

        return $this->baseQuery()
            ->where('tenant_id', $tenantId)
            ->where('slug', $slug)
            ->exists();
    }

    public function getCategoryHierarchy(string $tenantUuid): array
    {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);

        if (!$tenantId) {
            return [];
        }

        $categories = $this->baseQuery()
            ->where('tenant_id', $tenantId)
            ->orderBy('level')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return $this->buildHierarchy($categories);
    }

    public function delete(string $uuid): bool
    {
        if (!Str::isUuid($uuid)) {
            return false;
        }

        $category = $this->categoryModel->newQuery()->where('uuid', $uuid)->first();

        if (!$category) {
            return false;
        }

        return (bool) $category->delete();
    }

    public function findPaginated(string $tenantUuid, int $page, int $perPage): array
    {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);

        if (!$tenantId) {
            return [
                'data' => [],
                'total' => 0,
                'total_pages' => 0,
                'current_page' => $page,
            ];
        }

        /** @var LengthAwarePaginator $paginator */
        $paginator = $this->baseQuery()
            ->where('tenant_id', $tenantId)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate($perPage, ['*'], 'page', $page);

        return [
            'data' => $this->mapCollection(new EloquentCollection($paginator->items())),
            'total' => $paginator->total(),
            'total_pages' => $paginator->lastPage(),
            'current_page' => $paginator->currentPage(),
        ];
    }

    public function findAllSorted(string $tenantUuid, string $sortField, string $direction = 'asc'): array
    {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);

        if (!$tenantId) {
            return [];
        }

        return $this->mapCollection(
            $this->baseQuery()
                ->where('tenant_id', $tenantId)
                ->orderBy($sortField, $direction)
                ->orderBy('name')
                ->get(),
        );
    }

    private function baseQuery(): Builder
    {
        return $this->categoryModel->newQuery()->with(['tenant', 'parent'])->whereNull('deleted_at');
    }

    private function mapCollection(EloquentCollection $collection): array
    {
        return $collection
            ->map(fn (ProductCategoryModel $model): ProductCategory => $this->mapModelToDomain($model))
            ->all();
    }

    private function buildHierarchy(EloquentCollection $categories, ?int $parentId = null): array
    {
        return $categories
            ->where('parent_id', $parentId)
            ->map(function (ProductCategoryModel $model) use ($categories) {
                return [
                    'category' => $this->mapModelToDomain($model),
                    'children' => $this->buildHierarchy($categories, $model->id),
                ];
            })
            ->values()
            ->all();
    }

    private function mapDomainToAttributes(int $tenantId, ?int $parentId, ProductCategory $category): array
    {
        return [
            'tenant_id' => $tenantId,
            'name' => $category->getName()->getValue(),
            'slug' => $category->getSlug()->getValue(),
            'description' => $category->getDescription(),
            'parent_id' => $parentId,
            'sort_order' => $category->getSortOrder(),
            'level' => $category->getLevel(),
            'path' => $category->getPath(),
            'image' => $category->getImage(),
            'icon' => $category->getIcon(),
            'color_scheme' => $category->getColorScheme(),
            'is_active' => $category->isActive(),
            'is_featured' => $category->isFeatured(),
            'show_in_menu' => $category->showInMenu(),
            'allowed_materials' => array_map(static fn (ProductMaterial $material): string => $material->value, $category->getAllowedMaterials()),
            'quality_levels' => array_map(static fn (ProductQuality $quality): string => $quality->value, $category->getQualityLevels()),
            'customization_options' => $category->getCustomizationOptions(),
            'seo_title' => $category->getSeoTitle(),
            'seo_description' => $category->getSeoDescription(),
            'seo_keywords' => $category->getSeoKeywords(),
            'base_markup_percentage' => $category->getBaseMarkupPercentage(),
            'requires_quote' => $category->requiresQuote(),
        ];
    }

    private function mapModelToDomain(ProductCategoryModel $model): ProductCategory
    {
        $tenantUuid = $model->tenant?->uuid ?? $this->tenantModel->newQuery()->find($model->tenant_id)?->uuid;
        if (!$tenantUuid) {
            throw new RuntimeException('Category is missing tenant context.');
        }

        $parentUuid = $model->parent?->uuid;

        $allowedMaterials = array_map(static fn (string $value): ProductMaterial => ProductMaterial::fromString($value), $model->allowed_materials ?? []);
        $qualityLevels = array_map(static fn (string $value): ProductQuality => ProductQuality::fromString($value), $model->quality_levels ?? []);

        return new ProductCategory(
            new Uuid($model->uuid),
            new Uuid($tenantUuid),
            new ProductCategoryName($model->name),
            new ProductCategorySlug($model->slug),
            $model->description,
            $parentUuid ? new Uuid($parentUuid) : null,
            (int) $model->sort_order,
            (int) $model->level,
            $model->path,
            $model->image,
            $model->icon,
            $model->color_scheme,
            (bool) $model->is_active,
            (bool) $model->is_featured,
            (bool) $model->show_in_menu,
            $allowedMaterials,
            $qualityLevels,
            $model->customization_options ?? [],
            $model->seo_title,
            $model->seo_description,
            $model->seo_keywords ?? [],
            $model->base_markup_percentage !== null ? (float) $model->base_markup_percentage : null,
            (bool) $model->requires_quote,
            $model->created_at,
            $model->updated_at,
        );
    }

    private function normalizeTenantUuid(string $uuid): string
    {
        if (Str::isUuid($uuid)) {
            return $uuid;
        }

        if (!isset($this->tenantUuidMap[$uuid])) {
            $this->tenantUuidMap[$uuid] = Str::uuid()->toString();
        }

        return $this->tenantUuidMap[$uuid];
    }

    private function resolveTenant(string $uuid, ?string $name, ?string $slug, ?int $preferredId = null): Tenant
    {
        $normalizedUuid = $this->normalizeTenantUuid($uuid);

        $tenant = $this->tenantModel->newQuery()->where('uuid', $normalizedUuid)->first();

        if ($tenant) {
            return $tenant;
        }

        if ($preferredId) {
            $tenantById = $this->tenantModel->newQuery()->find($preferredId);
            if ($tenantById) {
                if ($tenantById->uuid !== $normalizedUuid) {
                    $tenantById->uuid = $normalizedUuid;
                    $tenantById->save();
                }

                return $tenantById;
            }
        }

        $resolvedName = $name ?? 'Tenant ' . Str::upper(Str::substr($normalizedUuid, 0, 8));
        $resolvedSlug = $slug ?? Str::slug($resolvedName);

        $payload = [
            'uuid' => $normalizedUuid,
            'name' => $resolvedName,
            'slug' => $resolvedSlug,
            'status' => 'active',
            'subscription_status' => 'active',
        ];

        $tenant = $this->tenantModel->newInstance();
        $tenant->forceFill($payload);

        if ($preferredId) {
            $tenant->id = $preferredId;
        }

        $tenant->save();

        return $tenant;
    }

    private function tenantIdFromUuid(string $tenantUuid): ?int
    {
        $normalized = $this->normalizeTenantUuid($tenantUuid);

        return $this->tenantModel->newQuery()->where('uuid', $normalized)->value('id');
    }

    private function categoryIdFromUuid(string $categoryUuid): ?int
    {
        return $this->categoryModel->newQuery()->where('uuid', $categoryUuid)->value('id');
    }

    private function currentTenantContext(): array
    {
        if (!app()->bound('currentTenant')) {
            return [];
        }

        $tenant = app('currentTenant');
        $uuid = $tenant->uuid ?? null;
        $normalizedUuid = $uuid ? $this->normalizeTenantUuid($uuid) : null;

        return [
            'id' => $tenant->id ?? null,
            'uuid' => $normalizedUuid,
            'name' => $tenant->name ?? null,
            'slug' => $tenant->slug ?? null,
        ];
    }
}
