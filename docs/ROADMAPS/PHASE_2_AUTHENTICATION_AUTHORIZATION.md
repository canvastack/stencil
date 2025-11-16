# Phase 2: Authentication & Authorization System

**Duration**: 3 weeks  
**Priority**: CRITICAL  
**Team**: 2-3 developers (1 senior, 1-2 mid/junior)  
**Dependencies**: Phase 1 (Multi-Tenant Foundation)

## Overview

This phase implements a comprehensive authentication and authorization system that handles both Account A (Platform Owners) and Account B (Tenants) with proper separation, JWT-based authentication, and role-based access control (RBAC) that respects multi-tenant boundaries.

## Architecture Overview

### Authentication Flow
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Laravel API   │    │   Database      │
│                 │    │                  │    │                 │
│ Login Request   │───▶│ 1. Identify      │───▶│ accounts/users  │
│                 │    │    Account Type  │    │                 │
│                 │    │                  │    │                 │
│                 │    │ 2. Validate      │───▶│ Check tenant    │
│                 │    │    Credentials   │    │    status       │
│                 │    │                  │    │                 │
│                 │    │ 3. Generate JWT  │    │                 │
│ JWT + User Info │◀───│    with tenant   │    │                 │
│                 │    │    context       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Authorization Model
- **Account A**: Platform-level permissions + limited tenant oversight
- **Account B**: Full tenant permissions + limited platform interaction
- **Role Inheritance**: System roles vs tenant-specific roles
- **Permission Scoping**: Platform scope vs tenant scope

## Week 1: JWT Authentication System

### Day 1-2: JWT Configuration & User Authentication

#### JWT Service Implementation
```php
// app/Services/Auth/JwtService.php
<?php

namespace App\Services\Auth;

use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use App\Models\Platform\Account;
use App\Models\User;
use App\Models\Tenant;
use Carbon\Carbon;

class JwtService
{
    public function generateTokenForAccount(Account $account): array
    {
        try {
            $payload = [
                'sub' => $account->id,
                'account_type' => 'platform_owner',
                'platform_access' => true,
                'tenant_access' => false,
                'permissions' => $this->getPlatformPermissions($account),
                'iat' => Carbon::now()->timestamp,
                'exp' => Carbon::now()->addHours(24)->timestamp
            ];

            $token = JWTAuth::fromUser($account, $payload);

            return [
                'access_token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => 24 * 60 * 60, // 24 hours
                'user' => $this->formatAccountResponse($account),
                'permissions' => $payload['permissions']
            ];
        } catch (JWTException $e) {
            throw new \Exception('Could not create token: ' . $e->getMessage());
        }
    }

    public function generateTokenForTenantUser(User $user, Tenant $tenant): array
    {
        try {
            $payload = [
                'sub' => $user->id,
                'tenant_id' => $tenant->id,
                'account_type' => 'tenant_user',
                'platform_access' => false,
                'tenant_access' => true,
                'permissions' => $this->getTenantPermissions($user),
                'tenant_data' => [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'status' => $tenant->status,
                    'subscription_status' => $tenant->subscription_status
                ],
                'iat' => Carbon::now()->timestamp,
                'exp' => Carbon::now()->addHours(8)->timestamp // Shorter for tenant users
            ];

            $token = JWTAuth::fromUser($user, $payload);

            return [
                'access_token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => 8 * 60 * 60, // 8 hours
                'user' => $this->formatUserResponse($user),
                'tenant' => $this->formatTenantResponse($tenant),
                'permissions' => $payload['permissions']
            ];
        } catch (JWTException $e) {
            throw new \Exception('Could not create token: ' . $e->getMessage());
        }
    }

    public function refreshToken(): array
    {
        try {
            $newToken = JWTAuth::refresh();
            $payload = JWTAuth::setToken($newToken)->getPayload();
            
            return [
                'access_token' => $newToken,
                'token_type' => 'Bearer',
                'expires_in' => $payload['exp'] - Carbon::now()->timestamp,
                'refreshed_at' => Carbon::now()->toISOString()
            ];
        } catch (JWTException $e) {
            throw new \Exception('Could not refresh token: ' . $e->getMessage());
        }
    }

    public function validateToken(string $token): bool
    {
        try {
            $payload = JWTAuth::setToken($token)->getPayload();
            
            // Additional validation
            if ($payload['account_type'] === 'tenant_user') {
                $tenant = Tenant::find($payload['tenant_id']);
                if (!$tenant || !$tenant->isActive()) {
                    return false;
                }
            }
            
            return true;
        } catch (JWTException $e) {
            return false;
        }
    }

    private function getPlatformPermissions(Account $account): array
    {
        // Get platform-level permissions from config
        $permissions = config('tenant-permissions.account_a_permissions');
        
        // Filter out forbidden permissions
        return array_keys(array_filter($permissions, fn($value) => $value !== false));
    }

    private function getTenantPermissions(User $user): array
    {
        $permissions = [];
        
        foreach ($user->roles as $role) {
            $permissions = array_merge($permissions, $role->abilities ?? []);
        }
        
        return array_unique($permissions);
    }

    private function formatAccountResponse(Account $account): array
    {
        return [
            'id' => $account->id,
            'name' => $account->name,
            'email' => $account->email,
            'account_type' => $account->account_type,
            'status' => $account->status,
            'avatar' => $account->avatar,
            'last_login_at' => $account->last_login_at,
            'settings' => $account->settings
        ];
    }

    private function formatUserResponse(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status,
            'department' => $user->department,
            'location' => $user->location,
            'avatar' => $user->avatar,
            'roles' => $user->roles->pluck('name'),
            'last_login_at' => $user->last_login_at
        ];
    }

    private function formatTenantResponse(Tenant $tenant): array
    {
        return [
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'domain' => $tenant->domain,
            'status' => $tenant->status,
            'subscription_status' => $tenant->subscription_status,
            'public_url' => $tenant->getPublicUrl(),
            'admin_url' => $tenant->getAdminUrl(),
            'subscription' => $tenant->subscription ? [
                'plan_name' => $tenant->subscription->plan_name,
                'features' => $tenant->subscription->features,
                'ends_at' => $tenant->subscription->ends_at
            ] : null
        ];
    }
}
```

