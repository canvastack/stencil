<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use App\Application\Auth\Services\RegistrationService;

class RegistrationController extends Controller
{
    public function __construct(
        private RegistrationService $registrationService
    ) {}

    /**
     * Register a new tenant user
     */
    public function registerTenantUser(Request $request, string $tenantId): JsonResponse
    {
        try {
            // Validate input data
            $validatedData = $this->registrationService->validateTenantUserData($request->all());
            
            // Register user
            $user = $this->registrationService->registerTenantUser($validatedData, $tenantId);
            
            return response()->json([
                'message' => 'User registered successfully. Please check your email to verify your account.',
                'success' => true,
                'data' => [
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'tenant_id' => $user->tenant_id,
                    'status' => $user->status,
                    'email_verified' => $user->email_verified_at !== null,
                ]
            ], 201);
            
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'success' => false,
                'errors' => $e->errors(),
            ], 422);
            
        } catch (\Exception $e) {
            \Log::error('Tenant user registration failed', [
                'tenant_id' => $tenantId,
                'email' => $request->email ?? 'unknown',
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Registration failed. Please try again.',
                'success' => false,
            ], 500);
        }
    }

    /**
     * Register a new platform account
     */
    public function registerPlatformAccount(Request $request): JsonResponse
    {
        try {
            // Validate input data
            $validatedData = $this->registrationService->validatePlatformAccountData($request->all());
            
            // Register account
            $account = $this->registrationService->registerPlatformAccount($validatedData);
            
            return response()->json([
                'message' => 'Platform account registered successfully. Please check your email to verify your account.',
                'success' => true,
                'data' => [
                    'account_id' => $account->id,
                    'name' => $account->name,
                    'email' => $account->email,
                    'account_type' => $account->account_type,
                    'status' => $account->status,
                    'email_verified' => $account->email_verified_at !== null,
                ]
            ], 201);
            
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'success' => false,
                'errors' => $e->errors(),
            ], 422);
            
        } catch (\Exception $e) {
            \Log::error('Platform account registration failed', [
                'email' => $request->email ?? 'unknown',
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Registration failed. Please try again.',
                'success' => false,
            ], 500);
        }
    }

    /**
     * Register new tenant with admin user
     */
    public function registerTenantWithAdmin(Request $request): JsonResponse
    {
        try {
            // Validate tenant data
            $tenantData = $this->registrationService->validateTenantData($request->input('tenant', []));
            
            // Validate admin user data
            $adminData = $this->registrationService->validateTenantUserData($request->input('admin', []));
            
            // Register tenant with admin
            $result = $this->registrationService->registerTenantWithAdmin($tenantData, $adminData);
            
            return response()->json([
                'message' => 'Tenant and admin user created successfully. Please check your email to verify the admin account.',
                'success' => true,
                'data' => [
                    'tenant' => [
                        'id' => $result['tenant']->id,
                        'name' => $result['tenant']->name,
                        'slug' => $result['tenant']->slug,
                        'domain' => $result['tenant']->domain,
                        'status' => $result['tenant']->status,
                        'subscription_status' => $result['tenant']->subscription_status,
                    ],
                    'admin_user' => [
                        'id' => $result['admin_user']->id,
                        'name' => $result['admin_user']->name,
                        'email' => $result['admin_user']->email,
                        'status' => $result['admin_user']->status,
                        'email_verified' => $result['admin_user']->email_verified_at !== null,
                    ]
                ]
            ], 201);
            
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'success' => false,
                'errors' => $e->errors(),
            ], 422);
            
        } catch (\Exception $e) {
            \Log::error('Tenant with admin registration failed', [
                'tenant_name' => $request->input('tenant.name', 'unknown'),
                'admin_email' => $request->input('admin.email', 'unknown'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            $errorMessage = app()->environment('testing', 'local') 
                ? $e->getMessage() 
                : 'Registration failed. Please try again.';

            return response()->json([
                'message' => $errorMessage,
                'success' => false,
            ], 500);
        }
    }

    /**
     * Check email availability
     */
    public function checkEmailAvailability(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'tenant_id' => 'nullable|exists:tenants,id',
        ]);

        try {
            $available = $this->registrationService->isEmailAvailable(
                $request->email, 
                $request->tenant_id
            );

            return response()->json([
                'available' => $available,
                'success' => true,
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Email availability check failed', [
                'email' => $request->email,
                'tenant_id' => $request->tenant_id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Unable to check email availability.',
                'success' => false,
            ], 500);
        }
    }

    /**
     * Get registration statistics for tenant
     */
    public function getRegistrationStats(Request $request, string $tenantId): JsonResponse
    {
        try {
            $stats = $this->registrationService->getRegistrationStats($tenantId);

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to get registration stats', [
                'tenant_id' => $tenantId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Unable to retrieve registration statistics.',
                'success' => false,
            ], 500);
        }
    }
}
