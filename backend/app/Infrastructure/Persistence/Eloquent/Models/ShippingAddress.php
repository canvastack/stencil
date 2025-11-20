<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;

class ShippingAddress extends Model implements TenantAwareModel
{
    use HasFactory, BelongsToTenant;

    protected $table = 'shipping_addresses';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'addressable_type',
        'addressable_id',
        'type',
        'recipient_name',
        'company_name',
        'phone',
        'address_line_1',
        'address_line_2',
        'city',
        'state_province',
        'postal_code',
        'country_code',
        'latitude',
        'longitude',
        'delivery_instructions',
        'is_default',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'is_default' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function addressable(): MorphTo
    {
        return $this->morphTo();
    }

    public function getFullAddress(): string
    {
        return collect([
            $this->address_line_1,
            $this->address_line_2,
            $this->city,
            $this->state_province,
            $this->postal_code
        ])->filter()->join(', ');
    }

    public function scopeShipping($query)
    {
        return $query->where('type', 'shipping');
    }

    public function scopeBilling($query)
    {
        return $query->where('type', 'billing');
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }
}
