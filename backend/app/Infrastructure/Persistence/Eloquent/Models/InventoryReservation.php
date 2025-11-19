<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;

class InventoryReservation extends Model
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
        'quantity',
        'status',
        'reserved_for_type',
        'reserved_for_id',
        'reserved_at',
        'expires_at',
        'released_at',
        'reserved_by',
        'released_by',
        'metadata',
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'reserved_at' => 'datetime',
        'expires_at' => 'datetime',
        'released_at' => 'datetime',
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

    public function reservedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reserved_by');
    }

    public function releasedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'released_by');
    }
}
