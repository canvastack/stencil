# Phase 3 Extensions: Critical Gap Resolution & Platform Completion
**Duration**: 6 Weeks (Extension of Phase 3)  
**Priority**: CRITICAL  
**Prerequisites**: Phase 1 (Multi-Tenant Foundation), Phase 2 (Authentication & Authorization), Phase 3 (Core Business Logic)

## 🎯 Phase Overview

This extension phase addresses critical gaps identified during the comprehensive Phase 1-3 audit, ensuring 100% compliance with the original roadmap and implementing essential production-ready features that were missing from the initial implementation.

### Current Implementation Status
- **Phase 1**: 95% Complete (Architecture foundation excellent)
- **Phase 2**: 90% Complete (Core auth solid, missing self-service features)  
- **Phase 3**: 100% Complete (Business logic exceeds roadmap expectations)

### Key Issues Identified
1. **🔴 CRITICAL**: Payment Refund System completely missing (blocking tests)
2. **🔴 CRITICAL**: Self-service authentication features missing (production blockers)
3. **🟡 MEDIUM**: File & Media Management System missing (core CMS feature)
4. **🟡 MEDIUM**: Shipping & Logistics system incomplete
5. **🟢 LOW**: Advanced business features for competitive differentiation

---

## 🏁 Development Progress Tracker

**Overall Progress**: ⬜ 0% Complete (0/82 tasks)

### Progress By Week:
- [ ] **Week 1**: Architecture Compliance (0/15 tasks)
- [ ] **Week 2**: Authentication Extensions (0/18 tasks)  
- [ ] **Week 3**: Payment & Refund System (0/22 tasks)
- [ ] **Week 4**: Shipping & Logistics (0/14 tasks)
- [ ] **Week 5**: File & Media Management (0/8 tasks)
- [ ] **Week 6**: Communication & Business Features (0/5 tasks)

### Critical Milestones:
- [ ] ⚠️ **Critical**: Payment refund tests passing (Week 3)
- [ ] ⚠️ **Critical**: Self-service auth features working (Week 2)
- [ ] 📦 **Important**: File upload system functional (Week 5)
- [ ] 🚚 **Important**: Shipping cost calculator working (Week 4)

---

## 📋 Week-by-Week Implementation Plan

### Week 1: Phase 1 Architecture Compliance & Standardization
**Progress**: ⬜ 0/15 tasks complete

#### **Critical Architecture Fixes**

**🔧 Model Structure Standardization** (4 tasks)
- [ ] Create `TenantAwareModel` interface
- [ ] Create `TenantAware` trait with global scope
- [ ] Update all models to implement `TenantAwareModel`
- [ ] Add standardization tests
```php
// ISSUE: Mixed EloquentModel patterns vs standard Laravel models
// SOLUTION: Maintain current working approach, add interface compliance

// File: app/Infrastructure/Persistence/Eloquent/Contracts/TenantAwareModel.php
interface TenantAwareModel
{
    public function getTenantId(): string;
    public function scopeTenantScoped($query);
}

// File: app/Infrastructure/Persistence/Eloquent/Traits/TenantAware.php
trait TenantAware
{
    protected static function bootTenantAware()
    {
        static::addGlobalScope(new TenantScope);
    }
    
    public function getTenantId(): string
    {
        return $this->tenant_id;
    }
    
    public function scopeTenantScoped($query)
    {
        return $query->where('tenant_id', app('current_tenant')->id);
    }
}
```

**🔧 UUID Compliance Implementation** (7 tasks)
- [ ] Create UUID migration for `users` table
- [ ] Create UUID migration for `accounts` table  
- [ ] Create UUID migration for `tenants` table
- [ ] Create UUID migration for `roles`, `products`, `orders` tables
- [ ] Create UUID migration for `customers`, `vendors` tables
- [ ] Update model factories to generate UUIDs
- [ ] Test UUID functionality across all models

```php
// File: database/migrations/add_uuid_compliance_to_existing_tables.php
// Add UUID fields while maintaining existing auto-increment IDs for performance
Schema::table('users', function (Blueprint $table) {
    $table->uuid('uuid')->after('id')->unique()->default(DB::raw('gen_random_uuid()'));
    $table->index('uuid');
});

// Apply to all major tables: accounts, tenants, users, roles, products, orders, customers, vendors
```

**🔧 Additional Architecture Tasks** (4 tasks)
- [ ] Create base repository interfaces  
- [ ] Implement service layer standardization
- [ ] Add domain event bus configuration
- [ ] Update documentation for new patterns

### Week 2: Phase 2 Authentication Extension - Self-Service Features
**Progress**: ⬜ 0/18 tasks complete

#### **Day 1-2: Password Reset System** (6 tasks)
- [ ] Create `password_reset_tokens` migration
- [ ] Create `PasswordResetToken` model
- [ ] Create `PasswordResetService` class
- [ ] Create password reset API endpoints
- [ ] Create password reset email templates
- [ ] Write password reset tests
```php
// File: database/migrations/create_password_reset_tokens_table.php
Schema::create('password_reset_tokens', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->nullable()->index();
    $table->string('email')->index();
    $table->string('token')->unique();
    $table->enum('user_type', ['platform', 'tenant'])->default('tenant');
    $table->timestamp('expires_at');
    $table->boolean('used')->default(false);
    $table->timestamp('used_at')->nullable();
    $table->string('ip_address')->nullable();
    $table->text('user_agent')->nullable();
    $table->timestamps();
    
    $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
    $table->index(['email', 'user_type']);
    $table->index(['token', 'expires_at']);
});

// File: app/Services/Auth/PasswordResetService.php
class PasswordResetService
{
    public function requestReset(string $email, ?string $tenantId = null): bool
    {
        $token = Str::random(64);
        $expires = now()->addHours(2);
        
        // Create or update reset token
        PasswordResetToken::updateOrCreate([
            'email' => $email,
            'tenant_id' => $tenantId,
            'user_type' => $tenantId ? 'tenant' : 'platform'
        ], [
            'token' => Hash::make($token),
            'expires_at' => $expires,
            'used' => false,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent()
        ]);
        
        // Send email with reset link
        $this->sendResetEmail($email, $token, $tenantId);
        
        return true;
    }
    
    public function resetPassword(string $token, string $password, string $email): bool
    {
        $resetToken = PasswordResetToken::where('email', $email)
            ->where('expires_at', '>', now())
            ->where('used', false)
            ->first();
            
        if (!$resetToken || !Hash::check($token, $resetToken->token)) {
            throw new ValidationException(['token' => ['Invalid or expired reset token.']]);
        }
        
        // Find and update user
        if ($resetToken->user_type === 'platform') {
            $user = AccountEloquentModel::where('email', $email)->first();
        } else {
            $user = UserEloquentModel::where('email', $email)
                ->where('tenant_id', $resetToken->tenant_id)
                ->first();
        }
        
        if (!$user) {
            throw new ValidationException(['email' => ['User not found.']]);
        }
        
        $user->update(['password' => Hash::make($password)]);
        
        // Mark token as used
        $resetToken->update([
            'used' => true,
            'used_at' => now()
        ]);
        
        return true;
    }
}
```

