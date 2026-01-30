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
        'name',
        'email',
        'phone',
        'company_name',
        'company',
        'customer_type',
        'status',
        'address',
        'city',
        'province',
        'postal_code',
        'location',
        'tags',
        'notes',
        'tax_id',
        'business_license',
        'total_orders',
        'total_spent',
        'last_order_at',
        'last_order_date',
        'metadata',
        'notification_preferences',
    ];

    protected $casts = [
        'location' => 'json',
        'tags' => 'json',
        'metadata' => 'json',
        'notification_preferences' => 'json',
        'total_orders' => 'integer',
        'total_spent' => 'integer',
        'last_order_date' => 'datetime',
        'last_order_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = [
        'last_order_date',
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
        return $query->where('customer_type', $type);
    }

    public function updateOrderStats()
    {
        $this->total_orders = $this->orders()->count();
        $this->total_spent = $this->orders()->sum('total_paid_amount');
        $this->last_order_date = $this->orders()->latest()->first()?->created_at;
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
