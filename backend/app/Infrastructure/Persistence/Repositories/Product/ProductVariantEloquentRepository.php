<?php

namespace App\Infrastructure\Persistence\Repositories\Product;

use App\Domain\Product\Entities\ProductVariant;
use App\Domain\Product\Enums\ProductMaterial;
use App\Domain\Product\Enums\ProductQuality;
use App\Domain\Product\ValueObjects\ProductName;
use App\Domain\Product\ValueObjects\ProductSku;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Infrastructure\Persistence\Eloquent\Models\Product as ProductModel;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory as ProductCategoryModel;
use App\Infrastructure\Persistence\Eloquent\Models\ProductVariant as ProductVariantModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use RuntimeException;

class ProductVariantEloquentRepository
{
    private ProductVariantModel $variantModel;

    private ProductModel $productModel;

    private ProductCategoryModel $categoryModel;

    private TenantEloquentModel $tenantModel;

    private array $tenantUuidMap = [];

    public function __construct(
        ?ProductVariantModel $variantModel = null,
        ?ProductModel $productModel = null,
        ?ProductCategoryModel $categoryModel = null,
        ?TenantEloquentModel $tenantModel = null,
    ) {
        $this->variantModel = $variantModel ?? new ProductVariantModel();
        $this->productModel = $productModel ?? new ProductModel();
        $this->categoryModel = $categoryModel ?? new ProductCategoryModel();
        $this->tenantModel = $tenantModel ?? new TenantEloquentModel();
    }

    public function save(ProductVariant $variant): ProductVariant
    {
        $tenantContext = $this->currentTenantContext();
        $tenantUuid = $tenantContext['uuid'] ?? $variant->getTenantId()->getValue();
        $tenant = $this->resolveTenant(
            $tenantUuid,
            $tenantContext['name'] ?? null,
            $tenantContext['slug'] ?? null,
            $tenantContext['id'] ?? null,
        );

        $categoryUuid = $variant->getCategoryId()->getValue();
        $category = $this->resolveCategory($tenant->id, $tenant->uuid, $categoryUuid);

        $product = $this->resolveProduct($tenant->id, $tenant->uuid, $category->id, $variant);

        $attributes = $this->mapDomainToAttributes($tenant->id, $category->id, $product->id, $variant);

        $eloquentVariant = $this->variantModel->newQuery()->updateOrCreate(
            ['uuid' => $variant->getId()->getValue()],
            $attributes,
        );

        return $this->mapModelToDomain($eloquentVariant->fresh(['tenant', 'category']));
    }

    public function findById(string $uuid): ?ProductVariant
    {
        if (!Str::isUuid($uuid)) {
            return null;
        }

        $variant = $this->baseQuery()
            ->where('uuid', $uuid)
            ->first();

        return $variant ? $this->mapModelToDomain($variant) : null;
    }

    public function findBySku(string $tenantUuid, string $sku): ?ProductVariant
    {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);

        if (!$tenantId) {
            return null;
        }

        $variant = $this->baseQuery()
            ->where('tenant_id', $tenantId)
            ->where('sku', $sku)
            ->first();

