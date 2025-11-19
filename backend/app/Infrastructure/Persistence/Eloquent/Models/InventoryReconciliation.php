<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;

class InventoryReconciliation extends Model
{
    use HasFactory;
    use SoftDeletes;
    use BelongsToTenant;

    protected $fillable = [
        'uuid',
        'model_uuid',
        'tenant_id',
        'inventory_item_id',
        'inventory_location_id',
        'expected_quantity',
        'counted_quantity',
        'variance_quantity',
        'variance_value',
        'status',
        'source',
        'initiated_by',
        'initiated_at',
        'resolved_by',
        'resolved_at',
        'metadata',
    ];

    protected $casts = [
        'expected_quantity' => 'decimal:4',
        'counted_quantity' => 'decimal:4',
        'variance_quantity' => 'decimal:4',
        'variance_value' => 'decimal:4',
        'initiated_at' => 'datetime',
        'resolved_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(InventoryLocation::class, 'inventory_location_id');
    }

    public function initiatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by');
    }

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
