<?php

namespace App\Application\Auth\Services;

use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\RoleEloquentModel;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Application\Auth\Services\EmailVerificationService;
use App\Mail\Auth\WelcomeUserMail;
use Illuminate\Support\Facades\Mail;

class RegistrationService
{
    public function __construct(
        private EmailVerificationService $emailVerificationService
    ) {}

    /**
     * Register a new tenant user
     */
    public function registerTenantUser(array $data, string $tenantId): UserEloquentModel
    {
        $tenant = TenantEloquentModel::findOrFail($tenantId);
        
        // Check tenant limits and status
        if (!$this->canCreateUser($tenant)) {
            throw ValidationException::withMessages([
                'tenant' => ['Cannot create user for this tenant. Check tenant status and user limits.']
            ]);
        }
        
        // Check if email already exists for this tenant
        $existingUser = UserEloquentModel::where('email', $data['email'])
            ->where('tenant_id', $tenantId)
            ->first();
            
        if ($existingUser) {
            throw ValidationException::withMessages([
                'email' => ['A user with this email already exists for this tenant.']
            ]);
        }
        
        // Create user
        $user = UserEloquentModel::create([
            'tenant_id' => $tenantId,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'department' => $data['department'] ?? null,
            'location' => $data['location'] ?? null,
            'status' => 'active',
        ]);
        
        // Assign default role
        $this->assignDefaultRole($user, $tenant);
        
        // Send email verification
        $this->emailVerificationService->sendVerification($user);
        
        // Send welcome email
        $this->sendWelcomeEmail($user, $tenant);
        
        return $user;
    }
    
