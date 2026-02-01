<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class ExchangeRateProvider extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'tenant_id',
        'name',
        'code',
        'api_url',
        'api_key',
        'requires_api_key',
        'is_unlimited',
        'monthly_quota',
        'priority',
        'is_enabled',
        'warning_threshold',
        'critical_threshold',
    ];

    protected $casts = [
        'requires_api_key' => 'boolean',
        'is_unlimited' => 'boolean',
        'is_enabled' => 'boolean',
        'monthly_quota' => 'integer',
        'priority' => 'integer',
        'warning_threshold' => 'integer',
        'critical_threshold' => 'integer',
    ];

    protected $hidden = [
        'id',
        'tenant_id',
        'api_key',
    ];

    protected $appends = [
        'uuid',
    ];

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
        return $this->belongsTo(Tenant::class);
    }

    public function quotaTracking(): HasMany
    {
        return $this->hasMany(ApiQuotaTracking::class, 'provider_id');
    }

    public function history(): HasMany
    {
        return $this->hasMany(ExchangeRateHistory::class, 'provider_id');
    }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }

    public function scopeOrderedByPriority($query)
    {
        return $query->orderBy('priority', 'asc');
    }

    public function setApiKeyAttribute(?string $value): void
    {
        if ($value !== null && $value !== '') {
            $this->attributes['api_key'] = Crypt::encryptString($value);
        } else {
            $this->attributes['api_key'] = null;
        }
    }

    public function getApiKeyAttribute(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return null;
        }
    }

    public function getCurrentQuota(): ?ApiQuotaTracking
    {
        $now = now();
        return $this->quotaTracking()
            ->where('year', $now->year)
            ->where('month', $now->month)
            ->first();
    }

    public function getRemainingQuota(): ?int
    {
        if ($this->is_unlimited) {
            return null;
        }

        $currentQuota = $this->getCurrentQuota();
        if (!$currentQuota) {
            return $this->monthly_quota;
        }

        return max(0, $currentQuota->quota_limit - $currentQuota->requests_made);
    }
}
