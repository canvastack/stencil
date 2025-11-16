# Phase 6: Platform Management (Account A Features)
**Duration**: 4 Weeks (Weeks 21-24)  
**Priority**: MEDIUM  
**Prerequisites**: Phase 1-5 (Complete multi-tenant foundation with all business features)

## 🎯 Phase Overview

This phase implements Account A (Platform Owner) specific features for managing the entire multi-tenant platform. These features provide B2B2C capabilities, enabling platform owners to onboard, manage, and monitor multiple tenant businesses while maintaining strict data isolation and forbidden access to tenant internal operations.

### Key Deliverables
- **Tenant Management & Provisioning** with automated onboarding
- **Platform-Level Analytics** with cross-tenant insights
- **Billing & Subscription Management** with multiple pricing tiers
- **Tenant Health Monitoring** with performance metrics
- **Platform Administration** with global settings
- **Resource Management** with usage quotas and limits

## 📋 Week-by-Week Breakdown

### Week 21: Tenant Provisioning & Management System

#### Day 1-2: Platform Models & Tenant Management
```php
// File: database/migrations/create_tenant_plans_table.php
Schema::create('tenant_plans', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('slug')->unique();
    $table->text('description')->nullable();
    $table->decimal('monthly_price', 10, 2);
    $table->decimal('yearly_price', 10, 2);
    $table->json('features'); // Available features
    $table->json('limits'); // Usage limits (users, products, orders, storage)
    $table->boolean('is_popular')->default(false);
    $table->boolean('is_active')->default(true);
    $table->integer('sort_order')->default(0);
    $table->timestamps();
});

// File: database/migrations/create_tenant_subscriptions_table.php
Schema::create('tenant_subscriptions', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->unsignedBigInteger('plan_id');
    $table->enum('billing_cycle', ['monthly', 'yearly']);
    $table->enum('status', ['active', 'cancelled', 'suspended', 'expired'])->default('active');
    $table->decimal('amount', 10, 2);
    $table->datetime('started_at');
    $table->datetime('expires_at');
    $table->datetime('cancelled_at')->nullable();
    $table->text('cancellation_reason')->nullable();
    $table->json('plan_features'); // Snapshot of features at subscription time
    $table->json('plan_limits'); // Snapshot of limits at subscription time
    $table->timestamps();
    
    $table->foreign('tenant_id')->references('id')->on('tenants');
    $table->foreign('plan_id')->references('id')->on('tenant_plans');
    $table->index(['tenant_id', 'status']);
});

// File: database/migrations/create_tenant_usage_metrics_table.php
Schema::create('tenant_usage_metrics', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->date('date');
    $table->integer('users_count')->default(0);
    $table->integer('products_count')->default(0);
    $table->integer('orders_count')->default(0);
    $table->integer('customers_count')->default(0);
    $table->bigInteger('storage_used_bytes')->default(0); // In bytes
    $table->integer('api_requests_count')->default(0);
    $table->integer('active_sessions')->default(0);
    $table->decimal('monthly_revenue', 15, 2)->default(0);
    $table->json('additional_metrics')->nullable(); // Custom metrics per tenant
    $table->timestamps();
    
    $table->foreign('tenant_id')->references('id')->on('tenants');
    $table->unique(['tenant_id', 'date']);
});

// File: database/migrations/add_platform_fields_to_tenants_table.php
Schema::table('tenants', function (Blueprint $table) {
    $table->string('business_name')->after('name');
    $table->string('business_type')->nullable()->after('business_name'); // B2B, B2C, Manufacturing, etc.
    $table->string('contact_person')->after('business_type');
    $table->string('contact_email')->after('contact_person');
    $table->string('contact_phone')->nullable()->after('contact_email');
    $table->text('business_address')->nullable()->after('contact_phone');
    $table->string('website_url')->nullable()->after('business_address');
    $table->enum('status', ['active', 'inactive', 'suspended', 'terminated'])->default('active')->after('website_url');
    $table->datetime('activated_at')->nullable()->after('status');
    $table->datetime('suspended_at')->nullable()->after('activated_at');
    $table->text('suspension_reason')->nullable()->after('suspended_at');
    $table->json('onboarding_progress')->nullable()->after('suspension_reason'); // Track onboarding steps
    $table->boolean('onboarding_completed')->default(false)->after('onboarding_progress');
    $table->datetime('trial_ends_at')->nullable()->after('onboarding_completed');
    $table->json('platform_settings')->nullable()->after('trial_ends_at'); // Platform-specific settings
});
```

