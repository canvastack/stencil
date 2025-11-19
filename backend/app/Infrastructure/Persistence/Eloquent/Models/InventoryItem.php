<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;

class InventoryItem extends Model
{
    use HasFactory;
    use SoftDeletes;
    use BelongsToTenant;

    protected $fillable = [
        'uuid',
        'model_uuid',
        'tenant_id',
        'product_id',
        'item_code',
        'item_name',
        'description',
        'category',
        'subcategory',
        'item_type',
        'unit_of_measure',
        'weight_per_unit',
        'volume_per_unit',
        'material_type',
        'material_grade',
        'thickness',
        'finish',
        'color',
        'is_serialized',
        'is_batch_tracked',
        'is_expirable',
        'shelf_life_days',
        'current_stock',
        'available_stock',
        'reserved_stock',
        'on_order_stock',
        'minimum_stock_level',
        'reorder_point',
        'reorder_quantity',
        'standard_cost',
        'average_cost',
        'last_purchase_cost',
        'current_market_price',
        'valuation_method',
        'quality_grade',
        'inspection_required',
        'quarantine_required',
        'primary_supplier_uuid',
        'supplier_part_number',
        'lead_time_days',
        'is_active',
        'is_discontinued',
        'is_hazardous',
        'hazard_classification',
        'storage_temperature_min',
        'storage_temperature_max',
        'storage_humidity_max',
        'technical_specifications',
        'custom_fields',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_serialized' => 'boolean',
        'is_batch_tracked' => 'boolean',
        'is_expirable' => 'boolean',
        'current_stock' => 'decimal:4',
        'available_stock' => 'decimal:4',
        'reserved_stock' => 'decimal:4',
        'on_order_stock' => 'decimal:4',
        'minimum_stock_level' => 'decimal:4',
        'reorder_point' => 'decimal:4',
        'reorder_quantity' => 'decimal:4',
        'standard_cost' => 'decimal:4',
        'average_cost' => 'decimal:4',
        'last_purchase_cost' => 'decimal:4',
        'current_market_price' => 'decimal:4',
        'inspection_required' => 'boolean',
        'quarantine_required' => 'boolean',
        'lead_time_days' => 'integer',
        'is_active' => 'boolean',
        'is_discontinued' => 'boolean',
        'is_hazardous' => 'boolean',
        'technical_specifications' => 'array',
        'custom_fields' => 'array',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function locations(): HasMany
    {
        return $this->hasMany(InventoryItemLocation::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(InventoryReservation::class);
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(InventoryAlert::class);
    }

    public function reconciliations(): HasMany
    {
        return $this->hasMany(InventoryReconciliation::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