#### **Day 3-4: Email Verification System** (6 tasks)
- [ ] Create `email_verifications` migration  
- [ ] Create `EmailVerification` model
- [ ] Create `EmailVerificationService` class
- [ ] Create email verification API endpoints
- [ ] Create email verification templates
- [ ] Write email verification tests
```php
// File: database/migrations/create_email_verifications_table.php
Schema::create('email_verifications', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->nullable()->index();
    $table->string('email')->index();
    $table->string('token')->unique();
    $table->enum('user_type', ['platform', 'tenant'])->default('tenant');
    $table->timestamp('expires_at');
    $table->boolean('verified')->default(false);
    $table->timestamp('verified_at')->nullable();
    $table->string('ip_address')->nullable();
    $table->timestamps();
    
    $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
    $table->index(['email', 'user_type']);
});

// File: app/Services/Auth/EmailVerificationService.php
class EmailVerificationService
{
    public function sendVerification($user): bool
    {
        $token = Str::random(64);
        $expires = now()->addHours(24);
        
        EmailVerification::create([
            'email' => $user->email,
            'tenant_id' => $user->tenant_id ?? null,
            'user_type' => $user instanceof AccountEloquentModel ? 'platform' : 'tenant',
            'token' => $token,
            'expires_at' => $expires,
            'ip_address' => request()->ip()
        ]);
        
        // Send verification email
        Mail::to($user->email)->send(new EmailVerificationMail($user, $token));
        
        return true;
    }
    
    public function verify(string $token): bool
    {
        $verification = EmailVerification::where('token', $token)
            ->where('expires_at', '>', now())
            ->where('verified', false)
            ->first();
            
        if (!$verification) {
            throw new ValidationException(['token' => ['Invalid or expired verification token.']]);
        }
        
        // Find and verify user
        if ($verification->user_type === 'platform') {
            $user = AccountEloquentModel::where('email', $verification->email)->first();
        } else {
            $user = UserEloquentModel::where('email', $verification->email)
                ->where('tenant_id', $verification->tenant_id)
                ->first();
        }
        
        if (!$user) {
            throw new ValidationException(['email' => ['User not found.']]);
        }
        
        $user->update(['email_verified_at' => now()]);
        
        $verification->update([
            'verified' => true,
            'verified_at' => now()
        ]);
        
        return true;
    }
}
```

#### **Day 5: User Registration System** (6 tasks)
- [ ] Create `RegistrationService` class
- [ ] Create tenant user registration API endpoints
- [ ] Create platform account registration endpoints
- [ ] Create registration form validation rules
- [ ] Create welcome email templates
- [ ] Write user registration tests
```php
// File: app/Services/Auth/RegistrationService.php
class RegistrationService
{
    public function registerTenantUser(array $data, string $tenantId): UserEloquentModel
    {
        $tenant = TenantEloquentModel::findOrFail($tenantId);
        
        // Check tenant limits
        if (!$tenant->canCreateUsers()) {
            throw new ValidationException(['tenant' => ['User limit exceeded for this tenant.']]);
        }
        
        // Create user
        $user = UserEloquentModel::create([
            'tenant_id' => $tenantId,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'department' => $data['department'] ?? null,
            'status' => 'active'
        ]);
        
        // Assign default role
        $defaultRole = RoleEloquentModel::where('tenant_id', $tenantId)
            ->where('slug', 'user')
            ->first();
            
        if ($defaultRole) {
            $user->roles()->attach($defaultRole);
        }
        
        // Send welcome email
        app(EmailVerificationService::class)->sendVerification($user);
        
        return $user;
    }
    
    public function registerPlatformAccount(array $data): AccountEloquentModel
    {
        // Create platform account
        $account = AccountEloquentModel::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'account_type' => 'platform_owner',
            'status' => 'active'
        ]);
        
        // Assign platform role
        $platformRole = RoleEloquentModel::whereNull('tenant_id')
            ->where('slug', 'platform-manager')
            ->first();
            
        if ($platformRole) {
            $account->roles()->attach($platformRole);
        }
        
        // Send verification email
        app(EmailVerificationService::class)->sendVerification($account);
        
        return $account;
    }
}
```

### Week 3: Payment & Financial Management System
**Progress**: ⬜ 0/22 tasks complete

#### **Day 1-2: Payment Refund Models & Migration** (8 tasks)
- [ ] Create `payment_refunds` migration
- [ ] Create `refund_approval_workflows` migration  
- [ ] Create `PaymentRefund` model with relationships
- [ ] Create `RefundApprovalWorkflow` model
- [ ] Create refund status enums
- [ ] Create refund event classes
- [ ] Add refund relationships to Order model
- [ ] Create model factories for refunds
```php
// File: database/migrations/create_payment_refunds_table.php
Schema::create('payment_refunds', function (Blueprint $table) {
    $table->id();
    $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
    $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
    $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
    $table->foreignId('original_transaction_id')->constrained('order_payment_transactions')->cascadeOnDelete();
    $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
    $table->foreignId('vendor_id')->nullable()->constrained('vendors')->nullOnDelete();
    $table->string('refund_reference')->unique();
    $table->enum('type', ['full', 'partial'])->default('partial');
    $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'rejected'])->default('pending');
    $table->bigInteger('refund_amount'); // Amount in cents
    $table->bigInteger('original_amount'); // Original transaction amount
    $table->string('currency', 3)->default('IDR');
    $table->string('refund_method')->nullable(); // original_method, bank_transfer, etc.
    $table->json('refund_details')->nullable(); // Bank account, etc.
    $table->text('reason');
    $table->text('notes')->nullable();
    $table->json('approval_workflow')->nullable(); // Who approved, when, etc.
    $table->foreignId('initiated_by')->constrained('users')->cascadeOnDelete();
    $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('requested_at');
    $table->timestamp('approved_at')->nullable();
    $table->timestamp('processed_at')->nullable();
    $table->timestamp('completed_at')->nullable();
    $table->json('processing_response')->nullable(); // Gateway response
    $table->json('metadata')->nullable(); // Additional data
    $table->timestamps();
    $table->softDeletes();

    $table->index('uuid');
    $table->index(['tenant_id', 'status']);
    $table->index(['tenant_id', 'type']);
    $table->index(['order_id', 'status']);
    $table->index(['customer_id']);
    $table->index(['refund_reference']);
});

// File: database/migrations/create_refund_approval_workflows_table.php
Schema::create('refund_approval_workflows', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
    $table->foreignId('refund_id')->constrained('payment_refunds')->cascadeOnDelete();
    $table->string('step'); // requested, manager_review, finance_approval, processing
    $table->enum('status', ['pending', 'approved', 'rejected', 'skipped'])->default('pending');
    $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignId('actioned_by')->nullable()->constrained('users')->nullOnDelete();
    $table->text('comments')->nullable();
    $table->timestamp('due_at')->nullable();
    $table->timestamp('actioned_at')->nullable();
    $table->json('metadata')->nullable();
    $table->timestamps();

    $table->index(['tenant_id', 'status']);
    $table->index(['refund_id', 'step']);
    $table->index(['assigned_to', 'status']);
});
```

