<?php

declare(strict_types=1);

namespace App\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\AuthenticateVendorCommand;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Domain\Audit\Repositories\AuditLogRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use InvalidArgumentException;

/**
 * AuthenticateVendorUseCase
 * 
 * Handles vendor authentication with security checks:
 * - Validates credentials
 * - Checks account status and portal access
 * - Handles failed login attempts and account lockout
 * - Generates Sanctum token
 * - Logs authentication events
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 15.5, 15.6, 15.7, 16.1
 */
final class AuthenticateVendorUseCase
{
    private const MAX_LOGIN_ATTEMPTS = 5;
    private const LOCKOUT_DURATION = 900; // 15 minutes in seconds
    private const RATE_LIMIT_KEY_PREFIX = 'vendor-login:';

    public function __construct(
        private readonly VendorRepositoryInterface $vendorRepository,
        private readonly AuditLogRepositoryInterface $auditLogRepository
    ) {}

    /**
     * Execute vendor authentication
     * 
     * @throws InvalidArgumentException If credentials are invalid or account is locked
     * @return array{token: string, vendor: array, user: array}
     */
    public function execute(AuthenticateVendorCommand $command): array
    {
        // Check rate limiting (Req 15.5)
        $this->checkRateLimit($command->email, $command->ipAddress);

        // Find user by email and tenant
        $user = UserEloquentModel::where('email', $command->email)
            ->where('tenant_id', $command->tenantId)
            ->where('account_type', 'vendor')
            ->first();

        // Validate user exists
        if (!$user) {
            $this->handleFailedLogin($command, null, 'User not found');
            throw new InvalidArgumentException('Invalid credentials');
        }

        // Check if account is locked (Req 15.6)
        if ($this->isAccountLocked($user)) {
            $this->logFailedLogin($command, $user->id, 'Account locked');
            throw new InvalidArgumentException('Account is locked due to too many failed login attempts. Please try again later.');
        }

        // Validate password (Req 1.2)
        if (!Hash::check($command->password, $user->password)) {
            $this->handleFailedLogin($command, $user->id, 'Invalid password');
            throw new InvalidArgumentException('Invalid credentials');
        }

        // Load vendor record
        $vendor = $this->vendorRepository->findByUserId($user->id, $command->tenantId);
        
        if (!$vendor) {
            $this->logFailedLogin($command, $user->id, 'Vendor record not found');
            throw new InvalidArgumentException('Vendor account not found');
        }

        // Check vendor is active (Req 1.4)
        if (!$vendor->isActive()) {
            $this->logFailedLogin($command, $user->id, 'Vendor inactive');
            throw new InvalidArgumentException('Your vendor account is inactive. Please contact support.');
        }

        // Check portal access is enabled (Req 2.5)
        if (!$vendor->isPortalAccessEnabled()) {
            $this->logFailedLogin($command, $user->id, 'Portal access disabled');
            throw new InvalidArgumentException('Portal access is not enabled for your account. Please contact support.');
        }

        // Check onboarding is completed (Req 17.7)
        if (!$vendor->isOnboardingCompleted()) {
            $this->logFailedLogin($command, $user->id, 'Onboarding not completed');
            throw new InvalidArgumentException('Please complete your onboarding process first.');
        }

        // Clear failed login attempts
        $this->clearFailedAttempts($user);

        // Generate Sanctum token (Req 1.6)
        $token = $user->createToken(
            'vendor-portal',
            ['vendor:access'],
            now()->addDays(30)
        )->plainTextToken;

        // Update portal access timestamp (Req 2.1)
        $vendor->recordPortalAccess();
        $this->vendorRepository->save($vendor);

        // Log successful authentication (Req 16.1)
        $this->logSuccessfulLogin($command, $user->id);

        return [
            'token' => $token,
            'vendor' => [
                'id' => $vendor->getId()->getValue(), // Use getValue() instead of toString()
                'company_name' => $vendor->getCompany(),
                'email' => $vendor->getEmail(),
                'phone' => $vendor->getPhone(),
                'status' => $vendor->isActive() ? 'active' : 'inactive',
                'onboarding_status' => $vendor->getOnboardingStatus(),
                'portal_access_enabled' => $vendor->isPortalAccessEnabled(),
                'tenant_id' => $command->tenantId,
            ],
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'account_type' => $user->account_type,
            ],
        ];
    }

    /**
     * Check rate limiting for login attempts
     * 
     * @throws InvalidArgumentException If rate limit exceeded
     */
    private function checkRateLimit(string $email, string $ipAddress): void
    {
        $key = self::RATE_LIMIT_KEY_PREFIX . $email . ':' . $ipAddress;
        
        if (RateLimiter::tooManyAttempts($key, self::MAX_LOGIN_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($key);
            throw new InvalidArgumentException(
                "Too many login attempts. Please try again in {$seconds} seconds."
            );
        }

        RateLimiter::hit($key, self::LOCKOUT_DURATION);
    }

    /**
     * Check if account is locked due to failed attempts
     */
    private function isAccountLocked(UserEloquentModel $user): bool
    {
        $failedAttempts = $user->failed_login_attempts ?? 0;
        $lastFailedAt = $user->last_failed_login_at;

        if ($failedAttempts >= self::MAX_LOGIN_ATTEMPTS) {
            // Check if lockout period has passed
            if ($lastFailedAt && $lastFailedAt->addSeconds(self::LOCKOUT_DURATION)->isFuture()) {
                return true;
            }
            
            // Lockout period passed, reset attempts
            $user->failed_login_attempts = 0;
            $user->save();
        }

        return false;
    }

    /**
     * Handle failed login attempt
     */
    private function handleFailedLogin(
        AuthenticateVendorCommand $command,
        ?int $userId,
        string $reason
    ): void {
        if ($userId) {
            $user = UserEloquentModel::find($userId);
            if ($user) {
                $user->increment('failed_login_attempts');
                $user->last_failed_login_at = now();
                $user->save();
            }
        }

        $this->logFailedLogin($command, $userId, $reason);
    }

    /**
     * Clear failed login attempts after successful login
     */
    private function clearFailedAttempts(UserEloquentModel $user): void
    {
        $user->failed_login_attempts = 0;
        $user->last_failed_login_at = null;
        $user->last_login_at = now();
        $user->save();
    }

    /**
     * Log successful login
     */
    private function logSuccessfulLogin(AuthenticateVendorCommand $command, int $userId): void
    {
        $this->auditLogRepository->create(
            tenantId: $command->tenantId,
            action: 'vendor_login',
            entityType: 'user',
            entityId: $userId,
            userId: $userId,
            metadata: [
                'email' => $command->email,
                'success' => true,
                'user_agent' => $command->userAgent,
            ],
            ipAddress: $command->ipAddress
        );
    }

    /**
     * Log failed login attempt
     */
    private function logFailedLogin(
        AuthenticateVendorCommand $command,
        ?int $userId,
        string $reason
    ): void {
        $this->auditLogRepository->create(
            tenantId: $command->tenantId,
            action: 'vendor_login_failed',
            entityType: 'user',
            entityId: $userId,
            userId: $userId,
            metadata: [
                'email' => $command->email,
                'success' => false,
                'reason' => $reason,
                'user_agent' => $command->userAgent,
            ],
            ipAddress: $command->ipAddress
        );
    }
}
