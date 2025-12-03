<?php

namespace App\Application\Auth\Services;

use App\Models\EmailVerification;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Mail\Auth\EmailVerificationMail;

class EmailVerificationService
{
    /**
     * Send email verification
     */
    public function sendVerification($user): bool
    {
        $token = Str::random(64);
        $expires = now()->addHours(24); // 24 hours expiration
        
        // Determine user type
        $userType = $user instanceof AccountEloquentModel ? 'platform' : 'tenant';
        $tenantId = $userType === 'tenant' ? $user->tenant_id : null;
        
        // Check if user already has a pending verification
        $existingVerification = EmailVerification::where('email', $user->email)
            ->where('user_type', $userType)
            ->where('tenant_id', $tenantId)
            ->where('verified', false)
            ->where('expires_at', '>', now())
            ->first();
        
        // Delete existing verification if found
        if ($existingVerification) {
            $existingVerification->delete();
        }
        
        // Create new verification token
        EmailVerification::create([
            'tenant_id' => $tenantId,
            'email' => $user->email,
            'token' => $token,
            'user_type' => $userType,
            'expires_at' => $expires,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
        
        // Send verification email
        $this->sendVerificationEmail($user, $token, $tenantId);
        
        return true;
    }
    
    /**
     * Verify email with token
     */
    public function verify(string $token): bool
    {
        $verification = EmailVerification::where('token', $token)
            ->where('expires_at', '>', now())
            ->where('verified', false)
            ->first();
            
        if (!$verification) {
            throw ValidationException::withMessages([
                'token' => ['Invalid or expired verification token.']
            ]);
        }
        
        // Find user based on verification type
        $user = $this->findUser($verification->email, $verification->tenant_id, $verification->user_type);
        
        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['User not found.']
            ]);
        }
        
        // Update user email verification
        $user->update(['email_verified_at' => now()]);
        
        // Mark verification as used
        $verification->update([
            'verified' => true,
            'verified_at' => now()
        ]);
        
        return true;
    }
    
    /**
     * Resend verification email
     */
    public function resendVerification(string $email, ?int $tenantId = null): bool
    {
        $userType = $tenantId ? 'tenant' : 'platform';
        $user = $this->findUser($email, $tenantId, $userType);
        
        if (!$user) {
            // For security, don't reveal if email exists
            return true;
        }
        
        // Check if user is already verified
        if ($user->email_verified_at) {
            throw ValidationException::withMessages([
                'email' => ['Email is already verified.']
            ]);
        }
        
        // Rate limiting: Check if a verification was sent recently (within 5 minutes)
        $recentVerification = EmailVerification::where('email', $email)
            ->where('user_type', $userType)
            ->where('tenant_id', $tenantId)
            ->where('created_at', '>', now()->subMinutes(5))
            ->exists();
            
        if ($recentVerification) {
            throw ValidationException::withMessages([
                'email' => ['Please wait before requesting another verification email.']
            ]);
        }
        
        return $this->sendVerification($user);
    }
    
    /**
     * Check if email is verified
     */
    public function isEmailVerified(string $email, ?int $tenantId = null): bool
    {
        $userType = $tenantId ? 'tenant' : 'platform';
        $user = $this->findUser($email, $tenantId, $userType);
        
        return $user && $user->email_verified_at !== null;
    }
    
    /**
     * Clean up expired verification tokens
     */
    public function cleanupExpiredTokens(): int
    {
        return EmailVerification::where('expires_at', '<', now())->delete();
    }
    
    /**
     * Find user by email and context
     */
    private function findUser(string $email, ?int $tenantId = null, ?string $userType = null)
    {
        if ($userType === 'platform' || (!$tenantId && !$userType)) {
            return AccountEloquentModel::where('email', $email)->first();
        }
        
        return UserEloquentModel::where('email', $email)
            ->where('tenant_id', $tenantId)
            ->first();
    }
    
    /**
     * Send verification email
     */
    private function sendVerificationEmail($user, string $token, ?int $tenantId = null): void
    {
        try {
            // In testing environment, use send() instead of queue() for Mail::fake() to work
            if (app()->environment('testing')) {
                Mail::to($user->email)->send(new EmailVerificationMail($user, $token, $tenantId));
            } else {
                Mail::to($user->email)->queue(new EmailVerificationMail($user, $token, $tenantId));
            }
        } catch (\Exception $e) {
            // Log the error but don't throw exception to prevent user feedback
            \Log::error('Failed to send email verification', [
                'email' => $user->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // In testing environment, rethrow the exception to help debug
            if (app()->environment('testing')) {
                throw $e;
            }
        }
    }
}