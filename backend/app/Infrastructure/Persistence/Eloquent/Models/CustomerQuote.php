<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerQuote extends Model implements TenantAwareModel
{
    use HasFactory, BelongsToTenant;

    protected $table = 'customer_quotes';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'order_id',
        'vendor_quote_id',
        'quote_number',
        'title',
        'description',
        'vendor_total_cost',
        'base_profit_amount',
        'base_profit_percentage',
        'handling_fee',
        'shipping_cost',
        'insurance',
        'other_costs',
        'other_costs_description',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'grand_total',
        'total_profit_amount',
        'total_profit_percentage',
        'currency',
        'valid_until',
        'payment_terms',
        'delivery_timeline',
        'terms_and_conditions',
        'status',
        'sent_at',
        'viewed_at',
        'responded_at',
        'approved_at',
        'rejected_at',
        'expired_at',
        'created_by',
        'sent_by',
        'approved_by',
        'rejected_by',
        'counter_offer_amount',
        'counter_offer_notes',
        'counter_offer_round',
        'max_negotiation_rounds',
        'approval_method',
        'approval_reason',
        'approval_notes',
        'rejection_reason',
        'response_token',
        'history',
        'metadata',
    ];

    protected $casts = [
        'vendor_total_cost' => 'integer',
        'base_profit_amount' => 'integer',
        'base_profit_percentage' => 'decimal:2',
        'handling_fee' => 'integer',
        'shipping_cost' => 'integer',
        'insurance' => 'integer',
        'other_costs' => 'integer',
        'subtotal' => 'integer',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'integer',
        'grand_total' => 'integer',
        'total_profit_amount' => 'integer',
        'total_profit_percentage' => 'decimal:2',
        'counter_offer_amount' => 'integer',
        'counter_offer_round' => 'integer',
        'max_negotiation_rounds' => 'integer',
        'history' => 'json',
        'metadata' => 'json',
        'valid_until' => 'datetime',
        'sent_at' => 'datetime',
        'viewed_at' => 'datetime',
        'responded_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'expired_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relationships
     */

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function vendorQuote(): BelongsTo
    {
        return $this->belongsTo(VendorQuote::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(OrderDocument::class, 'customer_quote_id');
    }

    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(OrderPaymentTransaction::class, 'order_id', 'order_id')
            ->where('direction', 'incoming')
            ->where(function ($query) {
                $query->where('type', 'customer_payment_dp')
                      ->orWhere('type', 'customer_payment_balance');
            });
    }

    /**
     * Scopes
     */

    public function scopePendingApproval($query)
    {
        return $query->where('status', 'pending_approval');
    }

    public function scopeExpired($query)
    {
        return $query->where('valid_until', '<', now());
    }

    public function scopeActive($query)
    {
        return $query->where('valid_until', '>=', now())
            ->whereNotIn('status', ['rejected', 'expired']);
    }

    public function scopeWithRelations($query)
    {
        return $query->with([
            'order:id,uuid,order_number,customer_id,status',
            'order.customer:id,name,email,phone',
            'createdBy:id,name,email',
            'approvedBy:id,name,email',
            'rejectedBy:id,name,email',
        ]);
    }

    public function scopeWithFullRelations($query)
    {
        return $query->with([
            'order:id,uuid,order_number,customer_id,status,payment_status',
            'order.customer:id,name,email,phone',
            'vendorQuote:id,uuid,quote_number,status',
            'createdBy:id,name,email',
            'approvedBy:id,name,email',
            'rejectedBy:id,name,email',
            'documents:id,customer_quote_id,document_type,document_number,file_url,status',
        ]);
    }

    /**
     * Attributes/Accessors
     */

    /**
     * Check if the quote is expired
     */
    public function isExpired(): bool
    {
        return $this->valid_until < now();
    }

    /**
     * Check if the quote can be accepted
     */
    public function canBeAccepted(): bool
    {
        return in_array($this->status, ['sent', 'viewed']) 
            && !$this->isExpired();
    }

    /**
     * Check if the quote can be countered
     */
    public function canBeCountered(): bool
    {
        return in_array($this->status, ['sent', 'viewed']) 
            && !$this->isExpired()
            && $this->counter_offer_round < $this->max_negotiation_rounds;
    }

    /**
     * Get payment status for the quote
     */
    public function getPaymentStatus(): string
    {
        // Only accepted quotes have payment status
        if ($this->status !== 'accepted') {
            return 'not_applicable';
        }

        $order = $this->order;
        
        if (!$order) {
            return 'unknown';
        }

        // Refresh order to get latest payment status
        $order->refresh();

        return $order->payment_status ?? 'unpaid';
    }

    /**
     * Check if down payment has been paid
     */
    public function isDownPaymentPaid(): bool
    {
        $order = $this->order;
        
        if (!$order || !$order->payment_schedule) {
            return false;
        }

        $dpSchedule = collect($order->payment_schedule)->firstWhere('type', 'dp_50');
        
        return $dpSchedule && ($dpSchedule['status'] ?? 'pending') === 'paid';
    }

    /**
     * Check if full payment has been completed
     */
    public function isFullyPaid(): bool
    {
        $order = $this->order;
        
        if (!$order) {
            return false;
        }

        return $order->payment_status === 'paid';
    }

    /**
     * Get total paid amount for this quote
     */
    public function getTotalPaidAmount(): int
    {
        return $this->paymentTransactions()
            ->where('status', 'completed')
            ->sum('amount');
    }

    /**
     * Get remaining payment amount
     */
    public function getRemainingPaymentAmount(): int
    {
        $totalPaid = $this->getTotalPaidAmount();
        return max(0, $this->grand_total - $totalPaid);
    }

    /**
     * Add history entry to the quote
     */
    public function addHistoryEntry(array $entry): void
    {
        // Ensure history is an array (handle both null and string cases)
        $history = $this->history;
        if (!is_array($history)) {
            $history = is_string($history) ? json_decode($history, true) : [];
        }
        if (!is_array($history)) {
            $history = [];
        }
        
        $history[] = $entry;
        $this->history = $history;
        $this->save();
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * Boot method for model events
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = \Ramsey\Uuid\Uuid::uuid4()->toString();
            }

            // Generate response token if not set
            if (empty($model->response_token)) {
                $model->response_token = \Ramsey\Uuid\Uuid::uuid4()->toString();
            }

            // Initialize history and metadata as empty arrays if not set
            if (empty($model->history)) {
                $model->history = [];
            }
            if (empty($model->metadata)) {
                $model->metadata = [];
            }
        });
    }
}

