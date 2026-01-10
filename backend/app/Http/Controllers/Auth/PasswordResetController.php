<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Application\Auth\Services\PasswordResetService;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\ValidateTokenRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    public function __construct(
        private PasswordResetService $passwordResetService
    ) {}

    /**
     * Send password reset link to user email (Platform)
     */
    public function forgotPasswordPlatform(ForgotPasswordRequest $request): JsonResponse
    {
        $email = $request->validated('email');

        // Rate limiting check
        if ($this->passwordResetService->getRecentAttemptCount($email) >= 3) {
            throw ValidationException::withMessages([
                'email' => ['Too many password reset attempts. Please try again later.']
            ]);
        }

        $success = $this->passwordResetService->requestReset($email);

        return response()->json([
            'success' => true,
            'message' => 'If an account with that email exists, a password reset link has been sent.',
            'data' => [
                'email' => $email,
                'type' => 'platform'
            ]
        ]);
    }

    /**
     * Send password reset link to user email (Tenant)
     */
    public function forgotPasswordTenant(ForgotPasswordRequest $request, string $tenantId): JsonResponse
    {
        $email = $request->validated('email');

        // Rate limiting check
        if ($this->passwordResetService->getRecentAttemptCount($email, $tenantId) >= 3) {
            throw ValidationException::withMessages([
                'email' => ['Too many password reset attempts. Please try again later.']
            ]);
        }

        $success = $this->passwordResetService->requestReset($email, $tenantId);

        return response()->json([
            'success' => true,
            'message' => 'If an account with that email exists, a password reset link has been sent.',
            'data' => [
                'email' => $email,
                'tenant_id' => $tenantId,
                'type' => 'tenant'
            ]
        ]);
    }

    /**
     * Reset password using token (Platform)
     */
    public function resetPasswordPlatform(ResetPasswordRequest $request): JsonResponse
    {
        $validated = $request->validated();
        
        try {
            $success = $this->passwordResetService->resetPassword(
                $validated['token'],
                $validated['password'],
                $validated['email']
            );

            return response()->json([
                'success' => true,
                'message' => 'Password has been reset successfully.',
                'data' => [
                    'email' => $validated['email'],
                    'type' => 'platform'
                ]
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INVALID_TOKEN',
                    'message' => 'Invalid or expired reset token.',
                    'details' => $e->errors()
                ]
            ], 422);
        }
    }

    /**
     * Reset password using token (Tenant)
     */
    public function resetPasswordTenant(ResetPasswordRequest $request, string $tenantId): JsonResponse
    {
        $validated = $request->validated();
        
        try {
            $success = $this->passwordResetService->resetPassword(
                $validated['token'],
                $validated['password'],
                $validated['email'],
                $tenantId
            );

            return response()->json([
                'success' => true,
                'message' => 'Password has been reset successfully.',
                'data' => [
                    'email' => $validated['email'],
                    'tenant_id' => $tenantId,
                    'type' => 'tenant'
                ]
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INVALID_TOKEN',
                    'message' => 'Invalid or expired reset token.',
                    'details' => $e->errors()
                ]
            ], 422);
        }
    }

    /**
     * Validate reset token without using it
     */
    public function validateTokenPlatform(ValidateTokenRequest $request): JsonResponse
    {
        $validated = $request->validated();
        
        $isValid = $this->passwordResetService->validateToken(
            $validated['token'],
            $validated['email']
        );

        return response()->json([
            'success' => true,
            'data' => [
                'valid' => $isValid,
                'email' => $validated['email'],
                'type' => 'platform'
            ]
        ]);
    }

    /**
     * Validate reset token without using it (Tenant)
     */
    public function validateTokenTenant(ValidateTokenRequest $request, string $tenantId): JsonResponse
    {
        $validated = $request->validated();
        
        $isValid = $this->passwordResetService->validateToken(
            $validated['token'],
            $validated['email'],
            $tenantId
        );

        return response()->json([
            'success' => true,
            'data' => [
                'valid' => $isValid,
                'email' => $validated['email'],
                'tenant_id' => $tenantId,
                'type' => 'tenant'
            ]
        ]);
    }
}