#### **Day 3-4: Payment Refund Service & Business Logic** (8 tasks)
- [ ] Create `PaymentRefundService` class
- [ ] Implement refund validation logic
- [ ] Create refund workflow state machine
- [ ] Implement approval process automation  
- [ ] Create refund API endpoints
- [ ] Create refund notification system
- [ ] Integrate with payment gateways
- [ ] Write refund business logic tests
```php
// File: app/Domain/Payment/Services/PaymentRefundService.php
namespace App\Domain\Payment\Services;

use App\Infrastructure\Persistence\Eloquent\Models\PaymentRefund;
use App\Infrastructure\Persistence\Eloquent\Models\OrderPaymentTransaction;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Domain\Payment\Enums\RefundStatus;
use App\Domain\Payment\Events\RefundRequested;
use App\Domain\Payment\Events\RefundApproved;
use App\Domain\Payment\Events\RefundCompleted;

class PaymentRefundService
{
    public function initiateRefund(array $data): PaymentRefund
    {
        $order = Order::with(['transactions', 'customer', 'vendor'])->findOrFail($data['order_id']);
        
        // Validate refund eligibility
        $this->validateRefundEligibility($order, $data['refund_amount']);
        
        // Find original payment transaction
        $originalTransaction = $order->transactions()
            ->where('direction', 'incoming')
            ->where('status', 'completed')
            ->first();
            
        if (!$originalTransaction) {
            throw new \Exception('No eligible payment transaction found for refund.');
        }
        
        // Calculate refund limits
        $totalRefunded = PaymentRefund::where('order_id', $order->id)
            ->whereIn('status', ['completed', 'processing'])
            ->sum('refund_amount');
            
        $maxRefundable = $originalTransaction->amount - $totalRefunded;
        
        if ($data['refund_amount'] > $maxRefundable) {
            throw new \Exception("Cannot refund more than available amount: " . number_format($maxRefundable / 100, 2));
        }
        
        // Create refund record
        $refund = PaymentRefund::create([
            'tenant_id' => $order->tenant_id,
            'order_id' => $order->id,
            'original_transaction_id' => $originalTransaction->id,
            'customer_id' => $order->customer_id,
            'vendor_id' => $order->vendor_id,
            'refund_reference' => 'RF-' . strtoupper(Str::random(8)),
            'type' => $data['refund_amount'] >= $originalTransaction->amount ? 'full' : 'partial',
            'status' => RefundStatus::PENDING->value,
            'refund_amount' => $data['refund_amount'],
            'original_amount' => $originalTransaction->amount,
            'currency' => $originalTransaction->currency,
            'reason' => $data['reason'],
            'notes' => $data['notes'] ?? null,
            'initiated_by' => auth()->id(),
            'requested_at' => now(),
        ]);
        
        // Initialize approval workflow
        $this->initializeApprovalWorkflow($refund);
        
        // Dispatch event
        RefundRequested::dispatch($refund);
        
        return $refund;
    }
    
    public function approveRefund(PaymentRefund $refund, ?string $comments = null): bool
    {
        if ($refund->status !== RefundStatus::PENDING->value) {
            throw new \Exception('Only pending refunds can be approved.');
        }
        
        $refund->update([
            'status' => RefundStatus::PROCESSING->value,
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);
        
        // Update approval workflow
        $refund->approvalWorkflow()
            ->where('step', 'manager_review')
            ->update([
                'status' => 'approved',
                'actioned_by' => auth()->id(),
                'comments' => $comments,
                'actioned_at' => now(),
            ]);
        
        // Dispatch event
        RefundApproved::dispatch($refund);
        
        // Process refund automatically for now (in production, integrate with payment gateway)
        return $this->processRefund($refund);
    }
    
    public function processRefund(PaymentRefund $refund): bool
    {
        if ($refund->status !== RefundStatus::PROCESSING->value) {
            throw new \Exception('Only approved refunds can be processed.');
        }
        
        try {
            // In production, integrate with payment gateway
            // For now, simulate successful processing
            $gatewayResponse = [
                'transaction_id' => 'ref_' . strtolower(Str::random(16)),
                'status' => 'success',
                'processed_at' => now()->toISOString(),
                'method' => 'original_payment_method'
            ];
            
            $refund->update([
                'status' => RefundStatus::COMPLETED->value,
                'processed_at' => now(),
                'completed_at' => now(),
                'processing_response' => $gatewayResponse,
            ]);
            
            // Create refund transaction record
            $this->createRefundTransaction($refund);
            
            // Update order payment status
            $this->updateOrderPaymentStatus($refund->order);
            
            // Dispatch event
            RefundCompleted::dispatch($refund);
            
            return true;
            
        } catch (\Exception $e) {
            $refund->update([
                'status' => RefundStatus::FAILED->value,
                'processing_response' => [
                    'error' => $e->getMessage(),
                    'failed_at' => now()->toISOString(),
                ]
            ]);
            
            throw $e;
        }
    }
    
    private function validateRefundEligibility(Order $order, int $refundAmount): void
    {
        // Check if order is eligible for refund
        if (!in_array($order->status, ['completed', 'delivered', 'cancelled'])) {
            throw new \Exception('Order is not eligible for refund in current status.');
        }
        
        // Check if refund amount is valid
        if ($refundAmount <= 0) {
            throw new \Exception('Refund amount must be greater than zero.');
        }
    }
    
    private function createRefundTransaction(PaymentRefund $refund): void
    {
        OrderPaymentTransaction::create([
            'tenant_id' => $refund->tenant_id,
            'order_id' => $refund->order_id,
            'customer_id' => $refund->customer_id,
            'vendor_id' => $refund->vendor_id,
            'direction' => 'outgoing',
            'type' => 'refund',
            'status' => 'completed',
            'amount' => $refund->refund_amount,
            'currency' => $refund->currency,
            'method' => 'refund',
            'reference' => $refund->refund_reference,
            'paid_at' => now(),
            'metadata' => [
                'refund_id' => $refund->id,
                'original_transaction_id' => $refund->original_transaction_id,
                'refund_type' => $refund->type,
            ]
        ]);
    }
    
    private function updateOrderPaymentStatus(Order $order): void
    {
        $totalPaid = $order->transactions()
            ->where('direction', 'incoming')
            ->where('status', 'completed')
            ->sum('amount');
            
        $totalRefunded = $order->transactions()
            ->where('direction', 'outgoing')
            ->where('type', 'refund')
            ->where('status', 'completed')
            ->sum('amount');
            
        $netPaid = $totalPaid - $totalRefunded;
        
        if ($netPaid <= 0) {
            $order->update(['payment_status' => 'refunded']);
        } elseif ($totalRefunded > 0) {
            $order->update(['payment_status' => 'partially_refunded']);
        }
    }
    
    private function initializeApprovalWorkflow(PaymentRefund $refund): void
    {
        // Create approval workflow steps
        $steps = [
            [
                'step' => 'requested',
                'status' => 'approved',
                'actioned_by' => $refund->initiated_by,
                'actioned_at' => now(),
            ],
            [
                'step' => 'manager_review',
                'status' => 'pending',
                'assigned_to' => $this->findManagerForRefund($refund),
                'due_at' => now()->addBusinessDays(2),
            ]
        ];
        
        foreach ($steps as $step) {
            $refund->approvalWorkflow()->create(array_merge($step, [
                'tenant_id' => $refund->tenant_id,
                'refund_id' => $refund->id,
            ]));
        }
    }
    
    private function findManagerForRefund(PaymentRefund $refund): ?int
    {
        // Find a manager role user for this tenant
        $managerRole = RoleEloquentModel::where('tenant_id', $refund->tenant_id)
            ->where('slug', 'manager')
            ->first();
            
        if ($managerRole) {
            $manager = $managerRole->users()->first();
            return $manager?->id;
        }
        
        return null;
    }
}
```

