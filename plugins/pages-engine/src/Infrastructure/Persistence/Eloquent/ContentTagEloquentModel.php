<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class ContentTagEloquentModel extends Model
{
    protected $table = 'canplug_pagen_tags';
    
    protected $fillable = [
        'uuid',
        'tenant_id',
        'name',
        'slug',
        'description',
        'content_count',
        'metadata',
    ];

    protected $casts = [
        'content_count' => 'integer',
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

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::class, 'tenant_id', 'uuid');
    }

    public function contents(): BelongsToMany
    {
        return $this->belongsToMany(
            ContentEloquentModel::class,
            'canplug_pagen_tag_pivot',
            'tag_id',
            'content_id',
            'uuid',
            'uuid'
        )->withTimestamps();
    }

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopePopular($query, int $limit = 10)
    {
        return $query->orderBy('content_count', 'desc')->limit($limit);
    }
}
