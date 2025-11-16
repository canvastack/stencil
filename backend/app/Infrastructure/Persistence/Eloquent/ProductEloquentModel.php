<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class ProductEloquentModel extends Model
{
    use HasUuids;

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
        'images',
        'categories',
        'tags',
        'weight',
        'dimensions',
        'track_stock',
        'allow_backorder',
        'published_at',
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
    }
}