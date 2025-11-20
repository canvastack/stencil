<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;

class MediaFolder extends Model implements TenantAwareModel
{
    use HasFactory, BelongsToTenant;

    protected $table = 'media_folders';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'name',
        'slug',
        'description',
        'parent_id',
        'sort_order',
        'is_public',
        'created_by',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(MediaFolder::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(MediaFolder::class, 'parent_id');
    }

    public function mediaFiles(): HasMany
    {
        return $this->hasMany(MediaFile::class, 'folder_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\UserEloquentModel::class, 'created_by');
    }

    public function getFullPath(): string
    {
        $path = [];
        $current = $this;

        while ($current) {
            array_unshift($path, $current->slug);
            $current = $current->parent;
        }

        return implode('/', $path);
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    public function scopePrivate($query)
    {
        return $query->where('is_public', false);
    }

    public function scopeRoots($query)
    {
        return $query->whereNull('parent_id');
    }
}
