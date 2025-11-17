<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class OrderEloquentModel extends Model
{

    protected $table = 'orders';

    protected $fillable = [
        'tenant_id',
        'customer_id',
        'order_number',
        'status',
        'total_amount',
        'currency',
        'items',
        'shipping_address',
        'billing_address',
        'notes',
    ];

    protected $casts = [
        'id' => 'string',
        'tenant_id' => 'string',
        'customer_id' => 'string',
        'total_amount' => 'decimal:2',
        'items' => 'array',
        'shipping_address' => 'array',
        'billing_address' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(TenantEloquentModel::class, 'tenant_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(CustomerEloquentModel::class, 'customer_id');
    }

    protected static function booted(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder) {
            if (app()->bound('current_tenant')) {
                $tenant = app('current_tenant');
                if ($tenant) {
                    $builder->where('tenant_id', $tenant->id);
                }
            }
        });

        static::creating(function ($order) {
            // Validate that customer belongs to the same tenant
            if ($order->customer_id && $order->tenant_id) {
                $customer = CustomerEloquentModel::withoutGlobalScopes()->find($order->customer_id);
                if ($customer && $customer->tenant_id !== $order->tenant_id) {
                    throw new \Exception('Cross-tenant relationships are not allowed');
                }
            }
        });
    }
}