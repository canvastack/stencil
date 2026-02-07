<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;

class Customer extends Authenticatable implements TenantAwareModel
{
    use HasFactory, SoftDeletes, Notifiable, BelongsToTenant;

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

    public function updateOrderStats()
    {
        $this->total_orders = $this->orders()->count(); // ✅ EXISTS (added in phase3)
        $this->total_spent = $this->orders()->sum('total_paid_amount'); // ✅ EXISTS (added in phase3)
        $this->last_order_date = $this->orders()->latest()->first()?->created_at; // ✅ EXISTS (added in phase3)
        $this->last_order_at = $this->orders()->latest()->first()?->created_at;
        $this->save();
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