#### Authentication Controllers

**Platform Authentication (Account A)**
```php
// app/Http/Controllers/Platform/AuthController.php
<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\LoginRequest;
use App\Models\Platform\Account;
use App\Services\Auth\JwtService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private JwtService $jwtService)
    {
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $key = 'platform-login:' . $request->ip();
        
        // Rate limiting: 5 attempts per minute
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            throw ValidationException::withMessages([
                'email' => ["Too many login attempts. Please try again in {$seconds} seconds."]
            ]);
        }

        $account = Account::where('email', $request->email)->first();

        if (!$account || !Hash::check($request->password, $account->password)) {
            RateLimiter::hit($key, 60);
            
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.']
            ]);
        }

        // Check account status
        if ($account->status !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['Your account is not active. Please contact support.']
            ]);
        }

        // Clear rate limiting on successful login
        RateLimiter::clear($key);
        
        // Update last login
        $account->update(['last_login_at' => now()]);
        
        // Generate JWT token
        $tokenData = $this->jwtService->generateTokenForAccount($account);
        
        // Log successful login
        activity()
            ->performedOn($account)
            ->causedBy($account)
            ->withProperties(['ip_address' => $request->ip()])
            ->log('platform_login');

        return response()->json($tokenData);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->bearerToken();
        
        if ($token) {
            // Invalidate token (add to blacklist)
            JWTAuth::setToken($token)->invalidate();
            
            // Log logout
            activity()
                ->causedBy(auth()->user())
                ->withProperties(['ip_address' => $request->ip()])
                ->log('platform_logout');
        }

        return response()->json(['message' => 'Successfully logged out']);
    }

    public function refresh(Request $request): JsonResponse
    {
        try {
            $tokenData = $this->jwtService->refreshToken();
            return response()->json($tokenData);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Token refresh failed'], 401);
        }
    }

    public function me(Request $request): JsonResponse
    {
        $account = auth()->user();
        
        return response()->json([
            'account' => $account,
            'permissions' => $this->jwtService->getPlatformPermissions($account)
        ]);
    }
}
```

