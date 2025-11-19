<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;

class ProductVariant extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'uuid',
        'tenant_id',
        'product_id',
        'category_id',
        'name',
        'sku',
        'material',
        'quality',
        'thickness',
        'color',
        'color_hex',
        'dimensions',
        'price_adjustment',
        'markup_percentage',
        'vendor_price',
        'stock_quantity',
        'low_stock_threshold',
        'track_inventory',
        'allow_backorder',
        'is_active',
        'is_default',
        'sort_order',
        'lead_time_days',
        'lead_time_note',
        'images',
        'custom_fields',
        'special_notes',
        'weight',
        'shipping_dimensions',
        'etching_specifications',
        'base_price',
        'selling_price', 
        'retail_price',
        'cost_price',
        'length',
        'width',
    ];

    protected $attributes = [
        'stock_quantity' => 0,
        'price_adjustment' => 0,
        'track_inventory' => true,
        'allow_backorder' => false,
        'is_active' => true,
        'is_default' => false,
        'sort_order' => 0,
    ];

    protected $casts = [
        'dimensions' => 'array',
        'price_adjustment' => 'integer',
        'markup_percentage' => 'float',
        'vendor_price' => 'integer',
        'stock_quantity' => 'integer',
        'low_stock_threshold' => 'integer',
        'track_inventory' => 'boolean',
        'allow_backorder' => 'boolean',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'sort_order' => 'integer',
        'lead_time_days' => 'integer',
        'images' => 'array',
        'custom_fields' => 'array',
        'weight' => 'float',
        'thickness' => 'float',
        'shipping_dimensions' => 'array',
        'etching_specifications' => 'array',
        'base_price' => 'float',
        'selling_price' => 'float',
        'retail_price' => 'float',
        'cost_price' => 'float',
        'length' => 'float',
        'width' => 'float',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * Get the tenant that owns this variant
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the product this variant belongs to
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the category this variant belongs to
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    /**
     * Scope to get only active variants
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get only default variants
     */
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    /**
     * Scope to get variants by material
     */
    public function scopeByMaterial($query, $material)
    {
        return $query->where('material', $material);
    }

    /**
     * Scope to get variants by quality
     */
    public function scopeByQuality($query, $quality)
    {
        return $query->where('quality', $quality);
    }

    /**
     * Scope to get variants that are in stock
     */
    public function scopeInStock($query)
    {
        return $query->where(function ($q) {
            $q->where('track_inventory', false)
              ->orWhere('stock_quantity', '>', 0)
              ->orWhere('allow_backorder', true);
        });
    }

    /**
     * Scope to get variants with low stock
     */
    public function scopeLowStock($query)
    {
        return $query->where('track_inventory', true)
                    ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
                    ->whereNotNull('low_stock_threshold');
    }

    /**
     * Scope to get out of stock variants
     */
    public function scopeOutOfStock($query)
    {
        return $query->where('track_inventory', true)
                    ->where('stock_quantity', 0)
                    ->where('allow_backorder', false);
    }

    /**
     * Scope to order by sort order
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Check if variant is in stock
     */
    public function isInStock(): bool
    {
        if (!$this->track_inventory) {
            return true;
        }

        return $this->stock_quantity > 0 || $this->allow_backorder;
    }

    /**
     * Check if variant has low stock
     */
    public function isLowStock(): bool
    {
        if (!$this->track_inventory || !$this->low_stock_threshold) {
            return false;
        }

        return $this->stock_quantity <= $this->low_stock_threshold;
    }

    /**
     * Get display name combining attributes
     */
    public function getDisplayName(): string
    {
        $parts = [];
        
        if ($this->material) {
            $parts[] = $this->material;
        }
        
        if ($this->quality) {
            $qualityDisplay = $this->quality === 'Tinggi' ? 'Premium' : $this->quality;
            $parts[] = $qualityDisplay;
        }
        
        if ($this->thickness) {
            $parts[] = $this->thickness;
        }
        
        if ($this->color) {
            $parts[] = $this->color;
        }

        return !empty($parts) ? implode(' - ', $parts) : $this->name;
    }

    /**
     * Get the formatted price adjustment
     */
    public function getFormattedPriceAdjustment(): string
    {
        if ($this->price_adjustment === 0) {
            return 'No adjustment';
        }

        $amount = number_format($this->price_adjustment / 100, 0, ',', '.');
        $sign = $this->price_adjustment > 0 ? '+' : '';
        
        return $sign . 'Rp ' . $amount;
    }

    /**
     * Get the formatted vendor price
     */
    public function getFormattedVendorPrice(): ?string
    {
        if (!$this->vendor_price) {
            return null;
        }

        return 'Rp ' . number_format($this->vendor_price / 100, 0, ',', '.');
    }

    /**
     * Scope to filter variants by price range
     */
    public function scopePriceRange($query, $minPrice, $maxPrice)
    {
        return $query->whereBetween('selling_price', [$minPrice, $maxPrice]);
    }

    /**
     * Check if variant has stock (alias method for tests)
     */
    public function hasStock(): bool
    {
        return $this->isInStock();
    }

    /**
     * Get profit margin amount
     */
    public function getProfitMargin(): float
    {
        if (!$this->base_price || !$this->selling_price) {
            return 0.0;
        }

        return (float) ($this->selling_price - $this->base_price);
    }

    /**
     * Get profit margin percentage
     */
    public function getProfitMarginPercentage(): float
    {
        if (!$this->base_price || $this->base_price == 0) {
            return 0.0;
        }

        $margin = $this->getProfitMargin();
        return ($margin / $this->base_price) * 100;
    }

    /**
     * Calculate area from dimensions
     */
    public function getArea(): float
    {
        if (!$this->length || !$this->width) {
            return 0.0;
        }

        return (float) ($this->length * $this->width);
    }

    /**
     * Calculate volume from dimensions
     */
    public function getVolume(): float
    {
        if (!$this->length || !$this->width || !$this->thickness) {
            return 0.0;
        }

        return (float) ($this->length * $this->width * $this->thickness);
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
            
            // Auto-generate name if not provided
            if (empty($model->name)) {
                $name = '';
                if ($model->material) {
                    $name .= ucfirst($model->material);
                }
                if ($model->quality) {
                    $name .= ' ' . ucfirst($model->quality);
                }
                if ($model->thickness) {
                    $name .= ' ' . $model->thickness;
                }
                if (empty($name)) {
                    $name = 'Product Variant';
                }
                $model->name = trim($name);
            }
        });

        // Handle default variant logic
        static::saving(function ($model) {
            // If setting this as default, unset other defaults for the same product
            if ($model->is_default && $model->isDirty('is_default')) {
                static::where('product_id', $model->product_id)
                     ->where('id', '!=', $model->id)
                     ->update(['is_default' => false]);
            }
        });

        // Ensure at least one default variant per product
        static::saved(function ($model) {
            if (!$model->is_default) {
                $hasDefault = static::where('product_id', $model->product_id)
                                  ->where('is_default', true)
                                  ->exists();
                
                if (!$hasDefault) {
                    $model->update(['is_default' => true]);
                }
            }
        });
    }
}