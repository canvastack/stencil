<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ExchangeRateSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'tenant_id',
        'mode',
        'manual_rate',
        'current_rate',
        'active_provider_id',
        'auto_update_enabled',
        'auto_update_time',
        'last_updated_at',
    ];

    protected $casts = [
        'manual_rate' => 'decimal:4',
        'current_rate' => 'decimal:4',
        'auto_update_enabled' => 'boolean',
        'last_updated_at' => 'datetime',
    ];

    protected $hidden = [
        'id',
        'tenant_id',
        'active_provider_id',
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

    public function activeProvider(): BelongsTo
    {
        return $this->belongsTo(ExchangeRateProvider::class, 'active_provider_id');
    }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function isManualMode(): bool
    {
        return $this->mode === 'manual';
    }

    public function isAutoMode(): bool
    {
        return $this->mode === 'auto';
    }

    public function getCurrentRate(): ?float
    {
        if ($this->isManualMode()) {
            return $this->manual_rate;
        }

        return $this->current_rate;
    }
}
