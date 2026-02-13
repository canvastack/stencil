<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;

/**
 * AuditLog Model
 * 
 * Tracks all vendor portal actions and system events for audit trail.
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6
 */
class AuditLog extends Model implements TenantAwareModel
{
    use HasFactory, BelongsToTenant;

    protected $table = 'audit_logs';

    // Audit logs are immutable - no updates allowed
    public $timestamps = false;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'user_type',
        'action_type',
        'resource_type',
        'resource_id',
        'old_values',
        'new_values',
        'metadata',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    // Relationships

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForResource($query, string $resourceType, string $resourceId = null)
    {
        $query->where('resource_type', $resourceType);
        
        if ($resourceId) {
            $query->where('resource_id', $resourceId);
        }
        
        return $query;
    }

    public function scopeByAction($query, string $actionType)
    {
        return $query->where('action_type', $actionType);
    }

    public function scopeByUserType($query, string $userType)
    {
        return $query->where('user_type', $userType);
    }

    public function scopeVendorActions($query)
    {
        return $query->where('user_type', 'vendor');
    }

    public function scopeInDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    // Helper Methods

    /**
     * Check if this is a login action.
     */
    public function isLoginAction(): bool
    {
        return in_array($this->action_type, ['login', 'login_success', 'login_failed']);
    }

    /**
     * Check if this is a quote action.
     */
    public function isQuoteAction(): bool
    {
        return $this->resource_type === 'quote';
    }

    /**
     * Check if this is a vendor action.
     */
    public function isVendorAction(): bool
    {
        return $this->user_type === 'vendor';
    }

    // Boot

    protected static function boot()
    {
        parent::boot();

        // Automatically set created_at on creation
        static::creating(function ($model) {
            if (empty($model->created_at)) {
                $model->created_at = now();
            }
        });

        // Prevent updates to audit logs (immutable)
        static::updating(function ($model) {
            return false;
        });
    }
}