#### Day 3-4: Platform Management Models
```php
// File: app/Models/TenantPlan.php
class TenantPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'slug', 'description', 'monthly_price', 'yearly_price',
        'features', 'limits', 'is_popular', 'is_active', 'sort_order'
    ];

    protected $casts = [
        'features' => 'array',
        'limits' => 'array',
        'monthly_price' => 'decimal:2',
        'yearly_price' => 'decimal:2',
        'is_popular' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(TenantSubscription::class, 'plan_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function getYearlySavingsAttribute(): float
    {
        $monthlyYearly = $this->monthly_price * 12;
        return $monthlyYearly - $this->yearly_price;
    }

    public function hasFeature(string $feature): bool
    {
        return in_array($feature, $this->features ?? []);
    }

    public function getLimit(string $limitType): ?int
    {
        return $this->limits[$limitType] ?? null;
    }
}

// File: app/Models/TenantSubscription.php  
class TenantSubscription extends Model
{
    protected $fillable = [
        'tenant_id', 'plan_id', 'billing_cycle', 'status', 'amount',
        'started_at', 'expires_at', 'cancelled_at', 'cancellation_reason',
        'plan_features', 'plan_limits'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'started_at' => 'datetime',
        'expires_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'plan_features' => 'array',
        'plan_limits' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(TenantPlan::class, 'plan_id');
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && $this->expires_at > now();
    }

    public function isExpired(): bool
    {
        return $this->expires_at < now();
    }

    public function cancel(string $reason = null): void
    {
        $this->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => $reason,
        ]);

        // Dispatch cancellation events
        TenantSubscriptionCancelledEvent::dispatch($this);
    }

    public function renew(string $billingCycle = null): self
    {
        $billingCycle = $billingCycle ?? $this->billing_cycle;
        $price = $billingCycle === 'yearly' ? $this->plan->yearly_price : $this->plan->monthly_price;
        $duration = $billingCycle === 'yearly' ? '+1 year' : '+1 month';

        return static::create([
            'tenant_id' => $this->tenant_id,
            'plan_id' => $this->plan_id,
            'billing_cycle' => $billingCycle,
            'status' => 'active',
            'amount' => $price,
            'started_at' => $this->expires_at,
            'expires_at' => $this->expires_at->modify($duration),
            'plan_features' => $this->plan->features,
            'plan_limits' => $this->plan->limits,
        ]);
    }
}

// File: app/Models/TenantUsageMetrics.php
class TenantUsageMetrics extends Model
{
    protected $fillable = [
        'tenant_id', 'date', 'users_count', 'products_count', 'orders_count',
        'customers_count', 'storage_used_bytes', 'api_requests_count',
        'active_sessions', 'monthly_revenue', 'additional_metrics'
    ];

    protected $casts = [
        'date' => 'date',
        'monthly_revenue' => 'decimal:2',
        'additional_metrics' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function getStorageUsedFormattedAttribute(): string
    {
        return $this->formatBytes($this->storage_used_bytes);
    }

    private function formatBytes(int $size): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $power = floor(log($size, 1024));
        return round($size / pow(1024, $power), 2) . ' ' . $units[$power];
    }

    public static function recordDaily(string $tenantId): void
    {
        tenancy()->initialize(Tenant::find($tenantId));

        $metrics = [
            'tenant_id' => $tenantId,
            'date' => today(),
            'users_count' => User::count(),
            'products_count' => Product::count(),
            'orders_count' => Order::count(),
            'customers_count' => Customer::count(),
            'storage_used_bytes' => MediaFile::sum('file_size'),
            'api_requests_count' => AnalyticsEvent::whereDate('created_at', today())->count(),
            'monthly_revenue' => Order::whereMonth('created_at', today()->month)->sum('total_amount'),
        ];

        static::updateOrCreate(
            ['tenant_id' => $tenantId, 'date' => today()],
            $metrics
        );
    }
}
```

