<?php

namespace App\Application\Product\Commands;

class CreateProductVariantCommand
{
    public readonly string $id;

    public function __construct(
        public readonly string $tenantId,
        public readonly string $categoryId,
        public readonly string $material,
        public readonly string $quality,
        ?string $id = null,
        public readonly ?string $name = null,
        public readonly ?string $customSku = null,
        public readonly ?float $basePrice = null,
        public readonly ?float $sellingPrice = null,
        public readonly ?float $retailPrice = null,
        public readonly ?int $stockQuantity = null,
        public readonly ?int $lowStockThreshold = null,
        public readonly ?float $length = null,
        public readonly ?float $width = null,
        public readonly ?float $height = null,
        public readonly ?float $thickness = null,
        public readonly ?float $weight = null,
        public readonly ?array $etchingSpecifications = null,
        public readonly ?bool $isActive = null,
        public readonly ?int $sortOrder = null
    ) {
        $this->id = $id ?? \Ramsey\Uuid\Uuid::uuid4()->toString();
    }

    public static function fromArray(array $data): self
    {
        return new self(
            tenantId: $data['tenant_id'],
            categoryId: $data['category_id'],
            material: $data['material'],
            quality: $data['quality'],
            id: $data['id'] ?? null,
            name: $data['name'] ?? null,
            customSku: $data['custom_sku'] ?? null,
            basePrice: $data['base_price'] ?? null,
            sellingPrice: $data['selling_price'] ?? null,
            retailPrice: $data['retail_price'] ?? null,
            stockQuantity: $data['stock_quantity'] ?? null,
            lowStockThreshold: $data['low_stock_threshold'] ?? null,
            length: $data['length'] ?? null,
            width: $data['width'] ?? null,
            height: $data['height'] ?? null,
            thickness: $data['thickness'] ?? null,
            weight: $data['weight'] ?? null,
            etchingSpecifications: $data['etching_specifications'] ?? null,
            isActive: $data['is_active'] ?? null,
            sortOrder: $data['sort_order'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenantId,
            'category_id' => $this->categoryId,
            'material' => $this->material,
            'quality' => $this->quality,
            'name' => $this->name,
            'custom_sku' => $this->customSku,
            'base_price' => $this->basePrice,
            'selling_price' => $this->sellingPrice,
            'retail_price' => $this->retailPrice,
            'stock_quantity' => $this->stockQuantity,
            'low_stock_threshold' => $this->lowStockThreshold,
            'length' => $this->length,
            'width' => $this->width,
            'height' => $this->height,
            'thickness' => $this->thickness,
            'weight' => $this->weight,
            'etching_specifications' => $this->etchingSpecifications,
            'is_active' => $this->isActive,
            'sort_order' => $this->sortOrder,
        ];
    }
}