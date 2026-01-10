<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductFormTemplate extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'product_form_templates';

    protected $fillable = [
        'uuid',
        'name',
        'description',
        'category',
        'form_schema',
        'validation_rules',
        'conditional_logic',
        'is_public',
        'is_system',
        'tenant_id',
        'preview_image_url',
        'tags',
        'usage_count',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'form_schema' => 'array',
        'validation_rules' => 'array',
        'conditional_logic' => 'array',
        'tags' => 'array',
        'is_public' => 'boolean',
        'is_system' => 'boolean',
        'usage_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::class, 'tenant_id', 'uuid');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\Models\User::class, 'created_by', 'id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\Models\User::class, 'updated_by', 'id');
    }

    public function configurations(): HasMany
    {
        return $this->hasMany(ProductFormConfiguration::class, 'template_id', 'id');
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByTenant($query, ?string $tenantId = null)
    {
        if ($tenantId === null) {
            return $query->whereNull('tenant_id');
        }
        return $query->where('tenant_id', $tenantId);
    }

    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }
}
