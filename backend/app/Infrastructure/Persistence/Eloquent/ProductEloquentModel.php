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
        'price',
        'currency',
        'status',
        'type',
        'stock_quantity',
        'low_stock_threshold',
        'track_inventory',
        'images',
        'categories',
        'tags',
        'slug',
        'vendor_price',
        'markup_percentage',
        'vendor_id',
        'seo_title',
        'seo_description',
        'metadata',
        'dimensions',
    ];

    protected $casts = [
        'id' => 'string',
        'tenant_id' => 'string',
        'price' => 'decimal:2',
        'stock_quantity' => 'integer',
        'low_stock_threshold' => 'integer',
        'images' => 'array',
        'categories' => 'array',
        'tags' => 'array',
        'weight' => 'decimal:3',
        'dimensions' => 'array',
        'track_stock' => 'boolean',
        'allow_backorder' => 'boolean',
        'published_at' => 'datetime',
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