#### Day 5: Platform Administration API
```php
// File: app/Http/Controllers/Platform/PlatformController.php  
namespace App\Http\Controllers\Platform;

class PlatformController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'platform.admin']);
    }

    public function dashboard()
    {
        $stats = [
            'total_tenants' => Tenant::count(),
            'active_tenants' => Tenant::where('status', 'active')->count(),
            'trial_tenants' => Tenant::whereNotNull('trial_ends_at')
                ->where('trial_ends_at', '>', now())->count(),
            'expired_trials' => Tenant::whereNotNull('trial_ends_at')
                ->where('trial_ends_at', '<=', now())->count(),
            'total_revenue' => TenantSubscription::where('status', 'active')->sum('amount'),
            'monthly_revenue' => TenantSubscription::where('status', 'active')
                ->where('billing_cycle', 'monthly')->sum('amount'),
            'yearly_revenue' => TenantSubscription::where('status', 'active')
                ->where('billing_cycle', 'yearly')->sum('amount'),
        ];

        return response()->json($stats);
    }

    public function tenants(Request $request)
    {
        $tenants = Tenant::query()
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->search, fn($q) => $q->where(function($subq) use ($request) {
                $subq->where('name', 'like', "%{$request->search}%")
                     ->orWhere('business_name', 'like', "%{$request->search}%")
                     ->orWhere('contact_email', 'like', "%{$request->search}%");
            }))
            ->with(['subscription.plan', 'latestUsageMetrics'])
            ->latest()
            ->paginate($request->limit ?? 20);

        return PlatformTenantResource::collection($tenants);
    }

    public function createTenant(CreateTenantRequest $request)
    {
        DB::beginTransaction();
        try {
            // Create tenant
            $tenant = Tenant::create([
                'id' => Str::uuid(),
                'name' => $request->name,
                'business_name' => $request->business_name,
                'business_type' => $request->business_type,
                'contact_person' => $request->contact_person,
                'contact_email' => $request->contact_email,
                'contact_phone' => $request->contact_phone,
                'business_address' => $request->business_address,
                'website_url' => $request->website_url,
                'status' => 'active',
                'activated_at' => now(),
                'trial_ends_at' => $request->trial_days ? now()->addDays($request->trial_days) : null,
                'onboarding_progress' => [
                    'account_created' => true,
                    'plan_selected' => false,
                    'payment_setup' => false,
                    'initial_setup' => false,
                ],
            ]);

            // Initialize tenant database
            tenancy()->initialize($tenant);
            
            // Run tenant-specific migrations and seeders
            Artisan::call('tenants:migrate', ['--tenants' => [$tenant->id]]);
            Artisan::call('tenants:seed', ['--tenants' => [$tenant->id]]);

            // Create subscription if plan is provided
            if ($request->plan_id) {
                $plan = TenantPlan::find($request->plan_id);
                $billingCycle = $request->billing_cycle ?? 'monthly';
                $price = $billingCycle === 'yearly' ? $plan->yearly_price : $plan->monthly_price;
                $duration = $billingCycle === 'yearly' ? '+1 year' : '+1 month';

                TenantSubscription::create([
                    'tenant_id' => $tenant->id,
                    'plan_id' => $plan->id,
                    'billing_cycle' => $billingCycle,
                    'status' => 'active',
                    'amount' => $price,
                    'started_at' => now(),
                    'expires_at' => now()->modify($duration),
                    'plan_features' => $plan->features,
                    'plan_limits' => $plan->limits,
                ]);
            }

            DB::commit();
            
            // Send welcome email to tenant
            TenantWelcomeEmailJob::dispatch($tenant);
            
            return new PlatformTenantResource($tenant->load('subscription.plan'));
            
        } catch (Exception $e) {
            DB::rollback();
            throw $e;
        }
    }

    public function suspendTenant(SuspendTenantRequest $request, Tenant $tenant)
    {
        $tenant->update([
            'status' => 'suspended',
            'suspended_at' => now(),
            'suspension_reason' => $request->reason,
        ]);

        // Notify tenant about suspension
        TenantSuspensionNotification::dispatch($tenant, $request->reason);

        return new PlatformTenantResource($tenant);
    }

    public function reactivateTenant(Tenant $tenant)
    {
        $tenant->update([
            'status' => 'active',
            'suspended_at' => null,
            'suspension_reason' => null,
        ]);

        // Notify tenant about reactivation
        TenantReactivationNotification::dispatch($tenant);

        return new PlatformTenantResource($tenant);
    }
}
```

### Week 22: Billing & Subscription Management

