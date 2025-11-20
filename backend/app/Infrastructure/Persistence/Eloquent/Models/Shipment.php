<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;

class Shipment extends Model implements TenantAwareModel
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $table = 'shipments';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'order_id',
        'shipping_method_id',
        'tracking_number',
        'carrier_reference',
        'status',
        'shipping_address',
        'return_address',
        'weight_kg',
        'dimensions',
        'shipping_cost',
        'currency',
        'items',
        'special_instructions',
        'shipped_at',
        'estimated_delivery',
        'delivered_at',
        'tracking_events',
        'metadata',
    ];

    protected $casts = [
        'shipping_address' => 'array',
        'return_address' => 'array',
        'dimensions' => 'array',
        'items' => 'array',
        'tracking_events' => 'array',
        'metadata' => 'array',
        'weight_kg' => 'float',
        'shipping_cost' => 'float',
        'shipped_at' => 'datetime',
        'estimated_delivery' => 'datetime',
        'delivered_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function shippingMethod(): BelongsTo
    {
        return $this->belongsTo(ShippingMethod::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeProcessing($query)
    {
        return $query->where('status', 'processing');
    }

    public function scopeShipped($query)
    {
        return $query->where('status', 'shipped');
    }

    public function scopeInTransit($query)
    {
        return $query->where('status', 'in_transit');
    }

    public function scopeDelivered($query)
    {
        return $query->where('status', 'delivered');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByTrackingNumber($query, string $trackingNumber)
    {
        return $query->where('tracking_number', $trackingNumber);
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isProcessing(): bool
    {
        return $this->status === 'processing';
    }

    public function isShipped(): bool
    {
        return $this->status === 'shipped';
    }

    public function isInTransit(): bool
    {
        return $this->status === 'in_transit';
    }

    public function isDelivered(): bool
    {
        return $this->status === 'delivered';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    public function getShippingCostFormatted(): string
    {
        return number_format($this->shipping_cost, 2) . ' ' . $this->currency;
    }

    public function getLatestTrackingEvent(): ?array
    {
        if (empty($this->tracking_events)) {
            return null;
        }
        return collect($this->tracking_events)->last();
    }

    public function getDeliveryStatus(): string
    {
        if ($this->isDelivered()) {
            return 'Delivered on ' . $this->delivered_at->format('M d, Y');
        }

        if ($this->estimated_delivery) {
            $daysRemaining = now()->diffInDays($this->estimated_delivery, false);
            if ($daysRemaining > 0) {
                return 'Estimated delivery in ' . $daysRemaining . ' day(s)';
            } elseif ($daysRemaining === 0) {
                return 'Delivery expected today';
            } else {
                return 'Delayed - Should have arrived ' . abs($daysRemaining) . ' day(s) ago';
            }
        }

        return 'Delivery date not set';
    }
}
