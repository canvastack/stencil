<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalSettings extends Model implements TenantAwareModel
{
    use HasFactory, BelongsToTenant;

    protected $table = 'customer_quote_approval_settings';

    protected $fillable = [
        'tenant_id',
        'auto_approval_enabled',
        'auto_approval_threshold',
        'require_email_verification',
        'min_successful_orders',
        'min_payment_success_rate',
        'auto_approve_standard_products',
        'require_approval_custom_products',
        'max_negotiation_rounds',
        'allow_customer_counter_offer',
        'notify_admin_on_auto_approve',
        'notify_admin_on_pending_approval',
    ];

    protected $casts = [
        'auto_approval_enabled' => 'boolean',
        'auto_approval_threshold' => 'integer',
        'require_email_verification' => 'boolean',
        'min_successful_orders' => 'integer',
        'min_payment_success_rate' => 'decimal:2',
        'auto_approve_standard_products' => 'boolean',
        'require_approval_custom_products' => 'boolean',
        'max_negotiation_rounds' => 'integer',
        'allow_customer_counter_offer' => 'boolean',
        'notify_admin_on_auto_approve' => 'boolean',
        'notify_admin_on_pending_approval' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relationships
     */

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get default settings for a new tenant
     */
    public static function getDefaults(): array
    {
        return [
            'auto_approval_enabled' => false,
            'auto_approval_threshold' => 5000000, // 5 juta in cents
            'require_email_verification' => true,
            'min_successful_orders' => 1,
            'min_payment_success_rate' => 90.00,
            'auto_approve_standard_products' => true,
            'require_approval_custom_products' => true,
            'max_negotiation_rounds' => 3,
            'allow_customer_counter_offer' => true,
            'notify_admin_on_auto_approve' => true,
            'notify_admin_on_pending_approval' => true,
        ];
    }

    /**
     * Get or create settings for a tenant
     */
    public static function getForTenant(int $tenantId): self
    {
        return static::firstOrCreate(
            ['tenant_id' => $tenantId],
            static::getDefaults()
        );
    }
}