#### Day 1-3: Payment Integration & Billing Logic
```php
// File: database/migrations/create_tenant_invoices_table.php
Schema::create('tenant_invoices', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->unsignedBigInteger('subscription_id');
    $table->string('invoice_number')->unique();
    $table->decimal('subtotal', 10, 2);
    $table->decimal('tax_amount', 10, 2)->default(0);
    $table->decimal('total_amount', 10, 2);
    $table->enum('status', ['pending', 'paid', 'overdue', 'cancelled'])->default('pending');
    $table->datetime('due_date');
    $table->datetime('paid_at')->nullable();
    $table->string('payment_method')->nullable();
    $table->string('payment_reference')->nullable();
    $table->json('line_items'); // Billing details
    $table->text('notes')->nullable();
    $table->timestamps();
    
    $table->foreign('tenant_id')->references('id')->on('tenants');
    $table->foreign('subscription_id')->references('id')->on('tenant_subscriptions');
    $table->index(['tenant_id', 'status']);
    $table->index(['tenant_id', 'due_date']);
});

// File: database/migrations/create_tenant_payments_table.php
Schema::create('tenant_payments', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->unsignedBigInteger('invoice_id');
    $table->string('payment_id')->unique(); // External payment ID (Stripe, Midtrans, etc.)
    $table->decimal('amount', 10, 2);
    $table->string('currency', 3)->default('IDR');
    $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('pending');
    $table->string('payment_method'); // credit_card, bank_transfer, etc.
    $table->string('gateway'); // stripe, midtrans, xendit, etc.
    $table->json('gateway_response')->nullable(); // Store gateway response
    $table->datetime('processed_at')->nullable();
    $table->text('failure_reason')->nullable();
    $table->timestamps();
    
    $table->foreign('tenant_id')->references('id')->on('tenants');
    $table->foreign('invoice_id')->references('id')->on('tenant_invoices');
    $table->index(['tenant_id', 'status']);
});

// File: app/Models/TenantInvoice.php
class TenantInvoice extends Model
{
    protected $fillable = [
        'tenant_id', 'subscription_id', 'invoice_number', 'subtotal', 'tax_amount',
        'total_amount', 'status', 'due_date', 'paid_at', 'payment_method',
        'payment_reference', 'line_items', 'notes'
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'due_date' => 'datetime',
        'paid_at' => 'datetime',
        'line_items' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(TenantSubscription::class, 'subscription_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(TenantPayment::class, 'invoice_id');
    }

    public function isOverdue(): bool
    {
        return $this->status !== 'paid' && $this->due_date < now();
    }

    public function markAsPaid(TenantPayment $payment): void
    {
        $this->update([
            'status' => 'paid',
            'paid_at' => $payment->processed_at,
            'payment_method' => $payment->payment_method,
            'payment_reference' => $payment->payment_id,
        ]);

        // Update subscription if needed
        $this->subscription->handleSuccessfulPayment($payment);
    }

    protected static function booted()
    {
        static::creating(function ($invoice) {
            if (!$invoice->invoice_number) {
                $invoice->invoice_number = static::generateInvoiceNumber();
            }
        });
    }

    public static function generateInvoiceNumber(): string
    {
        $year = now()->year;
        $month = now()->format('m');
        $sequence = static::whereYear('created_at', $year)
            ->whereMonth('created_at', now()->month)
            ->count() + 1;
        
        return sprintf('INV-%s%s-%05d', $year, $month, $sequence);
    }
}

// File: app/Services/BillingService.php
class BillingService
{
    public function __construct(
        private PaymentGatewayInterface $paymentGateway
    ) {}

    public function createInvoice(TenantSubscription $subscription): TenantInvoice
    {
        $plan = $subscription->plan;
        $amount = $subscription->billing_cycle === 'yearly' 
            ? $plan->yearly_price 
            : $plan->monthly_price;
        
        $taxRate = 0.11; // 11% Indonesian VAT
        $subtotal = $amount;
        $taxAmount = $subtotal * $taxRate;
        $totalAmount = $subtotal + $taxAmount;

        return TenantInvoice::create([
            'tenant_id' => $subscription->tenant_id,
            'subscription_id' => $subscription->id,
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total_amount' => $totalAmount,
            'status' => 'pending',
            'due_date' => now()->addDays(14), // 14-day payment terms
            'line_items' => [
                [
                    'description' => $plan->name . ' - ' . ucfirst($subscription->billing_cycle) . ' Subscription',
                    'quantity' => 1,
                    'unit_price' => $amount,
                    'total' => $amount,
                ]
            ],
        ]);
    }

    public function processPayment(TenantInvoice $invoice, array $paymentData): TenantPayment
    {
        $payment = TenantPayment::create([
            'tenant_id' => $invoice->tenant_id,
            'invoice_id' => $invoice->id,
            'amount' => $invoice->total_amount,
            'currency' => 'IDR',
            'status' => 'pending',
            'payment_method' => $paymentData['method'],
            'gateway' => $paymentData['gateway'],
        ]);

        try {
            $gatewayResponse = $this->paymentGateway->processPayment([
                'amount' => $invoice->total_amount,
                'currency' => 'IDR',
                'description' => "Invoice {$invoice->invoice_number}",
                'metadata' => [
                    'tenant_id' => $invoice->tenant_id,
                    'invoice_id' => $invoice->id,
                    'payment_id' => $payment->id,
                ],
                'payment_method' => $paymentData,
            ]);

            $payment->update([
                'payment_id' => $gatewayResponse['payment_id'],
                'gateway_response' => $gatewayResponse,
                'status' => $gatewayResponse['status'] === 'success' ? 'completed' : 'failed',
                'processed_at' => now(),
                'failure_reason' => $gatewayResponse['error'] ?? null,
            ]);

            if ($payment->status === 'completed') {
                $invoice->markAsPaid($payment);
            }

            return $payment;

        } catch (Exception $e) {
            $payment->update([
                'status' => 'failed',
                'failure_reason' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function handleWebhook(array $webhookData): void
    {
        $paymentId = $webhookData['payment_id'];
        $payment = TenantPayment::where('payment_id', $paymentId)->first();

        if (!$payment) {
            Log::warning('Webhook received for unknown payment ID: ' . $paymentId);
            return;
        }

        match($webhookData['status']) {
            'completed' => $this->handleSuccessfulPayment($payment, $webhookData),
            'failed' => $this->handleFailedPayment($payment, $webhookData),
            default => Log::info('Unhandled webhook status: ' . $webhookData['status']),
        };
    }

    private function handleSuccessfulPayment(TenantPayment $payment, array $webhookData): void
    {
        $payment->update([
            'status' => 'completed',
            'processed_at' => now(),
            'gateway_response' => array_merge($payment->gateway_response ?? [], $webhookData),
        ]);

        $payment->invoice->markAsPaid($payment);
        
        // Send payment confirmation
        TenantPaymentConfirmationJob::dispatch($payment);
    }
}
```

#### Day 4-5: Billing API & Management Interface
```php
// File: app/Http/Controllers/Platform/BillingController.php
namespace App\Http\Controllers\Platform;

class BillingController extends Controller
{
    public function __construct(private BillingService $billingService)
    {
        $this->middleware(['auth', 'platform.admin']);
    }

    public function invoices(Request $request)
    {
        $invoices = TenantInvoice::query()
            ->when($request->tenant_id, fn($q) => $q->where('tenant_id', $request->tenant_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->overdue, fn($q) => $q->where('due_date', '<', now())->where('status', '!=', 'paid'))
            ->with(['tenant', 'subscription.plan', 'payments'])
            ->latest()
            ->paginate($request->limit ?? 20);

        return TenantInvoiceResource::collection($invoices);
    }

    public function createInvoice(CreateInvoiceRequest $request)
    {
        $subscription = TenantSubscription::find($request->subscription_id);
        $invoice = $this->billingService->createInvoice($subscription);
        
        return new TenantInvoiceResource($invoice);
    }

    public function processPayment(ProcessPaymentRequest $request, TenantInvoice $invoice)
    {
        $payment = $this->billingService->processPayment($invoice, $request->payment_data);
        
        return new TenantPaymentResource($payment);
    }

    public function billingStats(Request $request)
    {
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : now()->startOfMonth();
        $endDate = $request->end_date ? Carbon::parse($request->end_date) : now()->endOfMonth();

        return [
            'total_revenue' => TenantInvoice::where('status', 'paid')
                ->whereBetween('paid_at', [$startDate, $endDate])
                ->sum('total_amount'),
            'pending_revenue' => TenantInvoice::where('status', 'pending')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->sum('total_amount'),
            'overdue_revenue' => TenantInvoice::where('status', 'overdue')
                ->sum('total_amount'),
            'monthly_recurring_revenue' => TenantSubscription::where('status', 'active')
                ->where('billing_cycle', 'monthly')
                ->sum('amount'),
            'yearly_recurring_revenue' => TenantSubscription::where('status', 'active')
                ->where('billing_cycle', 'yearly')
                ->sum('amount'),
        ];
    }

    public function webhook(Request $request)
    {
        $signature = $request->header('X-Webhook-Signature');
        $payload = $request->getContent();
        
        // Verify webhook signature
        if (!$this->verifyWebhookSignature($signature, $payload)) {
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $webhookData = json_decode($payload, true);
        
        $this->billingService->handleWebhook($webhookData);
        
        return response()->json(['status' => 'processed']);
    }
}
```

