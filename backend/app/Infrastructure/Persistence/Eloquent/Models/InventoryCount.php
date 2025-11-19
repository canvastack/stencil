<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;

class InventoryCount extends Model
{
    use HasFactory;
    use SoftDeletes;
    use BelongsToTenant;

    protected $fillable = [
        'uuid',
        'model_uuid',
        'tenant_id',
        'inventory_location_id',
        'count_type',
        'status',
        'scheduled_for',
        'started_at',
        'completed_at',
        'total_items',
        'items_counted',
        'variance_quantity',
        'variance_value',
        'created_by',
        'counted_by',
        'notes',
        'metadata',
    ];

    protected $casts = [
        'scheduled_for' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'variance_quantity' => 'decimal:4',
        'variance_value' => 'decimal:4',
        'metadata' => 'array',
    ];

    public function location(): BelongsTo
    {
        return $this->belongsTo(InventoryLocation::class, 'inventory_location_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function countedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'counted_by');
    }
}
