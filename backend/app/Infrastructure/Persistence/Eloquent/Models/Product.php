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
    ];

    protected $casts = [
        'price' => 'integer',
        'stock_quantity' => 'integer',
        'low_stock_threshold' => 'integer',
        'track_inventory' => 'boolean',
        'categories' => 'array',
        'tags' => 'array',
        'vendor_price' => 'integer',
        'markup_percentage' => 'integer',
        'images' => 'array',
        'metadata' => 'array',
        'dimensions' => 'array',
        'features' => 'array',
        'custom_options' => 'array',
        'customizable' => 'boolean',
        'requires_quote' => 'boolean',
        'min_order_quantity' => 'integer',
        'max_order_quantity' => 'integer',
        'min_price' => 'integer',
        'max_price' => 'integer',
        'quality_levels' => 'array',
        'specifications' => 'array',
        'available_materials' => 'array',
        'base_markup_percentage' => 'decimal:2',
        'vendor_pricing' => 'array',
        'featured' => 'boolean',
        'view_count' => 'integer',
        'average_rating' => 'decimal:2',
        'review_count' => 'integer',
        'seo_keywords' => 'array',
        'published_at' => 'datetime',
        'last_viewed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
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
     * Scope to get customizable products
     */
    public function scopeCustomizable($query)
    {
        return $query->where('customizable', true);
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
}