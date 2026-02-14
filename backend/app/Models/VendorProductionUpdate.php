<?php

namespace App\Models;

use App\Infrastructure\Persistence\Eloquent\Models\Order as OrderEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant as TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\User as UserEloquentModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Vendor Production Update Model
 * 
 * Tracks production progress updates from vendors for purchase orders.
 * Vendors can update status, progress percentage, add notes, and upload photos.
 * 
 * @property int $id
 * @property string $uuid
 * @property int $tenant_id
 * @property int $purchase_order_id
 * @property int $vendor_id
 * @property string $status
 * @property int $progress_percentage
 * @property string|null $notes
 * @property \Carbon\Carbon|null $estimated_completion_date
 * @property \Carbon\Carbon|null $actual_completion_date
 * @property array|null $photos
 * @property bool $is_milestone
 * @property int $created_by
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class VendorProductionUpdate extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'vendor_production_updates';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'uuid',
        'tenant_id',
        'purchase_order_id',
        'vendor_id',
        'status',
        'progress_percentage',
        'notes',
        'estimated_completion_date',
        'actual_completion_date',
        'photos',
        'is_milestone',
        'created_by',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'estimated_completion_date' => 'datetime',
        'actual_completion_date' => 'datetime',
        'photos' => 'array',
        'is_milestone' => 'boolean',
        'progress_percentage' => 'integer',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'id',
        // 'purchase_order_id', // Removed: needed in API responses for admin
        'vendor_id',
        'tenant_id',
        'created_by',
    ];

    /**
     * Production status constants
     */
    const STATUS_STARTED = 'started';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_QUALITY_CHECK = 'quality_check';
    const STATUS_DELAYED = 'delayed';
    const STATUS_COMPLETED = 'completed';

    /**
     * Get all valid statuses
     */
    public static function getValidStatuses(): array
    {
        return [
            self::STATUS_STARTED,
            self::STATUS_IN_PROGRESS,
            self::STATUS_QUALITY_CHECK,
            self::STATUS_DELAYED,
            self::STATUS_COMPLETED,
        ];
    }

    /**
     * Get the tenant that owns the production update.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(TenantEloquentModel::class);
    }

    /**
     * Get the purchase order associated with the update.
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(VendorPurchaseOrder::class, 'purchase_order_id');
    }

    /**
     * Get the vendor who created the update.
     */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(UserEloquentModel::class, 'vendor_id');
    }

    /**
     * Get the user who created the update.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(UserEloquentModel::class, 'created_by');
    }

    /**
     * Scope a query to only include updates for a specific tenant.
     */
    public function scopeForTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope a query to only include updates for a specific purchase order.
     */
    public function scopeForPurchaseOrder($query, $purchaseOrderId)
    {
        return $query->where('purchase_order_id', $purchaseOrderId);
    }

    /**
     * Scope a query to only include updates for a specific vendor.
     */
    public function scopeForVendor($query, $vendorId)
    {
        return $query->where('vendor_id', $vendorId);
    }

    /**
     * Scope a query to only include updates with a specific status.
     */
    public function scopeWithStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to only include milestone updates.
     */
    public function scopeMilestonesOnly($query)
    {
        return $query->where('is_milestone', true);
    }

    /**
     * Scope a query to order by most recent first and limit results.
     */
    public function scopeRecent($query, $limit = 10)
    {
        return $query->orderBy('created_at', 'desc')->limit($limit);
    }

    /**
     * Check if update is overdue based on purchase order's expected delivery date.
     */
    public function isOverdue(): bool
    {
        // Load purchase order if not already loaded
        if (!$this->relationLoaded('purchaseOrder')) {
            $this->load('purchaseOrder');
        }

        $po = $this->purchaseOrder;
        
        if (!$po || !$po->expected_delivery_date) {
            return false;
        }

        // Not overdue if production is completed
        if ($this->status === self::STATUS_COMPLETED) {
            return false;
        }

        return now()->isAfter($po->expected_delivery_date);
    }

    /**
     * Get days until estimated completion.
     */
    public function getDaysUntilCompletionAttribute(): ?int
    {
        if (!$this->estimated_completion_date) {
            return null;
        }

        return now()->diffInDays($this->estimated_completion_date, false);
    }

    /**
     * Get days since update was created.
     */
    public function getDaysSinceUpdateAttribute(): int
    {
        return $this->created_at->diffInDays(now());
    }

    /**
     * Check if status is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Check if status is delayed.
     */
    public function isDelayed(): bool
    {
        return $this->status === self::STATUS_DELAYED;
    }

    /**
     * Get photo count.
     */
    public function getPhotoCountAttribute(): int
    {
        return is_array($this->photos) ? count($this->photos) : 0;
    }

    /**
     * Get status display name.
     */
    public function getStatusDisplayNameAttribute(): string
    {
        return match($this->status) {
            self::STATUS_STARTED => 'Started',
            self::STATUS_IN_PROGRESS => 'In Progress',
            self::STATUS_QUALITY_CHECK => 'Quality Check',
            self::STATUS_DELAYED => 'Delayed',
            self::STATUS_COMPLETED => 'Completed',
            default => ucfirst($this->status),
        };
    }

    /**
     * Get status color for UI.
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            self::STATUS_STARTED => 'blue',
            self::STATUS_IN_PROGRESS => 'yellow',
            self::STATUS_QUALITY_CHECK => 'purple',
            self::STATUS_DELAYED => 'red',
            self::STATUS_COMPLETED => 'green',
            default => 'gray',
        };
    }

    /**
     * Validate status transition.
     */
    public function canTransitionTo(string $newStatus): bool
    {
        $validTransitions = [
            self::STATUS_STARTED => [self::STATUS_IN_PROGRESS, self::STATUS_DELAYED],
            self::STATUS_IN_PROGRESS => [self::STATUS_QUALITY_CHECK, self::STATUS_DELAYED, self::STATUS_COMPLETED],
            self::STATUS_QUALITY_CHECK => [self::STATUS_COMPLETED, self::STATUS_IN_PROGRESS, self::STATUS_DELAYED],
            self::STATUS_DELAYED => [self::STATUS_IN_PROGRESS, self::STATUS_STARTED],
            self::STATUS_COMPLETED => [], // Cannot transition from completed
        ];

        return in_array($newStatus, $validTransitions[$this->status] ?? []);
    }
}