### Week 23: Platform-Level Analytics & Monitoring

#### Day 1-3: Cross-Tenant Analytics System
```php
// File: database/migrations/create_platform_analytics_table.php
Schema::create('platform_analytics', function (Blueprint $table) {
    $table->id();
    $table->date('date');
    $table->string('metric_type'); // tenant_signups, churn_rate, revenue, usage, etc.
    $table->json('data'); // Aggregated platform-wide metrics
    $table->timestamps();
    
    $table->unique(['date', 'metric_type']);
});

// File: database/migrations/create_tenant_health_checks_table.php
Schema::create('tenant_health_checks', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->datetime('checked_at');
    $table->json('metrics'); // Performance metrics, errors, usage, etc.
    $table->integer('health_score'); // 0-100 health score
    $table->enum('status', ['healthy', 'warning', 'critical'])->default('healthy');
    $table->json('alerts')->nullable(); // Any alerts or issues detected
    $table->timestamps();
    
    $table->foreign('tenant_id')->references('id')->on('tenants');
    $table->index(['tenant_id', 'checked_at']);
});

// File: app/Services/PlatformAnalyticsService.php
class PlatformAnalyticsService
{
    public function getDashboardMetrics(Carbon $startDate, Carbon $endDate): array
    {
        return [
            'tenant_metrics' => $this->getTenantMetrics($startDate, $endDate),
            'revenue_metrics' => $this->getRevenueMetrics($startDate, $endDate),
            'usage_metrics' => $this->getUsageMetrics($startDate, $endDate),
            'health_metrics' => $this->getHealthMetrics(),
            'growth_metrics' => $this->getGrowthMetrics($startDate, $endDate),
        ];
    }

    private function getTenantMetrics(Carbon $startDate, Carbon $endDate): array
    {
        $totalTenants = Tenant::count();
        $activeTenants = Tenant::where('status', 'active')->count();
        $newTenants = Tenant::whereBetween('created_at', [$startDate, $endDate])->count();
        $churnedTenants = Tenant::where('status', 'terminated')
            ->whereBetween('updated_at', [$startDate, $endDate])->count();

        return [
            'total_tenants' => $totalTenants,
            'active_tenants' => $activeTenants,
            'new_tenants' => $newTenants,
            'churned_tenants' => $churnedTenants,
            'churn_rate' => $totalTenants > 0 ? ($churnedTenants / $totalTenants) * 100 : 0,
            'growth_rate' => $totalTenants > 0 ? ($newTenants / $totalTenants) * 100 : 0,
        ];
    }

    private function getRevenueMetrics(Carbon $startDate, Carbon $endDate): array
    {
        $totalRevenue = TenantInvoice::where('status', 'paid')
            ->whereBetween('paid_at', [$startDate, $endDate])
            ->sum('total_amount');

        $mrr = TenantSubscription::where('status', 'active')
            ->where('billing_cycle', 'monthly')
            ->sum('amount');

        $arr = TenantSubscription::where('status', 'active')
            ->sum(DB::raw('CASE 
                WHEN billing_cycle = "yearly" THEN amount 
                ELSE amount * 12 
            END'));

        $averageRevenuePerTenant = $totalRevenue > 0 && Tenant::where('status', 'active')->count() > 0
            ? $totalRevenue / Tenant::where('status', 'active')->count()
            : 0;

        return [
            'total_revenue' => $totalRevenue,
            'monthly_recurring_revenue' => $mrr,
            'annual_recurring_revenue' => $arr,
            'average_revenue_per_tenant' => $averageRevenuePerTenant,
        ];
    }

    private function getUsageMetrics(): array
    {
        $latestMetrics = TenantUsageMetrics::whereDate('date', today())
            ->get();

        return [
            'total_users' => $latestMetrics->sum('users_count'),
            'total_products' => $latestMetrics->sum('products_count'),
            'total_orders' => $latestMetrics->sum('orders_count'),
            'total_customers' => $latestMetrics->sum('customers_count'),
            'total_storage_used' => $latestMetrics->sum('storage_used_bytes'),
            'total_api_requests' => $latestMetrics->sum('api_requests_count'),
        ];
    }

    public function generateTenantHealthReport(Tenant $tenant): array
    {
        tenancy()->initialize($tenant);

        $metrics = [
            'database_health' => $this->checkDatabaseHealth(),
            'performance_metrics' => $this->getPerformanceMetrics(),
            'usage_metrics' => $this->getCurrentUsageMetrics(),
            'error_metrics' => $this->getErrorMetrics(),
            'security_metrics' => $this->getSecurityMetrics(),
        ];

        $healthScore = $this->calculateHealthScore($metrics);
        $status = $this->determineHealthStatus($healthScore);
        $alerts = $this->generateHealthAlerts($metrics);

        TenantHealthCheck::create([
            'tenant_id' => $tenant->id,
            'checked_at' => now(),
            'metrics' => $metrics,
            'health_score' => $healthScore,
            'status' => $status,
            'alerts' => $alerts,
        ]);

        return [
            'tenant' => $tenant,
            'health_score' => $healthScore,
            'status' => $status,
            'metrics' => $metrics,
            'alerts' => $alerts,
        ];
    }

    private function calculateHealthScore(array $metrics): int
    {
        $score = 100;
        
        // Deduct points based on issues
        if ($metrics['database_health']['slow_queries'] > 5) $score -= 10;
        if ($metrics['performance_metrics']['avg_response_time'] > 500) $score -= 15;
        if ($metrics['error_metrics']['error_rate'] > 5) $score -= 20;
        if ($metrics['security_metrics']['failed_logins'] > 10) $score -= 5;
        
        return max(0, $score);
    }

    private function determineHealthStatus(int $healthScore): string
    {
        return match(true) {
            $healthScore >= 80 => 'healthy',
            $healthScore >= 60 => 'warning',
            default => 'critical',
        };
    }
}
```

