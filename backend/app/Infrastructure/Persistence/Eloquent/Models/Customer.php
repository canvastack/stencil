<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;

class Customer extends Authenticatable implements TenantAwareModel
{
    use HasFactory, SoftDeletes, Notifiable, HasApiTokens, BelongsToTenant;

    protected $table = 'customers';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'first_name',
        'last_name',
        'name', // ✅ EXISTS (added in phase3)
        'email',
        'phone',
        'company_name',
        'company', // ✅ EXISTS (added in phase3)
        'customer_type', // ✅ EXISTS (renamed from type in phase3)
        'status',
        'address',
        'city', // ✅ EXISTS (added in phase3)
        'province', // ✅ EXISTS (added in phase3)
        'postal_code', // ✅ EXISTS (added in phase3)
        'location', // ✅ EXISTS (added in phase3)
        'tags',
        'notes', // ✅ EXISTS (added in phase3)
        'tax_id', // ✅ EXISTS (added in phase3)
        'business_license', // ✅ EXISTS (added in phase3)
        'total_orders', // ✅ EXISTS (added in phase3)
        'total_spent', // ✅ EXISTS (added in phase3)
        'last_order_at',
        'last_order_date', // ✅ EXISTS (added in phase3)
        'metadata',
        'notification_preferences',
        // Authentication fields (customer-quote-workflow)
        'account_type',
        'password_hash',
        'email_verified_at',
        'registration_token',
        'last_login_at',
        'login_count',
        'failed_login_attempts',
        'locked_until',
    ];

    protected $casts = [
        'location' => 'json', // ✅ EXISTS (added in phase3)
        'tags' => 'json',
        'metadata' => 'json',
        'notification_preferences' => 'json',
        'total_orders' => 'integer', // ✅ EXISTS (added in phase3)
        'total_spent' => 'integer', // ✅ EXISTS (added in phase3)
        'last_order_date' => 'datetime', // ✅ EXISTS (added in phase3)
        'last_order_at' => 'datetime',
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'locked_until' => 'datetime',
        'login_count' => 'integer',
        'failed_login_attempts' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = [
        'last_order_date', // ✅ EXISTS (added in phase3)
        'last_order_at',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(OrderPaymentTransaction::class);
    }

    public function incomingPayments(): HasMany
    {
        return $this->paymentTransactions()->where('direction', 'incoming');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('customer_type', $type); // ✅ CORRECT: customer_type (after phase3 rename)
    }

    /**
     * Scope: Get registered customers (not guests)
     */
    public function scopeRegistered($query)
    {
        return $query->whereIn('account_type', ['registered', 'verified']);
    }

    /**
     * Scope: Get verified customers
     */
    public function scopeVerified($query)
    {
        return $query->where('account_type', 'verified')
            ->whereNotNull('email_verified_at');
    }

    /**
     * Scope: Get guest customers
     */
    public function scopeGuests($query)
    {
        return $query->where('account_type', 'guest');
    }

    public function updateOrderStats()
    {
        $this->total_orders = $this->orders()->count(); // ✅ EXISTS (added in phase3)
        $this->total_spent = $this->orders()->sum('total_paid_amount'); // ✅ EXISTS (added in phase3)
        $this->last_order_date = $this->orders()->latest()->first()?->created_at; // ✅ EXISTS (added in phase3)
        $this->last_order_at = $this->orders()->latest()->first()?->created_at;
        $this->save();
    }

    /**
     * Check if customer is registered (not a guest)
     */
    public function isRegistered(): bool
    {
        return in_array($this->account_type, ['registered', 'verified']);
    }

    /**
     * Check if customer email is verified
     */
    public function isVerified(): bool
    {
        return $this->account_type === 'verified' && !is_null($this->email_verified_at);
    }

    /**
     * Check if customer can login
     */
    public function canLogin(): bool
    {
        // Cannot login if account is locked
        if ($this->locked_until && $this->locked_until->isFuture()) {
            return false;
        }

        // Must be registered or verified to login
        return $this->isRegistered() && !is_null($this->password_hash);
    }

    /**
     * Get successful orders count
     */
    public function getSuccessfulOrdersCount(): int
    {
        return $this->orders()
            ->whereIn('status', ['completed', 'delivered'])
            ->count();
    }

    /**
     * Get payment success rate (0-100)
     */
    public function getPaymentSuccessRate(): float
    {
        $totalOrders = $this->orders()->count();
        
        if ($totalOrders === 0) {
            return 0.0;
        }

        $paidOrders = $this->orders()
            ->where('payment_status', 'paid')
            ->count();

        return ($paidOrders / $totalOrders) * 100;
    }

    /**
     * Calculate customer trust score (0-100)
     */
    public function calculateTrustScore(): float
    {
        $score = 0;

        // Email verified: +20 points
        if ($this->isVerified()) {
            $score += 20;
        }

        // Successful orders: +5 points each (max 40)
        $successfulOrders = $this->getSuccessfulOrdersCount();
        $score += min($successfulOrders * 5, 40);

        // Payment success rate: up to 40 points
        $paymentSuccessRate = $this->getPaymentSuccessRate();
        $score += ($paymentSuccessRate / 100) * 40;

        return min($score, 100);
    }

    /**
     * Get the entity's notifications.
     */
    public function notifications()
    {
        return $this->morphMany(\App\Models\DatabaseNotification::class, 'notifiable')
                    ->orderBy('created_at', 'desc');
    }

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
