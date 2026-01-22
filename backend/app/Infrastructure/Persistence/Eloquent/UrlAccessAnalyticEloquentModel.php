<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class UrlAccessAnalyticEloquentModel extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'url_access_analytics';

    protected static function newFactory()
    {
        return \Database\Factories\Infrastructure\Persistence\Eloquent\UrlAccessAnalyticEloquentModelFactory::new();
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

    protected $fillable = [
        'uuid',
        'tenant_id',
        'url_config_id',
        'accessed_url',
        'url_pattern_used',
        'ip_address',
        'user_agent',
        'referrer',
        'country_code',
        'city',
        'http_status_code',
        'response_time_ms',
        'accessed_at',
    ];

    protected $casts = [
        'id' => 'integer',
        'tenant_id' => 'integer',
        'url_config_id' => 'integer',
        'http_status_code' => 'integer',
        'response_time_ms' => 'integer',
        'accessed_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(TenantEloquentModel::class, 'tenant_id');
    }

    public function urlConfiguration(): BelongsTo
    {
        return $this->belongsTo(TenantUrlConfigurationEloquentModel::class, 'url_config_id');
    }

    public function scopeByTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeByUrlConfig($query, int $urlConfigId)
    {
        return $query->where('url_config_id', $urlConfigId);
    }

    public function scopeByCountry($query, string $countryCode)
    {
        return $query->where('country_code', $countryCode);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('accessed_at', [$startDate, $endDate]);
    }

    public function scopeSuccessful($query)
    {
        return $query->whereBetween('http_status_code', [200, 299]);
    }

    public function scopeErrors($query)
    {
        return $query->where('http_status_code', '>=', 400);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('accessed_at', today());
    }

    public function scopeThisWeek($query)
    {
        return $query->whereBetween('accessed_at', [now()->startOfWeek(), now()->endOfWeek()]);
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('accessed_at', now()->month)
                    ->whereYear('accessed_at', now()->year);
    }
}