#### Day 4-5: Monitoring Dashboard & Alerts
```php
// File: app/Http/Controllers/Platform/MonitoringController.php
namespace App\Http\Controllers\Platform;

class MonitoringController extends Controller
{
    public function __construct(private PlatformAnalyticsService $analyticsService)
    {
        $this->middleware(['auth', 'platform.admin']);
    }

    public function dashboard(Request $request)
    {
        $startDate = Carbon::parse($request->start_date ?? now()->subDays(30));
        $endDate = Carbon::parse($request->end_date ?? now());

        $metrics = $this->analyticsService->getDashboardMetrics($startDate, $endDate);

        return response()->json($metrics);
    }

    public function tenantHealth(Request $request)
    {
        $healthChecks = TenantHealthCheck::query()
            ->with('tenant')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->tenant_id, fn($q) => $q->where('tenant_id', $request->tenant_id))
            ->latest('checked_at')
            ->paginate($request->limit ?? 20);

        return TenantHealthCheckResource::collection($healthChecks);
    }

    public function runHealthCheck(Tenant $tenant)
    {
        $report = $this->analyticsService->generateTenantHealthReport($tenant);
        
        // Send alert if health is critical
        if ($report['status'] === 'critical') {
            TenantHealthAlertJob::dispatch($tenant, $report);
        }

        return response()->json($report);
    }

    public function runAllHealthChecks()
    {
        $tenants = Tenant::where('status', 'active')->get();
        
        foreach ($tenants as $tenant) {
            RunTenantHealthCheckJob::dispatch($tenant);
        }

        return response()->json([
            'message' => 'Health checks queued for all active tenants',
            'tenant_count' => $tenants->count(),
        ]);
    }

    public function usageReport(Request $request)
    {
        $startDate = Carbon::parse($request->start_date ?? now()->subDays(30));
        $endDate = Carbon::parse($request->end_date ?? now());
        
        $usage = TenantUsageMetrics::whereBetween('date', [$startDate, $endDate])
            ->with('tenant')
            ->get()
            ->groupBy('tenant_id')
            ->map(function ($tenantMetrics) {
                $tenant = $tenantMetrics->first()->tenant;
                return [
                    'tenant' => [
                        'id' => $tenant->id,
                        'name' => $tenant->name,
                        'business_name' => $tenant->business_name,
                    ],
                    'total_orders' => $tenantMetrics->sum('orders_count'),
                    'total_revenue' => $tenantMetrics->sum('monthly_revenue'),
                    'avg_users' => $tenantMetrics->avg('users_count'),
                    'storage_used' => $tenantMetrics->last()->storage_used_bytes,
                    'api_requests' => $tenantMetrics->sum('api_requests_count'),
                ];
            })->values();

        return response()->json($usage);
    }
}
```

### Week 24: Resource Management & Platform Settings

