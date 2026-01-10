<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;

class Product extends Model implements TenantAwareModel
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'uuid',
        'tenant_id',
        'category_id',
        'name',
        'sku',
        'description',
        'long_description',
        'price',
        'currency',
        'status',
        'type',
        'business_type',
        'stock_quantity',
        'low_stock_threshold',
        'track_inventory',
        'categories',
        'tags',
        'vendor_price',
        'markup_percentage',
        'vendor_id',
        'images',
        'slug',
        'seo_title',
        'seo_description',
        'seo_keywords',
        'metadata',
        'dimensions',
        'features',
        'material',
        'size',
        'available_sizes',
        'subcategory',
        'customizable',
        'custom_options',
        'production_type',
        'requires_quote',
        'lead_time',
        'min_order_quantity',
        'max_order_quantity',
        'price_unit',
        'min_price',
        'max_price',
        'quality_levels',
        'specifications',
        'available_materials',
        'base_markup_percentage',
        'vendor_pricing',
        'featured',
        'view_count',
        'average_rating',
        'review_count',
        'published_at',
        'last_viewed_at',
        'product_type',
        'bahan',
        'bahan_options',
        'kualitas',
        'kualitas_options',
        'ketebalan',
        'ketebalan_options',
        'ukuran',
        'ukuran_options',
        'warna_background',
        'design_file_url',
        'custom_texts',
        'notes_wysiwyg',
    ];

    protected $casts = [
        'price' => 'integer',
        'stock_quantity' => 'integer',
        'low_stock_threshold' => 'integer',
        'track_inventory' => 'boolean',
        'categories' => 'json',
        'tags' => 'json',
        'vendor_price' => 'integer',
        'markup_percentage' => 'integer',
        'images' => 'json',
        'metadata' => 'json',
        'dimensions' => 'json',
        'features' => 'json',
        'custom_options' => 'json',
        'customizable' => 'boolean',
        'requires_quote' => 'boolean',
        'min_order_quantity' => 'integer',
        'max_order_quantity' => 'integer',
        'min_price' => 'integer',
        'max_price' => 'integer',
        'quality_levels' => 'json',
        'specifications' => 'json',
        'available_materials' => 'json',
        'available_sizes' => 'json',
        'base_markup_percentage' => 'decimal:2',
        'vendor_pricing' => 'json',
        'featured' => 'boolean',
        'view_count' => 'integer',
        'average_rating' => 'decimal:2',
        'review_count' => 'integer',
        'seo_keywords' => 'json',
        'published_at' => 'datetime',
        'last_viewed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'bahan_options' => 'json',
        'kualitas_options' => 'json',
        'ketebalan_options' => 'json',
        'ukuran_options' => 'json',
        'custom_texts' => 'json',
    ];

    protected $dates = [
        'published_at',
        'last_viewed_at',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * Get the tenant that owns this product
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the category this product belongs to
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    /**
     * Get the product variants
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    /**
     * Get the active form configuration for this product
     */
    public function formConfiguration(): HasMany
    {
        return $this->hasMany(\App\Models\ProductFormConfiguration::class, 'product_id', 'id');
    }

    /**
     * Get the active form configuration (single)
     */
    public function activeFormConfiguration(): ?object
    {
        return $this->formConfiguration()->where('is_active', true)->first();
    }

    /**
     * Scope to get only published products
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    /**
     * Scope to get only featured products
     */
    public function scopeFeatured($query)
    {
        return $query->where('featured', true);
    }

    /**
     * Scope to get products in stock
     */
    public function scopeInStock($query)
    {
        return $query->where('stock_quantity', '>', 0);
    }

    /**
     * Scope to get products by material
     */
    public function scopeByMaterial($query, $material)
    {
        return $query->where('material', $material);
    }

    /**
     * Scope to get products by business type
     */
    public function scopeBusinessType($query, string $type)
    {
        return $query->where('business_type', $type);
    }

    /**
     * Scope to get customizable products
     */
    public function scopeCustomizable($query)
    {
        return $query->where('customizable', true);
    }

    /**
     * Get display label for business type
     */
    public function getBusinessTypeLabel(): string
    {
        return match($this->business_type) {
            'metal_etching' => 'Metal Etching',
            'glass_etching' => 'Glass Etching',
            'award_plaque' => 'Awards & Plaques',
            'signage' => 'Signage Solutions',
            'industrial_etching' => 'Industrial Etching',
            'general' => 'General',
            default => ucwords(str_replace('_', ' ', $this->business_type ?? 'General'))
        };
    }

    /**
     * Boot method to handle model events
     */
    protected static function boot()
    {
        parent::boot();

        // Auto-generate UUID when creating
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = \Ramsey\Uuid\Uuid::uuid4()->toString();
            }
        });
    }

    /**
     * Check if product has stock
     */
    public function hasStock(): bool
    {
        return $this->stock_quantity > 0;
    }

    /**
     * Check if product is low on stock
     */
    public function isLowStock(): bool
    {
        if (!$this->low_stock_threshold) {
            return false;
        }

        return $this->stock_quantity <= $this->low_stock_threshold;
    }

    /**
     * Calculate profit margin
     */
    public function getProfitMargin(): float
    {
        if ($this->vendor_price === 0 || $this->vendor_price === null) {
            return 0.0;
        }

        return (($this->price - $this->vendor_price) / $this->vendor_price) * 100;
    }

    /**
     * Get available colors for the product from specifications
     */
    public function getAvailableColors(): array
    {
        if ($this->specifications && isset($this->specifications['colors'])) {
            return $this->specifications['colors'];
        }
        
        // Default colors for etching business
        return [
            ['name' => 'Natural', 'hex' => null, 'label' => 'Natural'],
            ['name' => 'Black', 'hex' => '#000000', 'label' => 'Hitam'],
            ['name' => 'Silver', 'hex' => '#C0C0C0', 'label' => 'Silver'],
            ['name' => 'Gold', 'hex' => '#FFD700', 'label' => 'Emas'],
        ];
    }

    /**
     * Get thickness options from specifications
     */
    public function getThicknessOptions(): array
    {
        return $this->specifications['thickness_options'] ?? ['2mm', '3mm', '5mm'];
    }

    /**
     * Get all product options for order customization
     */
    public function getProductOptions(): array
    {
        return [
            'materials' => $this->available_materials ?? [],
            'sizes' => $this->available_sizes ?? [],
            'quality_levels' => $this->quality_levels ?? ['standard', 'premium'],
            'colors' => $this->getAvailableColors(),
            'thickness_options' => $this->getThicknessOptions(),
            'custom_options' => $this->custom_options ?? [],
            'customizable' => $this->customizable,
        ];
    }

    /**
     * Check if product has multiple material options
     */
    public function hasMultipleMaterials(): bool
    {
        return !empty($this->available_materials) && count($this->available_materials) > 1;
    }

    /**
     * Check if product has multiple size options
     */
    public function hasMultipleSizes(): bool
    {
        return !empty($this->available_sizes) && count($this->available_sizes) > 1;
    }
}