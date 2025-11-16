<?php

namespace App\Domain\Product\Entities;

use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Product\ValueObjects\ProductName;
use App\Domain\Product\ValueObjects\ProductPrice;
use App\Domain\Product\ValueObjects\ProductSku;
use App\Domain\Product\ValueObjects\ProductDescription;
use App\Domain\Product\Enums\ProductStatus;
use App\Domain\Product\Enums\ProductType;
use DateTime;
use InvalidArgumentException;

class Product
{
    private UuidValueObject $id;
    private UuidValueObject $tenantId;
    private ProductName $name;
    private ProductSku $sku;
    private ?ProductDescription $description;
    private ProductPrice $price;
    private ProductStatus $status;
    private ProductType $type;
    private int $stockQuantity;
    private ?int $lowStockThreshold;
    private array $images;
    private array $categories;
    private array $tags;
    private ?float $weight;
    private ?array $dimensions;
    private bool $trackStock;
    private bool $allowBackorder;
    private ?DateTime $publishedAt;
    private DateTime $createdAt;
    private DateTime $updatedAt;

    public function __construct(
        UuidValueObject $id,
        UuidValueObject $tenantId,
        ProductName $name,
        ProductSku $sku,
        ProductPrice $price,
        ?ProductDescription $description = null,
        ProductStatus $status = ProductStatus::DRAFT,
        ProductType $type = ProductType::PHYSICAL,
        int $stockQuantity = 0,
        ?int $lowStockThreshold = null,
        array $images = [],
        array $categories = [],
        array $tags = [],
        ?float $weight = null,
        ?array $dimensions = null,
        bool $trackStock = true,
        bool $allowBackorder = false,
        ?DateTime $publishedAt = null,
        ?DateTime $createdAt = null,
        ?DateTime $updatedAt = null
    ) {
        $this->id = $id;
        $this->tenantId = $tenantId;
        $this->name = $name;
        $this->sku = $sku;
        $this->price = $price;
        $this->description = $description;
        $this->status = $status;
        $this->type = $type;
        $this->stockQuantity = $stockQuantity;
        $this->lowStockThreshold = $lowStockThreshold;
        $this->images = $images;
        $this->categories = $categories;
        $this->tags = $tags;
        $this->weight = $weight;
        $this->dimensions = $dimensions;
        $this->trackStock = $trackStock;
        $this->allowBackorder = $allowBackorder;
        $this->publishedAt = $publishedAt;
        $this->createdAt = $createdAt ?? new DateTime();
        $this->updatedAt = $updatedAt ?? new DateTime();

        $this->validateBusinessRules();
    }

    public function getId(): UuidValueObject
    {
        return $this->id;
    }

    public function getTenantId(): UuidValueObject
    {
        return $this->tenantId;
    }

    public function getName(): ProductName
    {
        return $this->name;
    }

    public function getSku(): ProductSku
    {
        return $this->sku;
    }

    public function getDescription(): ?ProductDescription
    {
        return $this->description;
    }

    public function getPrice(): ProductPrice
    {
        return $this->price;
    }

    public function getStatus(): ProductStatus
    {
        return $this->status;
    }

    public function getType(): ProductType
    {
        return $this->type;
    }

    public function getStockQuantity(): int
    {
        return $this->stockQuantity;
    }

    public function getLowStockThreshold(): ?int
    {
        return $this->lowStockThreshold;
    }

    public function getImages(): array
    {
        return $this->images;
    }

    public function getCategories(): array
    {
        return $this->categories;
    }

    public function getTags(): array
    {
        return $this->tags;
    }

    public function getWeight(): ?float
    {
        return $this->weight;
    }

    public function getDimensions(): ?array
    {
        return $this->dimensions;
    }

    public function isTrackStock(): bool
    {
        return $this->trackStock;
    }

    public function isAllowBackorder(): bool
    {
        return $this->allowBackorder;
    }

    public function getPublishedAt(): ?DateTime
    {
        return $this->publishedAt;
    }