#### Day 1-3: Resource Quotas & Limits
```php
// File: database/migrations/create_tenant_resource_usage_table.php
Schema::create('tenant_resource_usage', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->string('resource_type'); // users, storage, api_requests, etc.
    $table->bigInteger('current_usage');
    $table->bigInteger('quota_limit');
    $table->decimal('usage_percentage', 5, 2); // Percentage of quota used
    $table->datetime('last_reset_at')->nullable(); // For resources that reset (like monthly API calls)
    $table->json('usage_history')->nullable(); // Historical usage data
    $table->timestamps();
    
    $table->foreign('tenant_id')->references('id')->on('tenants');
    $table->unique(['tenant_id', 'resource_type']);
});

// File: app/Services/ResourceManagementService.php
class ResourceManagementService
{
    public function checkQuota(string $tenantId, string $resourceType, int $requestedAmount = 1): bool
    {
        $usage = TenantResourceUsage::where('tenant_id', $tenantId)
            ->where('resource_type', $resourceType)
            ->first();

        if (!$usage) {
            $this->initializeResourceUsage($tenantId, $resourceType);
            return true;
        }

        return ($usage->current_usage + $requestedAmount) <= $usage->quota_limit;
    }

    public function consumeResource(string $tenantId, string $resourceType, int $amount = 1): void
    {
        if (!$this->checkQuota($tenantId, $resourceType, $amount)) {
            throw new QuotaExceededException("Quota exceeded for {$resourceType}");
        }

        $usage = TenantResourceUsage::where('tenant_id', $tenantId)
            ->where('resource_type', $resourceType)
            ->first();

        $usage->increment('current_usage', $amount);
        $usage->update([
            'usage_percentage' => ($usage->current_usage / $usage->quota_limit) * 100
        ]);

        // Send warning if approaching limit
        if ($usage->usage_percentage >= 80) {
            QuotaWarningJob::dispatch($usage);
        }
    }

    public function updateQuota(string $tenantId, string $resourceType, int $newLimit): void
    {
        TenantResourceUsage::updateOrCreate(
            ['tenant_id' => $tenantId, 'resource_type' => $resourceType],
            [
                'quota_limit' => $newLimit,
                'usage_percentage' => function($usage) use ($newLimit) {
                    return ($usage->current_usage / $newLimit) * 100;
                }
            ]
        );
    }

    public function resetMonthlyQuotas(): void
    {
        $monthlyResources = ['api_requests', 'email_sends', 'sms_sends'];
        
        TenantResourceUsage::whereIn('resource_type', $monthlyResources)
            ->update([
                'current_usage' => 0,
                'usage_percentage' => 0,
                'last_reset_at' => now(),
            ]);
    }

    private function initializeResourceUsage(string $tenantId, string $resourceType): void
    {
        $tenant = Tenant::find($tenantId);
        $subscription = $tenant->subscription;
        $limits = $subscription ? $subscription->plan_limits : $this->getDefaultLimits();

        TenantResourceUsage::create([
            'tenant_id' => $tenantId,
            'resource_type' => $resourceType,
            'current_usage' => 0,
            'quota_limit' => $limits[$resourceType] ?? 1000,
            'usage_percentage' => 0,
        ]);
    }
}

// File: app/Http/Middleware/CheckResourceQuota.php
class CheckResourceQuota
{
    public function __construct(private ResourceManagementService $resourceService) {}

    public function handle(Request $request, Closure $next, string $resourceType = 'api_requests')
    {
        $tenantId = tenant()->id;
        
        if (!$this->resourceService->checkQuota($tenantId, $resourceType)) {
            return response()->json([
                'error' => 'Resource quota exceeded',
                'resource_type' => $resourceType,
                'message' => "You have exceeded your {$resourceType} quota for this billing period."
            ], 429);
        }

        // Consume resource after successful request
        $response = $next($request);
        
        if ($response->getStatusCode() < 400) {
            $this->resourceService->consumeResource($tenantId, $resourceType);
        }

        return $response;
    }
}
```

#### Day 4-5: Platform Settings & Configuration
```php
// File: database/migrations/create_platform_settings_table.php
Schema::create('platform_settings', function (Blueprint $table) {
    $table->id();
    $table->string('key')->unique();
    $table->text('value');
    $table->string('type')->default('string'); // string, json, boolean, integer
    $table->text('description')->nullable();
    $table->string('category')->default('general');
    $table->boolean('is_public')->default(false); // Can be accessed by tenants
    $table->timestamps();
    
    $table->index(['category', 'key']);
});

// File: app/Services/PlatformSettingsService.php
class PlatformSettingsService
{
    private array $cache = [];

    public function get(string $key, $default = null)
    {
        if (!isset($this->cache[$key])) {
            $setting = PlatformSetting::where('key', $key)->first();
            $this->cache[$key] = $setting ? $this->castValue($setting->value, $setting->type) : $default;
        }

        return $this->cache[$key];
    }

    public function set(string $key, $value, string $type = 'string', string $description = null, string $category = 'general'): void
    {
        $castValue = $this->preparValue($value, $type);
        
        PlatformSetting::updateOrCreate(['key' => $key], [
            'value' => $castValue,
            'type' => $type,
            'description' => $description,
            'category' => $category,
        ]);

        $this->cache[$key] = $value;
    }

    public function getPublicSettings(): array
    {
        return PlatformSetting::where('is_public', true)
            ->get()
            ->mapWithKeys(function ($setting) {
                return [$setting->key => $this->castValue($setting->value, $setting->type)];
            })
            ->toArray();
    }

    private function castValue(string $value, string $type)
    {
        return match($type) {
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $value,
            'json' => json_decode($value, true),
            default => $value,
        };
    }

    private function preparValue($value, string $type): string
    {
        return match($type) {
            'boolean' => $value ? '1' : '0',
            'integer' => (string) $value,
            'json' => json_encode($value),
            default => (string) $value,
        };
    }
}

// File: app/Http/Controllers/Platform/SettingsController.php
class SettingsController extends Controller
{
    public function __construct(private PlatformSettingsService $settingsService)
    {
        $this->middleware(['auth', 'platform.admin']);
    }

    public function index(Request $request)
    {
        $settings = PlatformSetting::query()
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->orderBy('category')
            ->orderBy('key')
            ->get();

        return PlatformSettingResource::collection($settings);
    }

    public function update(UpdateSettingsRequest $request)
    {
        foreach ($request->settings as $key => $value) {
            $this->settingsService->set($key, $value);
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }

    public function categories()
    {
        $categories = PlatformSetting::distinct('category')->pluck('category');
        return response()->json($categories);
    }
}
```

