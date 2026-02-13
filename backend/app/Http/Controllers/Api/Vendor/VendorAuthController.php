<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Application\Vendor\Commands\AuthenticateVendorCommand;
use App\Application\Vendor\Commands\LogoutVendorCommand;
use App\Application\Vendor\Commands\RequestPasswordResetCommand;
use App\Application\Vendor\Commands\ResetPasswordCommand;
use App\Application\Vendor\UseCases\AuthenticateVendorUseCase;
use App\Application\Vendor\UseCases\LogoutVendorUseCase;
use App\Application\Vendor\UseCases\RequestPasswordResetUseCase;
use App\Application\Vendor\UseCases\ResetPasswordUseCase;
use App\Http\Controllers\Controller;
use App\Http\Requests\Vendor\VendorLoginRequest;
use App\Http\Requests\Vendor\RequestPasswordResetRequest;
use App\Http\Requests\Vendor\ResetPasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VendorAuthController extends Controller
{
    public function __construct(
        private readonly AuthenticateVendorUseCase $authenticateVendorUseCase,
        private readonly LogoutVendorUseCase $logoutVendorUseCase,
        private readonly RequestPasswordResetUseCase $requestPasswordResetUseCase,
        private readonly ResetPasswordUseCase $resetPasswordUseCase
    ) {}

    /**
     * Vendor login endpoint
     * 
     * @param VendorLoginRequest $request
     * @return JsonResponse
     */
    public function login(VendorLoginRequest $request): JsonResponse
    {
        try {
            // Find user by email to get tenant_id
            $user = \App\Models\User::where('email', $request->input('email'))
                ->where('account_type', 'vendor')
                ->first();

            if (!$user) {
                return response()->json([
                    'message' => 'Invalid credentials',
                ], 401);
            }

            $command = new AuthenticateVendorCommand(
                email: $request->input('email'),
                password: $request->input('password'),
                ipAddress: $request->ip(),
                userAgent: $request->userAgent(),
                tenantId: $user->tenant_id
            );

            $result = $this->authenticateVendorUseCase->execute($command);

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'token' => $result['token'],
                    'token_type' => 'Bearer',
                    'expires_in' => 86400, // 24 hours in seconds
                    'user' => $result['user'],
                    'vendor' => $result['vendor'],
                ],
            ], 200);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => 'Invalid credentials',
                'error' => $e->getMessage(),
            ], 401);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => 'Authentication failed',
                'error' => $e->getMessage(),
            ], 403);
        } catch (\Exception $e) {
            Log::error('Vendor login error', [
                'email' => $request->input('email'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An error occurred during login',
                'error' => 'Internal server error',
            ], 500);
        }
    }

    /**
     * Vendor logout endpoint
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $vendor = $request->vendor;
            $user = $request->vendor_user;

            $command = new LogoutVendorCommand(
                tenantId: $vendor->tenant_id,
                userId: (string) $user->id,
                tokenId: $request->bearerToken() ?? ''
            );

            $result = $this->logoutVendorUseCase->execute($command);

            return response()->json([
                'message' => 'Logout successful',
                'data' => [
                    'tokens_revoked' => 1,
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Vendor logout error', [
                'vendor_id' => $request->vendor?->id,
                'user_id' => $request->vendor_user?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'An error occurred during logout',
                'error' => 'Internal server error',
            ], 500);
        }
    }

    /**
     * Request password reset endpoint
     * 
     * @param RequestPasswordResetRequest $request
     * @return JsonResponse
     */
    public function requestPasswordReset(RequestPasswordResetRequest $request): JsonResponse
    {
        try {
            // Find user by email to get tenant_id
            $user = \App\Models\User::where('email', $request->input('email'))
                ->where('account_type', 'vendor')
                ->first();

            if (!$user) {
                // Don't reveal if email exists - return success message anyway
                return response()->json([
                    'message' => 'Password reset link has been sent to your email',
                    'data' => [
                        'email' => $request->input('email'),
                    ],
                ], 200);
            }

            $command = new RequestPasswordResetCommand(
                email: $request->input('email'),
                tenantId: (string) $user->tenant_id
            );

            $result = $this->requestPasswordResetUseCase->execute($command);

            return response()->json([
                'message' => 'Password reset link has been sent to your email',
                'data' => [
                    'email' => $request->input('email'),
                ],
            ], 200);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => 'Invalid request',
                'error' => $e->getMessage(),
            ], 400);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => 'Password reset request failed',
                'error' => $e->getMessage(),
            ], 429);
        } catch (\Exception $e) {
            Log::error('Password reset request error', [
                'email' => $request->input('email'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'An error occurred while processing your request',
                'error' => 'Internal server error',
            ], 500);
        }
    }

    /**
     * Reset password endpoint
     * 
     * @param ResetPasswordRequest $request
     * @return JsonResponse
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        try {
            // Find user by email to get tenant_id
            $user = \App\Models\User::where('email', $request->input('email'))
                ->where('account_type', 'vendor')
                ->first();

            if (!$user) {
                return response()->json([
                    'message' => 'Invalid request',
                    'error' => 'User not found',
                ], 400);
            }

            $command = new ResetPasswordCommand(
                email: $request->input('email'),
                token: $request->input('token'),
                password: $request->input('password'),
                passwordConfirmation: $request->input('password_confirmation'),
                tenantId: (string) $user->tenant_id
            );

            $this->resetPasswordUseCase->execute($command);

            return response()->json([
                'message' => 'Password has been reset successfully',
            ], 200);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => 'Invalid request',
                'error' => $e->getMessage(),
            ], 400);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => 'Password reset failed',
                'error' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Password reset error', [
                'email' => $request->input('email'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'An error occurred while resetting your password',
                'error' => 'Internal server error',
            ], 500);
        }
    }
}