#### **Day 5: Refund API Controllers & Tests** (6 tasks)
- [ ] Create `PaymentRefundController` for tenant API
- [ ] Create refund API routes and middleware
- [ ] Update failing `PaymentRefundTest.php` to pass
- [ ] Create refund integration tests
- [ ] Create refund approval workflow tests
- [ ] Add refund performance tests
```php
// File: app/Infrastructure/Presentation/Http/Controllers/Tenant/PaymentRefundController.php
namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

class PaymentRefundController extends Controller
{
    public function __construct(
        private PaymentRefundService $refundService
    ) {
        $this->middleware(['auth:sanctum', 'tenant.context', 'tenant.scoped']);
    }
    
    public function index(Request $request)
    {
        $refunds = PaymentRefund::with(['order', 'customer', 'initiator', 'approver'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->type, fn($q) => $q->where('type', $request->type))
            ->when($request->order_id, fn($q) => $q->where('order_id', $request->order_id))
            ->when($request->customer_id, fn($q) => $q->where('customer_id', $request->customer_id))
            ->latest()
            ->paginate($request->limit ?? 20);
            
        return PaymentRefundResource::collection($refunds);
    }
    
    public function show(PaymentRefund $refund)
    {
        $refund->load(['order', 'customer', 'originalTransaction', 'approvalWorkflow.assignee']);
        return new PaymentRefundResource($refund);
    }
    
    public function store(StorePaymentRefundRequest $request)
    {
        $refund = $this->refundService->initiateRefund($request->validated());
        return new PaymentRefundResource($refund);
    }
    
    public function approve(PaymentRefund $refund, Request $request)
    {
        $request->validate([
            'comments' => 'nullable|string|max:1000'
        ]);
        
        $this->refundService->approveRefund($refund, $request->comments);
        
        return response()->json([
            'message' => 'Refund approved successfully',
            'refund' => new PaymentRefundResource($refund->fresh())
        ]);
    }
    
    public function reject(PaymentRefund $refund, Request $request)
    {
        $request->validate([
            'reason' => 'required|string|max:1000'
        ]);
        
        $refund->update([
            'status' => 'rejected',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'notes' => $request->reason
        ]);
        
        return response()->json([
            'message' => 'Refund rejected',
            'refund' => new PaymentRefundResource($refund)
        ]);
    }
}

// File: tests/Feature/Tenant/Api/PaymentRefundTest.php - Update existing skipped tests
class PaymentRefundTest extends TestCase
{
    // Remove markTestSkipped and implement actual tests
    public function test_initiate_refund()
    {
        $refund = $this->refundService->initiateRefund([
            'order_id' => $this->order->id,
            'refund_amount' => 50000, // 500 IDR
            'reason' => 'Customer requested refund',
            'notes' => 'Defective product'
        ]);

        $this->assertDatabaseHas('payment_refunds', [
            'order_id' => $this->order->id,
            'refund_amount' => 50000,
            'status' => 'pending'
        ]);
    }
    
    // Implement all other test methods...
}
```

### Week 4: Shipping & Logistics System
**Progress**: ⬜ 0/14 tasks complete

