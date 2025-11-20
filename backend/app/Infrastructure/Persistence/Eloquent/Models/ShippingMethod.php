<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;

class ShippingMethod extends Model implements TenantAwareModel
{
    use HasFactory, BelongsToTenant;

    protected $table = 'shipping_methods';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'name',
        'code',
        'description',
        'carrier',
        'type',
        'service_areas',
        'estimated_days_min',
        'estimated_days_max',
        'base_cost',
        'cost_calculation',
        'restrictions',
        'is_active',
        'is_default',
        'sort_order',
    ];

    protected $casts = [
        'service_areas' => 'array',
        'cost_calculation' => 'array',
        'restrictions' => 'array',
        'base_cost' => 'float',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCarrier($query, string $carrier)
    {
        return $query->where('carrier', $carrier);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    public function getEstimatedDaysRange(): string
    {
        if ($this->estimated_days_min === $this->estimated_days_max) {
            return "{$this->estimated_days_min} day(s)";
        }
        return "{$this->estimated_days_min}-{$this->estimated_days_max} days";
    }

    public function getBaseCostFormatted(): string
    {
        return number_format($this->base_cost, 2) . ' ' . config('app.currency', 'IDR');
    }
}
