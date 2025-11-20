<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class RefundApprovalWorkflow extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'refund_approval_workflows';

    protected $fillable = [
        'tenant_id',
        'payment_refund_id',
        'order_id',
        'workflow_name',
        'step_number',
        'total_steps',
        'is_current_step',
        'is_completed',
        'step_name',
        'step_description',
        'step_type',
        'approval_level',
        'assigned_to',
        'role_required',
        'permission_requirements',
        'decision',
        'decision_reason',
        'decision_metadata',
        'decided_by',
        'decided_at',
        'decision_ip_address',
        'decision_user_agent',
        'assigned_at',
        'due_at',
        'sla_hours',
        'is_overdue',
        'sla_breached',
        'can_be_escalated',
        'escalated_to',
        'escalated_at',
        'escalation_reason',
        'approval_conditions',
        'auto_approval_rules',
        'requires_manual_review',
        'notification_sent',
        'notification_sent_at',
        'notification_channels',
        'reminder_count',
        'last_reminder_sent_at',
        'refund_amount_threshold',
        'risk_assessment',
        'requires_additional_documentation',
        'required_documents'
    ];

    protected $casts = [
        'is_current_step' => 'boolean',
        'is_completed' => 'boolean',
        'is_overdue' => 'boolean',
        'sla_breached' => 'boolean',
        'can_be_escalated' => 'boolean',
        'requires_manual_review' => 'boolean',
        'notification_sent' => 'boolean',
        'requires_additional_documentation' => 'boolean',
        'permission_requirements' => 'array',
        'decision_metadata' => 'array',
        'approval_conditions' => 'array',
        'auto_approval_rules' => 'array',
        'notification_channels' => 'array',
        'risk_assessment' => 'array',
        'required_documents' => 'array',
        'refund_amount_threshold' => 'decimal:2',
        'decided_at' => 'datetime',
        'assigned_at' => 'datetime',
        'due_at' => 'datetime',
        'escalated_at' => 'datetime',
        'notification_sent_at' => 'datetime',
        'last_reminder_sent_at' => 'datetime',
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

        static::creating(function ($workflow) {
            if (!$workflow->tenant_id && app()->bound('current_tenant')) {
                $workflow->tenant_id = app('current_tenant')->id;
            }

            // Set default assigned_at if not provided
            if (!$workflow->assigned_at) {
                $workflow->assigned_at = now();
            }

            // Calculate due_at based on SLA if not provided
            if (!$workflow->due_at && $workflow->sla_hours) {
                $workflow->due_at = now()->addHours($workflow->sla_hours);
            }

            // Validate cross-tenant relationships
            if ($workflow->payment_refund_id && $workflow->tenant_id) {
                $refund = PaymentRefund::withoutGlobalScopes()->find($workflow->payment_refund_id);
                if ($refund && $refund->tenant_id !== $workflow->tenant_id) {
                    throw new \Exception('Cross-tenant relationships are not allowed');
                }
            }
        });

        static::updating(function ($workflow) {
            // Check if step is overdue
            if ($workflow->due_at && now() > $workflow->due_at && $workflow->decision === 'pending') {
                $workflow->is_overdue = true;
                if (!$workflow->sla_breached) {
                    $workflow->sla_breached = true;
                }
            }

            // Mark as completed when decision is made
            if ($workflow->isDirty('decision') && $workflow->decision !== 'pending' && !$workflow->is_completed) {
                $workflow->is_completed = true;
                $workflow->decided_at = now();
            }
        });
    }

    // Relationships
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::class, 'tenant_id');
    }

    public function paymentRefund(): BelongsTo
    {
        return $this->belongsTo(PaymentRefund::class, 'payment_refund_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\OrderEloquentModel::class, 'order_id');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\UserEloquentModel::class, 'assigned_to');
    }

    public function roleRequired(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\RoleEloquentModel::class, 'role_required');
    }

    public function decidedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\UserEloquentModel::class, 'decided_by');
    }

    public function escalatedTo(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\UserEloquentModel::class, 'escalated_to');
    }

    // Scopes for easy querying
    public function scopePending($query)
    {
        return $query->where('decision', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('decision', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('decision', 'rejected');
    }

    public function scopeEscalated($query)
    {
        return $query->where('decision', 'escalated');
    }

    public function scopeCompleted($query)
    {
        return $query->where('is_completed', true);
    }

    public function scopeActive($query)
    {
        return $query->where('is_current_step', true);
    }

    public function scopeOverdue($query)
    {
        return $query->where('is_overdue', true);
    }

    public function scopeSlaBreached($query)
    {
        return $query->where('sla_breached', true);
    }

    public function scopeAssignedTo($query, int $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    public function scopeByApprovalLevel($query, string $level)
    {
        return $query->where('approval_level', $level);
    }

    public function scopeByStepType($query, string $type)
    {
        return $query->where('step_type', $type);
    }

    public function scopeByWorkflowName($query, string $name)
    {
        return $query->where('workflow_name', $name);
    }

    public function scopeRequiringAttention($query)
    {
        return $query->where('is_current_step', true)
            ->where('decision', 'pending')
            ->where(function ($q) {
                $q->where('is_overdue', true)
                  ->orWhere('requires_manual_review', true);
            });
    }

    public function scopeDueSoon($query, int $hours = 24)
    {
        return $query->where('decision', 'pending')
            ->where('due_at', '<=', now()->addHours($hours))
            ->where('due_at', '>', now());
    }

    // Utility methods
    public function isPending(): bool
    {
        return $this->decision === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->decision === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->decision === 'rejected';
    }

    public function isEscalated(): bool
    {
        return $this->decision === 'escalated';
    }

    public function isCompleted(): bool
    {
        return $this->is_completed;
    }

    public function isCurrentStep(): bool
    {
        return $this->is_current_step;
    }

    public function isOverdue(): bool
    {
        return $this->is_overdue || ($this->due_at && now() > $this->due_at);
    }

    public function isSlaBreached(): bool
    {
        return $this->sla_breached;
    }

    public function canBeEscalated(): bool
    {
        return $this->can_be_escalated && $this->isPending() && $this->isCurrentStep();
    }

    public function requiresManualReview(): bool
    {
        return $this->requires_manual_review;
    }

    public function getTimeRemainingInHours(): ?int
    {
        if (!$this->due_at || $this->isCompleted()) {
            return null;
        }

        $diff = now()->diffInHours($this->due_at, false);
        return $diff > 0 ? $diff : 0;
    }

    public function getTimeOverdueInHours(): ?int
    {
        if (!$this->due_at || !$this->isOverdue()) {
            return null;
        }

        return now()->diffInHours($this->due_at);
    }

    public function getProgressPercentage(): float
    {
        if ($this->total_steps == 0) {
            return 0;
        }

        if ($this->isCompleted()) {
            return 100.0;
        }

        return ($this->step_number / $this->total_steps) * 100;
    }

    public function shouldSendReminder(): bool
    {
        if (!$this->isPending() || !$this->isCurrentStep()) {
            return false;
        }

        // Don't send too many reminders
        if ($this->reminder_count >= 3) {
            return false;
        }

        // Don't send reminders too frequently
        if ($this->last_reminder_sent_at && now()->diffInHours($this->last_reminder_sent_at) < 6) {
            return false;
        }

        // Send reminder if approaching due date or overdue
        if ($this->due_at) {
            $hoursUntilDue = now()->diffInHours($this->due_at, false);
            return $hoursUntilDue <= 4 || $this->isOverdue();
        }

        return false;
    }

    public function canAutoApprove(): bool
    {
        if ($this->requires_manual_review || !$this->auto_approval_rules) {
            return false;
        }

        // Check auto-approval conditions
        $rules = $this->auto_approval_rules;
        
        // Example auto-approval logic (can be customized per tenant)
        if (isset($rules['max_amount'])) {
            $refund = $this->paymentRefund;
            if ($refund && $refund->refund_amount > ($rules['max_amount'] * 100)) { // Convert to cents
                return false;
            }
        }

        if (isset($rules['allowed_reason_categories'])) {
            $refund = $this->paymentRefund;
            if ($refund && !in_array($refund->reason_category, $rules['allowed_reason_categories'])) {
                return false;
            }
        }

        return true;
    }

    // Action methods
    public function approve(int $userId, string $reason = null, array $metadata = []): bool
    {
        if (!$this->isPending() || !$this->isCurrentStep()) {
            return false;
        }

        $this->update([
            'decision' => 'approved',
            'decided_by' => $userId,
            'decided_at' => now(),
            'decision_reason' => $reason,
            'decision_metadata' => $metadata,
            'decision_ip_address' => request()?->ip(),
            'decision_user_agent' => request()?->userAgent(),
            'is_completed' => true,
            'is_current_step' => false
        ]);

        return true;
    }

    public function reject(int $userId, string $reason, array $metadata = []): bool
    {
        if (!$this->isPending() || !$this->isCurrentStep()) {
            return false;
        }

        $this->update([
            'decision' => 'rejected',
            'decided_by' => $userId,
            'decided_at' => now(),
            'decision_reason' => $reason,
            'decision_metadata' => $metadata,
            'decision_ip_address' => request()?->ip(),
            'decision_user_agent' => request()?->userAgent(),
            'is_completed' => true,
            'is_current_step' => false
        ]);

        return true;
    }

    public function escalate(int $escalatedToUserId, string $reason): bool
    {
        if (!$this->canBeEscalated()) {
            return false;
        }

        $this->update([
            'decision' => 'escalated',
            'escalated_to' => $escalatedToUserId,
            'escalated_at' => now(),
            'escalation_reason' => $reason,
            'assigned_to' => $escalatedToUserId, // Reassign to escalated user
            'due_at' => now()->addHours($this->sla_hours), // Reset due date
            'is_overdue' => false // Reset overdue status
        ]);

        return true;
    }

    public function sendReminderNotification(): bool
    {
        if (!$this->shouldSendReminder()) {
            return false;
        }

        $this->update([
            'reminder_count' => $this->reminder_count + 1,
            'last_reminder_sent_at' => now()
        ]);

        // Here you would trigger the actual notification
        // event(new WorkflowReminderEvent($this));

        return true;
    }

    public function markNotificationSent(array $channels = ['email']): void
    {
        $this->update([
            'notification_sent' => true,
            'notification_sent_at' => now(),
            'notification_channels' => $channels
        ]);
    }

    public function updateSlaStatus(): void
    {
        if ($this->due_at && now() > $this->due_at && $this->isPending()) {
            $this->update([
                'is_overdue' => true,
                'sla_breached' => true
            ]);
        }
    }
}