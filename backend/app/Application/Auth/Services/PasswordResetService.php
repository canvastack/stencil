<?php

namespace App\Application\Auth\Services;

use App\Infrastructure\Persistence\Eloquent\Models\PasswordResetToken;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Infrastructure\Notifications\Auth\PasswordResetMail;

class PasswordResetService
{
    /**
     * Request password reset token
     */
    public function requestReset(string $email, ?string $tenantId = null): bool
    {
        $token = Str::random(64);
        $expires = now()->addHours(2); // 2 hours expiration
        
        // Determine user type and validate user exists
        $userType = $tenantId ? 'tenant' : 'platform';
        $user = $this->findUser($email, $tenantId);
        
        if (!$user) {
            // For security, we don't reveal if email exists or not
            // Always return true but don't send email
            return true;
        }

        // Rate limiting: Check if a reset was requested recently (within 3 minutes)
        $recentRequest = PasswordResetToken::where('email', $email)
            ->where('user_type', $userType)
            ->where('tenant_id', $tenantId)
            ->where('created_at', '>', now()->subMinutes(3))
            ->exists();
            
        if ($recentRequest) {
            throw ValidationException::withMessages([
                'email' => ['Please wait before requesting another password reset.']
            ]);
        }

        // Clean up old tokens for this email and user type
        $this->cleanupOldTokens($email, $tenantId, $userType);

        // Create or update reset token
        $resetToken = PasswordResetToken::updateOrCreate([
            'email' => $email,
            'tenant_id' => $tenantId,
            'user_type' => $userType
        ], [
            'token' => Hash::make($token),
            'expires_at' => $expires,
            'used' => false,
            'used_at' => null,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent()
        ]);

        // Send password reset email
        $this->sendResetEmail($user, $token, $tenantId);
        
        return true;
    }

    /**
     * Reset password using token
     */
    public function resetPassword(string $token, string $password, string $email, ?string $tenantId = null): bool
    {
        $userType = $tenantId ? 'tenant' : 'platform';
        
        // Find active reset token
        $resetToken = PasswordResetToken::where('email', $email)
            ->where('user_type', $userType)
            ->where('tenant_id', $tenantId)
            ->active()
            ->first();

        if (!$resetToken || !Hash::check($token, $resetToken->token)) {
            throw ValidationException::withMessages([
                'token' => ['Invalid or expired reset token.']
            ]);
        }

        // Find user and validate
        $user = $this->findUser($email, $tenantId);
        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['User not found.']
            ]);
        }

        // Update user password
        $user->update(['password' => Hash::make($password)]);

        // Mark token as used
        $resetToken->markAsUsed();

        // Clean up other tokens for this user
        $this->cleanupOldTokens($email, $tenantId, $userType);

        return true;
    }

    /**
     * Validate reset token without using it
     */
    public function validateToken(string $token, string $email, ?string $tenantId = null): bool
    {
        $userType = $tenantId ? 'tenant' : 'platform';
        
        $resetToken = PasswordResetToken::where('email', $email)
            ->where('user_type', $userType)
            ->where('tenant_id', $tenantId)
            ->active()
            ->first();

        return $resetToken && Hash::check($token, $resetToken->token);
    }

    /**
     * Check if user has recent reset requests (rate limiting)
     */
    public function hasRecentRequest(string $email, ?string $tenantId = null, int $minutesThreshold = 5): bool
    {
        $userType = $tenantId ? 'tenant' : 'platform';
        
        return PasswordResetToken::where('email', $email)
            ->where('user_type', $userType)
            ->where('tenant_id', $tenantId)
            ->recentlyCreated($minutesThreshold)
            ->exists();
    }

    /**
     * Get reset attempt count for email in last hour
     */
    public function getRecentAttemptCount(string $email, ?string $tenantId = null): int
    {
        $userType = $tenantId ? 'tenant' : 'platform';
        
        return PasswordResetToken::where('email', $email)
            ->where('user_type', $userType)
            ->where('tenant_id', $tenantId)
            ->recentlyCreated(60) // Last hour
            ->count();
    }

    /**
     * Find user by email and tenant
     */
    private function findUser(string $email, ?string $tenantId)
    {
        if ($tenantId) {
            return UserEloquentModel::where('email', $email)
                ->where('tenant_id', $tenantId)
                ->where('status', 'active')
                ->first();
        } else {
            return AccountEloquentModel::where('email', $email)
                ->where('status', 'active')
                ->first();
        }
    }

    /**
     * Clean up old tokens for user
     */
    private function cleanupOldTokens(string $email, ?string $tenantId, string $userType): void
    {
        // Only delete expired tokens, keep used tokens for audit trail
        PasswordResetToken::where('email', $email)
            ->where('user_type', $userType)
            ->where('tenant_id', $tenantId)
            ->where('expires_at', '<', now())
            ->delete();
    }

    /**
     * Send password reset email
     */
    private function sendResetEmail($user, string $token, ?string $tenantId): void
    {
        try {
            Mail::to($user->email)->send(
                new PasswordResetMail($user, $token, $tenantId)
            );
        } catch (\Exception $e) {
            // Log error but don't throw - we don't want to reveal if email sending failed
            logger()->error('Password reset email failed to send', [
                'email' => $user->email,
                'tenant_id' => $tenantId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Cleanup expired tokens (for scheduled job)
     */
    public function cleanupExpiredTokens(): int
    {
        return PasswordResetToken::cleanup();
    }
}