    public function getCreatedAt(): DateTime
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): DateTime
    {
        return $this->updatedAt;
    }

    public function updateName(ProductName $name): self
    {
        $this->name = $name;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updatePrice(ProductPrice $price): self
    {
        $this->price = $price;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updateDescription(?ProductDescription $description): self
    {
        $this->description = $description;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updateStatus(ProductStatus $status): self
    {
        $oldStatus = $this->status;
        $this->status = $status;
        $this->updatedAt = new DateTime();

        if ($status === ProductStatus::PUBLISHED && $oldStatus !== ProductStatus::PUBLISHED) {
            $this->publishedAt = new DateTime();
        }
        
        return $this;
    }

    public function updateStock(int $quantity): self
    {
        if ($quantity < 0) {
            throw new InvalidArgumentException('Stock quantity cannot be negative');
        }

        $this->stockQuantity = $quantity;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function addStock(int $quantity): self
    {
        if ($quantity <= 0) {
            throw new InvalidArgumentException('Stock quantity to add must be positive');
        }

        $this->stockQuantity += $quantity;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function reduceStock(int $quantity): self
    {
        if ($quantity <= 0) {
            throw new InvalidArgumentException('Stock quantity to reduce must be positive');
        }

        if (!$this->canReduceStock($quantity)) {
            throw new InvalidArgumentException('Insufficient stock quantity');
        }

        $this->stockQuantity -= $quantity;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updateLowStockThreshold(?int $threshold): self
    {
        if ($threshold !== null && $threshold < 0) {
            throw new InvalidArgumentException('Low stock threshold cannot be negative');
        }

        $this->lowStockThreshold = $threshold;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function addImage(string $imagePath): self
    {
        if (!in_array($imagePath, $this->images)) {
            $this->images[] = $imagePath;
            $this->updatedAt = new DateTime();
        }
        
        return $this;
    }

    public function removeImage(string $imagePath): self
    {
        $index = array_search($imagePath, $this->images);
        
        if ($index !== false) {
            array_splice($this->images, $index, 1);
            $this->updatedAt = new DateTime();
        }
        
        return $this;
    }

    public function addCategory(string $category): self
    {
        $category = trim($category);
        
        if (!empty($category) && !in_array($category, $this->categories)) {
            $this->categories[] = $category;
            $this->updatedAt = new DateTime();
        }
        
        return $this;
    }

    public function removeCategory(string $category): self
    {
        $index = array_search($category, $this->categories);
        
        if ($index !== false) {
            array_splice($this->categories, $index, 1);
            $this->updatedAt = new DateTime();
        }
        
        return $this;
    }

    public function addTag(string $tag): self
    {
        $tag = trim($tag);
        
        if (!empty($tag) && !in_array($tag, $this->tags)) {
            $this->tags[] = $tag;
            $this->updatedAt = new DateTime();
        }
        
        return $this;
    }

    public function removeTag(string $tag): self
    {
        $index = array_search($tag, $this->tags);
        
        if ($index !== false) {
            array_splice($this->tags, $index, 1);
            $this->updatedAt = new DateTime();
        }
        
        return $this;
    }

    public function updateWeight(?float $weight): self
    {
        if ($weight !== null && $weight <= 0) {
            throw new InvalidArgumentException('Weight must be positive');
        }

        $this->weight = $weight;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updateDimensions(?array $dimensions): self
    {
        if ($dimensions !== null) {
            $this->validateDimensions($dimensions);
        }

        $this->dimensions = $dimensions;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function publish(): self
    {
        $this->status = ProductStatus::PUBLISHED;
        $this->publishedAt = new DateTime();
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function unpublish(): self
    {
        $this->status = ProductStatus::DRAFT;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function isPublished(): bool
    {
        return $this->status === ProductStatus::PUBLISHED;
    }

    public function isDraft(): bool
    {
        return $this->status === ProductStatus::DRAFT;
    }

    public function isOutOfStock(): bool
    {
        if (!$this->trackStock) {
            return false;
        }

        return $this->stockQuantity <= 0;
    }

    public function isLowStock(): bool
    {
        if (!$this->trackStock || $this->lowStockThreshold === null) {
            return false;
        }

        return $this->stockQuantity <= $this->lowStockThreshold;
    }

    public function canBePurchased(): bool
    {
        if (!$this->isPublished()) {
            return false;
        }

        if ($this->isOutOfStock() && !$this->allowBackorder) {
            return false;
        }

        return true;
    }

    public function canReduceStock(int $quantity): bool
    {
        if (!$this->trackStock) {
            return true;
        }

        if ($this->allowBackorder) {
            return true;
        }

        return $this->stockQuantity >= $quantity;
    }

    public function getPrimaryImage(): ?string
    {
        return empty($this->images) ? null : $this->images[0];
    }

    private function validateBusinessRules(): void
    {
        if ($this->trackStock && $this->stockQuantity < 0) {
            throw new InvalidArgumentException('Stock quantity cannot be negative when stock tracking is enabled');
        }

        if ($this->lowStockThreshold !== null && $this->lowStockThreshold < 0) {
            throw new InvalidArgumentException('Low stock threshold cannot be negative');
        }

        if ($this->weight !== null && $this->weight <= 0) {
            throw new InvalidArgumentException('Weight must be positive');
        }
    }

    private function validateDimensions(array $dimensions): void
    {
        $requiredKeys = ['length', 'width', 'height'];
        
        foreach ($requiredKeys as $key) {
            if (!isset($dimensions[$key]) || !is_numeric($dimensions[$key]) || $dimensions[$key] <= 0) {
                throw new InvalidArgumentException("Dimension '{$key}' must be a positive number");
            }
        }
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id->getValue(),
            'tenant_id' => $this->tenantId->getValue(),
            'name' => $this->name->getValue(),
            'sku' => $this->sku->getValue(),
            'description' => $this->description?->getValue(),
            'price' => $this->price->getAmount(),
            'currency' => $this->price->getCurrency(),
            'status' => $this->status->value,
            'type' => $this->type->value,
            'stock_quantity' => $this->stockQuantity,
            'low_stock_threshold' => $this->lowStockThreshold,
            'images' => $this->images,
            'categories' => $this->categories,
            'tags' => $this->tags,
            'weight' => $this->weight,
            'dimensions' => $this->dimensions,
            'track_stock' => $this->trackStock,
            'allow_backorder' => $this->allowBackorder,
            'published_at' => $this->publishedAt?->format('Y-m-d H:i:s'),
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
            'updated_at' => $this->updatedAt->format('Y-m-d H:i:s'),
        ];
    }
}