**Tenant Authentication (Account B)**
```php
// app/Http/Controllers/Tenant/AuthController.php
<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\LoginRequest;
use App\Models\User;
use App\Models\Tenant;
use App\Services\Auth\JwtService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private JwtService $jwtService)
    {
    }

    public function login(LoginRequest $request): JsonResponse
    {
        // Get tenant from request context (set by IdentifyTenant middleware)
        $tenant = $request->attributes->get('tenant');
        
        if (!$tenant) {
            return response()->json(['error' => 'Tenant not found'], 404);
        }

        // Check tenant status
        if (!$tenant->isActive()) {
            return response()->json([
                'error' => 'This business account is not active or subscription has expired'
            ], 403);
        }

        $key = "tenant-login:{$tenant->id}:{$request->ip()}";
        
        // Rate limiting: 5 attempts per minute per tenant
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            throw ValidationException::withMessages([
                'email' => ["Too many login attempts. Please try again in {$seconds} seconds."]
            ]);
        }

        // Find user within tenant context
        $user = User::where('tenant_id', $tenant->id)
            ->where('email', $request->email)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            RateLimiter::hit($key, 60);
            
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.']
            ]);
        }

        // Check user status
        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['Your account is not active. Please contact your administrator.']
            ]);
        }

        // Clear rate limiting on successful login
        RateLimiter::clear($key);
        
        // Update last login
        $user->update(['last_login_at' => now()]);
        
        // Generate JWT token
        $tokenData = $this->jwtService->generateTokenForTenantUser($user, $tenant);
        
        // Log successful login
        activity()
            ->performedOn($user)
            ->causedBy($user)
            ->withProperties([
                'tenant_id' => $tenant->id,
                'ip_address' => $request->ip()
            ])
            ->log('tenant_user_login');

        return response()->json($tokenData);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->bearerToken();
        
        if ($token) {
            JWTAuth::setToken($token)->invalidate();
            
            // Log logout
            activity()
                ->causedBy(auth()->user())
                ->withProperties([
                    'tenant_id' => $request->attributes->get('tenant')?->id,
                    'ip_address' => $request->ip()
                ])
                ->log('tenant_user_logout');
        }

        return response()->json(['message' => 'Successfully logged out']);
    }

    public function refresh(Request $request): JsonResponse
    {
        try {
            $tokenData = $this->jwtService->refreshToken();
            return response()->json($tokenData);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Token refresh failed'], 401);
        }
    }

    public function me(Request $request): JsonResponse
    {
        $user = auth()->user();
        $tenant = $request->attributes->get('tenant');
        
        return response()->json([
            'user' => $user,
            'tenant' => $tenant,
            'permissions' => $this->jwtService->getTenantPermissions($user)
        ]);
    }
}
```

### Day 3-4: Password Management & Security

