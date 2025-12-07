<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Infrastructure\Persistence\Eloquent\Traits\TenantScopedModel;

/**
 * RefundDispute Model
 * 
 * Handles customer disputes over refund decisions
 * Provides mediation workflow for complex cases
 * 
 * @property string $id
 * @property string $refund_request_id
 * @property int $tenant_id
 * @property string $dispute_reason
 * @property string $customer_claim
 * @property array|null $evidence_customer
 * @property string|null $company_response
 * @property array|null $evidence_company
 * @property string $status
 * @property string|null $resolution_notes
 * @property float|null $final_refund_amount
 * @property string|null $mediator_contact
 * @property float|null $mediation_cost
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property \Carbon\Carbon|null $resolved_at
 */
class RefundDispute extends Model
{
    use HasFactory, HasUuids, TenantScopedModel;

    protected $table = 'refund_disputes';

    protected $fillable = [
        'refund_request_id',
        'tenant_id',
        'dispute_reason',
        'customer_claim',
        'evidence_customer',
        'company_response',
        'evidence_company',
        'status',
        'resolution_notes',
        'final_refund_amount',
        'mediator_contact',
        'mediation_cost',
        'resolved_at',
    ];

    protected $casts = [
        'evidence_customer' => 'array',
        'evidence_company' => 'array',
        'final_refund_amount' => 'decimal:2',
        'mediation_cost' => 'decimal:2',
        'resolved_at' => 'datetime',
    ];

    // Dispute Status Constants
    public const STATUS_OPEN = 'open';
    public const STATUS_UNDER_REVIEW = 'under_review';
    public const STATUS_MEDIATION = 'mediation';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_ESCALATED = 'escalated';

    // Dispute Reason Constants
    public const REASON_REFUND_AMOUNT = 'refund_amount';
    public const REASON_LIABILITY_PARTY = 'liability_party';
    public const REASON_CALCULATION_ERROR = 'calculation_error';
    public const REASON_EVIDENCE_DISPUTE = 'evidence_dispute';
    public const REASON_TIMELINE_DISPUTE = 'timeline_dispute';
    public const REASON_SERVICE_QUALITY = 'service_quality';

    /**
     * Get all available statuses
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_OPEN,
            self::STATUS_UNDER_REVIEW,
            self::STATUS_MEDIATION,
            self::STATUS_RESOLVED,
            self::STATUS_ESCALATED,
        ];
    }

    /**
     * Get all available dispute reasons
     */
    public static function getDisputeReasons(): array
    {
        return [
            self::REASON_REFUND_AMOUNT,
            self::REASON_LIABILITY_PARTY,
            self::REASON_CALCULATION_ERROR,
            self::REASON_EVIDENCE_DISPUTE,
            self::REASON_TIMELINE_DISPUTE,
            self::REASON_SERVICE_QUALITY,
        ];
    }

    /**
     * Relationship with RefundRequest
     */
    public function refundRequest(): BelongsTo
    {
        return $this->belongsTo(PaymentRefund::class, 'refund_request_id', 'id');
    }

    /**
     * Relationship with Tenant
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'id');
    }

    /**
     * Check if dispute is active (not resolved)
     */
    public function isActive(): bool
    {
        return !in_array($this->status, [self::STATUS_RESOLVED]);
    }

    /**
     * Check if dispute requires mediation
     */
    public function requiresMediation(): bool
    {
        return $this->status === self::STATUS_MEDIATION;
    }

    /**
     * Check if dispute is escalated
     */
    public function isEscalated(): bool
    {
        return $this->status === self::STATUS_ESCALATED;
    }

    /**
     * Mark dispute as resolved
     */
    public function markAsResolved(float $finalAmount, string $resolutionNotes): void
    {
        $this->update([
            'status' => self::STATUS_RESOLVED,
            'final_refund_amount' => $finalAmount,
            'resolution_notes' => $resolutionNotes,
            'resolved_at' => now(),
        ]);
    }

    /**
     * Escalate dispute to mediation
     */
    public function escalateToMediation(string $mediatorContact, float $mediationCost): void
    {
        $this->update([
            'status' => self::STATUS_MEDIATION,
            'mediator_contact' => $mediatorContact,
            'mediation_cost' => $mediationCost,
        ]);
    }

    /**
     * Add company response to dispute
     */
    public function addCompanyResponse(string $response, array $evidence = []): void
    {
        $this->update([
            'company_response' => $response,
            'evidence_company' => $evidence,
            'status' => self::STATUS_UNDER_REVIEW,
        ]);
    }

    /**
     * Get dispute priority based on refund amount and reason
     */
    public function getPriority(): string
    {
        $refund = $this->refundRequest;
        
        if (!$refund) {
            return 'medium';
        }

        // High priority for large amounts or quality issues
        if ($refund->refund_amount > 2000000 || 
            in_array($this->dispute_reason, [self::REASON_SERVICE_QUALITY, self::REASON_EVIDENCE_DISPUTE])) {
            return 'high';
        }

        // Low priority for small amounts and minor disputes
        if ($refund->refund_amount < 500000 && 
            in_array($this->dispute_reason, [self::REASON_TIMELINE_DISPUTE])) {
            return 'low';
        }

        return 'medium';
    }

    /**
     * Get expected resolution timeframe in days
     */
    public function getExpectedResolutionDays(): int
    {
        return match ($this->getPriority()) {
            'high' => 3,
            'medium' => 7,
            'low' => 14,
            default => 7,
        };
    }

    /**
     * Check if dispute is overdue
     */
    public function isOverdue(): bool
    {
        $expectedDays = $this->getExpectedResolutionDays();
        $deadline = $this->created_at->addDays($expectedDays);
        
        return now()->isAfter($deadline) && $this->isActive();
    }
}