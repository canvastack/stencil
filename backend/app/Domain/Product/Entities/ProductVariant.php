<?php

namespace App\Domain\Product\Entities;

use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Product\ValueObjects\ProductName;
use App\Domain\Product\ValueObjects\ProductSku;
use App\Domain\Product\ValueObjects\ProductPrice;
use App\Domain\Product\Enums\ProductMaterial;
use App\Domain\Product\Enums\ProductQuality;
use DateTime;
use InvalidArgumentException;

class ProductVariant
{
    private Uuid $id;
    private Uuid $tenantId;
    private Uuid $categoryId;
    private ProductName $name;
    private ?ProductSku $sku;
    private ?string $customSku;
    private ?ProductMaterial $material;
    private ?ProductQuality $quality;
    private ?string $thickness;
    private ?string $color;
    private ?string $colorHex;
    private ?array $dimensions;
    private ProductPrice $priceAdjustment;
    private ?float $markupPercentage;
    private ?ProductPrice $vendorPrice;
    private ?ProductPrice $basePrice;
    private ?ProductPrice $sellingPrice;
    private ?ProductPrice $retailPrice;
    private int $stockQuantity;
    private ?int $lowStockThreshold;
    private bool $trackInventory;
    private bool $allowBackorder;
    private bool $isActive;
    private bool $isDefault;
    private int $sortOrder;
    private ?int $leadTimeDays;
    private ?string $leadTimeNote;
    private array $images;
    private array $customFields;
    private ?string $specialNotes;
    private ?float $weight;
    private ?float $length;
    private ?float $width;
    private ?array $shippingDimensions;
    private array $etchingSpecifications;
    private DateTime $createdAt;
    private DateTime $updatedAt;

