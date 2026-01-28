<?php

namespace App\Domain\Security\Services;

use App\Domain\Security\ValueObjects\TwoFactorSetup;
use App\Domain\Security\ValueObjects\TwoFactorVerification;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use OTPHP\TOTP;
use PragmaRX\Google2FA\Google2FA;

/**
 * Two-Factor Authentication Service
 * 
 * Provides TOTP-based two-factor authentication functionality including
 * secret generation, QR code creation, backup codes, and verification.
 */
class TwoFactorAuthService
{
    private const BACKUP_CODES_COUNT = 8;
    private const BACKUP_CODE_LENGTH = 8;

    public function __construct(
        private Google2FA $google2fa
    ) {}

    /**
     * Enable two-factor authentication for a user
     */
    public function enableTwoFactorAuthentication(User $user): TwoFactorSetup
    {
        // Generate TOTP secret
        $secret = $this->generateTOTPSecret();
        
        // Generate QR code
        $qrCode = $this->generateQRCode($user, $secret);
        
        // Generate backup codes
        $backupCodes = $this->generateBackupCodes();
        
        // Store 2FA settings in users.metadata JSON field (not enabled yet)
        $metadata = $user->metadata ?? [];
        $metadata['two_factor'] = [
            'secret' => Crypt::encryptString($secret),
            'enabled' => false, // Will be enabled after verification
            'backup_codes' => array_map(fn($code) => Crypt::encryptString($code), $backupCodes),
            'setup_at' => now()->toISOString(),
            'recovery_codes_generated_at' => now()->toISOString()
        ];
        
        $user->update(['metadata' => $metadata]);
        
        return new TwoFactorSetup(
            userId: new UuidValueObject($user->uuid),
            secret: $secret,
            qrCode: $qrCode,
            backupCodes: $backupCodes,
            setupInstructions: $this->getSetupInstructions(),
            appName: config('app.name', 'CanvaStencil')
        );
    }

    /**
     * Verify and confirm two-factor authentication setup
     */
    public function confirmTwoFactorAuthentication(User $user, string $code): TwoFactorVerification
    {
        $metadata = $user->metadata ?? [];
        
        if (!isset($metadata['two_factor']['secret'])) {
            return new TwoFactorVerification(
                success: false,
                message: 'Two-factor authentication is not set up for this user'
            );
        }

        $secret = Crypt::decryptString($metadata['two_factor']['secret']);
        
        if ($this->verifyTOTPCode($secret, $code)) {
            // Enable 2FA
            $metadata['two_factor']['enabled'] = true;
            $metadata['two_factor']['confirmed_at'] = now()->toISOString();
            $user->update(['metadata' => $metadata]);
            
            return new TwoFactorVerification(
                success: true,
                message: 'Two-factor authentication has been successfully enabled'
            );
        }

        return new TwoFactorVerification(
            success: false,
            message: 'Invalid verification code'
        );
    }

    /**
     * Verify TOTP code during login
     */
    public function verifyTwoFactorCode(User $user, string $code): TwoFactorVerification
    {
        if (!$user->two_factor_enabled || !$user->two_factor_secret) {
            return new TwoFactorVerification(
                success: false,
                message: 'Two-factor authentication is not enabled for this user'
            );
        }

        $secret = $user->two_factor_secret;
        
        // Try TOTP code first
        if ($this->google2fa->verifyKey($secret, $code)) {
            return new TwoFactorVerification(
                success: true,
                message: 'Two-factor authentication successful'
            );
        }

        // Try backup codes
        if ($this->verifyRecoveryCode($user, $code)) {
            return new TwoFactorVerification(
                success: true,
                message: 'Backup code used successfully',
                usedBackupCode: true
            );
        }

        return new TwoFactorVerification(
            success: false,
            message: 'Invalid two-factor authentication code'
        );
    }

    /**
     * Disable two-factor authentication
     */
    public function disableTwoFactorAuthentication(User $user, string $password): TwoFactorVerification
    {
        // Verify password before disabling
        if (!password_verify($password, $user->password)) {
            return new TwoFactorVerification(
                success: false,
                message: 'Invalid password'
            );
        }

        $metadata = $user->metadata ?? [];
        
        if (isset($metadata['two_factor'])) {
            $metadata['two_factor'] = [
                'enabled' => false,
                'disabled_at' => now()->toISOString(),
                'disabled_by' => $user->uuid
            ];
            
            $user->update(['metadata' => $metadata]);
        }

        return new TwoFactorVerification(
            success: true,
            message: 'Two-factor authentication has been disabled'
        );
    }

