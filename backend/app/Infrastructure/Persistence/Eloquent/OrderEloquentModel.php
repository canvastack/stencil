<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class OrderEloquentModel extends Model
{

    protected $table = 'orders';

    protected $fillable = [
        'tenant_id',
        'customer_id',
        'vendor_id',
        'order_number',
        'status',
        'total_amount',
        'subtotal',
        'tax',
        'shipping_cost',
        'discount',
        'down_payment_amount',
        'total_paid_amount',
        'total_disbursed_amount',
        'currency',
        'items',
        'shipping_address',
        'billing_address',
        'shipping_method',
        'tracking_number',
        'notes',
        'customer_notes',
        'internal_notes',
        'production_type',
        'payment_status',
        'payment_method',
        'payment_schedule',
        'metadata',
        'estimated_delivery',
        'payment_date',
        'down_payment_due_at',
        'down_payment_paid_at',
        'shipped_at',
        'delivered_at',
    ];

    protected $casts = [
        'id' => 'string',
        'tenant_id' => 'string',
        'customer_id' => 'string',
        'vendor_id' => 'string',
        'total_amount' => 'integer',
        'subtotal' => 'integer',
        'tax' => 'integer',
        'shipping_cost' => 'integer',
        'discount' => 'integer',
        'down_payment_amount' => 'integer',
        'total_paid_amount' => 'integer',
        'total_disbursed_amount' => 'integer',
        'items' => 'array',
        'shipping_address' => 'array',
        'billing_address' => 'array',
        'payment_schedule' => 'array',
        'metadata' => 'array',
        'estimated_delivery' => 'datetime',
        'payment_date' => 'datetime',
        'down_payment_due_at' => 'datetime',
        'down_payment_paid_at' => 'datetime',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(TenantEloquentModel::class, 'tenant_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(CustomerEloquentModel::class, 'customer_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(VendorEloquentModel::class, 'vendor_id');
    }

    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(OrderPaymentTransactionEloquentModel::class, 'order_id');
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(\App\Models\PaymentRefund::class, 'order_id');
    }

    public function activeRefunds(): HasMany
    {
        return $this->hasMany(\App\Models\PaymentRefund::class, 'order_id')
            ->whereIn('status', ['pending', 'processing', 'approved']);
    }

    public function completedRefunds(): HasMany
    {
        return $this->hasMany(\App\Models\PaymentRefund::class, 'order_id')
            ->where('status', 'completed');
    }

    public function pendingRefunds(): HasMany
    {
        return $this->hasMany(\App\Models\PaymentRefund::class, 'order_id')
            ->where('status', 'pending');
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

    // Refund-related helper methods
    public function getTotalRefundedAmount(): int
    {
        return $this->completedRefunds()->sum('refund_amount');
    }

    public function getTotalPendingRefundAmount(): int
    {
        return $this->activeRefunds()->sum('refund_amount');
    }

    public function getRefundableAmount(): int
    {
        return max(0, $this->total_amount - $this->getTotalRefundedAmount() - $this->getTotalPendingRefundAmount());
    }

    public function hasActiveRefunds(): bool
    {
        return $this->activeRefunds()->exists();
    }

    public function hasPendingRefunds(): bool
    {
        return $this->pendingRefunds()->exists();
    }

    public function canBeRefunded(): bool
    {
        return in_array($this->status, [
            'payment_received',
            'in_production',
            'quality_check',
            'cancelled'
        ]) && $this->getRefundableAmount() > 0;
    }

    public function isFullyRefunded(): bool
    {
        return $this->getTotalRefundedAmount() >= $this->total_amount;
    }

    public function getRefundPercentage(): float
    {
        if ($this->total_amount == 0) {
            return 0;
        }
        return ($this->getTotalRefundedAmount() / $this->total_amount) * 100;
    }
}