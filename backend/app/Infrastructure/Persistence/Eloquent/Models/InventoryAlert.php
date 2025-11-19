<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;

class InventoryAlert extends Model
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
        'alert_type',
        'severity',
        'message',
        'triggered_quantity',
        'threshold_quantity',
        'resolved',
        'resolved_at',
        'resolved_by',
        'metadata',
    ];

    protected $casts = [
        'triggered_quantity' => 'decimal:4',
        'threshold_quantity' => 'decimal:4',
        'resolved' => 'boolean',
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

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
