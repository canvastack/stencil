<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductVariant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'tenant_id',
        'product_id',
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
    ];

    protected $casts = [
        'dimensions' => 'array',
        'price_adjustment' => 'integer',
        'markup_percentage' => 'decimal:2',
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
        'weight' => 'decimal:2',
        'shipping_dimensions' => 'array',
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
            $parts[] = $this->quality;
        }
        
        if ($this->thickness) {
            $parts[] = $this->thickness;
        }
        
        if ($this->color) {
            $parts[] = $this->color;
        }

        return !empty($parts) ? implode(' ', $parts) : $this->name;
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