#### **Day 1-2: Shipping Models & Database** (5 tasks)
- [ ] Create `shipping_addresses` migration
- [ ] Create `shipping_methods` migration  
- [ ] Create `shipments` migration
- [ ] Create shipping-related models with relationships
- [ ] Create shipping model factories and seeders
```php
// File: database/migrations/create_shipping_addresses_table.php
Schema::create('shipping_addresses', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
    $table->morphs('addressable'); // Customer, Order, etc.
    $table->enum('type', ['billing', 'shipping', 'both'])->default('shipping');
    $table->string('recipient_name');
    $table->string('company_name')->nullable();
    $table->string('phone')->nullable();
    $table->text('address_line_1');
    $table->text('address_line_2')->nullable();
    $table->string('city');
    $table->string('state_province');
    $table->string('postal_code');
    $table->string('country_code', 3)->default('IDN');
    $table->decimal('latitude', 10, 8)->nullable();
    $table->decimal('longitude', 11, 8)->nullable();
    $table->text('delivery_instructions')->nullable();
    $table->boolean('is_default')->default(false);
    $table->timestamps();

    $table->index(['tenant_id', 'addressable_type', 'addressable_id']);
    $table->index(['tenant_id', 'type']);
});

// File: database/migrations/create_shipping_methods_table.php
Schema::create('shipping_methods', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
    $table->string('name');
    $table->string('code')->unique(); // JNE_REG, JNT_EXPRESS, etc.
    $table->text('description')->nullable();
    $table->string('carrier'); // JNE, JNT, SiCepat, etc.
    $table->enum('type', ['standard', 'express', 'same_day', 'pickup'])->default('standard');
    $table->json('service_areas'); // Supported regions/cities
    $table->integer('estimated_days_min')->default(1);
    $table->integer('estimated_days_max')->default(7);
    $table->decimal('base_cost', 12, 2)->default(0);
    $table->json('cost_calculation')->nullable(); // Weight, distance, etc. rules
    $table->json('restrictions')->nullable(); // Max weight, dimensions, etc.
    $table->boolean('is_active')->default(true);
    $table->boolean('is_default')->default(false);
    $table->integer('sort_order')->default(0);
    $table->timestamps();

    $table->index(['tenant_id', 'is_active']);
    $table->index(['carrier', 'type']);
});

// File: database/migrations/create_shipments_table.php
Schema::create('shipments', function (Blueprint $table) {
    $table->id();
    $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
    $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
    $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
    $table->foreignId('shipping_method_id')->constrained('shipping_methods');
    $table->string('tracking_number')->nullable()->unique();
    $table->string('carrier_reference')->nullable();
    $table->enum('status', ['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'failed', 'cancelled'])->default('pending');
    $table->json('shipping_address');
    $table->json('return_address');
    $table->decimal('weight_kg', 8, 3)->nullable();
    $table->json('dimensions')->nullable(); // length, width, height in cm
    $table->decimal('shipping_cost', 12, 2);
    $table->string('currency', 3)->default('IDR');
    $table->json('items'); // Shipped items details
    $table->text('special_instructions')->nullable();
    $table->timestamp('shipped_at')->nullable();
    $table->timestamp('estimated_delivery')->nullable();
    $table->timestamp('delivered_at')->nullable();
    $table->json('tracking_events')->nullable(); // Carrier tracking updates
    $table->json('metadata')->nullable();
    $table->timestamps();
    $table->softDeletes();

    $table->index(['tenant_id', 'status']);
    $table->index(['order_id']);
    $table->index(['tracking_number']);
    $table->index(['uuid']);
});
```

#### **Day 3-4: Shipping Service & Business Logic** (5 tasks)
- [ ] Create `ShippingService` class with cost calculation
- [ ] Implement shipment creation and processing
- [ ] Create carrier integration framework (JNE, JNT, SiCepat)
- [ ] Create tracking update system
- [ ] Write shipping service tests
```php
// File: app/Domain/Shipping/Services/ShippingService.php
namespace App\Domain\Shipping\Services;

use App\Infrastructure\Persistence\Eloquent\Models\Shipment;
use App\Infrastructure\Persistence\Eloquent\Models\ShippingMethod;
use App\Infrastructure\Persistence\Eloquent\Models\Order;

class ShippingService
{
    public function calculateShippingCost(Order $order, ShippingMethod $method): array
    {
        $baseConfig = $method->cost_calculation;
        
        // Calculate based on weight
        $totalWeight = $this->calculateOrderWeight($order);
        $weightCost = ($baseConfig['per_kg'] ?? 0) * $totalWeight;
        
        // Calculate based on distance (if configured)
        $distanceCost = 0;
        if ($baseConfig['per_km'] ?? false) {
            $distance = $this->calculateDistance($order->shipping_address, $order->tenant->address);
            $distanceCost = $baseConfig['per_km'] * $distance;
        }
        
        // Apply base cost
        $totalCost = $method->base_cost + $weightCost + $distanceCost;
        
        // Apply any special rules
        if ($totalCost < ($baseConfig['minimum_cost'] ?? 0)) {
            $totalCost = $baseConfig['minimum_cost'];
        }
        
        return [
            'base_cost' => $method->base_cost,
            'weight_cost' => $weightCost,
            'distance_cost' => $distanceCost,
            'total_cost' => $totalCost,
            'weight_kg' => $totalWeight,
            'estimated_days' => rand($method->estimated_days_min, $method->estimated_days_max)
        ];
    }
    
    public function createShipment(Order $order, array $data): Shipment
    {
        $shippingMethod = ShippingMethod::findOrFail($data['shipping_method_id']);
        
        // Calculate shipping cost
        $costDetails = $this->calculateShippingCost($order, $shippingMethod);
        
        // Prepare shipment data
        $shipmentData = [
            'tenant_id' => $order->tenant_id,
            'order_id' => $order->id,
            'shipping_method_id' => $shippingMethod->id,
            'status' => 'pending',
            'shipping_address' => $order->shipping_address,
            'return_address' => $order->tenant->getShippingAddress(),
            'weight_kg' => $costDetails['weight_kg'],
            'dimensions' => $data['dimensions'] ?? null,
            'shipping_cost' => $costDetails['total_cost'],
            'currency' => 'IDR',
            'items' => $this->prepareShipmentItems($order),
            'special_instructions' => $data['special_instructions'] ?? null,
            'estimated_delivery' => now()->addDays($costDetails['estimated_days']),
        ];
        
        $shipment = Shipment::create($shipmentData);
        
        // Update order status
        $order->update(['status' => 'processing']);
        
        return $shipment;
    }
    
    public function processShipment(Shipment $shipment): bool
    {
        if ($shipment->status !== 'pending') {
            throw new \Exception('Only pending shipments can be processed.');
        }
        
        // Generate tracking number
        $trackingNumber = $this->generateTrackingNumber($shipment);
        
        // In production, integrate with carrier API
        $carrierResponse = $this->submitToCarrier($shipment, $trackingNumber);
        
        $shipment->update([
            'status' => 'processing',
            'tracking_number' => $trackingNumber,
            'carrier_reference' => $carrierResponse['reference'] ?? null,
        ]);
        
        // Update order status
        $shipment->order->update(['status' => 'shipped']);
        
        return true;
    }
    
    public function updateTracking(Shipment $shipment): array
    {
        // In production, call carrier API for tracking updates
        $trackingEvents = $this->getCarrierTrackingEvents($shipment);
        
        $shipment->update([
            'tracking_events' => $trackingEvents,
        ]);
        
        // Update shipment status based on latest event
        $latestEvent = collect($trackingEvents)->last();
        $newStatus = $this->mapCarrierStatusToShipmentStatus($latestEvent['status']);
        
        if ($newStatus !== $shipment->status) {
            $shipment->update(['status' => $newStatus]);
            
            if ($newStatus === 'delivered') {
                $shipment->update(['delivered_at' => now()]);
                $shipment->order->update(['status' => 'delivered']);
            }
        }
        
        return $trackingEvents;
    }
    
    private function calculateOrderWeight(Order $order): float
    {
        // Calculate total weight from order items
        $totalWeight = 0;
        
        foreach ($order->items as $item) {
            $productWeight = $item['product']['weight_kg'] ?? 0.5; // Default 500g
            $totalWeight += $productWeight * $item['quantity'];
        }
        
        return max($totalWeight, 0.1); // Minimum 100g
    }
    
    private function generateTrackingNumber(Shipment $shipment): string
    {
        return strtoupper($shipment->shippingMethod->carrier) . now()->format('ymd') . str_pad($shipment->id, 6, '0', STR_PAD_LEFT);
    }
    
    private function submitToCarrier(Shipment $shipment, string $trackingNumber): array
    {
        // Mock carrier API integration
        // In production, integrate with JNE, JNT, SiCepat, etc. APIs
        return [
            'status' => 'success',
            'reference' => 'CR' . strtoupper(Str::random(8)),
            'estimated_pickup' => now()->addHours(4)->toISOString(),
        ];
    }
    
    private function getCarrierTrackingEvents(Shipment $shipment): array
    {
        // Mock tracking events - in production, fetch from carrier API
        return [
            [
                'status' => 'picked_up',
                'description' => 'Package picked up from sender',
                'location' => 'Jakarta',
                'timestamp' => now()->subHours(2)->toISOString(),
            ],
            [
                'status' => 'in_transit',
                'description' => 'Package in transit to destination',
                'location' => 'Jakarta Sorting Center',
                'timestamp' => now()->subHour()->toISOString(),
            ]
        ];
    }
    
    private function mapCarrierStatusToShipmentStatus(string $carrierStatus): string
    {
        return match($carrierStatus) {
            'picked_up', 'collected' => 'shipped',
            'in_transit', 'on_the_way' => 'in_transit',
            'delivered', 'completed' => 'delivered',
            'failed', 'returned' => 'failed',
            default => 'processing'
        };
    }
    
    private function prepareShipmentItems(Order $order): array
    {
        return collect($order->items)->map(function ($item) {
            return [
                'product_id' => $item['product']['id'],
                'name' => $item['product']['name'],
                'sku' => $item['product']['sku'] ?? null,
                'quantity' => $item['quantity'],
                'weight_kg' => $item['product']['weight_kg'] ?? 0.5,
            ];
        })->toArray();
    }
}
```