        return $variant ? $this->mapModelToDomain($variant) : null;
    }

    public function findByCategoryMaterialQuality(
        string $tenantUuid,
        string $categoryUuid,
        ProductMaterial $material,
        ProductQuality $quality
    ): ?ProductVariant {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);
        $categoryId = $this->categoryIdFromUuid($categoryUuid);

        if (!$tenantId || !$categoryId) {
            return null;
        }

        $variant = $this->baseQuery()
            ->where('tenant_id', $tenantId)
            ->where('category_id', $categoryId)
            ->where('material', $material->getDisplayName())
            ->where('quality', $quality->getDisplayName())
            ->first();

        return $variant ? $this->mapModelToDomain($variant) : null;
    }

    public function findByCategory(string $categoryUuid): array
    {
        $categoryId = $this->categoryIdFromUuid($categoryUuid);

        if (!$categoryId) {
            return [];
        }

        return $this->mapCollection(
            $this->baseQuery()
                ->where('category_id', $categoryId)
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
                ->where('material', $material->getDisplayName())
                ->get(),
        );
    }

    public function findByQuality(string $tenantUuid, ProductQuality $quality): array
    {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);

        if (!$tenantId) {
            return [];
        }

        return $this->mapCollection(
            $this->baseQuery()
                ->where('tenant_id', $tenantId)
                ->where('quality', $quality->getDisplayName())
                ->get(),
        );
    }

    public function findActiveVariants(string $tenantUuid): array
    {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);

        if (!$tenantId) {
            return [];
        }

        return $this->mapCollection(
            $this->baseQuery()
                ->where('tenant_id', $tenantId)
                ->where('is_active', true)
                ->get(),
        );
    }

    public function findInStock(string $tenantUuid): array
    {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);

        if (!$tenantId) {
            return [];
        }

        return $this->mapCollection(
            $this->baseQuery()
                ->where('tenant_id', $tenantId)
                ->where('stock_quantity', '>', 0)
                ->get(),
        );
    }

    public function findLowStock(string $tenantUuid): array
    {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);

        if (!$tenantId) {
            return [];
        }

        return $this->mapCollection(
            $this->baseQuery()
                ->where('tenant_id', $tenantId)
                ->whereNotNull('low_stock_threshold')
                ->where('stock_quantity', '>', 0)
                ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
                ->get(),
        );
    }

    public function findByPriceRange(string $tenantUuid, float $minPrice, float $maxPrice): array
    {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);

        if (!$tenantId) {
            return [];
        }

        return $this->mapCollection(
            $this->baseQuery()
                ->where('tenant_id', $tenantId)
                ->whereBetween('selling_price', [$minPrice, $maxPrice])
                ->get(),
        );
    }

    public function updateStock(string $uuid, int $quantity): bool
    {
        if (!Str::isUuid($uuid)) {
            return false;
        }

        $variant = $this->variantModel->newQuery()->where('uuid', $uuid)->first();

        if (!$variant) {
            return false;
        }

        $variant->stock_quantity = max(0, $quantity);
        $variant->save();

        return true;
    }

    public function increaseStock(string $uuid, int $quantity): bool
    {
        if ($quantity <= 0 || !Str::isUuid($uuid)) {
            return false;
        }

        $variant = $this->variantModel->newQuery()->where('uuid', $uuid)->first();

        if (!$variant) {
            return false;
        }

        $variant->stock_quantity += $quantity;
        $variant->save();

        return true;
    }

    public function decreaseStock(string $uuid, int $quantity): bool
    {
        if ($quantity <= 0 || !Str::isUuid($uuid)) {
            return false;
        }

        $variant = $this->variantModel->newQuery()->where('uuid', $uuid)->first();

        if (!$variant) {
            return false;
        }

        if ($variant->stock_quantity < $quantity) {
            return false;
        }

        $variant->stock_quantity -= $quantity;
        $variant->save();

        return true;
    }

    public function updatePricing(string $uuid, float $basePrice, float $sellingPrice, float $retailPrice): bool
    {
        if (!Str::isUuid($uuid)) {
            return false;
        }

        $variant = $this->variantModel->newQuery()->where('uuid', $uuid)->first();

        if (!$variant) {
            return false;
        }

        $variant->base_price = $basePrice;
        $variant->selling_price = $sellingPrice;
        $variant->retail_price = $retailPrice;
        $variant->save();

        return true;
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

    public function countByCategory(string $categoryUuid): int
    {
        $categoryId = $this->categoryIdFromUuid($categoryUuid);

        if (!$categoryId) {
            return 0;
        }

        return (int) $this->baseQuery()
            ->where('category_id', $categoryId)
            ->count();
    }

    public function skuExists(string $tenantUuid, string $sku): bool
    {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);

        if (!$tenantId) {
            return false;
        }

        return $this->baseQuery()
            ->where('tenant_id', $tenantId)
            ->where('sku', $sku)
            ->exists();
    }

    public function delete(string $uuid): bool
    {
        if (!Str::isUuid($uuid)) {
            return false;
        }

        $variant = $this->variantModel->newQuery()->where('uuid', $uuid)->first();

        if (!$variant) {
            return false;
        }

        return (bool) $variant->delete();
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

    public function search(string $tenantUuid, string $query, int $limit = 20): array
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
                        ->where('name', 'like', $like)
                        ->orWhere('sku', 'like', $like);
                })
                ->limit($limit)
                ->get(),
        );
    }

    public function getStockSummary(string $tenantUuid): array
    {
        $tenantId = $this->tenantIdFromUuid($tenantUuid);

        if (!$tenantId) {
            return [
                'total_stock' => 0,
                'variant_count' => 0,
                'average_stock' => 0.0,
            ];
        }

        $query = $this->baseQuery()->where('tenant_id', $tenantId);

        $variantCount = (int) (clone $query)->count();
        $totalStock = (int) (clone $query)->sum('stock_quantity');

        return [
            'total_stock' => $totalStock,
            'variant_count' => $variantCount,
            'average_stock' => $variantCount > 0 ? $totalStock / $variantCount : 0.0,
        ];
    }

    private function baseQuery(): Builder
    {
        return $this->variantModel->newQuery()->with(['tenant', 'category'])->whereNull('deleted_at');
    }

    private function mapCollection(EloquentCollection $collection): array
    {
        return $collection->map(fn (ProductVariantModel $variant): ProductVariant => $this->mapModelToDomain($variant))->all();
    }

    private function mapDomainToAttributes(
        int $tenantId,
        int $categoryId,
        int $productId,
        ProductVariant $variant
    ): array {
        return [
            'tenant_id' => $tenantId,
            'product_id' => $productId,
            'category_id' => $categoryId,
            'name' => $variant->getName()->getValue(),
            'sku' => $variant->getSku(),
            'material' => $variant->getMaterial()?->getDisplayName(),
            'quality' => $variant->getQuality()?->getDisplayName(),
            'thickness' => $variant->getThickness() !== null ? (float) $variant->getThickness() : null,
            'color' => $variant->getColor(),
            'color_hex' => $variant->getColorHex(),
            'dimensions' => $variant->getDimensions(),
            'etching_specifications' => $variant->getEtchingSpecifications(),
            'stock_quantity' => $variant->getStockQuantity(),
            'low_stock_threshold' => $variant->getLowStockThreshold(),
            'is_active' => $variant->isActive(),
            'is_default' => $variant->isDefault(),
            'base_price' => $variant->getBasePrice(),
            'selling_price' => $variant->getSellingPrice(),
            'retail_price' => $variant->getRetailPrice(),
            'weight' => $variant->getWeight(),
            'length' => $variant->getLength(),
            'width' => $variant->getWidth(),
        ];
    }

    private function mapModelToDomain(ProductVariantModel $variant): ProductVariant
    {
        $tenantUuid = $variant->tenant?->uuid ?? $this->tenantModel->newQuery()->find($variant->tenant_id)?->uuid;
        $categoryUuid = $variant->category?->uuid ?? $this->categoryModel->newQuery()->find($variant->category_id)?->uuid;

        if (!$tenantUuid || !$categoryUuid) {
            throw new RuntimeException('Variant is missing tenant or category context.');
        }

        $materialEnum = $this->materialFromStoredValue($variant->material);
        $qualityEnum = $this->qualityFromStoredValue($variant->quality);

        $entity = new ProductVariant(
            new Uuid($variant->uuid),
            new Uuid($tenantUuid),
            new Uuid($categoryUuid),
            $materialEnum,
            $qualityEnum,
        );

        $entity->updateName(new ProductName($variant->name));
        $entity->updateSku($variant->sku ? new ProductSku($variant->sku) : null);
        $entity->updateStock((int) $variant->stock_quantity);

        if ($variant->low_stock_threshold !== null) {
            $entity->setLowStockThreshold((int) $variant->low_stock_threshold);
        }

        if (!$variant->is_active) {
            $entity->deactivate();
        }

        if ($variant->color || $variant->color_hex) {
            $entity->updateColor($variant->color, $variant->color_hex);
        }

        if ($variant->length && $variant->width) {
            $entity->setDimensions((float) $variant->length, (float) $variant->width, $variant->thickness !== null ? (float) $variant->thickness : null);
        }

        if ($variant->weight) {
            $entity->setWeight((float) $variant->weight);
        }

        if ($variant->etching_specifications) {
            $entity->setEtchingSpecifications((array) $variant->etching_specifications);
        }

        if ($variant->base_price !== null && $variant->selling_price !== null && $variant->retail_price !== null) {
            $entity->updatePricing((float) $variant->base_price, (float) $variant->selling_price, (float) $variant->retail_price);
        }

        return $entity;
    }

    private function materialFromStoredValue(?string $value): ProductMaterial
    {
        foreach (ProductMaterial::cases() as $case) {
            if ($case->getDisplayName() === $value || $case->value === Str::lower(Str::replace(' ', '_', (string) $value))) {
                return $case;
            }
        }

        return ProductMaterial::AKRILIK;
    }

    private function qualityFromStoredValue(?string $value): ProductQuality
    {
        foreach (ProductQuality::cases() as $case) {
            if ($case->getDisplayName() === $value || $case->value === Str::lower((string) $value)) {
                return $case;
            }
        }

        return ProductQuality::STANDARD;
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

    private function resolveTenant(string $uuid, ?string $name, ?string $slug, ?int $preferredId = null): TenantEloquentModel
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

    private function resolveCategory(int $tenantId, string $tenantUuid, string $categoryUuid): ProductCategoryModel
    {
        $category = $this->categoryModel->newQuery()->where('uuid', $categoryUuid)->first();

        if ($category) {
            return $category;
        }

        $name = 'Category ' . Str::substr($categoryUuid, 0, 8);
        $slug = Str::slug($name . '-' . Str::substr($tenantUuid, 0, 6));

        return $this->categoryModel->newQuery()->create([
            'uuid' => $categoryUuid,
            'tenant_id' => $tenantId,
            'name' => $name,
            'slug' => $slug,
            'is_active' => true,
            'level' => 0,
            'path' => $slug,
        ]);
    }

    private function resolveProduct(int $tenantId, string $tenantUuid, int $categoryId, ProductVariant $variant): ProductModel
    {
        $sku = 'prod-' . Str::replace('-', '', Str::substr($variant->getId()->getValue(), 0, 12));

        $product = $this->productModel->newQuery()
            ->where('tenant_id', $tenantId)
            ->where('sku', $sku)
            ->first();

        if ($product) {
            return $product;
        }

        $name = $variant->getDisplayName() ?: 'Product ' . Str::substr($variant->getId()->getValue(), 0, 8);
        $slugBase = $name . '-' . Str::substr($variant->getId()->getValue(), 0, 8);
        $slugCandidate = Str::slug($slugBase);

        if ($this->productModel->newQuery()->where('slug', $slugCandidate)->exists()) {
            $slugCandidate = Str::slug($slugBase . '-' . Str::substr(Str::uuid()->toString(), 0, 6));
        }

        return $this->productModel->newQuery()->create([
            'uuid' => Str::uuid()->toString(),
            'tenant_id' => $tenantId,
            'category_id' => $categoryId,
            'name' => $name,
            'sku' => $sku,
            'price' => 0,
            'currency' => 'IDR',
            'status' => 'draft',
            'type' => 'physical',
            'stock_quantity' => $variant->getStockQuantity(),
            'track_inventory' => true,
            'slug' => $slugCandidate,
        ]);
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
