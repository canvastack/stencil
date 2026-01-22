<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class TenantUrlConfigurationEloquentModel extends Model
{
    use HasFactory;

    protected $table = 'tenant_url_configurations';

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    protected $fillable = [
        'uuid',
        'tenant_id',
        'url_pattern',
        'is_primary',
        'is_enabled',
        'subdomain',
        'url_path',
        'custom_domain_id',
        'force_https',
        'redirect_to_primary',
        'meta_title',
        'meta_description',
        'og_image_url',
        'deleted_at',
    ];

    protected $casts = [
        'id' => 'integer',
        'tenant_id' => 'integer',
        'custom_domain_id' => 'integer',
        'is_primary' => 'boolean',
        'is_enabled' => 'boolean',
        'force_https' => 'boolean',
        'redirect_to_primary' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(TenantEloquentModel::class, 'tenant_id');
    }

    public function customDomain(): BelongsTo
    {
        return $this->belongsTo(CustomDomainEloquentModel::class, 'custom_domain_id');
    }

    public function analytics(): HasMany
    {
        return $this->hasMany(UrlAccessAnalyticEloquentModel::class, 'url_config_id');
    }

    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }

    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }

    public function scopeByTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeByPattern($query, string $pattern)
    {
        return $query->where('url_pattern', $pattern);
    }

    public function scopeBySubdomain($query, string $subdomain)
    {
        return $query->where('subdomain', $subdomain);
    }

    public function scopeByPath($query, string $path)
    {
        return $query->where('url_path', $path);
    }

    public function scopeActive($query)
    {
        return $query->whereNull('deleted_at');
    }
}
