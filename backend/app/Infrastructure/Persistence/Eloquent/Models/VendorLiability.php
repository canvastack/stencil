<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Infrastructure\Persistence\Eloquent\Traits\TenantScopedModel;
use App\Models\PaymentRefund;

/**
 * VendorLiability Model
 * 
 * Tracks financial liability claims against vendors
 * Manages recovery workflow for vendor failures
 * 
 * @property string $id
 * @property int $tenant_id
 * @property int $vendor_id
 * @property int $order_id
 * @property string|null $refund_request_id
 * @property float $liability_amount
 * @property string $reason
 * @property string $status
 * @property \Carbon\Carbon|null $claim_date
 * @property \Carbon\Carbon|null $recovery_date
 * @property float|null $recovered_amount
 * @property string|null $recovery_notes
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class VendorLiability extends Model
{
    use HasFactory, HasUuids, TenantScopedModel;

    protected $table = 'vendor_liabilities';

    protected $fillable = [
        'tenant_id',
        'vendor_id',
        'order_id',
        'refund_request_id',
        'liability_amount',
        'reason',
        'status',
        'claim_date',
        'recovery_date',
        'recovered_amount',
        'recovery_notes',
    ];

    protected $casts = [
        'liability_amount' => 'decimal:2',
        'recovered_amount' => 'decimal:2',
        'claim_date' => 'datetime',
        'recovery_date' => 'datetime',
    ];

    // Status Constants
    public const STATUS_PENDING_CLAIM = 'pending_claim';
    public const STATUS_CLAIMED = 'claimed';
    public const STATUS_RECOVERED = 'recovered';
    public const STATUS_WRITTEN_OFF = 'written_off';
    public const STATUS_DISPUTED = 'disputed';
    public const STATUS_PARTIAL_RECOVERY = 'partial_recovery';

    // Liability Reason Constants
    public const REASON_QUALITY_FAILURE = 'quality_failure';
    public const REASON_DELIVERY_FAILURE = 'delivery_failure';
    public const REASON_TIMELINE_BREACH = 'timeline_breach';
    public const REASON_SPECIFICATION_ERROR = 'specification_error';
    public const REASON_MATERIAL_DEFECT = 'material_defect';
    public const REASON_SERVICE_ABANDONMENT = 'service_abandonment';
    public const REASON_CONTRACT_BREACH = 'contract_breach';

    /**
     * Get all available statuses
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_PENDING_CLAIM,
            self::STATUS_CLAIMED,
            self::STATUS_RECOVERED,
            self::STATUS_WRITTEN_OFF,
            self::STATUS_DISPUTED,
            self::STATUS_PARTIAL_RECOVERY,
        ];
    }

    /**
     * Get all available liability reasons
     */
    public static function getLiabilityReasons(): array
    {
        return [
            self::REASON_QUALITY_FAILURE,
            self::REASON_DELIVERY_FAILURE,
            self::REASON_TIMELINE_BREACH,
            self::REASON_SPECIFICATION_ERROR,
            self::REASON_MATERIAL_DEFECT,
            self::REASON_SERVICE_ABANDONMENT,
            self::REASON_CONTRACT_BREACH,
        ];
    }

    /**
     * Relationship with Tenant
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'id');
    }

    /**
     * Relationship with Vendor
     */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id', 'id');
    }

    /**
     * Relationship with Order
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id', 'id');
    }

    /**
     * Relationship with RefundRequest (optional)
     */
    public function refundRequest(): BelongsTo
    {
        return $this->belongsTo(PaymentRefund::class, 'refund_request_id', 'id');
    }

    /**
     * Check if liability is active (not recovered or written off)
     */
    public function isActive(): bool
    {
        return !in_array($this->status, [
            self::STATUS_RECOVERED,
            self::STATUS_WRITTEN_OFF
        ]);
    }

    /**
     * Check if liability has been claimed from vendor
     */
    public function isClaimed(): bool
    {
        return in_array($this->status, [
            self::STATUS_CLAIMED,
            self::STATUS_RECOVERED,
            self::STATUS_PARTIAL_RECOVERY,
            self::STATUS_DISPUTED
        ]);
    }

    /**
     * Check if liability is overdue for action
     */
    public function isOverdue(): bool
    {
        $daysSinceCreated = $this->created_at->diffInDays(now());
        
        return match ($this->status) {
            self::STATUS_PENDING_CLAIM => $daysSinceCreated > 7, // 7 days to file claim
            self::STATUS_CLAIMED => $daysSinceCreated > 30, // 30 days to get response
            self::STATUS_DISPUTED => $daysSinceCreated > 60, // 60 days for dispute resolution
            default => false,
        };
    }

    /**
     * Get priority level based on amount and reason
     */
    public function getPriority(): string
    {
        // High priority for large amounts or critical failures
        if ($this->liability_amount > 5000000 || 
            in_array($this->reason, [self::REASON_SERVICE_ABANDONMENT, self::REASON_CONTRACT_BREACH])) {
            return 'high';
        }

        // Low priority for small amounts and minor issues
        if ($this->liability_amount < 1000000 && 
            in_array($this->reason, [self::REASON_TIMELINE_BREACH])) {
            return 'low';
        }

        return 'medium';
    }

    /**
     * Calculate recovery rate percentage
     */
    public function getRecoveryRate(): float
    {
        if ($this->liability_amount <= 0) {
            return 0;
        }

        $recoveredAmount = $this->recovered_amount ?? 0;
        return ($recoveredAmount / $this->liability_amount) * 100;
    }

    /**
     * Get expected recovery amount based on historical data
     */
    public function getExpectedRecoveryAmount(): float
    {
        // Base recovery rate by reason type (historical averages)
        $baseRecoveryRates = [
            self::REASON_QUALITY_FAILURE => 0.85,
            self::REASON_DELIVERY_FAILURE => 0.75,
            self::REASON_TIMELINE_BREACH => 0.60,
            self::REASON_SPECIFICATION_ERROR => 0.90,
            self::REASON_MATERIAL_DEFECT => 0.95,
            self::REASON_SERVICE_ABANDONMENT => 0.40,
            self::REASON_CONTRACT_BREACH => 0.70,
        ];

        $baseRate = $baseRecoveryRates[$this->reason] ?? 0.65;
        
        // Adjust based on vendor history (would be calculated from database)
        // For now, using base rate
        return $this->liability_amount * $baseRate;
    }

    /**
     * Mark claim as filed with vendor
     */
    public function fileClaim(string $notes = ''): void
    {
        $this->update([
            'status' => self::STATUS_CLAIMED,
            'claim_date' => now(),
            'recovery_notes' => $notes,
        ]);
    }

    /**
     * Record recovery payment
     */
    public function recordRecovery(float $amount, string $notes = ''): void
    {
        $isFullRecovery = $amount >= $this->liability_amount;
        
        $this->update([
            'status' => $isFullRecovery ? self::STATUS_RECOVERED : self::STATUS_PARTIAL_RECOVERY,
            'recovery_date' => now(),
            'recovered_amount' => $amount,
            'recovery_notes' => $notes,
        ]);
    }

    /**
     * Mark liability as disputed by vendor
     */
    public function markAsDisputed(string $notes = ''): void
    {
        $this->update([
            'status' => self::STATUS_DISPUTED,
            'recovery_notes' => $notes,
        ]);
    }

    /**
     * Write off uncollectable liability
     */
    public function writeOff(string $reason): void
    {
        $this->update([
            'status' => self::STATUS_WRITTEN_OFF,
            'recovery_notes' => "Written off: {$reason}",
        ]);
    }

    /**
     * Get days since claim was filed
     */
    public function getDaysSinceClaim(): int
    {
        if (!$this->claim_date) {
            return 0;
        }

        return $this->claim_date->diffInDays(now());
    }

    /**
     * Get recommended action based on current status and timing
     */
    public function getRecommendedAction(): array
    {
        $daysSinceCreated = $this->created_at->diffInDays(now());
        $daysSinceClaim = $this->getDaysSinceClaim();

        return match ($this->status) {
            self::STATUS_PENDING_CLAIM => [
                'action' => $daysSinceCreated > 3 ? 'file_claim_urgent' : 'prepare_claim',
                'priority' => $daysSinceCreated > 7 ? 'high' : 'medium',
                'reason' => $daysSinceCreated > 7 ? 'Claim filing overdue' : 'Prepare claim documentation',
            ],
            self::STATUS_CLAIMED => [
                'action' => $daysSinceClaim > 21 ? 'follow_up_urgent' : 'monitor_response',
                'priority' => $daysSinceClaim > 30 ? 'high' : 'medium',
                'reason' => $daysSinceClaim > 30 ? 'Vendor response overdue' : 'Awaiting vendor response',
            ],
            self::STATUS_DISPUTED => [
                'action' => 'escalate_dispute',
                'priority' => 'high',
                'reason' => 'Requires legal or mediation intervention',
            ],
            self::STATUS_PARTIAL_RECOVERY => [
                'action' => 'negotiate_remainder',
                'priority' => 'medium',
                'reason' => 'Pursue remaining recovery amount',
            ],
            default => [
                'action' => 'no_action',
                'priority' => 'low',
                'reason' => 'Liability resolved or written off',
            ],
        };
    }
}