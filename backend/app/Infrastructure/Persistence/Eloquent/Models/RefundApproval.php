<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;

class RefundApproval extends Model implements TenantAwareModel
{
    use HasFactory, BelongsToTenant;

    protected $table = 'refund_approvals';

    protected $fillable = [
        'tenant_id',
        'refund_request_id',
        'approver_id',
        'approval_level',
        'decision',
        'decision_notes',
        'decided_at',
        'reviewed_calculation',
        'adjusted_amount',
    ];

    protected $casts = [
        'reviewed_calculation' => 'array',
        'adjusted_amount' => 'decimal:2',
        'decided_at' => 'datetime',
    ];

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'id';
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
        });
    }

    // Relationships

    /**
     * Get the refund request that owns this approval.
     */
    public function refundRequest(): BelongsTo
    {
        return $this->belongsTo(RefundRequest::class, 'refund_request_id');
    }

    /**
     * Get the user who made this approval decision.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    // Scopes

    /**
     * Scope approvals by decision type.
     */
    public function scopeByDecision($query, string $decision)
    {
        return $query->where('decision', $decision);
    }

    /**
     * Scope approvals by level.
     */
    public function scopeByLevel($query, int $level)
    {
        return $query->where('approval_level', $level);
    }

    /**
     * Scope approved approvals.
     */
    public function scopeApproved($query)
    {
        return $query->where('decision', 'approved');
    }

    /**
     * Scope rejected approvals.
     */
    public function scopeRejected($query)
    {
        return $query->where('decision', 'rejected');
    }

    /**
     * Scope approvals needing more information.
     */
    public function scopeNeedsInfo($query)
    {
        return $query->where('decision', 'needs_info');
    }

    // Accessors & Mutators

    /**
     * Check if this approval is approved.
     */
    public function isApproved(): bool
    {
        return $this->decision === 'approved';
    }

    /**
     * Check if this approval is rejected.
     */
    public function isRejected(): bool
    {
        return $this->decision === 'rejected';
    }

    /**
     * Check if this approval needs more information.
     */
    public function needsMoreInfo(): bool
    {
        return $this->decision === 'needs_info';
    }

    /**
     * Check if this approval has financial adjustments.
     */
    public function hasAdjustments(): bool
    {
        return !is_null($this->adjusted_amount) || !is_null($this->reviewed_calculation);
    }

    /**
     * Get approval level description.
     */
    public function getLevelDescription(): string
    {
        return match($this->approval_level) {
            1 => 'Finance Review',
            2 => 'Manager Approval', 
            3 => 'Executive Approval',
            default => 'Unknown Level'
        };
    }

    /**
     * Get decision badge color for UI.
     */
    public function getDecisionBadgeColor(): string
    {
        return match($this->decision) {
            'approved' => 'green',
            'rejected' => 'red',
            'needs_info' => 'yellow',
            default => 'gray'
        };
    }

    /**
     * Get formatted decision with notes.
     */
    public function getFormattedDecision(): array
    {
        return [
            'decision' => $this->decision,
            'level' => $this->approval_level,
            'level_description' => $this->getLevelDescription(),
            'approver_name' => $this->approver->name ?? 'Unknown',
            'decided_at' => $this->decided_at->format('Y-m-d H:i:s'),
            'notes' => $this->decision_notes,
            'has_adjustments' => $this->hasAdjustments(),
            'adjusted_amount' => $this->adjusted_amount,
        ];
    }

    // Business Logic Methods

    /**
     * Get tenant ID from related refund request.
     */
    public function getTenantId(): ?string
    {
        return (string) $this->refundRequest?->tenant_id;
    }

    /**
     * Check if this approval allows progression to next level.
     */
    public function allowsProgression(): bool
    {
        return $this->isApproved() && !$this->needsMoreInfo();
    }

    /**
     * Check if this approval blocks further processing.
     */
    public function blocksProgression(): bool
    {
        return $this->isRejected() || $this->needsMoreInfo();
    }

    /**
     * Get effective refund amount after adjustments.
     */
    public function getEffectiveRefundAmount(): ?float
    {
        if ($this->adjusted_amount) {
            return (float) $this->adjusted_amount;
        }

        if ($this->reviewed_calculation && isset($this->reviewed_calculation['refundableToCustomer'])) {
            return (float) $this->reviewed_calculation['refundableToCustomer'];
        }

        return null;
    }
}