### Week 5: File & Media Management System
**Progress**: ⬜ 0/8 tasks complete

#### **Day 1-2: Media Models & Storage Setup** (3 tasks)
- [ ] Create `media_folders`, `media_files`, `media_associations` migrations
- [ ] Create media models with relationships and polymorphic associations
- [ ] Configure multi-tenant file storage with Laravel filesystem
```php
// File: database/migrations/create_media_folders_table.php
Schema::create('media_folders', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
    $table->string('name');
    $table->string('slug');
    $table->text('description')->nullable();
    $table->foreignId('parent_id')->nullable()->constrained('media_folders')->cascadeOnDelete();
    $table->integer('sort_order')->default(0);
    $table->boolean('is_public')->default(true);
    $table->foreignId('created_by')->constrained('users');
    $table->timestamps();
    
    $table->unique(['tenant_id', 'slug', 'parent_id']);
    $table->index(['tenant_id', 'parent_id']);
});

// File: database/migrations/create_media_files_table.php
Schema::create('media_files', function (Blueprint $table) {
    $table->id();
    $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
    $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
    $table->string('name');
    $table->string('original_name');
    $table->string('file_path');
    $table->string('file_url');
    $table->string('thumbnail_url')->nullable();
    $table->string('mime_type');
    $table->string('file_extension', 10);
    $table->bigInteger('file_size'); // in bytes
    $table->json('dimensions')->nullable(); // for images: width, height
    $table->json('metadata')->nullable(); // EXIF, etc.
    $table->string('storage_disk')->default('public');
    $table->string('alt_text')->nullable();
    $table->text('description')->nullable();
    $table->foreignId('folder_id')->nullable()->constrained('media_folders');
    $table->enum('status', ['processing', 'ready', 'failed'])->default('processing');
    $table->foreignId('uploaded_by')->constrained('users');
    $table->timestamps();
    $table->softDeletes();
    
    $table->index(['tenant_id', 'mime_type']);
    $table->index(['tenant_id', 'status']);
    $table->index(['folder_id']);
    $table->index(['uuid']);
});

// File: database/migrations/create_media_associations_table.php
Schema::create('media_associations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
    $table->foreignId('media_file_id')->constrained('media_files')->cascadeOnDelete();
    $table->morphs('associable'); // Product, Page, etc.
    $table->string('context')->default('default'); // gallery, featured, thumbnail, etc.
    $table->integer('sort_order')->default(0);
    $table->timestamps();
    
    $table->unique(['media_file_id', 'associable_type', 'associable_id', 'context'], 'unique_media_association');
    $table->index(['tenant_id', 'associable_type', 'associable_id']);
});
```