#### Password Reset System
```php
// app/Services/Auth/PasswordResetService.php
<?php

namespace App\Services\Auth;

use App\Models\Platform\Account;
use App\Models\User;
use App\Models\Tenant;
use App\Notifications\Platform\PlatformPasswordReset;
use App\Notifications\Tenant\TenantPasswordReset;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PasswordResetService
{
    public function sendPlatformResetLink(string $email): bool
    {
        $account = Account::where('email', $email)->first();
        
        if (!$account) {
            // Don't reveal if account exists
            return true;
        }

        $token = Str::random(64);
        
        // Store reset token
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token' => Hash::make($token),
                'created_at' => Carbon::now(),
                'account_type' => 'platform'
            ]
        );

        // Send notification
        $account->notify(new PlatformPasswordReset($token));

        return true;
    }

    public function sendTenantResetLink(string $email, Tenant $tenant): bool
    {
        $user = User::where('tenant_id', $tenant->id)
            ->where('email', $email)
            ->first();
        
        if (!$user) {
            // Don't reveal if user exists
            return true;
        }

        $token = Str::random(64);
        
        // Store reset token with tenant context
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email, 'tenant_id' => $tenant->id],
            [
                'token' => Hash::make($token),
                'created_at' => Carbon::now(),
                'account_type' => 'tenant'
            ]
        );

        // Send notification
        $user->notify(new TenantPasswordReset($token, $tenant));

        return true;
    }

    public function resetPlatformPassword(string $token, string $email, string $password): bool
    {
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->where('account_type', 'platform')
            ->first();

        if (!$resetRecord || !Hash::check($token, $resetRecord->token)) {
            return false;
        }

        // Check if token is expired (24 hours)
        if (Carbon::parse($resetRecord->created_at)->addHours(24)->isPast()) {
            return false;
        }

        // Reset password
        $account = Account::where('email', $email)->first();
        if ($account) {
            $account->update(['password' => Hash::make($password)]);
            
            // Delete reset token
            DB::table('password_reset_tokens')
                ->where('email', $email)
                ->where('account_type', 'platform')
                ->delete();
            
            // Log password reset
            activity()
                ->performedOn($account)
                ->causedBy($account)
                ->log('platform_password_reset');
            
            return true;
        }

        return false;
    }

    public function resetTenantPassword(string $token, string $email, string $password, Tenant $tenant): bool
    {
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->where('tenant_id', $tenant->id)
            ->where('account_type', 'tenant')
            ->first();

        if (!$resetRecord || !Hash::check($token, $resetRecord->token)) {
            return false;
        }

        // Check if token is expired (24 hours)
        if (Carbon::parse($resetRecord->created_at)->addHours(24)->isPast()) {
            return false;
        }

        // Reset password
        $user = User::where('tenant_id', $tenant->id)
            ->where('email', $email)
            ->first();
            
        if ($user) {
            $user->update(['password' => Hash::make($password)]);
            
            // Delete reset token
            DB::table('password_reset_tokens')
                ->where('email', $email)
                ->where('tenant_id', $tenant->id)
                ->where('account_type', 'tenant')
                ->delete();
            
            // Log password reset
            activity()
                ->performedOn($user)
                ->causedBy($user)
                ->withProperties(['tenant_id' => $tenant->id])
                ->log('tenant_password_reset');
            
            return true;
        }

        return false;
    }
}
```

## Week 2: Role-Based Access Control (RBAC)

### Day 1-2: Permission System Implementation