    public function __construct(
        Uuid $id,
        Uuid $tenantId,
        Uuid $categoryId,
        ProductMaterial $material,
        ProductQuality $quality
    ) {
        $this->id = $id;
        $this->tenantId = $tenantId;
        $this->categoryId = $categoryId;
        $this->material = $material;
        $this->quality = $quality;
        
        // Set default values
        $this->name = new ProductName('Untitled Variant');
        $this->stockQuantity = 0;
        $this->lowStockThreshold = 10;
        $this->trackInventory = true;
        $this->allowBackorder = false;
        $this->isActive = true;
        $this->isDefault = false;
        $this->sortOrder = 0;
        $this->leadTimeDays = null;
        $this->leadTimeNote = null;
        $this->images = [];
        $this->customFields = [];
        $this->specialNotes = null;
        $this->weight = null;
        $this->thickness = null;
        $this->color = null;
        $this->colorHex = null;
        $this->dimensions = null;
        $this->shippingDimensions = null;
        $this->vendorPrice = null;
        $this->basePrice = null;
        $this->sellingPrice = null;
        $this->retailPrice = null;
        $this->length = null;
        $this->width = null;
        $this->etchingSpecifications = [];
        $this->customSku = null;
        $this->markupPercentage = null;
        $this->createdAt = new DateTime();
        $this->updatedAt = new DateTime();
        $this->priceAdjustment = new ProductPrice(0, 'IDR');

        // Generate SKU automatically based on material and quality
        $materialValue = strtolower(str_replace('_', '-', $this->material->value));
        $qualityValue = strtolower($this->quality->value);
        $this->sku = new ProductSku($materialValue . '-' . $qualityValue);

        $this->validateBusinessRules();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getTenantId(): Uuid
    {
        return $this->tenantId;
    }

    public function getCategoryId(): Uuid
    {
        return $this->categoryId;
    }

    public function getName(): ProductName
    {
        return $this->name;
    }

    public function getSku(): string
    {
        return $this->customSku ?: ($this->sku ? (string)$this->sku : '');
    }
    
    public function getBasePrice(): ?float
    {
        return $this->basePrice?->getAmount();
    }

    public function getSellingPrice(): ?float
    {
        return $this->sellingPrice?->getAmount();
    }

    public function getRetailPrice(): ?float
    {
        return $this->retailPrice?->getAmount();
    }

    public function getMaterial(): ?ProductMaterial
    {
        return $this->material;
    }

    public function getQuality(): ?ProductQuality
    {
        return $this->quality;
    }

    public function getThickness(): ?string
    {
        return $this->thickness;
    }

    public function getColor(): ?string
    {
        return $this->color;
    }

    public function getColorHex(): ?string
    {
        return $this->colorHex;
    }

    public function getDimensions(): ?array
    {
        return $this->dimensions;
    }

    public function getPriceAdjustment(): ProductPrice
    {
        return $this->priceAdjustment;
    }

    public function getVendorPrice(): ?ProductPrice
    {
        return $this->vendorPrice;
    }

    public function getStockQuantity(): int
    {
        return $this->stockQuantity;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function isDefault(): bool
    {
        return $this->isDefault;
    }

    public function isInStock(): bool
    {
        if (!$this->trackInventory) {
            return true;
        }

        return $this->stockQuantity > 0 || $this->allowBackorder;
    }

    public function isLowStock(): bool
    {
        if (!$this->trackInventory || $this->lowStockThreshold === null || $this->stockQuantity === 0) {
            return false;
        }

        return $this->stockQuantity <= $this->lowStockThreshold;
    }

    public function getDisplayName(): string
    {
        $parts = [];
        
        if ($this->material) {
            $parts[] = $this->material->getDisplayName();
        }
        
        if ($this->quality) {
            $parts[] = $this->quality->getDisplayName();
        }
        
        if ($this->thickness) {
            $parts[] = $this->thickness;
        }
        
        if ($this->color) {
            $parts[] = $this->color;
        }

        return !empty($parts) ? implode(' - ', $parts) : $this->name->getValue();
    }

    public function updateName(ProductName $name): self
    {
        $this->name = $name;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updateSku(?ProductSku $sku): self
    {
        $this->sku = $sku;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updateMaterial(?ProductMaterial $material): self
    {
        $this->material = $material;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updateQuality(?ProductQuality $quality): self
    {
        $this->quality = $quality;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updateColor(?string $color, ?string $colorHex = null): self
    {
        $this->color = $color;
        $this->colorHex = $colorHex;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updatePriceAdjustment(ProductPrice $priceAdjustment): self
    {
        $this->priceAdjustment = $priceAdjustment;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updateVendorPrice(?ProductPrice $vendorPrice): self
    {
        $this->vendorPrice = $vendorPrice;
        $this->updatedAt = new DateTime();
        
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

        if ($this->trackInventory && !$this->allowBackorder && $this->stockQuantity < $quantity) {
            throw new InvalidArgumentException('Insufficient stock quantity');
        }

        $this->stockQuantity = max(0, $this->stockQuantity - $quantity);
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function activate(): self
    {
        $this->isActive = true;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function deactivate(): self
    {
        $this->isActive = false;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function makeDefault(): self
    {
        $this->isDefault = true;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function removeDefault(): self
    {
        $this->isDefault = false;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updateCustomFields(array $customFields): self
    {
        $this->customFields = $customFields;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updateLeadTime(?int $leadTimeDays, ?string $leadTimeNote = null): self
    {
        if ($leadTimeDays !== null && $leadTimeDays < 0) {
            throw new InvalidArgumentException('Lead time days cannot be negative');
        }

        $this->leadTimeDays = $leadTimeDays;
        $this->leadTimeNote = $leadTimeNote;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    // Stock-related methods
    public function increaseStock(int $quantity): self
    {
        return $this->addStock($quantity);
    }

    public function decreaseStock(int $quantity): self
    {
        if ($quantity <= 0) {
            throw new InvalidArgumentException('Stock quantity to decrease must be positive');
        }

        if ($this->stockQuantity < $quantity) {
            throw new InvalidArgumentException('Cannot decrease stock below zero');
        }

        $this->stockQuantity -= $quantity;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function hasStock(): bool
    {
        return $this->stockQuantity > 0;
    }

    public function isOutOfStock(): bool
    {
        return $this->stockQuantity === 0;
    }

    public function setLowStockThreshold(int $threshold): self
    {
        if ($threshold < 0) {
            throw new InvalidArgumentException('Low stock threshold cannot be negative');
        }

        $this->lowStockThreshold = $threshold;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function getLowStockThreshold(): ?int
    {
        return $this->lowStockThreshold;
    }

    // Pricing methods
    public function updatePricing(float $basePrice, float $sellingPrice, float $retailPrice): self
    {
        $this->basePrice = new ProductPrice($basePrice, 'IDR');
        $this->sellingPrice = new ProductPrice($sellingPrice, 'IDR');
        $this->retailPrice = new ProductPrice($retailPrice, 'IDR');
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function getProfitMarginPercentage(): float
    {
        if ($this->basePrice === null || $this->sellingPrice === null || $this->basePrice->getAmount() == 0) {
            return 0.0;
        }

        $baseAmount = $this->basePrice->getAmount();
        $sellingAmount = $this->sellingPrice->getAmount();
        
        return (($sellingAmount - $baseAmount) / $baseAmount) * 100;
    }

    // Dimension methods
    public function setDimensions(float $length, float $width, ?float $thickness = null): self
    {
        if ($length <= 0 || $width <= 0 || ($thickness !== null && $thickness <= 0)) {
            throw new InvalidArgumentException('Dimensions must be positive numbers');
        }

        $this->length = $length;
        $this->width = $width;
        if ($thickness !== null) {
            $this->thickness = (string)$thickness;
        }
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function getLength(): ?float
    {
        return $this->length;
    }

    public function getWidth(): ?float
    {
        return $this->width;
    }

    public function getArea(): ?float
    {
        if ($this->length === null || $this->width === null) {
            return null;
        }
        
        // Calculate area for both sides (relevant for etching business)
        return $this->length * $this->width * 2;
    }

    public function getVolume(): ?float
    {
        if ($this->length === null || $this->width === null || $this->thickness === null) {
            return null;
        }
        
        // Calculate volume considering both sides (relevant for etching business)
        return $this->length * $this->width * (float)$this->thickness * 2;
    }

    // Weight methods
    public function setWeight(float $weight): self
    {
        if ($weight <= 0) {
            throw new InvalidArgumentException('Weight must be a positive number');
        }

        $this->weight = $weight;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function getWeight(): ?float
    {
        return $this->weight;
    }

    // SKU methods
    public function setCustomSku(string $sku): self
    {
        if (!preg_match('/^[a-zA-Z0-9-]+$/', $sku)) {
            throw new InvalidArgumentException('SKU must be unique and contain only alphanumeric characters and hyphens');
        }

        $this->customSku = $sku;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    // Etching specifications
    public function setEtchingSpecifications(array $specifications): self
    {
        $this->etchingSpecifications = $specifications;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function getEtchingSpecifications(): array
    {
        return $this->etchingSpecifications;
    }

    public function getEtchingSpecification(string $key): ?string
    {
        return $this->etchingSpecifications[$key] ?? null;
    }

    // Material checks
    public function isMaterial(ProductMaterial $material): bool
    {
        return $this->material === $material;
    }

    public function isPlasticMaterial(): bool
    {
        return $this->material && $this->material->isPlastic();
    }

    public function isMetalMaterial(): bool
    {
        return $this->material && $this->material->isMetal();
    }

    // Quality checks
    public function isQuality(ProductQuality $quality): bool
    {
        return $this->quality === $quality;
    }

    public function isStandardQuality(): bool
    {
        return $this->quality === ProductQuality::STANDARD;
    }

    public function isPremiumQuality(): bool
    {
        return $this->quality === ProductQuality::PREMIUM;
    }

    // Price calculations
    public function calculatePriceWithMultipliers(float $basePrice): float
    {
        $materialMultiplier = $this->material ? $this->material->getPricingMultiplier() : 1.0;
        $qualityMultiplier = $this->quality ? $this->quality->getPricingMultiplier() : 1.0;
        
        return $basePrice * $materialMultiplier * $qualityMultiplier;
    }

    private function validateBusinessRules(): void
    {
        if ($this->stockQuantity < 0) {
            throw new InvalidArgumentException('Stock quantity cannot be negative');
        }

        if ($this->lowStockThreshold !== null && $this->lowStockThreshold < 0) {
            throw new InvalidArgumentException('Low stock threshold cannot be negative');
        }

        if ($this->leadTimeDays !== null && $this->leadTimeDays < 0) {
            throw new InvalidArgumentException('Lead time days cannot be negative');
        }

        if ($this->sortOrder < 0) {
            throw new InvalidArgumentException('Sort order cannot be negative');
        }

        if ($this->weight !== null && $this->weight <= 0) {
            throw new InvalidArgumentException('Weight must be positive');
        }
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id->getValue(),
            'tenant_id' => $this->tenantId->getValue(),
            'category_id' => $this->categoryId->getValue(),
            'name' => $this->name->getValue(),
            'display_name' => $this->getDisplayName(),
            'sku' => $this->sku?->getValue(),
            'material' => $this->material?->value,
            'quality' => $this->quality?->value,
            'thickness' => $this->thickness,
            'color' => $this->color,
            'color_hex' => $this->colorHex,
            'dimensions' => $this->dimensions,
            'length' => $this->length,
            'width' => $this->width,
            'weight' => $this->weight,
            'base_price' => $this->basePrice?->getAmount(),
            'selling_price' => $this->sellingPrice?->getAmount(),
            'retail_price' => $this->retailPrice?->getAmount(),
            'price_adjustment' => $this->priceAdjustment->getAmount(),
            'markup_percentage' => $this->markupPercentage,
            'vendor_price' => $this->vendorPrice?->getAmount(),
            'stock_quantity' => $this->stockQuantity,
            'low_stock_threshold' => $this->lowStockThreshold,
            'track_inventory' => $this->trackInventory,
            'allow_backorder' => $this->allowBackorder,
            'is_active' => $this->isActive,
            'is_default' => $this->isDefault,
            'is_in_stock' => $this->isInStock(),
            'is_low_stock' => $this->isLowStock(),
            'sort_order' => $this->sortOrder,
            'lead_time_days' => $this->leadTimeDays,
            'lead_time_note' => $this->leadTimeNote,
            'images' => $this->images,
            'custom_fields' => $this->customFields,
            'special_notes' => $this->specialNotes,
            'weight' => $this->weight,
            'shipping_dimensions' => $this->shippingDimensions,
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
            'updated_at' => $this->updatedAt->format('Y-m-d H:i:s'),
        ];
    }
}