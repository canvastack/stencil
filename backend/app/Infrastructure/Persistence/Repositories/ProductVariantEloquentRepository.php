<?php

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Product\Entities\ProductVariant;
use App\Domain\Product\Repositories\ProductVariantRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\ProductVariantEloquentModel;
use App\Domain\Product\Enums\ProductMaterial;
use App\Domain\Product\Enums\ProductQuality;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class ProductVariantEloquentRepository implements ProductVariantRepositoryInterface
{
    public function __construct(
        private ProductVariantEloquentModel $model
    ) {
    }

    public function findById(int $id): ?ProductVariant
    {
        $variant = $this->model->find($id);
        return $variant ? $this->toDomainEntity($variant) : null;
    }

    public function findBySku(string $sku): ?ProductVariant
    {
        $variant = $this->model->where('sku', $sku)->first();
        return $variant ? $this->toDomainEntity($variant) : null;
    }

    public function findByProduct(int $productId): Collection
    {
        $variants = $this->model->where('product_id', $productId)->get();
        return $variants->map(fn($variant) => $this->toDomainEntity($variant));
    }

    public function findByMaterial(ProductMaterial $material): Collection
    {
        $variants = $this->model->where('material', $material->value)->get();
        return $variants->map(fn($variant) => $this->toDomainEntity($variant));
    }

    public function findByQuality(ProductQuality $quality): Collection
    {
        $variants = $this->model->where('quality', $quality->value)->get();
        return $variants->map(fn($variant) => $this->toDomainEntity($variant));
    }

    public function findByMaterialAndQuality(ProductMaterial $material, ProductQuality $quality): Collection
    {
        $variants = $this->model
            ->where('material', $material->value)
            ->where('quality', $quality->value)
            ->get();
        return $variants->map(fn($variant) => $this->toDomainEntity($variant));
    }

    public function findInStock(): Collection
    {
        $variants = $this->model->where('in_stock', true)->where('stock_quantity', '>', 0)->get();
        return $variants->map(fn($variant) => $this->toDomainEntity($variant));
    }

    public function findOutOfStock(): Collection
    {
        $variants = $this->model
            ->where(function($query) {
                $query->where('in_stock', false)
                      ->orWhere('stock_quantity', '<=', 0);
            })
            ->get();
        return $variants->map(fn($variant) => $this->toDomainEntity($variant));
    }

    public function findLowStock(int $threshold = 10): Collection
    {
        $variants = $this->model
            ->where('in_stock', true)
            ->where('stock_quantity', '>', 0)
            ->where('stock_quantity', '<=', $threshold)
            ->get();
        return $variants->map(fn($variant) => $this->toDomainEntity($variant));
    }

    public function findByPriceRange(float $minPrice, float $maxPrice): Collection
    {
        $variants = $this->model
            ->where('final_price', '>=', $minPrice)
            ->where('final_price', '<=', $maxPrice)
            ->get();
        return $variants->map(fn($variant) => $this->toDomainEntity($variant));
    }

    public function findAvailableForOrder(): Collection
    {
        $variants = $this->model
            ->where('status', 'active')
            ->where('in_stock', true)
            ->where('stock_quantity', '>', 0)
            ->get();
        return $variants->map(fn($variant) => $this->toDomainEntity($variant));
    }

    public function findFeatured(): Collection
    {
        $variants = $this->model->where('featured', true)->orderBy('sort_order')->get();
        return $variants->map(fn($variant) => $this->toDomainEntity($variant));
    }

    public function findByComplexityRating(int $minRating, int $maxRating): Collection
    {
        $variants = $this->model
            ->where('complexity_rating', '>=', $minRating)
            ->where('complexity_rating', '<=', $maxRating)
            ->get();
        return $variants->map(fn($variant) => $this->toDomainEntity($variant));
    }

    public function findWithCustomEtching(): Collection
    {
        $variants = $this->model->where('is_custom_etching_available', true)->get();
        return $variants->map(fn($variant) => $this->toDomainEntity($variant));
    }

    public function findByMinimumOrder(int $maxMinimumOrder): Collection
    {
        $variants = $this->model->where('minimum_order_quantity', '<=', $maxMinimumOrder)->get();
        return $variants->map(fn($variant) => $this->toDomainEntity($variant));
    }

    public function findByLeadTime(int $maxLeadTimeDays): Collection
    {
        $variants = $this->model->where('lead_time_days', '<=', $maxLeadTimeDays)->get();
        return $variants->map(fn($variant) => $this->toDomainEntity($variant));
    }

    public function findByDimensions(?float $minWidth, ?float $maxWidth, ?float $minHeight, ?float $maxHeight): Collection
    {
        $query = $this->model->newQuery();
        
        if ($minWidth !== null) {
            $query->whereRaw("JSON_EXTRACT(dimensions, '$.width') >= ?", [$minWidth]);
        }
        if ($maxWidth !== null) {
            $query->whereRaw("JSON_EXTRACT(dimensions, '$.width') <= ?", [$maxWidth]);
        }
        if ($minHeight !== null) {
            $query->whereRaw("JSON_EXTRACT(dimensions, '$.height') >= ?", [$minHeight]);
        }
        if ($maxHeight !== null) {
            $query->whereRaw("JSON_EXTRACT(dimensions, '$.height') <= ?", [$maxHeight]);
        }
        
        $variants = $query->get();
        return $variants->map(fn($variant) => $this->toDomainEntity($variant));
    }

    public function findByColor(string $color): Collection
    {
        $variants = $this->model->where('color', 'like', "%{$color}%")->get();
        return $variants->map(fn($variant) => $this->toDomainEntity($variant));
    }

    public function findByFinish(string $finish): Collection
    {
        $variants = $this->model->where('finish', 'like', "%{$finish}%")->get();
        return $variants->map(fn($variant) => $this->toDomainEntity($variant));
    }

    public function search(string $query, int $limit = 20): Collection
    {
        $variants = $this->model
            ->where('name', 'LIKE', "%{$query}%")
            ->orWhere('sku', 'LIKE', "%{$query}%")
            ->orWhere('notes', 'LIKE', "%{$query}%")
            ->orderBy('sort_order')
            ->limit($limit)
            ->get();
            
        return $variants->map(fn($variant) => $this->toDomainEntity($variant));
    }

    public function findWithFilters(array $filters, int $limit = 50): Collection
    {
        $query = $this->model->newQuery();
        
        if (!empty($filters['material'])) {
            $query->where('material', $filters['material']);
        }
        
        if (!empty($filters['quality'])) {
            $query->where('quality', $filters['quality']);
        }
        
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        
        if (isset($filters['in_stock'])) {
            $query->where('in_stock', $filters['in_stock']);
        }
        
        if (!empty($filters['featured'])) {
            $query->where('featured', $filters['featured']);
        }
        
        if (!empty($filters['min_price'])) {
            $query->where('final_price', '>=', $filters['min_price']);
        }
        
        if (!empty($filters['max_price'])) {
            $query->where('final_price', '<=', $filters['max_price']);
        }
        
        $variants = $query->orderBy('sort_order')->limit($limit)->get();
        return $variants->map(fn($variant) => $this->toDomainEntity($variant));
    }

    public function save(ProductVariant $variant): ProductVariant
    {
        $eloquentVariant = $this->model->newInstance($variant->toArray());
        $eloquentVariant->save();
        
        return $this->toDomainEntity($eloquentVariant);
    }

    public function update(ProductVariant $variant): ProductVariant
    {
        $eloquentVariant = $this->model->find($variant->getId());
        
        if (!$eloquentVariant) {
            throw new \InvalidArgumentException("Variant with ID {$variant->getId()} not found");
        }
        
        $eloquentVariant->update($variant->toArray());
        
        return $this->toDomainEntity($eloquentVariant);
    }

    public function delete(int $id): bool
    {
        $variant = $this->model->find($id);
        return $variant ? $variant->delete() : false;
    }

    public function exists(int $id): bool
    {
        return $this->model->where('id', $id)->exists();
    }

    public function existsBySku(string $sku): bool
    {
        return $this->model->where('sku', $sku)->exists();
    }

    public function updateStock(int $variantId, int $quantity, int $reservedQuantity = 0): bool
    {
        $variant = $this->model->find($variantId);
        
        if (!$variant) {
            return false;
        }
        
        $variant->stock_quantity = $quantity;
        $variant->reserved_quantity = $reservedQuantity;
        $variant->in_stock = $quantity > 0;
        
        return $variant->save();
    }

    public function reserveStock(int $variantId, int $quantity): bool
    {
        $variant = $this->model->find($variantId);
        
        if (!$variant || $variant->available_quantity < $quantity) {
            return false;
        }
        
        $variant->reserved_quantity += $quantity;
        return $variant->save();
    }

    public function releaseStock(int $variantId, int $quantity): bool
    {
        $variant = $this->model->find($variantId);
        
        if (!$variant || $variant->reserved_quantity < $quantity) {
            return false;
        }
        
        $variant->reserved_quantity -= $quantity;
        return $variant->save();
    }

    public function decrementStock(int $variantId, int $quantity): bool
    {
        $variant = $this->model->find($variantId);
        
        if (!$variant || $variant->stock_quantity < $quantity) {
            return false;
        }
        
        $variant->stock_quantity -= $quantity;
        $variant->in_stock = $variant->stock_quantity > 0;
        
        return $variant->save();
    }

    public function incrementStock(int $variantId, int $quantity): bool
    {
        $variant = $this->model->find($variantId);
        
        if (!$variant) {
            return false;
        }
        
        $variant->stock_quantity += $quantity;
        $variant->in_stock = true;
        
        return $variant->save();
    }

    public function reorder(array $variantOrders): bool
    {
        try {
            foreach ($variantOrders as $order) {
                $this->model->where('id', $order['id'])
                    ->update(['sort_order' => $order['sort_order']]);
            }
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function countByStatus(string $status): int
    {
        return $this->model->where('status', $status)->count();
    }

    public function countByMaterial(ProductMaterial $material): int
    {
        return $this->model->where('material', $material->value)->count();
    }

    public function countInStock(): int
    {
        return $this->model->where('in_stock', true)->where('stock_quantity', '>', 0)->count();
    }

    public function countOutOfStock(): int
    {
        return $this->model->where(function($query) {
            $query->where('in_stock', false)->orWhere('stock_quantity', '<=', 0);
        })->count();
    }

    public function getTotalStockValue(): float
    {
        return $this->model
            ->where('in_stock', true)
            ->selectRaw('SUM(stock_quantity * final_price) as total_value')
            ->value('total_value') ?? 0.0;
    }

    public function getAveragePrice(): float
    {
        return $this->model->avg('final_price') ?? 0.0;
    }

    public function getMaterialDistribution(): array
    {
        return $this->model
            ->select('material')
            ->selectRaw('count(*) as count')
            ->groupBy('material')
            ->pluck('count', 'material')
            ->toArray();
    }

    public function getQualityDistribution(): array
    {
        return $this->model
            ->select('quality')
            ->selectRaw('count(*) as count')
            ->groupBy('quality')
            ->pluck('count', 'quality')
            ->toArray();
    }

    /**
     * Convert Eloquent model to domain entity
     */
    private function toDomainEntity(ProductVariantEloquentModel $variant): ProductVariant
    {
        return ProductVariant::fromArray([
            'id' => $variant->id,
            'tenant_id' => $variant->tenant_id,
            'product_id' => $variant->product_id,
            'name' => $variant->name,
            'sku' => $variant->sku,
            'material' => ProductMaterial::from($variant->material),
            'quality' => ProductQuality::from($variant->quality),
            'base_price' => $variant->base_price,
            'final_price' => $variant->final_price,
            'currency' => $variant->currency,
            'price_modifier' => $variant->price_modifier,
            'dimensions' => $variant->dimensions,
            'weight' => $variant->weight,
            'thickness' => $variant->thickness,
            'color' => $variant->color,
            'finish' => $variant->finish,
            'in_stock' => $variant->in_stock,
            'stock_quantity' => $variant->stock_quantity,
            'reserved_quantity' => $variant->reserved_quantity,
            'available_quantity' => $variant->available_quantity,
            'lead_time_days' => $variant->lead_time_days,
            'minimum_order_quantity' => $variant->minimum_order_quantity,
            'is_custom_etching_available' => $variant->is_custom_etching_available,
            'etching_area_max' => $variant->etching_area_max,
            'complexity_rating' => $variant->complexity_rating,
            'supports_engraving' => $variant->supports_engraving,
            'supports_cutting' => $variant->supports_cutting,
            'weather_resistant' => $variant->weather_resistant,
            'notes' => $variant->notes,
            'status' => $variant->status,
            'featured' => $variant->featured,
            'sort_order' => $variant->sort_order,
            'created_at' => $variant->created_at,
            'updated_at' => $variant->updated_at,
        ]);
    }
}