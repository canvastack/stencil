<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;

class InsuranceFundTransaction extends Model implements TenantAwareModel
{
    use HasFactory, BelongsToTenant;

    protected $table = 'insurance_fund_transactions';

    protected $fillable = [
        'tenant_id',
        'order_id',
        'refund_request_id',
        'transaction_type',
        'amount',
        'description',
        'balance_before',
        'balance_after',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    // Relationships

    /**
     * Get the order this transaction relates to.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the refund request this transaction relates to.
     */
    public function refundRequest(): BelongsTo
    {
        return $this->belongsTo(RefundRequest::class, 'refund_request_id');
    }

    // Scopes

    /**
     * Scope contributions.
     */
    public function scopeContributions($query)
    {
        return $query->where('transaction_type', 'contribution');
    }

    /**
     * Scope withdrawals.
     */
    public function scopeWithdrawals($query)
    {
        return $query->where('transaction_type', 'withdrawal');
    }

    /**
     * Scope by tenant.
     */
    public function scopeForTenant(\Illuminate\Database\Eloquent\Builder $query, \Spatie\Multitenancy\Models\Tenant|string $tenant): \Illuminate\Database\Eloquent\Builder
    {
        $tenantId = is_string($tenant) ? $tenant : $tenant->id;
        return $query->where('tenant_id', $tenantId);
    }

    // Accessors

    /**
     * Check if this is a contribution.
     */
    public function isContribution(): bool
    {
        return $this->transaction_type === 'contribution';
    }

    /**
     * Check if this is a withdrawal.
     */
    public function isWithdrawal(): bool
    {
        return $this->transaction_type === 'withdrawal';
    }

    /**
     * Get formatted amount.
     */
    public function getFormattedAmountAttribute(): string
    {
        return 'IDR ' . number_format($this->amount, 0, ',', '.');
    }

    /**
     * Get transaction impact.
     */
    public function getImpact(): string
    {
        return $this->isContribution() ? '+' . $this->getFormattedAmountAttribute() : '-' . $this->getFormattedAmountAttribute();
    }
}