#### **Day 3-4: File Processing & Management Service** (3 tasks)
- [ ] Create `MediaService` with file upload, processing, and management
- [ ] Implement image processing with thumbnail generation (Intervention Image)
- [ ] Create file association system for models (products, pages, etc.)
```php
// File: app/Domain/Media/Services/MediaService.php
namespace App\Domain\Media\Services;

use App\Infrastructure\Persistence\Eloquent\Models\MediaFile;
use App\Infrastructure\Persistence\Eloquent\Models\MediaFolder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Facades\Image;

class MediaService
{
    public function uploadFile(UploadedFile $file, array $options = []): MediaFile
    {
        // Validate file
        $this->validateFile($file);
        
        // Generate unique filename
        $filename = $this->generateUniqueFilename($file);
        $path = $this->getStoragePath($options['folder_id'] ?? null);
        $fullPath = $path . '/' . $filename;
        
        // Store file
        $storedPath = Storage::disk('public')->putFileAs($path, $file, $filename);
        
        // Create media record
        $mediaFile = MediaFile::create([
            'tenant_id' => app('current_tenant')->id,
            'name' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
            'original_name' => $file->getClientOriginalName(),
            'file_path' => $storedPath,
            'file_url' => Storage::disk('public')->url($storedPath),
            'mime_type' => $file->getMimeType(),
            'file_extension' => $file->getClientOriginalExtension(),
            'file_size' => $file->getSize(),
            'storage_disk' => 'public',
            'folder_id' => $options['folder_id'] ?? null,
            'uploaded_by' => auth()->id(),
            'status' => 'processing',
        ]);
        
        // Process file asynchronously
        ProcessMediaFile::dispatch($mediaFile);
        
        return $mediaFile;
    }
    
    public function processFile(MediaFile $mediaFile): void
    {
        try {
            // Extract metadata
            $metadata = $this->extractMetadata($mediaFile);
            
            // Generate thumbnails for images
            $thumbnailUrl = null;
            if ($this->isImage($mediaFile)) {
                $thumbnailUrl = $this->generateThumbnails($mediaFile);
                $dimensions = $this->getImageDimensions($mediaFile);
                $metadata['dimensions'] = $dimensions;
            }
            
            // Update media file
            $mediaFile->update([
                'thumbnail_url' => $thumbnailUrl,
                'dimensions' => $metadata['dimensions'] ?? null,
                'metadata' => $metadata,
                'status' => 'ready',
            ]);
            
        } catch (\Exception $e) {
            $mediaFile->update([
                'status' => 'failed',
                'metadata' => ['error' => $e->getMessage()],
            ]);
        }
    }
    
    public function createFolder(array $data): MediaFolder
    {
        return MediaFolder::create([
            'tenant_id' => app('current_tenant')->id,
            'name' => $data['name'],
            'slug' => Str::slug($data['name']),
            'description' => $data['description'] ?? null,
            'parent_id' => $data['parent_id'] ?? null,
            'is_public' => $data['is_public'] ?? true,
            'created_by' => auth()->id(),
        ]);
    }
    
    public function moveFile(MediaFile $mediaFile, ?int $folderId): MediaFile
    {
        $oldPath = $mediaFile->file_path;
        $newPath = $this->getStoragePath($folderId) . '/' . basename($oldPath);
        
        // Move file in storage
        Storage::disk('public')->move($oldPath, $newPath);
        
        // Update database
        $mediaFile->update([
            'folder_id' => $folderId,
            'file_path' => $newPath,
            'file_url' => Storage::disk('public')->url($newPath),
        ]);
        
        return $mediaFile;
    }
    
    public function deleteFile(MediaFile $mediaFile): bool
    {
        // Delete file from storage
        if (Storage::disk('public')->exists($mediaFile->file_path)) {
            Storage::disk('public')->delete($mediaFile->file_path);
        }
        
        // Delete thumbnails
        if ($mediaFile->thumbnail_url) {
            $thumbnailPath = parse_url($mediaFile->thumbnail_url, PHP_URL_PATH);
            Storage::disk('public')->delete(ltrim($thumbnailPath, '/'));
        }
        
        // Soft delete from database
        return $mediaFile->delete();
    }
    
    public function associateWithModel($model, MediaFile $mediaFile, string $context = 'default'): void
    {
        $model->mediaFiles()->attach($mediaFile->id, [
            'tenant_id' => app('current_tenant')->id,
            'context' => $context,
            'sort_order' => $model->mediaFiles()->count(),
        ]);
    }
    
    private function validateFile(UploadedFile $file): void
    {
        $allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain', 'text/csv',
        ];
        
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            throw new \Exception('File type not allowed: ' . $file->getMimeType());
        }
        
        // Check file size (10MB max)
        if ($file->getSize() > 10 * 1024 * 1024) {
            throw new \Exception('File size too large. Maximum 10MB allowed.');
        }
    }
    
    private function generateUniqueFilename(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        return Str::uuid() . '.' . $extension;
    }
    
    private function getStoragePath(?int $folderId): string
    {
        $basePath = 'tenant-' . app('current_tenant')->id;
        
        if ($folderId) {
            $folder = MediaFolder::find($folderId);
            if ($folder) {
                $folderPath = $this->buildFolderPath($folder);
                return $basePath . '/' . $folderPath;
            }
        }
        
        return $basePath . '/uploads';
    }
    
    private function buildFolderPath(MediaFolder $folder): string
    {
        $path = [];
        $current = $folder;
        
        while ($current) {
            array_unshift($path, $current->slug);
            $current = $current->parent;
        }
        
        return implode('/', $path);
    }
    
    private function isImage(MediaFile $mediaFile): bool
    {
        return str_starts_with($mediaFile->mime_type, 'image/');
    }
    
    private function generateThumbnails(MediaFile $mediaFile): ?string
    {
        if (!$this->isImage($mediaFile)) {
            return null;
        }
        
        $originalPath = Storage::disk('public')->path($mediaFile->file_path);
        $thumbnailPath = dirname($mediaFile->file_path) . '/thumbs/' . basename($mediaFile->file_path);
        $thumbnailFullPath = Storage::disk('public')->path($thumbnailPath);
        
        // Ensure thumbnail directory exists
        $thumbnailDir = dirname($thumbnailFullPath);
        if (!file_exists($thumbnailDir)) {
            mkdir($thumbnailDir, 0755, true);
        }
        
        // Generate thumbnail
        try {
            $image = Image::make($originalPath);
            $image->fit(300, 300);
            $image->save($thumbnailFullPath);
            
            return Storage::disk('public')->url($thumbnailPath);
        } catch (\Exception $e) {
            return null;
        }
    }
    
    private function getImageDimensions(MediaFile $mediaFile): ?array
    {
        if (!$this->isImage($mediaFile)) {
            return null;
        }
        
        try {
            $imagePath = Storage::disk('public')->path($mediaFile->file_path);
            $dimensions = getimagesize($imagePath);
            
            return [
                'width' => $dimensions[0],
                'height' => $dimensions[1],
            ];
        } catch (\Exception $e) {
            return null;
        }
    }
    
    private function extractMetadata(MediaFile $mediaFile): array
    {
        $metadata = [];
        
        if ($this->isImage($mediaFile)) {
            $imagePath = Storage::disk('public')->path($mediaFile->file_path);
            $exif = @exif_read_data($imagePath);
            
            if ($exif) {
                $metadata['exif'] = [
                    'camera' => $exif['Model'] ?? null,
                    'datetime' => $exif['DateTime'] ?? null,
                    'iso' => $exif['ISOSpeedRatings'] ?? null,
                ];
            }
        }
        
        return $metadata;
    }
}
```

#### **Day 5: API Controllers & File Upload Interface** (2 tasks)
- [ ] Create media API controllers with upload, browse, and management endpoints
- [ ] Write comprehensive media management tests

### Week 6: Communication System Enhancement & Advanced Features
**Progress**: ⬜ 0/5 tasks complete

