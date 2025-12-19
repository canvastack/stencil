<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VendorSourcing extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $table = 'vendor_sourcing';

    protected $fillable = [
        'tenant_id',
        'order_id',
        'title',
        'description',
        'status',
        'assigned_vendor',
        'requirements',
        'responses',
        'best_quote',
    ];

    protected $casts = [
        'requirements' => 'array',
        'best_quote' => 'decimal:2',
        'responses' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(VendorQuote::class, 'sourcing_request_id');
    }
}
