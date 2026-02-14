<?php

namespace App\Models;

use App\Infrastructure\Persistence\Eloquent\Models\Order as OrderEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant as TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\User as UserEloquentModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Vendor Purchase Order Model
 * 
 * Represents a formal purchase order sent to a vendor after quote acceptance.
 * This is different from customer orders - it's the document PT CEX sends to vendors.
 * 
 * @property int $id
 * @property string $uuid
 * @property int $tenant_id
 * @property int $order_id
 * @property int $quote_id
 * @property int $vendor_id
 * @property string $po_number
 * @property \Carbon\Carbon $issue_date
 * @property \Carbon\Carbon $validity_date
 * @property \Carbon\Carbon $expected_delivery_date
 * @property string|null $delivery_address
 * @property string|null $delivery_method
 * @property string|null $special_instructions
 * @property int $subtotal Amount in cents
 * @property int $discount Amount in cents
 * @property int $tax Amount in cents
 * @property int $shipping Amount in cents
 * @property int $grand_total Amount in cents
 * @property string|null $payment_method
 * @property string|null $payment_schedule JSON
 * @property string $status
 * @property string|null $pdf_path
 * @property \Carbon\Carbon|null $pdf_generated_at
 * @property int|null $created_by
 * @property \Carbon\Carbon|null $sent_at
 * @property \Carbon\Carbon|null $accepted_at
 * @property int|null $accepted_by
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 */
class VendorPurchaseOrder extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'vendor_purchase_orders';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'uuid',
        'tenant_id',
        'order_id',
        'quote_id',
        'vendor_id',
        'po_number',
        'issue_date',
        'validity_date',
        'expected_delivery_date',
        'delivery_address',
        'delivery_method',
        'special_instructions',
        'subtotal',
        'discount',
        'tax',
        'shipping',
        'grand_total',
        'currency', // Add currency field
        'payment_method',
        'payment_schedule',
        'payment_terms', // Add payment_terms
        'delivery_terms', // Add delivery_terms
        'notes', // Add notes
        'status',
        'pdf_path',
        'pdf_generated_at',
        'created_by',
        'sent_at',
        'accepted_at',
        'accepted_by',
        'latest_production_status',
        'latest_progress_percentage',
        'latest_update_at',
        'production_started_at',
        'production_completed_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'issue_date' => 'datetime',
        'validity_date' => 'datetime',
        'expected_delivery_date' => 'datetime',
        'subtotal' => 'integer',
        'discount' => 'integer',
        'tax' => 'integer',
        'shipping' => 'integer',
        'grand_total' => 'integer',
        'payment_schedule' => 'array',
        'pdf_generated_at' => 'datetime',
        'sent_at' => 'datetime',
        'accepted_at' => 'datetime',
        'latest_progress_percentage' => 'integer',
        'latest_update_at' => 'datetime',
        'production_started_at' => 'datetime',
        'production_completed_at' => 'datetime',
    ];

    /**
     * Get the tenant that owns the purchase order.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(TenantEloquentModel::class);
    }

    /**
     * Get the order associated with the purchase order.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(OrderEloquentModel::class);
    }

    /**
     * Get the quote associated with the purchase order.
     */
    public function quote(): BelongsTo
    {
        return $this->belongsTo(OrderVendorNegotiation::class, 'quote_id');
    }

    /**
     * Get the vendor associated with the purchase order.
     */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(UserEloquentModel::class, 'vendor_id');
    }

    /**
     * Get the user who created the purchase order.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(UserEloquentModel::class, 'created_by');
    }

    /**
     * Get the user who accepted the purchase order.
     */
    public function acceptor(): BelongsTo
    {
        return $this->belongsTo(UserEloquentModel::class, 'accepted_by');
    }

    /**
     * Get all production updates for this purchase order.
     */
    public function productionUpdates(): HasMany
    {
        return $this->hasMany(VendorProductionUpdate::class, 'purchase_order_id');
    }

    /**
     * Get the latest production update.
     */
    public function latestProductionUpdate(): ?VendorProductionUpdate
    {
        return $this->productionUpdates()
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->first();
    }

    /**
     * Scope a query to only include purchase orders for a specific tenant.
     */
    public function scopeForTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope a query to only include purchase orders with a specific status.
     */
    public function scopeWithStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Check if PO is expired (past validity date).
     */
    public function isExpired(): bool
    {
        return now()->isAfter($this->validity_date);
    }

    /**
     * Check if PO is overdue (past expected delivery date).
     */
    public function isOverdue(): bool
    {
        return now()->isAfter($this->expected_delivery_date) && $this->status !== 'completed';
    }

    /**
     * Get formatted subtotal.
     */
    public function getFormattedSubtotalAttribute(): string
    {
        return $this->formatCurrency($this->subtotal);
    }

    /**
     * Get formatted tax.
     */
    public function getFormattedTaxAttribute(): string
    {
        return $this->formatCurrency($this->tax);
    }

    /**
     * Get formatted grand total.
     */
    public function getFormattedGrandTotalAttribute(): string
    {
        return $this->formatCurrency($this->grand_total);
    }

    /**
     * Format currency amount.
     */
    private function formatCurrency(int $amountInCents): string
    {
        $amount = $amountInCents / 100;
        return 'Rp ' . number_format($amount, 0, ',', '.');
    }

    /**
     * Get days until expected delivery.
     */
    public function getDaysUntilDeliveryAttribute(): int
    {
        return now()->diffInDays($this->expected_delivery_date, false);
    }

    /**
     * Get days since issue.
     */
    public function getDaysSinceIssueAttribute(): int
    {
        return $this->issue_date->diffInDays(now());
    }
}
