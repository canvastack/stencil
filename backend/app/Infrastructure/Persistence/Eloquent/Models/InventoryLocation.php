<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;

class InventoryLocation extends Model
{
    use HasFactory;
    use SoftDeletes;
    use BelongsToTenant;

    protected $fillable = [
        'uuid',
        'model_uuid',
        'tenant_id',
        'location_code',
        'location_name',
        'description',
        'parent_location_id',
        'location_level',
        'location_type',
        'address_line_1',
        'address_line_2',
        'city',
        'state_province',
        'postal_code',
        'country',
        'total_capacity',
        'used_capacity',
        'capacity_unit',
        'temperature_controlled',
        'temperature_min',
        'temperature_max',
        'humidity_controlled',
        'humidity_max',
        'security_level',
        'is_active',
        'is_primary',
        'operational_hours',
        'contact_information',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'total_capacity' => 'decimal:4',
        'used_capacity' => 'decimal:4',
        'temperature_controlled' => 'boolean',
        'temperature_min' => 'decimal:2',
        'temperature_max' => 'decimal:2',
        'humidity_controlled' => 'boolean',
        'humidity_max' => 'decimal:2',
        'is_active' => 'boolean',
        'is_primary' => 'boolean',
        'operational_hours' => 'array',
        'contact_information' => 'array',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_location_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_location_id');
    }

    public function itemLocations(): HasMany
    {
        return $this->hasMany(InventoryItemLocation::class);
    }

    public function movementsFrom(): HasMany
    {
        return $this->hasMany(InventoryMovement::class, 'from_location_id');
    }

    public function movementsTo(): HasMany
    {
        return $this->hasMany(InventoryMovement::class, 'to_location_id');
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
