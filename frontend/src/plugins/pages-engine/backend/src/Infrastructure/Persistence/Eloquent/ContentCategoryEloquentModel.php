<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class ContentCategoryEloquentModel extends Model
{
    protected $table = 'canplug_pagen_categories';
    
    protected $fillable = [
        'uuid',
        'tenant_id',
        'content_type_id',
        'parent_id',
        'name',
        'slug',
        'description',
        'path',
        'level',
        'featured_image_id',
        'seo_title',
        'seo_description',
        'sort_order',
        'content_count',
        'is_active',
        'metadata',
    ];

    protected $casts = [
        'level' => 'integer',
        'sort_order' => 'integer',
        'content_count' => 'integer',
        'is_active' => 'boolean',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $hidden = [
        'id',
    ];

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function contentType(): BelongsTo
    {
        return $this->belongsTo(ContentTypeEloquentModel::class, 'content_type_id', 'uuid');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::class, 'tenant_id', 'id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ContentCategoryEloquentModel::class, 'parent_id', 'uuid');
    }

    public function children(): HasMany
    {
        return $this->hasMany(ContentCategoryEloquentModel::class, 'parent_id', 'uuid');
    }

    public function contents(): BelongsToMany
    {
        return $this->belongsToMany(
            ContentEloquentModel::class,
            'canplug_pagen_category_pivot',
            'category_id',
            'content_id',
            'uuid',
            'uuid'
        )->withTimestamps();
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeOfType($query, string $contentTypeUuid)
    {
        return $query->where('content_type_id', $contentTypeUuid);
    }

    public function scopeRootCategories($query)
    {
        return $query->whereNull('parent_id');
    }

    public function scopeOrderBySort($query)
    {
        return $query->orderBy('sort_order', 'asc');
    }
}