#### Permission Management System
```php
// app/Services/Auth/PermissionService.php
<?php

namespace App\Services\Auth;

use App\Models\Role;
use App\Models\Platform\Account;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Support\Collection;

class PermissionService
{
    private array $platformPermissions;
    private array $tenantPermissions;

    public function __construct()
    {
        $this->platformPermissions = config('tenant-permissions.account_a_permissions');
        $this->tenantPermissions = config('tenant-permissions.account_b_permissions');
    }

    public function createSystemRoles(): void
    {
        // Platform system roles (Account A)
        $this->createPlatformRoles();
        
        // Tenant system roles (Account B) - created per tenant
        $tenants = Tenant::all();
        foreach ($tenants as $tenant) {
            $this->createTenantRoles($tenant);
        }
    }

    private function createPlatformRoles(): void
    {
        // Platform Administrator
        Role::updateOrCreate(
            ['slug' => 'platform-admin', 'tenant_id' => null],
            [
                'name' => 'Platform Administrator',
                'description' => 'Full platform management access',
                'is_system' => true,
                'abilities' => array_keys(array_filter(
                    $this->platformPermissions, 
                    fn($value) => $value !== false
                ))
            ]
        );

        // Platform Manager
        Role::updateOrCreate(
            ['slug' => 'platform-manager', 'tenant_id' => null],
            [
                'name' => 'Platform Manager',
                'description' => 'Platform operations management',
                'is_system' => true,
                'abilities' => [
                    'platform.view_analytics',
                    'platform.manage_subscriptions',
                    'tenant.view_basic_info',
                    'tenant.view_usage_stats'
                ]
            ]
        );

        // Platform Support
        Role::updateOrCreate(
            ['slug' => 'platform-support', 'tenant_id' => null],
            [
                'name' => 'Platform Support',
                'description' => 'Customer support access',
                'is_system' => true,
                'abilities' => [
                    'tenant.view_basic_info',
                    'tenant.manage_subscription'
                ]
            ]
        );
    }

    private function createTenantRoles(Tenant $tenant): void
    {
        // Tenant Administrator
        Role::updateOrCreate(
            ['slug' => 'admin', 'tenant_id' => $tenant->id],
            [
                'name' => 'Administrator',
                'description' => 'Full tenant system access',
                'is_system' => true,
                'abilities' => array_keys(array_filter(
                    $this->tenantPermissions,
                    fn($value) => $value !== false
                ))
            ]
        );

        // Business Manager
        Role::updateOrCreate(
            ['slug' => 'manager', 'tenant_id' => $tenant->id],
            [
                'name' => 'Business Manager',
                'description' => 'Business operations management',
                'is_system' => true,
                'abilities' => [
                    'tenant.manage_products',
                    'tenant.manage_orders',
                    'tenant.manage_customers',
                    'tenant.view_reports'
                ]
            ]
        );

        // Sales Representative  
        Role::updateOrCreate(
            ['slug' => 'sales', 'tenant_id' => $tenant->id],
            [
                'name' => 'Sales Representative',
                'description' => 'Sales and customer management',
                'is_system' => true,
                'abilities' => [
                    'tenant.manage_customers',
                    'tenant.create_orders',
                    'tenant.view_products'
                ]
            ]
        );

        // Production Staff
        Role::updateOrCreate(
            ['slug' => 'production', 'tenant_id' => $tenant->id],
            [
                'name' => 'Production Staff',
                'description' => 'Production and order fulfillment',
                'is_system' => true,
                'abilities' => [
                    'tenant.view_orders',
                    'tenant.update_order_status',
                    'tenant.manage_inventory'
                ]
            ]
        );
    }

    public function checkPlatformPermission(Account $account, string $permission): bool
    {
        // Get account roles
        $roles = $account->roles;
        
        foreach ($roles as $role) {
            if (in_array($permission, $role->abilities ?? [])) {
                return true;
            }
        }

        return false;
    }

    public function checkTenantPermission(User $user, string $permission): bool
    {
        // Get user roles within tenant
        $roles = $user->roles;
        
        foreach ($roles as $role) {
            if (in_array($permission, $role->abilities ?? [])) {
                return true;
            }
        }

        return false;
    }

    public function getUserPermissions(User $user): array
    {
        $permissions = [];
        
        foreach ($user->roles as $role) {
            $permissions = array_merge($permissions, $role->abilities ?? []);
        }
        
        return array_unique($permissions);
    }

    public function getAccountPermissions(Account $account): array
    {
        $permissions = [];
        
        foreach ($account->roles as $role) {
            $permissions = array_merge($permissions, $role->abilities ?? []);
        }
        
        return array_unique($permissions);
    }

    public function assignRoleToUser(User $user, string $roleSlug): bool
    {
        $role = Role::where('tenant_id', $user->tenant_id)
            ->where('slug', $roleSlug)
            ->first();
            
        if (!$role) {
            return false;
        }
        
        $user->roles()->syncWithoutDetaching([$role->id]);
        
        // Log role assignment
        activity()
            ->performedOn($user)
            ->causedBy(auth()->user())
            ->withProperties([
                'role_assigned' => $role->name,
                'tenant_id' => $user->tenant_id
            ])
            ->log('role_assigned');
        
        return true;
    }

    public function assignRoleToAccount(Account $account, string $roleSlug): bool
    {
        $role = Role::whereNull('tenant_id')
            ->where('slug', $roleSlug)
            ->first();
            
        if (!$role) {
            return false;
        }
        
        $account->roles()->syncWithoutDetaching([$role->id]);
        
        // Log role assignment
        activity()
            ->performedOn($account)
            ->causedBy(auth()->user())
            ->withProperties(['role_assigned' => $role->name])
            ->log('platform_role_assigned');
        
        return true;
    }
}
```

### Day 3-4: Authorization Middleware & Guards

