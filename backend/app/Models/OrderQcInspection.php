<?php

namespace App\Models;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class OrderQcInspection extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'tenant_id',
        'order_id',
        'inspector_user_id',
        'inspection_date',
        'inspection_duration_minutes',
        'checklist_results',
        'overall_rating',
        'total_score',
        'critical_items_passed',
        'decision',
        'decision_notes',
        'photos',
        'photo_count',
        'vendor_notified_at',
        'vendor_response',
        'rework_deadline',
        'is_reinspection',
        'original_inspection_id',
        'reinspection_count',
    ];

    protected $casts = [
        'inspection_date' => 'datetime',
        'checklist_results' => 'array',
        'total_score' => 'decimal:2',
        'critical_items_passed' => 'boolean',
        'photos' => 'array',
        'photo_count' => 'integer',
        'vendor_notified_at' => 'datetime',
        'rework_deadline' => 'datetime',
        'is_reinspection' => 'boolean',
        'reinspection_count' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Get the order that this inspection belongs to
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the inspector user
     */
    public function inspector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspector_user_id');
    }

    /**
     * Get the original inspection (for re-inspections)
     */
    public function originalInspection(): BelongsTo
    {
        return $this->belongsTo(OrderQcInspection::class, 'original_inspection_id');
    }

    /**
     * Get re-inspections of this inspection
     */
    public function reinspections()
    {
        return $this->hasMany(OrderQcInspection::class, 'original_inspection_id');
    }

    /**
     * Check if inspection is approved
     */
    public function isApproved(): bool
    {
        return in_array($this->decision, ['approved', 'approved_with_notes']);
    }

    /**
     * Check if inspection is rejected
     */
    public function isRejected(): bool
    {
        return in_array($this->decision, ['rejected', 'needs_rework']);
    }

    /**
     * Get decision label
     */
    public function getDecisionLabelAttribute(): string
    {
        return match($this->decision) {
            'approved' => 'Approved',
            'approved_with_notes' => 'Approved with Notes',
            'rejected' => 'Rejected',
            'needs_rework' => 'Needs Rework',
            default => 'Unknown',
        };
    }

    /**
     * Get overall rating label
     */
    public function getOverallRatingLabelAttribute(): string
    {
        return match($this->overall_rating) {
            'excellent' => 'Excellent',
            'good' => 'Good',
            'acceptable' => 'Acceptable',
            'poor' => 'Poor',
            default => 'Not Rated',
        };
    }

    /**
     * Scope to filter by tenant
     */
    public function scopeForTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope to filter by decision
     */
    public function scopeByDecision($query, $decision)
    {
        return $query->where('decision', $decision);
    }

    /**
     * Scope to get approved inspections
     */
    public function scopeApproved($query)
    {
        return $query->whereIn('decision', ['approved', 'approved_with_notes']);
    }

    /**
     * Scope to get rejected inspections
     */
    public function scopeRejected($query)
    {
        return $query->whereIn('decision', ['rejected', 'needs_rework']);
    }
}
