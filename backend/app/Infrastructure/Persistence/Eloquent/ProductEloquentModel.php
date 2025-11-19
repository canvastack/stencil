<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class ProductEloquentModel extends Model
{

    protected $table = 'products';

    protected $fillable = [
        'tenant_id',
        'name',
        'sku',
        'description',
        'long_description',
        'price',
        'currency',
        'price_unit',
        'status',
        'type',
        'stock_quantity',
        'low_stock_threshold',
        'track_inventory',
        'images',
        'categories',
        'category_id',
        'subcategory',
        'tags',
        'slug',
        'features',
        'material',
        'available_materials',
        'quality_levels',
        'specifications',
        'customizable',
        'custom_options',
        'production_type',
        'requires_quote',
        'lead_time',
        'min_order_quantity',
        'max_order_quantity',
        'vendor_price',
        'markup_percentage',
        'base_markup_percentage',
        'min_price',
        'max_price',
        'vendor_pricing',
        'vendor_id',
        'featured',
        'view_count',
        'average_rating',
        'review_count',
        'seo_title',
        'seo_description',
        'seo_keywords',
        'metadata',
        'dimensions',
        'published_at',
        'last_viewed_at',
    ];

    protected $casts = [
        'price' => 'integer',
        'vendor_price' => 'integer',
        'min_price' => 'integer',
        'max_price' => 'integer',
        'markup_percentage' => 'integer',
        'stock_quantity' => 'integer',
        'low_stock_threshold' => 'integer',
        'min_order_quantity' => 'integer',
        'max_order_quantity' => 'integer',
        'view_count' => 'integer',
        'review_count' => 'integer',
        'images' => 'array',
        'categories' => 'array',
        'tags' => 'array',
        'features' => 'array',
        'available_materials' => 'array',
        'quality_levels' => 'array',
        'specifications' => 'array',
        'custom_options' => 'array',
        'vendor_pricing' => 'array',
        'seo_keywords' => 'array',
        'dimensions' => 'array',
        'metadata' => 'array',
        'base_markup_percentage' => 'decimal:2',
        'average_rating' => 'decimal:2',
        'track_inventory' => 'boolean',
        'customizable' => 'boolean',
        'requires_quote' => 'boolean',
        'featured' => 'boolean',
        'published_at' => 'datetime',
        'last_viewed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(TenantEloquentModel::class, 'tenant_id');
    }

    protected static function booted(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder) {
            if (app()->bound('current_tenant')) {
                $tenant = app('current_tenant');
                if ($tenant) {
                    $builder->where('tenant_id', $tenant->id);
                }
            }
        });
        
        static::creating(function ($product) {
            if (empty($product->slug) && !empty($product->name)) {
                $product->slug = Str::slug($product->name);
                
                // Ensure uniqueness by adding a suffix if needed
                $originalSlug = $product->slug;
                $counter = 1;
                while (static::where('slug', $product->slug)->exists()) {
                    $product->slug = $originalSlug . '-' . $counter;
                    $counter++;
                }
            }
        });
    }
}