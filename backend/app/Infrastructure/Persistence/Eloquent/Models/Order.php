<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;

class Order extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $table = 'orders';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'customer_id',
        'vendor_id',
        'order_number',
        'status',
        'payment_status',
        'production_type',
        'items',
        'subtotal',
        'tax',
        'shipping_cost',
        'discount',
        'total_amount',
        'down_payment_amount',
        'total_paid_amount',
        'total_disbursed_amount',
        'currency',
        'shipping_address',
        'billing_address',
        'customer_notes',
        'internal_notes',
        'payment_method',
        'payment_date',
        'down_payment_due_at',
        'down_payment_paid_at',
        'estimated_delivery',
        'shipped_at',
        'delivered_at',
        'tracking_number',
        'payment_schedule',
        'metadata',
    ];

    protected $casts = [
        'items' => 'array',
        'shipping_address' => 'array',
        'billing_address' => 'array',
        'metadata' => 'array',
        'payment_schedule' => 'array',
        'subtotal' => 'integer',
        'tax' => 'integer',
        'shipping_cost' => 'integer',
        'discount' => 'integer',
        'total_amount' => 'integer',
        'down_payment_amount' => 'integer',
        'total_paid_amount' => 'integer',
        'total_disbursed_amount' => 'integer',
        'payment_date' => 'datetime',
        'down_payment_due_at' => 'datetime',
        'down_payment_paid_at' => 'datetime',
        'estimated_delivery' => 'datetime',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = [
        'payment_date',
        'down_payment_due_at',
        'down_payment_paid_at',
        'estimated_delivery',
        'shipped_at',
        'delivered_at',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function vendorNegotiations(): HasMany
    {
        return $this->hasMany(OrderVendorNegotiation::class);
    }

    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(OrderPaymentTransaction::class);
    }

    public function customerPayments(): HasMany
    {
        return $this->paymentTransactions()->where('direction', 'incoming');
    }

    public function vendorDisbursements(): HasMany
    {
        return $this->paymentTransactions()->where('direction', 'outgoing');
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByPaymentStatus($query, $status)
    {
        return $query->where('payment_status', $status);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = \Ramsey\Uuid\Uuid::uuid4()->toString();
            }
            
            if (empty($model->order_number)) {
                $model->order_number = 'ORD-' . strtoupper(uniqid());
            }
        });
    }
}
