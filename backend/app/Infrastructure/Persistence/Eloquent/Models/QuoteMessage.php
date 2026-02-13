<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;

/**
 * QuoteMessage Model
 * 
 * Represents messages in the vendor-admin communication thread for quotes.
 * Requirements: 13.1, 13.2, 13.3, 13.6, 13.10
 */
class QuoteMessage extends Model implements TenantAwareModel
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $table = 'quote_messages';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'quote_id',
        'sender_id',
        'message',
        'attachments',
        'sender_type',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'attachments' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Relationships

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function quote(): BelongsTo
    {
        return $this->belongsTo(OrderVendorNegotiation::class, 'quote_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    // Business Methods

    /**
     * Mark this message as read.
     * Requirements: 13.10
     */
    public function markAsRead(): void
    {
        if ($this->is_read) {
            return; // Already read
        }

        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    /**
     * Check if message is from vendor.
     * Requirements: 13.3
     */
    public function isFromVendor(): bool
    {
        return $this->sender_type === 'vendor';
    }

    /**
     * Check if message is from admin.
     * Requirements: 13.3
     */
    public function isFromAdmin(): bool
    {
        return $this->sender_type === 'admin';
    }

    // Scopes

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeForQuote($query, $quoteId)
    {
        return $query->where('quote_id', $quoteId);
    }

    public function scopeFromVendor($query)
    {
        return $query->where('sender_type', 'vendor');
    }

    public function scopeFromAdmin($query)
    {
        return $query->where('sender_type', 'admin');
    }

    // Boot

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