#### Permission-based Middleware
```php
// app/Http/Middleware/CheckPlatformPermission.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\Auth\PermissionService;

class CheckPlatformPermission
{
    public function __construct(private PermissionService $permissionService)
    {
    }

    public function handle(Request $request, Closure $next, string $permission): mixed
    {
        $account = auth()->user();
        
        if (!$account) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        if (!$this->permissionService->checkPlatformPermission($account, $permission)) {
            return response()->json([
                'error' => 'Insufficient permissions',
                'required_permission' => $permission
            ], 403);
        }

        return $next($request);
    }
}
```

```php
// app/Http/Middleware/CheckTenantPermission.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\Auth\PermissionService;

class CheckTenantPermission
{
    public function __construct(private PermissionService $permissionService)
    {
    }

    public function handle(Request $request, Closure $next, string $permission): mixed
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        if (!$this->permissionService->checkTenantPermission($user, $permission)) {
            return response()->json([
                'error' => 'Insufficient permissions',
                'required_permission' => $permission
            ], 403);
        }

        return $next($request);
    }
}
```

#### Custom Authentication Guards
```php
// config/auth.php additions
<?php

return [
    'guards' => [
        'platform' => [
            'driver' => 'jwt',
            'provider' => 'accounts',
        ],
        'tenant' => [
            'driver' => 'jwt',
            'provider' => 'users',
        ],
    ],
    
    'providers' => [
        'accounts' => [
            'driver' => 'eloquent',
            'model' => App\Models\Platform\Account::class,
        ],
        'users' => [
            'driver' => 'eloquent',
            'model' => App\Models\User::class,
        ],
    ],
];
```

## Week 3: Advanced Security & Integration

### Day 1-2: Two-Factor Authentication (2FA)

#### 2FA Implementation
```php
// app/Services/Auth/TwoFactorService.php
<?php

namespace App\Services\Auth;

use App\Models\Platform\Account;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorService
{
    private Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    public function generateSecretKey(): string
    {
        return $this->google2fa->generateSecretKey();
    }

    public function getQrCodeUrl(string $company, string $holder, string $secret): string
    {
        return $this->google2fa->getQRCodeUrl($company, $holder, $secret);
    }

    public function verifyCode(string $secret, string $code): bool
    {
        return $this->google2fa->verifyKey($secret, $code);
    }

    public function enableTwoFactorForAccount(Account $account, string $code): bool
    {
        if (!$account->two_factor_secret) {
            return false;
        }

        if (!$this->verifyCode($account->two_factor_secret, $code)) {
            return false;
        }

        $account->update([
            'two_factor_enabled' => true,
            'two_factor_recovery_codes' => $this->generateRecoveryCodes()
        ]);

        // Log 2FA enabled
        activity()
            ->performedOn($account)
            ->causedBy($account)
            ->log('two_factor_enabled');

        return true;
    }

    public function enableTwoFactorForUser(User $user, string $code): bool
    {
        if (!$user->two_factor_secret) {
            return false;
        }

        if (!$this->verifyCode($user->two_factor_secret, $code)) {
            return false;
        }

        $user->update([
            'two_factor_enabled' => true,
            'two_factor_recovery_codes' => $this->generateRecoveryCodes()
        ]);

        // Log 2FA enabled
        activity()
            ->performedOn($user)
            ->causedBy($user)
            ->withProperties(['tenant_id' => $user->tenant_id])
            ->log('two_factor_enabled');

        return true;
    }

    private function generateRecoveryCodes(): array
    {
        $codes = [];
        for ($i = 0; $i < 8; $i++) {
            $codes[] = Str::random(10);
        }
        return $codes;
    }
}
```

### Day 3-4: Session Management & Security

