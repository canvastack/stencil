<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;

class InventoryItemLocation extends Model
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
        'stock_on_hand',
        'stock_reserved',
        'stock_available',
        'stock_damaged',
        'stock_in_transit',
        'last_counted_at',
        'last_reconciled_at',
        'last_counted_by',
    ];

    protected $casts = [
        'stock_on_hand' => 'decimal:4',
        'stock_reserved' => 'decimal:4',
        'stock_available' => 'decimal:4',
        'stock_damaged' => 'decimal:4',
        'stock_in_transit' => 'decimal:4',
        'last_counted_at' => 'datetime',
        'last_reconciled_at' => 'datetime',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(InventoryLocation::class, 'inventory_location_id');
    }

    public function lastCountedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'last_counted_by');
    }
}
