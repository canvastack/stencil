<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ProviderSwitchEvent extends Model
{
    use HasFactory;

    const UPDATED_AT = null; // Append-only table

    protected $fillable = [
        'uuid',
        'tenant_id',
        'old_provider_id',
        'new_provider_id',
        'reason',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    protected $hidden = [
        'id',
        'tenant_id',
        'old_provider_id',
        'new_provider_id',
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

    public function oldProvider(): BelongsTo
    {
        return $this->belongsTo(ExchangeRateProvider::class, 'old_provider_id');
    }

    public function newProvider(): BelongsTo
    {
        return $this->belongsTo(ExchangeRateProvider::class, 'new_provider_id');
    }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeByReason($query, string $reason)
    {
        return $query->where('reason', $reason);
    }

    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }
}
