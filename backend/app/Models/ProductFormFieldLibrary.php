<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductFormFieldLibrary extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'product_form_field_library';

    protected $fillable = [
        'uuid',
        'name',
        'description',
        'field_type',
        'category',
        'field_config',
        'is_system',
        'tenant_id',
        'icon',
        'preview_url',
        'tags',
        'usage_count',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'field_config' => 'array',
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

    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    public function scopeByType($query, string $fieldType)
    {
        return $query->where('field_type', $fieldType);
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
