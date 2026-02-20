<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrderDocument extends Model implements TenantAwareModel
{
    use HasFactory, BelongsToTenant, SoftDeletes;

    protected $table = 'order_documents';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'order_id',
        'document_type',
        'document_number',
        'document_date',
        'customer_quote_id',
        'vendor_quote_id',
        'payment_id',
        'title',
        'description',
        'file_url',
        'file_size',
        'file_type',
        'version',
        'parent_document_id',
        'is_latest_version',
        'status',
        'generated_at',
        'sent_at',
        'acknowledged_at',
        'completed_at',
        'generated_by',
        'sent_by',
        'acknowledged_by',
        'recipient_type',
        'recipient_id',
        'recipient_email',
        'metadata',
        'access_log',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'version' => 'integer',
        'is_latest_version' => 'boolean',
        'metadata' => 'json',
        'access_log' => 'json',
        'document_date' => 'date',
        'generated_at' => 'datetime',
        'sent_at' => 'datetime',
        'acknowledged_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Relationships
     */

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function customerQuote(): BelongsTo
    {
        return $this->belongsTo(CustomerQuote::class);
    }

    public function vendorQuote(): BelongsTo
    {
        return $this->belongsTo(VendorQuote::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(OrderPaymentTransaction::class, 'payment_id');
    }

    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function sentBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sent_by');
    }

    public function acknowledgedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acknowledged_by');
    }

    public function parentDocument(): BelongsTo
    {
        return $this->belongsTo(OrderDocument::class, 'parent_document_id');
    }

    public function childDocuments(): HasMany
    {
        return $this->hasMany(OrderDocument::class, 'parent_document_id');
    }

    /**
     * Scopes
     */

    public function scopeByType($query, string $type)
    {
        return $query->where('document_type', $type);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeLatestVersion($query)
    {
        return $query->where('is_latest_version', true);
    }

    public function scopeForRecipient($query, string $recipientType, int $recipientId)
    {
        return $query->where('recipient_type', $recipientType)
            ->where('recipient_id', $recipientId);
    }

    /**
     * Attributes/Accessors
     */

    /**
     * Check if document has been sent
     */
    public function isSent(): bool
    {
        return !is_null($this->sent_at);
    }

    /**
     * Check if document has been acknowledged
     */
    public function isAcknowledged(): bool
    {
        return !is_null($this->acknowledged_at);
    }

    /**
     * Check if document is completed
     */
    public function isCompleted(): bool
    {
        return !is_null($this->completed_at);
    }

    /**
     * Log document access
     */
    public function logAccess(int $userId, string $action, ?string $ipAddress = null): void
    {
        $accessLog = $this->access_log ?? [];
        $accessLog[] = [
            'accessed_by' => $userId,
            'accessed_at' => now()->toIso8601String(),
            'action' => $action, // 'view', 'download', 'email'
            'ip_address' => $ipAddress ?? request()->ip(),
        ];
        $this->access_log = $accessLog;
        $this->save();
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * Boot method for model events
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            // UUID is auto-generated by database, don't override
            // if (empty($model->uuid)) {
            //     $model->uuid = \Ramsey\Uuid\Uuid::uuid4()->toString();
            // }

            // Initialize metadata and access_log as empty objects/arrays if not set
            // Use null coalescing to avoid overwriting existing values
            $model->metadata = $model->metadata ?? [];
            $model->access_log = $model->access_log ?? [];

            // Set generated_at if not set
            if (empty($model->generated_at)) {
                $model->generated_at = now();
            }
        });
    }
}
