<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;

class VendorOrder extends Model implements TenantAwareModel
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $table = 'vendor_orders';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'order_id',
        'vendor_id',
        'assignment_type',
        'status',
        'estimated_price',
        'final_price',
        'estimated_lead_time_days',
        'actual_lead_time_days',
        'delivery_status',
        'quality_rating',
        'notes',
        'internal_notes',
        'assigned_at',
        'accepted_at',
        'started_at',
        'completed_at',
        'cancelled_at',
        'metadata',
    ];

    protected $casts = [
        'estimated_price' => 'decimal:2',
        'final_price' => 'decimal:2',
        'estimated_lead_time_days' => 'integer',
        'actual_lead_time_days' => 'integer',
        'quality_rating' => 'decimal:2',
        'assigned_at' => 'datetime',
        'accepted_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = [
        'assigned_at',
        'accepted_at',
        'started_at',
        'completed_at',
        'cancelled_at',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    /**
     * Check if vendor assignment is active
     */
    public function isActive(): bool
    {
        return in_array($this->status, ['pending', 'accepted', 'in_progress']);
    }

    /**
     * Check if assignment can be cancelled
     */
    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['pending', 'accepted']);
    }

    /**
     * Calculate performance metrics
     */
    public function getPerformanceMetrics(): array
    {
        return [
            'on_time_delivery' => $this->delivery_status === 'on_time',
            'lead_time_variance' => $this->actual_lead_time_days && $this->estimated_lead_time_days 
                ? ($this->actual_lead_time_days - $this->estimated_lead_time_days) 
                : null,
            'price_variance' => $this->final_price && $this->estimated_price 
                ? ($this->final_price - $this->estimated_price) 
                : null,
            'quality_score' => $this->quality_rating,
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = \Ramsey\Uuid\Uuid::uuid4()->toString();
            }
        });
    }
}