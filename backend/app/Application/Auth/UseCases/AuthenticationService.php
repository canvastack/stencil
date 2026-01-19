<?php

namespace App\Application\Auth\UseCases;

use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class AuthenticationService
{
    /**
     * Authenticate Platform Account (Account A)
     */
    public function authenticatePlatformAccount(string $email, string $password, string $ipAddress): array
    {
        $key = 'platform-login:' . $ipAddress;
        
        // Rate limiting: 5 attempts per minute
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            throw ValidationException::withMessages([
                'email' => ["Too many login attempts. Please try again in {$seconds} seconds."]
            ]);
        }

        // Check if this email belongs to a tenant user (not platform account)
        $tenantUser = UserEloquentModel::whereRaw('LOWER(email) = LOWER(?)', [$email])->first();
        if ($tenantUser) {
            RateLimiter::hit($key, 60);
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials for platform login.']
            ]);
        }

        $account = AccountEloquentModel::whereRaw('LOWER(email) = LOWER(?)', [$email])->first();

        if (!$account || !Hash::check($password, $account->password)) {
            RateLimiter::hit($key, 60);
            
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials. Please check your email and password.']
            ]);
        }

        // Check account status
        if (!$account->isActive()) {
            throw ValidationException::withMessages([
                'email' => ['Your account is not active. Please contact support.']
            ]);
        }

        // Clear rate limiting on successful login
        RateLimiter::clear($key);
        
        // Update last login
        $account->updateLastLogin();
        
        // Generate token with platform permissions
        $token = $this->generatePlatformToken($account);
        
        return [
            'access_token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'expires_in' => 24 * 60 * 60, // 24 hours
            'account' => $this->formatAccountResponse($account),
            'permissions' => $this->getPlatformAccountPermissions($account),
            'account_type' => 'platform_owner'
        ];
    }

    /**
     * Authenticate Tenant User (Account B)
     */
    public function authenticateTenantUser(string $email, string $password, string $tenantId, string $ipAddress): array
    {
        $tenant = TenantEloquentModel::find($tenantId);
        
        if (!$tenant) {
            throw ValidationException::withMessages([
                'email' => ['Tenant not found.']
            ]);
        }

        // Check tenant status
        if (!$tenant->isActive()) {
            throw ValidationException::withMessages([
                'email' => ['This business account is not active or subscription has expired.']
            ]);
        }

        $key = "tenant-login:{$tenantId}:{$ipAddress}";
        
        // Rate limiting: 5 attempts per minute per tenant
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            throw ValidationException::withMessages([
                'email' => ["Too many login attempts. Please try again in {$seconds} seconds."]
            ]);
        }

        // Check if this email belongs to a platform account (not tenant user)
        $platformAccount = AccountEloquentModel::whereRaw('LOWER(email) = LOWER(?)', [$email])->first();
        if ($platformAccount) {
            RateLimiter::hit($key, 60);
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials for tenant login.']
            ]);
        }

        // Find user within tenant context
        $user = UserEloquentModel::where('tenant_id', $tenantId)
            ->whereRaw('LOWER(email) = LOWER(?)', [$email])
            ->first();

        if (!$user || !Hash::check($password, $user->password)) {
            RateLimiter::hit($key, 60);
            
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials. Please check your email and password.']
            ]);
        }

        // Check user status
        if (!$user->isActive()) {
            throw ValidationException::withMessages([
                'email' => ['Your account is not active. Please contact your administrator.']
            ]);
        }

        // Clear rate limiting on successful login
        RateLimiter::clear($key);
        
        // Update last login
        $user->updateLastLogin();
        
        // Set permissions team ID for multi-tenant role access
        setPermissionsTeamId($user->tenant_id);
        
        // Generate token with tenant permissions
        $token = $this->generateTenantToken($user, $tenant);
        
        return [
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'expires_in' => 8 * 60 * 60, // 8 hours
            'user' => $this->formatUserResponse($user),
            'tenant' => $this->formatTenantResponse($tenant),
            'permissions' => $user->getAllPermissions(),
            'roles' => $user->roles->pluck('name')->toArray(),
            'account_type' => 'tenant_user'
        ];
    }

    /**
     * Refresh Token
     */
    public function refreshToken($user): array
    {
        // Revoke current token
        $user->currentAccessToken()->delete();
        
        if ($user instanceof AccountEloquentModel) {
            $token = $this->generatePlatformToken($user);
            return [
                'access_token' => $token->plainTextToken,
                'token_type' => 'Bearer',
                'expires_in' => 24 * 60 * 60,
                'account_type' => 'platform'
            ];
        } else {
            $tenant = $user->tenant;
            $token = $this->generateTenantToken($user, $tenant);
            return [
                'access_token' => $token->plainTextToken,
                'token_type' => 'Bearer', 
                'expires_in' => 8 * 60 * 60,
                'account_type' => 'tenant'
            ];
        }
    }

    /**
     * Logout User
     */
    public function logout($user): void
    {
        // Try to get the current token
        $currentToken = $user->currentAccessToken();
        
        if ($currentToken) {
            // Delete the specific token
            $currentToken->delete();
        } else {
            // If no current token, delete all tokens for this user
            $user->tokens()->delete();
        }
    }

    /**
     * Generate Platform Token
     */
    private function generatePlatformToken(AccountEloquentModel $account)
    {
        return $account->createToken('platform-token', [
            'platform:read',
            'platform:write', 
            'tenants:manage',
            'analytics:view'
        ]);
    }

    /**
     * Generate Tenant Token
     */
    private function generateTenantToken(UserEloquentModel $user, TenantEloquentModel $tenant)
    {
        $abilities = array_merge(
            ['tenant:access'],
            $user->getAllPermissions()
        );
        
        return $user->createToken("tenant-{$tenant->id}-token", $abilities);
    }

    /**
     * Get Platform Permissions
     */
    private function getPlatformPermissions(AccountEloquentModel $account): array
    {
        return $this->getPlatformAccountPermissions($account);
    }
    
    /**
     * Get Platform Account Permissions from Roles
     */
    public function getPlatformAccountPermissions(AccountEloquentModel $account): array
    {
        // Load roles if not already loaded
        if (!$account->relationLoaded('roles')) {
            $account->load('roles');
        }
        
        // Collect all abilities from all roles
        $permissions = collect();
        foreach ($account->roles as $role) {
            $abilities = $role->abilities ?? [];
            
            // Handle both array and JSON string cases (defensive)
            if (is_string($abilities)) {
                $abilities = json_decode($abilities, true) ?? [];
            }
            
            if (is_array($abilities)) {
                $permissions = $permissions->merge($abilities);
            }
        }
        
        return $permissions->unique()->values()->toArray();
    }

    /**
     * Format Account Response
     */
    private function formatAccountResponse(AccountEloquentModel $account): array
    {
        return [
            'id' => $account->id,
            'uuid' => $account->uuid,
            'name' => $account->name,
            'email' => $account->email,
            'email_verified_at' => $account->email_verified_at?->toISOString(),
            'account_type' => $account->account_type,
            'status' => $account->status,
            'avatar' => $account->avatar,
            'last_login_at' => $account->last_login_at?->toISOString(),
            'settings' => $account->settings,
            'created_at' => $account->created_at?->toISOString(),
            'updated_at' => $account->updated_at?->toISOString()
        ];
    }

    /**
     * Format User Response
     */
    private function formatUserResponse(UserEloquentModel $user): array
    {
        // Load roles if not already loaded
        if (!$user->relationLoaded('roles')) {
            $user->load('roles');
        }
        
        return [
            'id' => $user->id,
            'uuid' => $user->uuid,
            'tenant_id' => $user->tenant_id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status,
            'department' => $user->department,
            'location' => $user->location,
            'avatar' => $user->avatar,
            'email_verified_at' => $user->email_verified_at?->toISOString(),
            'created_at' => $user->created_at?->toISOString(),
            'updated_at' => $user->updated_at?->toISOString(),
            'last_login_at' => $user->last_login_at?->toISOString()
        ];
    }

    /**
     * Format Tenant Response
     */
    private function formatTenantResponse(TenantEloquentModel $tenant): array
    {
        return [
            'id' => $tenant->id,
            'uuid' => $tenant->uuid,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'domain' => $tenant->domain,
            'status' => $tenant->status,
            'subscription_status' => $tenant->subscription_status,
            'public_url' => $tenant->getPublicUrl(),
            'admin_url' => $tenant->getAdminUrl(),
            'is_active' => $tenant->isActive(),
            'is_on_trial' => $tenant->isOnTrial(),
        ];
    }
}