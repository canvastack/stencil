<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;

class Order extends Model implements TenantAwareModel
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $table = 'orders';
    
    protected static function newFactory()
    {
        return \Database\Factories\Infrastructure\Persistence\Eloquent\Models\OrderFactory::new();
    }

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
        'invoice_number',
        'invoice_generated_at',
        'completed_at',
        'completion_recorded',
        'refund_amount',
        'refund_status',
        'refunded_at',
    ];

    protected $casts = [
        'items' => 'json',
        'shipping_address' => 'json',
        'billing_address' => 'json',
        'metadata' => 'json',
        'payment_schedule' => 'json',
        'subtotal' => 'integer',
        'tax' => 'integer',
        'shipping_cost' => 'integer',
        'discount' => 'integer',
        'total_amount' => 'integer',
        'down_payment_amount' => 'integer',
        'total_paid_amount' => 'integer',
        'total_disbursed_amount' => 'integer',
        'refund_amount' => 'integer',
        'payment_date' => 'datetime',
        'down_payment_due_at' => 'datetime',
        'down_payment_paid_at' => 'datetime',
        'estimated_delivery' => 'datetime',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
        'invoice_generated_at' => 'datetime',
        'completed_at' => 'datetime',
        'refunded_at' => 'datetime',
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

    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class);
    }

    // ❌ REMOVED: items() relationship for dynamic form data
    // This relationship conflicts with JSON-based items storage
    // Use direct JSON field access instead: $order->items
    
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByPaymentStatus($query, $status)
    {
        return $query->where('payment_status', $status);
    }

    /**
     * Get the route key for the model.
     *
     * @return string
     */
    public function getRouteKeyName()
    {
        return 'uuid';
    }

    /**
     * Get the UUID as ID for domain compatibility
     * This method provides compatibility with domain events that expect getId()
     *
     * @return \App\Domain\Shared\ValueObjects\UuidValueObject
     */
    public function getId(): \App\Domain\Shared\ValueObjects\UuidValueObject
    {
        return new \App\Domain\Shared\ValueObjects\UuidValueObject($this->uuid);
    }

    /**
     * Get items count from JSON field
     * Used for frontend compatibility and API responses
     */
    public function getItemsCountAttribute(): int
    {
        if (is_array($this->items)) {
            return count($this->items);
        }
        
        if (is_string($this->items)) {
            $decoded = json_decode($this->items, true);
            return is_array($decoded) ? count($decoded) : 0;
        }
        
        return 0;
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = \Ramsey\Uuid\Uuid::uuid4()->toString();
            }
            
            if (empty($model->order_number)) {
                // Generate truly unique order number using UUID suffix
                $uuidSuffix = strtoupper(substr(str_replace('-', '', $model->uuid), -8));
                $model->order_number = 'ORD-' . date('Ymd') . '-' . $uuidSuffix;
            }
            
            // Validate cross-tenant relationships (skip in testing environment unless explicitly enabled)
            if ((!app()->environment('testing') || config('app.enable_cross_tenant_validation', false)) && 
                !empty($model->customer_id) && !empty($model->tenant_id)) {
                $customer = Customer::find($model->customer_id);
                if ($customer && $customer->tenant_id !== $model->tenant_id) {
                    throw new \Exception('Cross-tenant relationships are not allowed. Customer must belong to the same tenant.');
                }
            }
        });

        static::updating(function ($model) {
            // Validate cross-tenant relationships on update as well (skip in testing environment unless explicitly enabled)
            if ((!app()->environment('testing') || config('app.enable_cross_tenant_validation', false)) && 
                !empty($model->customer_id) && !empty($model->tenant_id)) {
                $customer = Customer::find($model->customer_id);
                if ($customer && $customer->tenant_id !== $model->tenant_id) {
                    throw new \Exception('Cross-tenant relationships are not allowed. Customer must belong to the same tenant.');
                }
            }
        });
    }
}
