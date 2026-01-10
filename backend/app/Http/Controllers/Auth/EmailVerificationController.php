<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use App\Application\Auth\Services\EmailVerificationService;

class EmailVerificationController extends Controller
{
    public function __construct(
        private EmailVerificationService $emailVerificationService
    ) {}

    /**
     * Send email verification to tenant user
     */
    public function sendTenantVerification(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'tenant_id' => 'required|integer|exists:tenants,id',
        ]);

        try {
            $this->emailVerificationService->resendVerification(
                $request->email,
                $request->tenant_id
            );

            return response()->json([
                'message' => 'If the email exists in our system, a verification link has been sent.',
                'success' => true
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
                'success' => false
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Email verification send failed', [
                'email' => $request->email,
                'tenant_id' => $request->tenant_id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Unable to send verification email. Please try again.',
                'success' => false
            ], 500);
        }
    }

    /**
     * Send email verification to platform user
     */
    public function sendPlatformVerification(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        try {
            $this->emailVerificationService->resendVerification($request->email);

            return response()->json([
                'message' => 'If the email exists in our system, a verification link has been sent.',
                'success' => true
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
                'success' => false
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Platform email verification send failed', [
                'email' => $request->email,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Unable to send verification email. Please try again.',
                'success' => false
            ], 500);
        }
    }

    /**
     * Verify email with token
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        try {
            $this->emailVerificationService->verify($request->token);

            return response()->json([
                'message' => 'Email verified successfully.',
                'success' => true
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
                'success' => false
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Email verification failed', [
                'token' => $request->token,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Email verification failed. Please try again or request a new verification email.',
                'success' => false
            ], 500);
        }
    }

    /**
     * Check email verification status
     */
    public function checkVerificationStatus(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'tenant_id' => 'nullable|integer|exists:tenants,id',
        ]);

        try {
            $isVerified = $this->emailVerificationService->isEmailVerified(
                $request->email,
                $request->tenant_id
            );

            return response()->json([
                'verified' => $isVerified,
                'success' => true
            ]);
        } catch (\Exception $e) {
            \Log::error('Email verification status check failed', [
                'email' => $request->email,
                'tenant_id' => $request->tenant_id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Unable to check verification status.',
                'success' => false
            ], 500);
        }
    }
}
