<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ExchangeRateHistory extends Model
{
    use HasFactory;

    const UPDATED_AT = null; // Append-only table

    protected $table = 'exchange_rate_history';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'rate',
        'provider_id',
        'source',
        'event_type',
        'metadata',
    ];

    protected $casts = [
        'rate' => 'decimal:4',
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    protected $hidden = [
        'id',
        'tenant_id',
        'provider_id',
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

    public function provider(): BelongsTo
    {
        return $this->belongsTo(ExchangeRateProvider::class, 'provider_id');
    }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    public function scopeByEventType($query, string $eventType)
    {
        return $query->where('event_type', $eventType);
    }

    public function scopeBySource($query, string $source)
    {
        return $query->where('source', $source);
    }

    public function scopeByProvider($query, int $providerId)
    {
        return $query->where('provider_id', $providerId);
    }
}
