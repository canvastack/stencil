<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class CustomDomainEloquentModel extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'custom_domains';

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
            if (empty($model->verification_token)) {
                $model->verification_token = Str::random(64);
            }
        });
    }

    protected $fillable = [
        'uuid',
        'tenant_id',
        'domain_name',
        'is_verified',
        'verification_method',
        'verification_token',
        'verified_at',
        'ssl_enabled',
        'ssl_certificate_path',
        'ssl_certificate_issued_at',
        'ssl_certificate_expires_at',
        'auto_renew_ssl',
        'dns_provider',
        'dns_record_id',
        'dns_zone_id',
        'status',
        'redirect_to_https',
        'www_redirect',
        'metadata',
        'created_by',
        'deleted_at',
    ];

    protected $casts = [
        'id' => 'integer',
        'tenant_id' => 'integer',
        'created_by' => 'integer',
        'is_verified' => 'boolean',
        'verified_at' => 'datetime',
        'ssl_enabled' => 'boolean',
        'ssl_certificate_issued_at' => 'datetime',
        'ssl_certificate_expires_at' => 'datetime',
        'auto_renew_ssl' => 'boolean',
        'redirect_to_https' => 'boolean',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(TenantEloquentModel::class, 'tenant_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(UserEloquentModel::class, 'created_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(UserEloquentModel::class, 'created_by');
    }

    public function urlConfigurations(): HasMany
    {
        return $this->hasMany(TenantUrlConfigurationEloquentModel::class, 'custom_domain_id');
    }

    public function verificationLogs(): HasMany
    {
        return $this->hasMany(DomainVerificationLogEloquentModel::class, 'custom_domain_id');
    }

    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeByDomain($query, string $domain)
    {
        return $query->where('domain_name', $domain);
    }

    public function scopeSslExpiring($query, int $days = 30)
    {
        return $query->where('ssl_enabled', true)
                    ->whereNotNull('ssl_certificate_expires_at')
                    ->whereBetween('ssl_certificate_expires_at', [
                        now(),
                        now()->addDays($days)
                    ]);
    }

    public function scopePendingVerification($query)
    {
        return $query->where('status', 'pending_verification');
    }
}