    /**
     * Generate new backup codes
     */
    public function regenerateBackupCodes(User $user): array
    {
        $metadata = $user->metadata ?? [];
        
        if (!isset($metadata['two_factor']) || !$metadata['two_factor']['enabled']) {
            throw new \InvalidArgumentException('Two-factor authentication is not enabled');
        }

        $backupCodes = $this->generateBackupCodes();
        
        $metadata['two_factor']['backup_codes'] = array_map(
            fn($code) => Crypt::encryptString($code), 
            $backupCodes
        );
        $metadata['two_factor']['recovery_codes_generated_at'] = now()->toISOString();
        
        $user->update(['metadata' => $metadata]);
        
        return $backupCodes;
    }

    /**
     * Check if user has 2FA enabled
     */
    public function isTwoFactorEnabled(User $user): bool
    {
        $metadata = $user->metadata ?? [];
        return isset($metadata['two_factor']['enabled']) && $metadata['two_factor']['enabled'] === true;
    }

    /**
     * Get 2FA status for user
     */
    public function getTwoFactorStatus(User $user): array
    {
        $metadata = $user->metadata ?? [];
        $twoFactor = $metadata['two_factor'] ?? null;

        if (!$twoFactor) {
            return [
                'enabled' => false,
                'setup' => false,
                'backup_codes_count' => 0
            ];
        }

        $backupCodesCount = 0;
        if (isset($twoFactor['backup_codes'])) {
            $backupCodesCount = count($twoFactor['backup_codes']);
        }

        return [
            'enabled' => $twoFactor['enabled'] ?? false,
            'setup' => isset($twoFactor['secret']),
            'backup_codes_count' => $backupCodesCount,
            'setup_at' => $twoFactor['setup_at'] ?? null,
            'confirmed_at' => $twoFactor['confirmed_at'] ?? null,
            'recovery_codes_generated_at' => $twoFactor['recovery_codes_generated_at'] ?? null
        ];
    }

    /**
     * Generate TOTP secret
     */
    private function generateTOTPSecret(): string
    {
        return TOTP::create()->getSecret();
    }

    /**
     * Generate QR code for TOTP setup
     */
    private function generateQRCode(User $user, string $secret): string
    {
        $totp = TOTP::create($secret);
        $totp->setLabel($user->email);
        $totp->setIssuer(config('app.name', 'CanvaStencil'));

        $renderer = new ImageRenderer(
            new RendererStyle(200),
            new SvgImageBackEnd()
        );
        
        $writer = new Writer($renderer);
        
        return $writer->writeString($totp->getProvisioningUri());
    }

    /**
     * Verify TOTP code
     */
    private function verifyTOTPCode(string $secret, string $code): bool
    {
        $totp = TOTP::create($secret);
        
        // Allow for time drift (±1 window = ±30 seconds)
        return $totp->verify($code, null, 1);
    }

    /**
     * Generate backup codes
     */
    private function generateBackupCodes(): array
    {
        $codes = [];
        
        for ($i = 0; $i < self::BACKUP_CODES_COUNT; $i++) {
            $codes[] = strtoupper(Str::random(self::BACKUP_CODE_LENGTH));
        }
        
        return $codes;
    }

    /**
     * Verify backup code and mark as used
     */
    private function verifyBackupCode(User $user, string $code): bool
    {
        $metadata = $user->metadata ?? [];
        $backupCodes = $metadata['two_factor']['backup_codes'] ?? [];
        
        foreach ($backupCodes as $index => $encryptedCode) {
            try {
                $decryptedCode = Crypt::decryptString($encryptedCode);
                
                if (hash_equals($decryptedCode, strtoupper($code))) {
                    // Remove used backup code
                    unset($metadata['two_factor']['backup_codes'][$index]);
                    $metadata['two_factor']['backup_codes'] = array_values($metadata['two_factor']['backup_codes']);
                    $metadata['two_factor']['last_backup_code_used_at'] = now()->toISOString();
                    
                    $user->update(['metadata' => $metadata]);
                    
                    return true;
                }
            } catch (\Exception $e) {
                // Skip invalid encrypted codes
                continue;
            }
        }
        
        return false;
    }

