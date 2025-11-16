<?php

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Product\Entities\Product;
use App\Domain\Product\Repositories\ProductRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Product\ValueObjects\ProductName;
use App\Domain\Product\ValueObjects\ProductSku;
use App\Domain\Product\ValueObjects\ProductPrice;
use App\Domain\Product\ValueObjects\ProductDescription;
use App\Domain\Product\Enums\ProductStatus;
use App\Domain\Product\Enums\ProductType;
use App\Infrastructure\Persistence\Eloquent\ProductEloquentModel;

class ProductEloquentRepository implements ProductRepositoryInterface
{
    public function __construct(
        private ProductEloquentModel $model
    ) {}

    public function findById(UuidValueObject $id): ?Product
    {
        $model = $this->model->find($id->getValue());
        
        if (!$model) {
            return null;
        }
        
        return $this->toDomain($model);
    }

    public function findBySku(UuidValueObject $tenantId, ProductSku $sku): ?Product
    {
        $model = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('sku', $sku->getValue())
            ->first();
        
        if (!$model) {
            return null;
        }
        
        return $this->toDomain($model);
    }

    public function findByTenantId(UuidValueObject $tenantId): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findByStatus(UuidValueObject $tenantId, ProductStatus $status): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('status', $status->value)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findByType(UuidValueObject $tenantId, ProductType $type): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('type', $type->value)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findByCategory(UuidValueObject $tenantId, string $category): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->whereJsonContains('categories', $category)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findByTag(UuidValueObject $tenantId, string $tag): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->whereJsonContains('tags', $tag)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findLowStock(UuidValueObject $tenantId): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('track_stock', true)
            ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findOutOfStock(UuidValueObject $tenantId): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('track_stock', true)
            ->where('stock_quantity', 0)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findPublished(UuidValueObject $tenantId): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('status', ProductStatus::PUBLISHED->value)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function save(Product $product): Product
    {
        $data = $this->fromDomain($product);
        
        $model = $this->model->updateOrCreate(
            ['id' => $data['id']],
            $data
        );
        
        return $this->toDomain($model);
    }

    public function delete(UuidValueObject $id): bool
    {
        return $this->model->where('id', $id->getValue())->delete() > 0;
    }

    public function existsBySku(UuidValueObject $tenantId, ProductSku $sku): bool
    {
        return $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('sku', $sku->getValue())
            ->exists();
    }

    public function countByTenantId(UuidValueObject $tenantId): int
    {
        return $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->count();
    }

    public function countByStatus(UuidValueObject $tenantId, ProductStatus $status): int
    {
        return $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('status', $status->value)
            ->count();
    }

    public function searchByName(UuidValueObject $tenantId, string $searchTerm): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('name', 'like', "%{$searchTerm}%")
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findByPriceRange(UuidValueObject $tenantId, float $minPrice, float $maxPrice): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->whereBetween('price', [$minPrice, $maxPrice])
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function updateStock(UuidValueObject $productId, int $quantity): bool
    {
        return $this->model
            ->where('id', $productId->getValue())
            ->update(['stock_quantity' => $quantity]) > 0;
    }

    private function toDomain(ProductEloquentModel $model): Product
    {
        return new Product(
            new UuidValueObject($model->id),
            new UuidValueObject($model->tenant_id),
            new ProductName($model->name),
            new ProductSku($model->sku),
            new ProductPrice($model->price, $model->currency),
            $model->description ? new ProductDescription($model->description) : null,
            ProductStatus::fromString($model->status),
            ProductType::fromString($model->type),
            $model->stock_quantity,
            $model->low_stock_threshold,
            $model->images ?? [],
            $model->categories ?? [],
            $model->tags ?? [],
            $model->weight,
            $model->dimensions,
            $model->track_stock,
            $model->allow_backorder,
            $model->published_at,
            $model->created_at,
            $model->updated_at
        );
    }

    private function fromDomain(Product $product): array
    {
        return [
            'id' => $product->getId()->getValue(),
            'tenant_id' => $product->getTenantId()->getValue(),
            'name' => $product->getName()->getValue(),
            'sku' => $product->getSku()->getValue(),
            'description' => $product->getDescription()?->getValue(),
            'price' => $product->getPrice()->getAmount(),
            'currency' => $product->getPrice()->getCurrency(),
            'status' => $product->getStatus()->value,
            'type' => $product->getType()->value,
            'stock_quantity' => $product->getStockQuantity(),
            'low_stock_threshold' => $product->getLowStockThreshold(),
            'images' => $product->getImages(),
            'categories' => $product->getCategories(),
            'tags' => $product->getTags(),
            'weight' => $product->getWeight(),
            'dimensions' => $product->getDimensions(),
            'track_stock' => $product->isTrackStock(),
            'allow_backorder' => $product->isAllowBackorder(),
            'published_at' => $product->getPublishedAt(),
        ];
    }
}