#### Comprehensive Session Security
```php
// app/Http/Middleware/SessionSecurity.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;

class SessionSecurity
{
    public function handle(Request $request, Closure $next): mixed
    {
        $user = Auth::user();
        
        if ($user) {
            // Check for concurrent session limits
            $this->checkConcurrentSessions($user, $request);
            
            // Check for suspicious activity
            $this->checkSuspiciousActivity($user, $request);
            
            // Update user activity
            $this->updateUserActivity($user, $request);
        }

        return $next($request);
    }

    private function checkConcurrentSessions($user, Request $request): void
    {
        $userType = $user instanceof \App\Models\Platform\Account ? 'platform' : 'tenant';
        $sessionKey = "active_sessions:{$userType}:{$user->id}";
        $currentSessionId = $request->session()->getId();
        
        // Get active sessions
        $activeSessions = Cache::get($sessionKey, []);
        
        // Add current session
        $activeSessions[$currentSessionId] = [
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'last_activity' => now()->timestamp
        ];

        // Remove old sessions (older than 24 hours)
        $activeSessions = array_filter($activeSessions, function ($session) {
            return (now()->timestamp - $session['last_activity']) < 86400;
        });

        // Limit concurrent sessions (3 for platform, 5 for tenant)
        $maxSessions = $userType === 'platform' ? 3 : 5;
        
        if (count($activeSessions) > $maxSessions) {
            // Remove oldest sessions
            uasort($activeSessions, fn($a, $b) => $a['last_activity'] <=> $b['last_activity']);
            $activeSessions = array_slice($activeSessions, -$maxSessions, null, true);
        }

        Cache::put($sessionKey, $activeSessions, 86400); // 24 hours
    }

    private function checkSuspiciousActivity($user, Request $request): void
    {
        $userType = $user instanceof \App\Models\Platform\Account ? 'platform' : 'tenant';
        $activityKey = "user_activity:{$userType}:{$user->id}";
        
        $lastActivity = Cache::get($activityKey);
        
        if ($lastActivity) {
            // Check for unusual location/IP changes
            if ($lastActivity['ip_address'] !== $request->ip()) {
                // Log IP change
                activity()
                    ->performedOn($user)
                    ->causedBy($user)
                    ->withProperties([
                        'old_ip' => $lastActivity['ip_address'],
                        'new_ip' => $request->ip(),
                        'user_agent' => $request->userAgent()
                    ])
                    ->log('suspicious_ip_change');
            }
        }
    }

    private function updateUserActivity($user, Request $request): void
    {
        $userType = $user instanceof \App\Models\Platform\Account ? 'platform' : 'tenant';
        $activityKey = "user_activity:{$userType}:{$user->id}";
        
        Cache::put($activityKey, [
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'last_activity' => now()->timestamp,
            'session_id' => $request->session()->getId()
        ], 86400);
    }
}
```

### Integration with Frontend

#### API Routes Configuration
```php
// routes/platform.php (Account A routes)
<?php

use App\Http\Controllers\Platform\AuthController;
use App\Http\Controllers\Platform\TenantController;

Route::prefix('platform')->group(function () {
    // Authentication routes
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    
    // Protected routes
    Route::middleware(['auth:platform'])->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        
        // Tenant management (with permission checks)
        Route::middleware(['permission:platform.manage_tenants'])->group(function () {
            Route::get('/tenants', [TenantController::class, 'index']);
            Route::post('/tenants', [TenantController::class, 'store']);
            Route::put('/tenants/{tenant}', [TenantController::class, 'update']);
            Route::delete('/tenants/{tenant}', [TenantController::class, 'destroy']);
        });
        
        // Analytics (with permission checks)
        Route::middleware(['permission:platform.view_analytics'])->group(function () {
            Route::get('/analytics', [AnalyticsController::class, 'index']);
        });
    });
});
```

```php
// routes/tenant.php (Account B routes)
<?php

use App\Http\Controllers\Tenant\AuthController;
use App\Http\Controllers\Tenant\DashboardController;
use App\Http\Controllers\Tenant\UserController;

Route::middleware(['identify.tenant'])->group(function () {
    // Authentication routes
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    
    // Protected routes
    Route::middleware(['auth:tenant', 'tenant.isolation'])->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::get('/dashboard', [DashboardController::class, 'index']);
        
        // User management (with permission checks)
        Route::middleware(['permission:tenant.manage_users'])->group(function () {
            Route::get('/users', [UserController::class, 'index']);
            Route::post('/users', [UserController::class, 'store']);
            Route::put('/users/{user}', [UserController::class, 'update']);
        });
    });
});
```