#### **Day 1-2: Enhanced Notification System** (2 tasks)
- [ ] Create notification templates and logs system
- [ ] Implement dynamic template system with variable substitution
```php
// File: database/migrations/create_notification_templates_table.php
Schema::create('notification_templates', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
    $table->string('name');
    $table->string('slug');
    $table->string('type'); // email, sms, whatsapp
    $table->string('event'); // order_created, payment_received, etc.
    $table->string('subject')->nullable(); // For email
    $table->text('content');
    $table->json('variables')->nullable(); // Available template variables
    $table->boolean('is_system')->default(false);
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    
    $table->unique(['tenant_id', 'slug']);
    $table->index(['tenant_id', 'type']);
    $table->index(['tenant_id', 'event']);
});

// File: database/migrations/create_notification_logs_table.php
Schema::create('notification_logs', function (Blueprint $table) {
    $table->id();
    $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
    $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
    $table->string('type'); // email, sms, whatsapp
    $table->string('recipient');
    $table->string('subject')->nullable();
    $table->text('content');
    $table->enum('status', ['pending', 'sent', 'delivered', 'failed'])->default('pending');
    $table->json('response')->nullable(); // Provider response
    $table->string('provider')->nullable(); // sendgrid, twilio, etc.
    $table->morphs('notifiable'); // Related model
    $table->timestamp('sent_at')->nullable();
    $table->timestamp('delivered_at')->nullable();
    $table->integer('retry_count')->default(0);
    $table->timestamp('next_retry_at')->nullable();
    $table->timestamps();
    
    $table->index(['tenant_id', 'status']);
    $table->index(['tenant_id', 'type']);
    $table->index(['notifiable_type', 'notifiable_id']);
    $table->index(['uuid']);
});
```

#### **Day 3-4: Advanced Business Features** (2 tasks)
- [ ] Create discount coupons system with flexible rules
- [ ] Create customer reviews and ratings system
```php
// File: database/migrations/create_discount_coupons_table.php
Schema::create('discount_coupons', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
    $table->string('name');
    $table->string('code')->unique();
    $table->text('description')->nullable();
    $table->enum('type', ['percentage', 'fixed_amount', 'free_shipping'])->default('percentage');
    $table->decimal('value', 12, 2); // Percentage or amount
    $table->decimal('minimum_amount', 12, 2)->nullable();
    $table->decimal('maximum_discount', 12, 2)->nullable();
    $table->integer('usage_limit')->nullable(); // Total usage limit
    $table->integer('usage_limit_per_customer')->nullable();
    $table->integer('used_count')->default(0);
    $table->json('applicable_products')->nullable(); // Product IDs
    $table->json('applicable_categories')->nullable(); // Category IDs
    $table->boolean('is_active')->default(true);
    $table->timestamp('starts_at')->nullable();
    $table->timestamp('expires_at')->nullable();
    $table->timestamps();
    
    $table->index(['tenant_id', 'is_active']);
    $table->index(['code']);
    $table->index(['starts_at', 'expires_at']);
});

// File: database/migrations/create_customer_reviews_table.php
Schema::create('customer_reviews', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
    $table->foreignId('customer_id')->constrained('customers');
    $table->foreignId('product_id')->constrained('products');
    $table->foreignId('order_id')->nullable()->constrained('orders');
    $table->integer('rating'); // 1-5 stars
    $table->text('title')->nullable();
    $table->text('content');
    $table->json('images')->nullable(); // Review images
    $table->boolean('is_verified_purchase')->default(false);
    $table->boolean('is_approved')->default(false);
    $table->timestamp('approved_at')->nullable();
    $table->foreignId('approved_by')->nullable()->constrained('users');
    $table->integer('helpful_count')->default(0);
    $table->integer('not_helpful_count')->default(0);
    $table->timestamps();
    
    $table->index(['tenant_id', 'product_id', 'is_approved']);
    $table->index(['customer_id']);
    $table->index(['rating']);
    $table->unique(['customer_id', 'product_id', 'order_id']);
});
```

#### **Day 5: Testing & Documentation** (1 task)
- [ ] Create comprehensive integration tests for all new features
```php
// File: tests/Feature/PaymentRefundCompleteTest.php
class PaymentRefundCompleteTest extends TestCase
{
    use RefreshDatabase;
    
    public function test_complete_refund_workflow()
    {
        // Test complete refund workflow from request to completion
        $order = Order::factory()->create(['payment_status' => 'paid']);
        
        // Create payment transaction
        $transaction = OrderPaymentTransaction::factory()->create([
            'order_id' => $order->id,
            'direction' => 'incoming',
            'amount' => 100000,
            'status' => 'completed'
        ]);
        
        // Initiate refund
        $refund = $this->refundService->initiateRefund([
            'order_id' => $order->id,
            'refund_amount' => 50000,
            'reason' => 'Customer request',
        ]);
        
        $this->assertEquals('pending', $refund->status);
        
        // Approve refund
        $this->refundService->approveRefund($refund);
        $this->assertEquals('completed', $refund->fresh()->status);
        
        // Verify refund transaction created
        $this->assertDatabaseHas('order_payment_transactions', [
            'order_id' => $order->id,
            'direction' => 'outgoing',
            'type' => 'refund',
            'amount' => 50000
        ]);
        
        // Verify order status updated
        $this->assertEquals('partially_refunded', $order->fresh()->payment_status);
    }
}

// Update all previously skipped test methods to pass
```

---

## 🎯 Success Metrics & Completion Criteria

### **Phase 1 Completion (95% → 100%)**
- [ ] All model structure inconsistencies resolved
- [ ] UUID compliance implemented across all tables
- [ ] Architecture documentation updated

### **Phase 2 Completion (90% → 100%)**
- [ ] Password reset system fully functional
- [ ] Email verification system implemented
- [ ] User registration endpoints available
- [ ] All authentication flows tested and documented

### **Phase 3 Extensions Completion**
- [ ] Payment refund system 100% functional (all tests passing)
- [ ] Shipping & logistics system operational
- [ ] File & media management system complete
- [ ] Enhanced notification system with templates
- [ ] Basic advanced business features (coupons, reviews)

### **Testing Requirements**
- [ ] All previously failing tests now pass
- [ ] 95%+ code coverage maintained
- [ ] Integration tests for all new features
- [ ] Performance tests for file upload/processing

### **Documentation Requirements**
- [ ] API documentation updated
- [ ] Database schema documentation
- [ ] Deployment guide updated
- [ ] Feature usage documentation

---

## 🚀 Post-Implementation Roadmap

After completing Phase 3 Extensions, the platform will be 100% production-ready with:

1. **Complete Multi-Tenant Foundation** ✅
2. **Full Authentication & Authorization** ✅  
3. **Complete Business Logic** ✅
4. **Payment & Financial Management** ✅
5. **Shipping & Logistics** ✅
6. **File & Media Management** ✅
7. **Enhanced Communication System** ✅

**Next phases can then proceed:**
- Phase 4: Content Management System
- Phase 5: Advanced Features (Themes, Multi-language)
- Phase 6: Platform Management
- Phase 7: Custom Domain Management  
- Phase 8: Performance & Security Optimization

This comprehensive extension ensures a solid, production-ready foundation before advancing to advanced features.