    /**
     * Get setup instructions
     */
    private function getSetupInstructions(): array
    {
        return [
            'step1' => 'Install an authenticator app like Google Authenticator, Authy, or 1Password',
            'step2' => 'Scan the QR code with your authenticator app',
            'step3' => 'Enter the 6-digit code from your app to confirm setup',
            'step4' => 'Save your backup codes in a secure location',
            'apps' => [
                'Google Authenticator' => [
                    'ios' => 'https://apps.apple.com/app/google-authenticator/id388497605',
                    'android' => 'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2'
                ],
                'Authy' => [
                    'ios' => 'https://apps.apple.com/app/authy/id494168017',
                    'android' => 'https://play.google.com/store/apps/details?id=com.authy.authy'
                ],
                '1Password' => [
                    'ios' => 'https://apps.apple.com/app/1password-7-password-manager/id1333542190',
                    'android' => 'https://play.google.com/store/apps/details?id=com.onepassword.android'
                ]
            ]
        ];
    }

    /**
     * Generate a secret key for TOTP
     */
    public function generateSecretKey(): string
    {
        return $this->google2fa->generateSecretKey();
    }

    /**
     * Generate QR code URL for TOTP setup
     */
    public function generateQRCodeUrl(User $user, string $secretKey, string $companyName = 'CanvaStencil'): string
    {
        $otpAuthUrl = $this->google2fa->getQRCodeUrl($companyName, $user->email, $secretKey);
        
        // Generate QR code URL using online service
        return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . $otpAuthUrl;
    }

    /**
     * Enable two-factor authentication with verification
     */
    public function enableTwoFactorAuth(User $user, string $secretKey, string $verificationCode): bool
    {
        // Verify the code first
        if (!$this->google2fa->verifyKey($secretKey, $verificationCode)) {
            return false;
        }

        // Update user with 2FA settings
        $user->two_factor_secret = Crypt::encryptString($secretKey);
        $user->two_factor_enabled = true;
        $user->save();

        return true;
    }

    /**
     * Disable two-factor authentication
     */
    public function disableTwoFactorAuth(User $user): bool
    {
        $user->two_factor_secret = null;
        $user->two_factor_enabled = false;
        $user->two_factor_recovery_codes = null;
        $user->save();

        return true;
    }

    /**
     * Verify two-factor authentication code (simple boolean check)
     */
    public function verifyTwoFactorCodeSimple(User $user, string $code): bool
    {
        if (!$user->two_factor_enabled || !$user->two_factor_secret) {
            return false;
        }

        $secret = Crypt::decryptString($user->two_factor_secret);
        return $this->google2fa->verifyKey($secret, $code);
    }

    /**
     * Generate recovery codes
     */
    public function generateRecoveryCodes(User $user): array
    {
        $codes = [];
        for ($i = 0; $i < self::BACKUP_CODES_COUNT; $i++) {
            $codes[] = strtoupper(Str::random(10));
        }

        $user->two_factor_recovery_codes = json_encode($codes);
        $user->save();

        return $codes;
    }

    /**
     * Verify recovery code
     */
    public function verifyRecoveryCode(User $user, string $code): bool
    {
        if (!$user->two_factor_enabled || !$user->two_factor_recovery_codes) {
            return false;
        }

        $recoveryCodes = json_decode($user->two_factor_recovery_codes, true);
        
        if (!in_array($code, $recoveryCodes)) {
            return false;
        }

        // Remove used recovery code
        $recoveryCodes = array_filter($recoveryCodes, fn($c) => $c !== $code);
        $user->two_factor_recovery_codes = json_encode(array_values($recoveryCodes));
        $user->save();

        return true;
    }

    /**
     * Check if user has two-factor authentication enabled
     */
    public function hasTwoFactorEnabled(User $user): bool
    {
        return $user->two_factor_enabled && !empty($user->two_factor_secret);
    }

    /**
     * Get backup codes count
     */
    public function getBackupCodesCount(User $user): int
    {
        if (!$user->two_factor_recovery_codes) {
            return 0;
        }

        $codes = json_decode($user->two_factor_recovery_codes, true);
        return is_array($codes) ? count($codes) : 0;
    }

    /**
     * Regenerate recovery codes
     */
    public function regenerateRecoveryCodes(User $user): array
    {
        return $this->generateRecoveryCodes($user);
    }
}