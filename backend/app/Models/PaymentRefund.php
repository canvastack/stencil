<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PaymentRefund extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'payment_refunds';

    protected $fillable = [
        'tenant_id',
        'order_id', 
        'original_transaction_id',
        'customer_id',
        'vendor_id',
        'refund_reference',
        'gateway_refund_id',
        'type',
        'status',
        'refund_amount',
        'original_amount',
        'final_amount',
        'currency',
        'refund_method',
        'refund_details',
        'reason_category',
        'reason',
        'internal_notes',
        'supporting_documents',
        'approval_workflow',
        'initiated_by',
        'approved_by',
        'processed_by',
        'requested_at',
        'approved_at',
        'rejected_at',
        'processed_at',
        'completed_at',
        'failed_at',
        'failure_reason',
        'gateway_response',
        'gateway_error_code',
        'gateway_error_message',
        'fee_amount',
        'is_disputed',
        'affects_vendor_payment',
        'impact_analysis'
    ];

    protected $casts = [
        'refund_amount' => 'integer',
        'original_amount' => 'integer',
        'final_amount' => 'integer',
        'fee_amount' => 'integer',
        'refund_details' => 'json',
        'supporting_documents' => 'json',
        'approval_workflow' => 'json',
        'gateway_response' => 'json',
        'impact_analysis' => 'json',
        'is_disputed' => 'boolean',
        'affects_vendor_payment' => 'boolean',
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'processed_at' => 'datetime',
        'completed_at' => 'datetime',
        'failed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Tenant-aware global scope
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

        static::creating(function ($refund) {
            if (!$refund->tenant_id && app()->bound('current_tenant')) {
                $refund->tenant_id = app('current_tenant')->id;
            }

            // Auto-generate refund reference if not provided
            if (!$refund->refund_reference) {
                $refund->refund_reference = 'REF-' . strtoupper(uniqid());
            }

            // Set requested_at if not provided
            if (!$refund->requested_at) {
                $refund->requested_at = now();
            }
        });

        static::updating(function ($refund) {
            // Validate cross-tenant relationships on updates only
            if ($refund->isDirty('customer_id') && $refund->customer_id && $refund->tenant_id) {
                $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::withoutGlobalScopes()->find($refund->customer_id);
                if ($customer && $customer->tenant_id !== $refund->tenant_id) {
                    throw new \Exception('Cross-tenant relationships are not allowed');
                }
            }
        });
    }

    // Relationships
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::class, 'tenant_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\OrderEloquentModel::class, 'order_id');
    }

    public function originalTransaction(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\OrderPaymentTransactionEloquentModel::class, 'original_transaction_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\Models\Customer::class, 'customer_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\VendorEloquentModel::class, 'vendor_id');
    }

    public function initiatedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\UserEloquentModel::class, 'initiated_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\UserEloquentModel::class, 'approved_by');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\UserEloquentModel::class, 'processed_by');
    }

    public function approvalWorkflows(): HasMany
    {
        return $this->hasMany(RefundApprovalWorkflow::class, 'payment_refund_id');
    }

    // Scopes for easy querying
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeProcessing($query)
    {
        return $query->where('status', 'processing');
    }

    public function scopeByReasonCategory($query, string $category)
    {
        return $query->where('reason_category', $category);
    }

    public function scopeByRefundMethod($query, string $method)
    {
        return $query->where('refund_method', $method);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeDisputed($query)
    {
        return $query->where('is_disputed', true);
    }

    public function scopeAffectsVendorPayment($query)
    {
        return $query->where('affects_vendor_payment', true);
    }

    public function scopeAmountGreaterThan($query, int $amount)
    {
        return $query->where('refund_amount', '>', $amount);
    }

    public function scopeAmountBetween($query, int $minAmount, int $maxAmount)
    {
        return $query->whereBetween('refund_amount', [$minAmount, $maxAmount]);
    }

    public function scopeRequestedBetween($query, $startDate, $endDate)
    {
        return $query->whereBetween('requested_at', [$startDate, $endDate]);
    }

    // Utility methods
    public function getRefundAmountInCurrency(): string
    {
        return number_format($this->refund_amount / 100, 2) . ' ' . $this->currency;
    }

    public function getOriginalAmountInCurrency(): string
    {
        return number_format($this->original_amount / 100, 2) . ' ' . $this->currency;
    }

    public function getFeeAmountInCurrency(): string
    {
        return number_format($this->fee_amount / 100, 2) . ' ' . $this->currency;
    }

    public function getNetRefundAmount(): int
    {
        return $this->refund_amount - $this->fee_amount;
    }

    public function getNetRefundAmountInCurrency(): string
    {
        return number_format($this->getNetRefundAmount() / 100, 2) . ' ' . $this->currency;
    }

    public function getRefundPercentage(): float
    {
        if ($this->original_amount == 0) {
            return 0;
        }
        return ($this->refund_amount / $this->original_amount) * 100;
    }

    public function isFullRefund(): bool
    {
        return $this->type === 'full' || $this->refund_amount >= $this->original_amount;
    }

    public function isPartialRefund(): bool
    {
        return $this->type === 'partial' && $this->refund_amount < $this->original_amount;
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    public function isProcessing(): bool
    {
        return $this->status === 'processing';
    }

    public function requiresApproval(): bool
    {
        return in_array($this->status, ['pending', 'processing']) && !$this->isApproved();
    }

    public function canBeProcessed(): bool
    {
        return $this->status === 'approved' && !$this->isCompleted() && !$this->isFailed();
    }

    public function hasActiveWorkflow(): bool
    {
        return $this->approvalWorkflows()
            ->where('is_current_step', true)
            ->where('decision', 'pending')
            ->exists();
    }

    public function getCurrentWorkflowStep(): ?RefundApprovalWorkflow
    {
        return $this->approvalWorkflows()
            ->where('is_current_step', true)
            ->where('decision', 'pending')
            ->first();
    }

    // Status transition methods
    public function markAsProcessing(int $userId): bool
    {
        if (!$this->isApproved()) {
            return false;
        }

        $this->update([
            'status' => 'processing',
            'processed_by' => $userId,
            'processed_at' => now()
        ]);

        return true;
    }

    public function markAsCompleted(int $userId, array $gatewayResponse = null): bool
    {
        if (!$this->canBeProcessed()) {
            return false;
        }

        $this->update([
            'status' => 'completed',
            'processed_by' => $userId,
            'completed_at' => now(),
            'gateway_response' => $gatewayResponse
        ]);

        return true;
    }

    public function markAsFailed(int $userId, string $errorCode = null, string $errorMessage = null): bool
    {
        $this->update([
            'status' => 'failed',
            'processed_by' => $userId,
            'gateway_error_code' => $errorCode,
            'gateway_error_message' => $errorMessage
        ]);

        return true;
    }

    public function markAsRejected(int $userId, string $reason): bool
    {
        $this->update([
            'status' => 'rejected',
            'approved_by' => $userId,
            'rejected_at' => now(),
            'internal_notes' => $this->internal_notes . "\n\nRejection Reason: " . $reason
        ]);

        return true;
    }

    public function markAsApproved(int $userId): bool
    {
        $this->update([
            'status' => 'approved',
            'approved_by' => $userId,
            'approved_at' => now()
        ]);

        return true;
    }
}