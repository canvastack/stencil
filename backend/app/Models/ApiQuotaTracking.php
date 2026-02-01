<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ApiQuotaTracking extends Model
{
    use HasFactory;

    protected $table = 'api_quota_tracking';

    protected $fillable = [
        'uuid',
        'provider_id',
        'requests_made',
        'quota_limit',
        'year',
        'month',
        'last_reset_at',
    ];

    protected $casts = [
        'requests_made' => 'integer',
        'quota_limit' => 'integer',
        'year' => 'integer',
        'month' => 'integer',
        'last_reset_at' => 'datetime',
    ];

    protected $hidden = [
        'id',
        'provider_id',
    ];

    protected $appends = [
        'uuid',
        'remaining_quota',
        'usage_percentage',
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

    public function provider(): BelongsTo
    {
        return $this->belongsTo(ExchangeRateProvider::class, 'provider_id');
    }

    public function scopeForProvider($query, int $providerId)
    {
        return $query->where('provider_id', $providerId);
    }

    public function scopeCurrentMonth($query)
    {
        $now = now();
        return $query->where('year', $now->year)
                     ->where('month', $now->month);
    }

    public function getRemainingQuotaAttribute(): int
    {
        return max(0, $this->quota_limit - $this->requests_made);
    }

    public function getUsagePercentageAttribute(): float
    {
        if ($this->quota_limit === 0) {
            return 0.0;
        }

        return round(($this->requests_made / $this->quota_limit) * 100, 2);
    }

    public function isExhausted(): bool
    {
        return $this->remaining_quota <= 0;
    }

    public function shouldReset(): bool
    {
        $now = now();
        return $now->year !== $this->year || $now->month !== $this->month;
    }

    public function incrementUsage(int $count = 1): void
    {
        $this->increment('requests_made', $count);
    }
}
