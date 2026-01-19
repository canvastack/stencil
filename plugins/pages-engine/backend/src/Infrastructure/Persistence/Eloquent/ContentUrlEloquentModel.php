<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ContentUrlEloquentModel extends Model
{
    protected $table = 'canplug_pagen_urls';
    
    protected $fillable = [
        'uuid',
        'tenant_id',
        'content_id',
        'old_url',
        'new_url',
        'redirect_type',
        'is_active',
        'hit_count',
    ];

    protected $casts = [
        'redirect_type' => 'integer',
        'is_active' => 'boolean',
        'hit_count' => 'integer',
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

    public function content(): BelongsTo
    {
        return $this->belongsTo(ContentEloquentModel::class, 'content_id', 'uuid');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::class, 'tenant_id', 'id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeForOldUrl($query, string $oldUrl)
    {
        return $query->where('old_url', $oldUrl);
    }
}