## 🎯 Database Seeding Strategy

### Platform Management Seeding
```php
// File: database/seeders/PlatformManagementSeeder.php
class PlatformManagementSeeder extends Seeder
{
    public function run()
    {
        // Tenant Plans
        $this->seedTenantPlans();
        
        // Platform Settings
        $this->seedPlatformSettings();
        
        // Sample tenant subscriptions and usage data
        $this->seedTenantSubscriptions();
        
        // Resource quotas for all tenants
        $this->seedResourceUsage();
    }
    
    private function seedTenantPlans()
    {
        $plans = [
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'Perfect for small businesses getting started',
                'monthly_price' => 299000, // IDR 299,000
                'yearly_price' => 2990000, // IDR 2,990,000 (2 months free)
                'features' => [
                    'custom_domain', 'basic_analytics', 'email_support', 
                    'theme_customization', 'multi_language'
                ],
                'limits' => [
                    'users' => 5,
                    'products' => 100,
                    'orders_per_month' => 500,
                    'storage_gb' => 5,
                    'api_requests_per_month' => 10000,
                ],
                'is_popular' => false,
                'sort_order' => 1,
            ],
            [
                'name' => 'Professional',
                'slug' => 'professional', 
                'description' => 'For growing businesses with advanced needs',
                'monthly_price' => 599000, // IDR 599,000
                'yearly_price' => 5990000, // IDR 5,990,000
                'features' => [
                    'custom_domain', 'advanced_analytics', 'priority_support',
                    'theme_customization', 'multi_language', 'api_access',
                    'custom_integrations', 'advanced_reporting'
                ],
                'limits' => [
                    'users' => 25,
                    'products' => 1000,
                    'orders_per_month' => 5000,
                    'storage_gb' => 50,
                    'api_requests_per_month' => 100000,
                ],
                'is_popular' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'For large businesses requiring maximum flexibility',
                'monthly_price' => 1199000, // IDR 1,199,000
                'yearly_price' => 11990000, // IDR 11,990,000
                'features' => [
                    'custom_domain', 'enterprise_analytics', '24/7_support',
                    'theme_customization', 'multi_language', 'api_access',
                    'custom_integrations', 'advanced_reporting', 'sso',
                    'dedicated_manager', 'custom_training'
                ],
                'limits' => [
                    'users' => 100,
                    'products' => 10000,
                    'orders_per_month' => 50000,
                    'storage_gb' => 500,
                    'api_requests_per_month' => 1000000,
                ],
                'is_popular' => false,
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $planData) {
            TenantPlan::create($planData);
        }
    }
}
```

## ✅ Testing Requirements

### Platform Management Testing (95%+ Coverage)
```php
// File: tests/Feature/Platform/TenantManagementTest.php
class TenantManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_platform_admin_can_create_tenant()
    {
        $admin = User::factory()->platformAdmin()->create();
        
        $response = $this->actingAs($admin)
            ->postJson('/platform/tenants', [
                'name' => 'test-tenant',
                'business_name' => 'Test Business',
                'contact_email' => 'contact@test.com',
                'contact_person' => 'John Doe',
            ]);
        
        $response->assertCreated();
        $this->assertDatabaseHas('tenants', ['business_name' => 'Test Business']);
    }

    public function test_tenant_health_check_calculates_score()
    {
        $tenant = Tenant::factory()->create();
        $service = app(PlatformAnalyticsService::class);
        
        $report = $service->generateTenantHealthReport($tenant);
        
        $this->assertArrayHasKey('health_score', $report);
        $this->assertBetween(0, 100, $report['health_score']);
    }
}
```

## 🔒 Security Checkpoints

### Platform-Level Security
- **Access Control**: Platform admin role separation from tenant access
- **Data Isolation**: Strict separation between platform and tenant data
- **Audit Logging**: All platform administrative actions logged
- **Billing Security**: PCI compliance for payment processing

## 📊 Performance Requirements

- **Platform Dashboard**: < 500ms load time
- **Tenant Creation**: < 10 seconds complete provisioning
- **Health Checks**: < 5 seconds per tenant check
- **Billing Processing**: < 30 seconds payment processing

## 🚀 Success Metrics

### Technical Metrics
- [x] Platform admin interface functional
- [x] Tenant provisioning automated
- [x] Billing system with payment integration
- [x] Health monitoring for all tenants

### Business Metrics
- [x] Multi-tier subscription plans operational
- [x] Platform analytics dashboard complete
- [x] Resource quota system enforced
- [x] Automated tenant onboarding process

---

**Next Phase**: [Phase 7: Custom Domain & URL Management](./PHASE_7_CUSTOM_DOMAIN_URL_MANAGEMENT.md)