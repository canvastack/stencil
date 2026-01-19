<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class TenantAuthController extends Controller
{
    /**
     * Register a new tenant user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'tenant_name' => 'required|string|max:255',
            'tenant_slug' => 'required|string|max:100|unique:tenants,slug',
            'tenant_domain' => 'nullable|string|max:255|unique:tenants,domain'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Create tenant first
            $tenant = TenantEloquentModel::create([
                'uuid' => Str::uuid(),
                'name' => $request->tenant_name,
                'slug' => $request->tenant_slug,
                'domain' => $request->tenant_domain ?? $request->tenant_slug . '.canvastencil.com',
                'status' => 'active',
                'subscription_status' => 'trial',
                'subscription_plan' => 'starter',
                'trial_ends_at' => now()->addDays(30),
                'settings' => json_encode([
                    'timezone' => 'Asia/Jakarta',
                    'currency' => 'IDR',
                    'language' => 'id'
                ])
            ]);

            // Create user for the tenant
            $user = UserEloquentModel::create([
                'uuid' => Str::uuid(),
                'name' => $request->name,
                'email' => $request->email,
                'email_verified_at' => now(),
                'password' => Hash::make($request->password),
                'tenant_id' => $tenant->id,
                'role' => 'admin', // First user is admin
                'status' => 'active'
            ]);

            // Create access token
            $token = $user->createToken('tenant-access-token', ['*'])->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Registration successful',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'uuid' => $user->uuid,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'status' => $user->status
                    ],
                    'tenant' => [
                        'id' => $tenant->id,
                        'uuid' => $tenant->uuid,
                        'name' => $tenant->name,
                        'slug' => $tenant->slug,
                        'domain' => $tenant->domain,
                        'status' => $tenant->status,
                        'subscription_status' => $tenant->subscription_status,
                        'subscription_plan' => $tenant->subscription_plan
                    ],
                    'access_token' => $token,
                    'token_type' => 'Bearer'
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Login tenant user
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
            'tenant_slug' => 'nullable|string',
            'account_type' => 'nullable|string|in:platform,tenant'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $accountType = $request->account_type ?? 'tenant';
            
            if ($accountType === 'platform') {
                // Handle platform login
                $account = AccountEloquentModel::where('email', $request->email)
                    ->where('status', 'active')
                    ->first();

                if (!$account || !Hash::check($request->password, $account->password)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid credentials'
                    ], 401);
                }

                // Revoke existing tokens for security
                $account->tokens()->delete();

                // Create new access token
                $token = $account->createToken('platform-access-token', ['*'])->plainTextToken;

                return response()->json([
                    'success' => true,
                    'message' => 'Login successful',
                    'data' => [
                        'account' => [
                            'id' => $account->id,
                            'uuid' => $account->uuid,
                            'name' => $account->name,
                            'email' => $account->email,
                            'account_type' => $account->account_type,
                            'status' => $account->status
                        ],
                        'access_token' => $token,
                        'token_type' => 'Bearer'
                    ]
                ], 200);
            }

            // Handle tenant login
            $userQuery = UserEloquentModel::where('email', $request->email)
                ->where('status', 'active');

            // If tenant_slug is provided, filter by tenant
            if ($request->tenant_slug) {
                $tenant = TenantEloquentModel::where('slug', $request->tenant_slug)
                    ->where('status', 'active')
                    ->first();

                if (!$tenant) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Tenant not found or inactive'
                    ], 404);
                }

                $userQuery->where('tenant_id', $tenant->id);
            }

            $user = $userQuery->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ], 401);
            }

            // Set permissions team ID BEFORE loading roles for multi-tenant access
            setPermissionsTeamId($user->tenant_id);  // ← Must be first!

            // Load tenant and roles relationships
            $user->load('tenant', 'roles');

            // Revoke existing tokens for security
            $user->tokens()->delete();
            
            // Create new access token
            $token = $user->createToken('tenant-access-token', ['*'])->plainTextToken;

            // Get all permissions from user roles
            $permissions = $user->getAllPermissions();
            $roles = $user->roles->pluck('slug')->toArray();

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'uuid' => $user->uuid,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'status' => $user->status
                    ],
                    'tenant' => [
                        'id' => $user->tenant->id,
                        'uuid' => $user->tenant->uuid,
                        'name' => $user->tenant->name,
                        'slug' => $user->tenant->slug,
                        'domain' => $user->tenant->domain,
                        'status' => $user->tenant->status,
                        'subscription_status' => $user->tenant->subscription_status,
                        'subscription_plan' => $user->tenant->subscription_plan
                    ],
                    'permissions' => $permissions,
                    'roles' => $roles,
                    'access_token' => $token,
                    'token_type' => 'Bearer'
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Login failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Logout tenant user
     */
    public function logout(Request $request)
    {
        try {
            // Revoke current access token
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logout successful'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get authenticated user info
     */
    public function me(Request $request)
    {
        try {
            $user = $request->user();
            $user->load('tenant');

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'uuid' => $user->uuid,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'status' => $user->status
                    ],
                    'tenant' => [
                        'id' => $user->tenant->id,
                        'uuid' => $user->tenant->uuid,
                        'name' => $user->tenant->name,
                        'slug' => $user->tenant->slug,
                        'domain' => $user->tenant->domain,
                        'status' => $user->tenant->status,
                        'subscription_status' => $user->tenant->subscription_status,
                        'subscription_plan' => $user->tenant->subscription_plan
                    ]
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get user info',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}