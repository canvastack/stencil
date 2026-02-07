<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;

/**
 * QuoteMessage Eloquent Model
 * 
 * Represents a message in a quote communication thread.
 * Maps to quote_messages table in the database.
 * 
 * Relationships:
 * - Belongs to Tenant (multi-tenant isolation)
 * - Belongs to OrderVendorNegotiation (quote)
 * - Belongs to User (sender)
 * 
 * Features:
 * - UUID for public identification
 * - JSONB attachments storage
 * - Read tracking with timestamp
 * - Tenant scoping
 */
class QuoteMessage extends Model
{
    use HasFactory, BelongsToTenant;

    protected $table = 'quote_messages';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'quote_id',
        'sender_id',
        'message',
        'attachments',
        'read_at',
    ];

    protected $casts = [
        'attachments' => 'array',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $dates = [
        'read_at',
        'created_at',
        'updated_at',
    ];

    /**
     * Get the quote (order_vendor_negotiation) this message belongs to
     */
    public function quote(): BelongsTo
    {
        return $this->belongsTo(OrderVendorNegotiation::class, 'quote_id');
    }

    /**
     * Get the user who sent this message
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Get the tenant this message belongs to
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Boot method to auto-generate UUID
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = \Ramsey\Uuid\Uuid::uuid4()->toString();
            }
        });
    }

    /**
     * Scope to filter unread messages
     */
    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    /**
     * Scope to filter read messages
     */
    public function scopeRead($query)
    {
        return $query->whereNotNull('read_at');
    }

    /**
     * Scope to filter by quote
     */
    public function scopeForQuote($query, int $quoteId)
    {
        return $query->where('quote_id', $quoteId);
    }

    /**
     * Scope to filter by sender
     */
    public function scopeBySender($query, int $senderId)
    {
        return $query->where('sender_id', $senderId);
    }

    /**
     * Check if message is read
     */
    public function isRead(): bool
    {
        return $this->read_at !== null;
    }

    /**
     * Check if message has attachments
     */
    public function hasAttachments(): bool
    {
        return !empty($this->attachments);
    }

    /**
     * Get attachment count
     */
    public function getAttachmentCount(): int
    {
        return count($this->attachments ?? []);
    }
}
