<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;

class RefundRequest extends Model implements TenantAwareModel
{
    use HasFactory, BelongsToTenant;

    protected $table = 'refund_requests';
    
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'tenant_id',
        'order_id',
        'request_number',
        'refund_reason',
        'refund_type',
        'customer_request_amount',
        'quality_issue_percentage',
        'delay_days',
        'evidence_documents',
        'customer_notes',
        'status',
        'current_approver_id',
        'calculation',
        'requested_by',
        'requested_at',
        'approved_at',
        'processed_at',
    ];

    protected $casts = [
        'evidence_documents' => 'array',
        'calculation' => 'array',
        'customer_request_amount' => 'decimal:2',
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    /**
     * Get the route key for the model.
     *
     * @return string
     */
    public function getRouteKeyName()
    {
        return 'request_number';
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
            if (empty($model->request_number)) {
                $model->request_number = static::generateRequestNumber();
            }
            if (empty($model->requested_at)) {
                $model->requested_at = now();
            }
        });
    }

    /**
     * Generate unique request number.
     */
    private static function generateRequestNumber(): string
    {
        $date = now()->format('Ymd');
        $sequence = static::whereDate('created_at', now())->count() + 1;
        return 'RFD-' . $date . '-' . str_pad($sequence, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Get the order that this refund request belongs to.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the user who requested the refund.
     */
    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * Get the current approver.
     */
    public function currentApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'current_approver_id');
    }

    /**
     * Get all approvals for this refund request.
     */
    public function approvals(): HasMany
    {
        return $this->hasMany(RefundApproval::class);
    }

    /**
     * Get the dispute for this refund request.
     */
    public function dispute(): HasOne
    {
        return $this->hasOne(RefundDispute::class);
    }

    /**
     * Get insurance fund transactions related to this refund.
     */
    public function insuranceTransactions(): HasMany
    {
        return $this->hasMany(InsuranceFundTransaction::class);
    }

    /**
     * Scope to filter by status.
     */
    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to filter by refund reason.
     */
    public function scopeWithReason($query, string $reason)
    {
        return $query->where('refund_reason', $reason);
    }

    /**
     * Scope to filter by pending approval.
     */
    public function scopePendingApproval($query)
    {
        return $query->whereIn('status', [
            'pending_review',
            'pending_finance', 
            'pending_manager'
        ]);
    }

    /**
     * Check if refund can be processed.
     */
    public function canBeProcessed(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Check if refund can be disputed.
     */
    public function canBeDisputed(): bool
    {
        return in_array($this->status, ['rejected', 'completed']) && 
               !$this->dispute()->exists();
    }

    /**
     * Get refund calculation data.
     */
    public function getCalculation(): array
    {
        return $this->calculation ?? [];
    }

    /**
     * Get refundable amount from calculation.
     */
    public function getRefundableAmount(): float
    {
        $calc = $this->getCalculation();
        return $calc['refundableToCustomer'] ?? 0;
    }

    /**
     * Get company loss from calculation.
     */
    public function getCompanyLoss(): float
    {
        $calc = $this->getCalculation();
        return $calc['companyLoss'] ?? 0;
    }

    /**
     * Get vendor recoverable amount.
     */
    public function getVendorRecoverable(): float
    {
        $calc = $this->getCalculation();
        return $calc['vendorRecoverable'] ?? 0;
    }

    /**
     * Get insurance coverage amount.
     */
    public function getInsuranceCover(): float
    {
        $calc = $this->getCalculation();
        return $calc['insuranceCover'] ?? 0;
    }
}