## Comprehensive Testing Suite

### Authentication Tests
```php
// tests/Feature/Auth/PlatformAuthTest.php
<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;
use App\Models\Platform\Account;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PlatformAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_platform_login_success(): void
    {
        $account = Account::factory()->create([
            'email' => 'admin@canvastencil.com',
            'password' => bcrypt('password123')
        ]);

        $response = $this->postJson('/platform/login', [
            'email' => 'admin@canvastencil.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'access_token',
                'token_type',
                'expires_in',
                'user',
                'permissions'
            ]);
    }

    public function test_platform_login_invalid_credentials(): void
    {
        $response = $this->postJson('/platform/login', [
            'email' => 'admin@canvastencil.com',
            'password' => 'wrongpassword'
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_platform_logout(): void
    {
        $account = Account::factory()->create();
        $token = auth('platform')->login($account);

        $response = $this->withToken($token)
            ->postJson('/platform/logout');

        $response->assertStatus(200);
    }
}
```

```php
// tests/Feature/Auth/TenantAuthTest.php
<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TenantAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_user_login_success(): void
    {
        $tenant = Tenant::factory()->create(['slug' => 'testcompany']);
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'user@testcompany.com',
            'password' => bcrypt('password123')
        ]);

        $response = $this->postJson('/testcompany/login', [
            'email' => 'user@testcompany.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'access_token',
                'token_type', 
                'expires_in',
                'user',
                'tenant',
                'permissions'
            ]);
    }

    public function test_tenant_data_isolation_in_auth(): void
    {
        $tenant1 = Tenant::factory()->create(['slug' => 'company1']);
        $tenant2 = Tenant::factory()->create(['slug' => 'company2']);
        
        $user1 = User::factory()->create([
            'tenant_id' => $tenant1->id,
            'email' => 'user@same-email.com'
        ]);
        
        $user2 = User::factory()->create([
            'tenant_id' => $tenant2->id,
            'email' => 'user@same-email.com'
        ]);

        // Login to tenant1
        $response = $this->postJson('/company1/login', [
            'email' => 'user@same-email.com',
            'password' => 'password'
        ]);

        $response->assertStatus(200);
        $this->assertEquals($tenant1->id, $response->json('tenant.id'));
    }
}
```

## Deliverables & Success Criteria

### Week 1 Deliverables
- [ ] JWT authentication service with multi-tenant support
- [ ] Separate authentication controllers for Account A and Account B
- [ ] Password reset system with tenant isolation
- [ ] Token validation and refresh mechanisms
- [ ] Rate limiting and security measures

### Week 2 Deliverables
- [ ] Complete RBAC system with predefined roles
- [ ] Permission service with platform/tenant separation
- [ ] Authorization middleware for route protection
- [ ] Role assignment and management APIs
- [ ] Dynamic permission checking system

### Week 3 Deliverables
- [ ] Two-factor authentication implementation
- [ ] Session management and security controls
- [ ] Comprehensive security middleware
- [ ] Integration with frontend authentication flows
- [ ] Complete test coverage for authentication/authorization

### Success Criteria
1. **Authentication**: Secure login/logout for both account types
2. **Authorization**: Proper permission enforcement with 0% false positives
3. **Security**: Pass security audit with 0 critical vulnerabilities
4. **Performance**: Authentication < 100ms, authorization < 50ms
5. **Testing**: 95%+ test coverage for all auth functionality
6. **Documentation**: Complete API documentation and integration guides

### Security Checklist
- [ ] Password hashing using bcrypt with proper salt
- [ ] JWT tokens with appropriate expiration times
- [ ] Rate limiting on authentication endpoints
- [ ] Two-factor authentication for sensitive accounts
- [ ] Session hijacking prevention
- [ ] Cross-tenant authentication isolation verified
- [ ] Audit logging for all authentication events
- [ ] Password reset token security implemented

---

**Next Phase**: [Phase 3: Core Business Logic](./PHASE_3_CORE_BUSINESS_LOGIC.md)