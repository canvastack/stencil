<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorQuote extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'sourcing_request_id',
        'vendor_id',
        'amount',
        'description',
        'status',
        'valid_until',
        'terms',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'terms' => 'array',
        'valid_until' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $appends = ['quoted_price'];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function sourcingRequest(): BelongsTo
    {
        return $this->belongsTo(VendorSourcing::class, 'sourcing_request_id');
    }

    // Alias for controller compatibility
    public function vendorSourcing(): BelongsTo
    {
        return $this->sourcingRequest();
    }

    // Accessor for backward compatibility (amount → quoted_price)
    public function getQuotedPriceAttribute()
    {
        return $this->amount;
    }

    // Mutator for backward compatibility (quoted_price → amount)
    public function setQuotedPriceAttribute($value)
    {
        $this->attributes['amount'] = $value;
    }
}
