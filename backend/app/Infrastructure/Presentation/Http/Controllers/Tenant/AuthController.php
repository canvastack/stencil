<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Application\Auth\UseCases\AuthenticationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private AuthenticationService $authService)
    {
    }

    /**
     * Tenant User Login (Account B)
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:6',
            'tenant_id' => 'nullable|exists:tenants,id',
            'tenant_slug' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$request->tenant_id && !$request->tenant_slug) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => ['tenant_id' => ['Either tenant_id or tenant_slug is required']]
            ], 422);
        }

        try {
            $tenantId = $request->tenant_id;
            
            if ($request->tenant_slug && !$tenantId) {
                $tenant = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::where('slug', $request->tenant_slug)->first();
                if (!$tenant) {
                    return response()->json([
                        'message' => 'Validation failed',
                        'errors' => ['tenant_slug' => ['Tenant not found']]
                    ], 422);
                }
                $tenantId = $tenant->id;
            }

            $tokenData = $this->authService->authenticateTenantUser(
                $request->email,
                $request->password,
                $tenantId,
                $request->ip()
            );
            
            // Log successful login
            // activity()
            //     ->causedBy($tokenData['user']['id'])
            //     ->withProperties([
            //         'ip_address' => $request->ip(),
            //         'tenant_id' => $request->tenant_id
            //     ])
            //     ->log('tenant_user_login');

            // Transform response to match expected format  
            $user = $tokenData['user'];
            $user['permissions'] = $tokenData['permissions'];
            
            $response = [
                'token' => $tokenData['token'],
                'token_type' => $tokenData['token_type'],
                'expires_in' => $tokenData['expires_in'],
                'user' => $user,
                'tenant' => $tokenData['tenant'],
                'permissions' => $tokenData['permissions'], // For unit tests
                'roles' => $tokenData['roles'],
                'account_type' => $tokenData['account_type']
            ];
            
            return response()->json($response);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Authentication failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 403);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Login failed',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Tenant Context Login (using middleware-detected tenant)
     */
    public function contextLogin(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Get tenant from middleware context
        $tenant = $request->attributes->get('tenant') ?? 
                  $request->get('current_tenant') ?? 
                  app('tenant.context') ?? 
                  null;
        
        if (!$tenant) {
            return response()->json([
                'message' => 'Tenant context not found',
                'error' => 'Invalid tenant context'
            ], 404);
        }

        try {
            $tokenData = $this->authService->authenticateTenantUser(
                $request->email,
                $request->password,
                $tenant->id,
                $request->ip()
            );
            
            // Log successful login
            // activity()
            //     ->causedBy($tokenData['user']['id'])
            //     ->withProperties([
            //         'ip_address' => $request->ip(),
            //         'tenant_id' => $tenant->id,
            //         'tenant_slug' => $tenant->slug
            //     ])
            //     ->log('tenant_user_context_login');

            // Transform response to match expected format
            $user = $tokenData['user'];
            $user['permissions'] = $tokenData['permissions'];
            
            $response = [
                'token' => $tokenData['token'],
                'token_type' => $tokenData['token_type'],
                'expires_in' => $tokenData['expires_in'],
                'user' => $user,
                'tenant' => $tokenData['tenant'],
                'permissions' => $tokenData['permissions'], // For unit tests
                'roles' => $tokenData['roles'],
                'account_type' => $tokenData['account_type']
            ];
            
            return response()->json($response);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Authentication failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 403);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Login failed',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Tenant User Logout
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $this->authService->logout($user);
            
            // Log logout
            // activity()
            //     ->causedBy($user)
            //     ->withProperties([
            //         'ip_address' => $request->ip(),
            //         'tenant_id' => $user->tenant_id
            //     ])
            //     ->log('tenant_user_logout');

            return response()->json([
                'message' => 'Successfully logged out'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Logout failed',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Refresh Tenant Token
     */
    public function refresh(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $tokenData = $this->authService->refreshToken($user);
            
            return response()->json($tokenData);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Token refresh failed',
                'error' => 'An unexpected error occurred'
            ], 401);
        }
    }

    /**
     * Get Current Tenant User Info
     */
    public function me(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Load roles if not already loaded
            if (!$user->relationLoaded('roles')) {
                $user->load('roles');
            }
            
            $tenant = $user->tenant;
            
            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'tenant_id' => $user->tenant_id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'status' => $user->status,
                    'department' => $user->department,
                    'location' => $user->location,
                    'avatar' => $user->avatar,
                    'last_login_at' => $user->last_login_at?->toISOString()
                ],
                'tenant' => [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'domain' => $tenant->domain,
                    'status' => $tenant->status,
                    'subscription_status' => $tenant->subscription_status,
                    'public_url' => $tenant->getPublicUrl(),
                    'admin_url' => $tenant->getAdminUrl()
                ],
                'permissions' => $user->getAllPermissions(),
                'roles' => $user->roles->pluck('name')->toArray(),
                'account_type' => 'tenant'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve user information',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Validate Tenant Token
     */
    public function validateToken(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $tenant = $user->tenant;
            
            if (!$user || !$user->isActive() || !$tenant->isActive()) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Invalid or inactive user/tenant'
                ], 401);
            }

            return response()->json([
                'valid' => true,
                'account_type' => 'tenant',
                'user_id' => $user->id,
                'user_name' => $user->name,
                'tenant_id' => $tenant->id,
                'tenant_name' => $tenant->name,
                'tenant_slug' => $tenant->slug
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'valid' => false,
                'message' => 'Token validation failed'
            ], 401);
        }
    }

    /**
     * Switch User Role (if user has multiple roles)
     */
    public function switchRole(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'role_slug' => 'required|string|exists:roles,slug',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $request->user();
            $roleSlug = $request->role_slug;
            
            if (!$user->hasRole($roleSlug)) {
                return response()->json([
                    'message' => 'Role not assigned to user',
                    'error' => 'Unauthorized role switch attempt'
                ], 403);
            }

            // Generate new token with role-specific permissions
            $tenant = $user->tenant;
            $tokenData = $this->authService->refreshToken($user);
            
            return response()->json([
                ...$tokenData,
                'active_role' => $roleSlug
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Role switch failed',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }
}