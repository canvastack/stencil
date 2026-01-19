<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ContentTypeEloquentModel extends Model
{
    protected $table = 'canplug_pagen_content_types';
    
    protected $fillable = [
        'uuid',
        'tenant_id',
        'name',
        'slug',
        'description',
        'icon',
        'default_url_pattern',
        'is_commentable',
        'is_categorizable',
        'is_taggable',
        'is_revisioned',
        'scope',
        'is_active',
        'metadata',
    ];

    protected $casts = [
        'is_commentable' => 'boolean',
        'is_categorizable' => 'boolean',
        'is_taggable' => 'boolean',
        'is_revisioned' => 'boolean',
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

    public function contents(): HasMany
    {
        return $this->hasMany(ContentEloquentModel::class, 'content_type_id', 'uuid');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::class, 'tenant_id', 'id');
    }

    public function scopePlatformLevel($query)
    {
        return $query->where('scope', 'platform');
    }

    public function scopeTenantLevel($query)
    {
        return $query->where('scope', 'tenant');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}
