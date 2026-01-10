<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Cache;

class ProductFormConfiguration extends Model
{
    use HasFactory, SoftDeletes;

    protected static function booted()
    {
        static::saved(function ($config) {
            self::invalidateCache($config);
        });

        static::deleted(function ($config) {
            self::invalidateCache($config);
        });

        static::restored(function ($config) {
            self::invalidateCache($config);
        });
    }

    private static function invalidateCache($config): void
    {
        if ($config->product_uuid) {
            Cache::forget("product_form_config:{$config->product_uuid}");
        }
        
        if ($config->uuid) {
            Cache::forget("form_config:{$config->uuid}");
        }
    }

    protected $table = 'product_form_configurations';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'product_id',
        'product_uuid',
        'name',
        'description',
        'form_schema',
        'validation_rules',
        'conditional_logic',
        'is_active',
        'is_default',
        'is_template',
        'template_id',
        'version',
        'submission_count',
        'avg_completion_time',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'form_schema' => 'array',
        'validation_rules' => 'array',
        'conditional_logic' => 'array',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'is_template' => 'boolean',
        'version' => 'integer',
        'submission_count' => 'integer',
        'avg_completion_time' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::class, 'tenant_id', 'id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\Models\Product::class, 'product_id', 'id');
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(ProductFormTemplate::class, 'template_id', 'id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\Models\User::class, 'created_by', 'id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\Models\User::class, 'updated_by', 'id');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(ProductFormSubmission::class, 'form_configuration_id', 'id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeByProduct($query, int $productId)
    {
        return $query->where('product_id', $productId);
    }
}