    /**
     * Register a new platform account
     */
    public function registerPlatformAccount(array $data): AccountEloquentModel
    {
        // Check if email already exists
        $existingAccount = AccountEloquentModel::where('email', $data['email'])->first();
        
        if ($existingAccount) {
            throw ValidationException::withMessages([
                'email' => ['An account with this email already exists.']
            ]);
        }
        
        // Create platform account
        $account = AccountEloquentModel::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'account_type' => $data['account_type'] ?? 'platform_owner',
            'status' => 'active',
        ]);
        
        // Assign platform role
        $this->assignPlatformRole($account, $data['account_type'] ?? 'platform_owner');
        
        // Send email verification
        $this->emailVerificationService->sendVerification($account);
        
        // Send welcome email
        $this->sendWelcomeEmail($account);
        
        return $account;
    }
    
    /**
     * Register tenant admin (creates both tenant and admin user)
     */
    public function registerTenantWithAdmin(array $tenantData, array $adminData): array
    {
        // Validate tenant domain/slug uniqueness
        $existingTenant = TenantEloquentModel::where('domain', $tenantData['domain'])
            ->orWhere('slug', $tenantData['slug'])
            ->first();
            
        if ($existingTenant) {
            throw ValidationException::withMessages([
                'domain' => ['Domain or slug already exists.']
            ]);
        }
        
        // Create tenant
        $tenant = TenantEloquentModel::create([
            'name' => $tenantData['name'],
            'slug' => $tenantData['slug'],
            'domain' => $tenantData['domain'],
            'database_name' => $tenantData['database_name'] ?? 'tenant_' . $tenantData['slug'],
            'status' => 'active',
            'subscription_status' => $tenantData['subscription_status'] ?? 'trial',
        ]);
        
        // Create admin user for the tenant
        $adminUser = $this->registerTenantUser($adminData, $tenant->id);
        
        // Assign admin role
        $adminRole = RoleEloquentModel::where('tenant_id', $tenant->id)
            ->where('slug', 'admin')
            ->first();
            
        if ($adminRole) {
            $adminUser->roles()->sync([$adminRole->id]);
        }
        
        return [
            'tenant' => $tenant,
            'admin_user' => $adminUser,
        ];
    }
    
    /**
     * Validate registration data for tenant user
     */
    public function validateTenantUserData(array $data): array
    {
        return validator($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'department' => 'nullable|string|max:100',
            'location' => 'nullable|array',
        ])->validate();
    }
    
    /**
     * Validate registration data for platform account
     */
    public function validatePlatformAccountData(array $data): array
    {
        return validator($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:8|confirmed',
            'account_type' => 'nullable|in:platform_owner,platform_manager',
        ])->validate();
    }
    
    /**
     * Validate tenant creation data
     */
    public function validateTenantData(array $data): array
    {
        return validator($data, [
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:50|alpha_dash',
            'domain' => 'required|string|max:255|unique:tenants,domain',
            'database_name' => 'nullable|string|max:100',
            'subscription_status' => 'nullable|in:trial,basic,premium,enterprise',
        ])->validate();
    }
    
    /**
     * Check if tenant can create new users
     */
    private function canCreateUser(TenantEloquentModel $tenant): bool
    {
        // Check tenant status
        if ($tenant->status !== 'active') {
            return false;
        }
        
        // Check user limits based on subscription tier
        $currentUserCount = UserEloquentModel::where('tenant_id', $tenant->id)->count();
        $userLimit = $this->getUserLimitForTier($tenant->subscription_status);
        
        return $userLimit === null || $currentUserCount < $userLimit;
    }
    
    /**
     * Get user limit for subscription tier
     */
    private function getUserLimitForTier(?string $tier): ?int
    {
        return match($tier) {
            'trial' => 5,
            'basic' => 25,
            'premium' => 100,
            'enterprise' => null, // unlimited
            default => 5,
        };
    }
    
    /**
     * Assign default role to tenant user
     */
    private function assignDefaultRole(UserEloquentModel $user, TenantEloquentModel $tenant): void
    {
        $defaultRole = RoleEloquentModel::where('tenant_id', $tenant->id)
            ->where('slug', 'user')
            ->first();
            
        if ($defaultRole) {
            $user->roles()->attach($defaultRole);
        }
    }
    
    /**
     * Assign platform role to account
     */
    private function assignPlatformRole(AccountEloquentModel $account, string $accountType): void
    {
        $roleSlug = match($accountType) {
            'platform_owner' => 'platform-owner',
            'platform_manager' => 'platform-manager',
            default => 'platform-manager',
        };
        
        $platformRole = RoleEloquentModel::whereNull('tenant_id')
            ->where('slug', $roleSlug)
            ->first();
            
        if ($platformRole) {
            $account->roles()->attach($platformRole);
        }
    }
    
    /**
     * Check if email is available for registration
     */
    public function isEmailAvailable(string $email, ?string $tenantId = null): bool
    {
        if ($tenantId) {
            // Check within tenant scope
            return !UserEloquentModel::where('email', $email)
                ->where('tenant_id', $tenantId)
                ->exists();
        } else {
            // Check for platform account
            return !AccountEloquentModel::where('email', $email)->exists();
        }
    }
    
    /**
     * Get registration statistics for tenant
     */
    public function getRegistrationStats(string $tenantId): array
    {
        $tenant = TenantEloquentModel::findOrFail($tenantId);
        $userCount = UserEloquentModel::where('tenant_id', $tenantId)->count();
        $userLimit = $this->getUserLimitForTier($tenant->subscription_status);
        
        return [
            'current_users' => $userCount,
            'user_limit' => $userLimit,
            'can_create_users' => $this->canCreateUser($tenant),
            'subscription_status' => $tenant->subscription_status,
        ];
    }
    
    /**
     * Send welcome email to user
     */
    private function sendWelcomeEmail($user, ?TenantEloquentModel $tenant = null): void
    {
        try {
            $tenantId = $tenant?->id;
            $options = [];
            
            if ($tenant) {
                $options = [
                    'tenant_name' => $tenant->name,
                    'tenant_domain' => $tenant->domain,
                    'user_role' => $this->getUserRole($user, $tenant),
                ];
            } else {
                $options = [
                    'user_role' => $this->getPlatformRole($user),
                ];
            }
            
            Mail::to($user->email)->queue(new WelcomeUserMail($user, $tenantId, $options));
        } catch (\Exception $e) {
            \Log::error('Failed to send welcome email', [
                'user_email' => $user->email,
                'tenant_id' => $tenant?->id,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get user role display name
     */
    private function getUserRole($user, TenantEloquentModel $tenant): string
    {
        $roles = $user->roles()->where('tenant_id', $tenant->id)->pluck('name')->toArray();
        return !empty($roles) ? implode(', ', $roles) : 'User';
    }
    
    /**
     * Get platform role display name
     */
    private function getPlatformRole($user): string
    {
        $roles = $user->roles()->whereNull('tenant_id')->pluck('name')->toArray();
        return !empty($roles) ? implode(', ', $roles) : 'Platform User';
    }
}